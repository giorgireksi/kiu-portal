const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 8876);
const LISTEN_HOST = String(process.env.KIU_LOCAL_BIND_HOST || process.env.KIU_LOCAL_LMS_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_HOST = String(process.env.KIU_LOCAL_BACKEND_PROXY_HOST || process.env.KIU_LOCAL_BACKEND_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_PORT = Number(process.env.KIU_LOCAL_BACKEND_PORT || 48933);
const PROXY_TIMEOUT_MS = Number(process.env.KIU_LOCAL_PROXY_TIMEOUT_MS || 20000);
const PROXY_RETRY_DELAY_MS = Number(process.env.KIU_LOCAL_PROXY_RETRY_DELAY_MS || 150);
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'proxy-connection'
]);
const BLOCKED_PATH_RE = /^\/(?:artifacts(?:\/|$)|admin-tools-standalone(?:\.dom)?\.html$|\.env(?:$|[./])|\.git(?:\/|$)|\.cursor(?:\/|$)|node_modules(?:\/|$)|backend(?:\/|$)|tools(?:\/|$)|test(?:\/|$)|\.tmp(?:\/|$)|kiu-realtime-bridge(?:\/|$)|anti-cheat(?:\/|$))/i;

const CONTENT_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.htm': 'text/html; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function normalizeRequestPath(requestUrl = '/') {
    try {
        const parsed = new URL(requestUrl, 'http://127.0.0.1');
        return decodeURIComponent(parsed.pathname || '/');
    } catch (error) {
        return '/';
    }
}

function isBlockedStaticPath(requestPath = '') {
    return BLOCKED_PATH_RE.test(String(requestPath || '').trim());
}

function sendError(response, statusCode, message) {
    response.writeHead(statusCode, {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Type': 'text/plain; charset=utf-8',
        'Expires': '0',
        'Pragma': 'no-cache'
    });
    response.end(message);
}

function resolveFilePath(requestPath) {
    const safePath = requestPath === '/' ? '/index.html' : requestPath;
    const absolutePath = path.resolve(ROOT, `.${safePath}`);
    const relativePath = path.relative(ROOT, absolutePath);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
        return path.join(absolutePath, 'index.html');
    }
    return absolutePath;
}

function shouldProxyToBackend(requestPath) {
    return requestPath.startsWith('/api/')
        || requestPath === '/health'
        || requestPath === '/ready'
        || requestPath === '/download'
        || requestPath.startsWith('/download/');
}

function getStaticCompression(request, contentType, size) {
    if (size < 1024 || !/^(?:text\/|application\/(?:javascript|json|xml))/.test(contentType)) return '';
    const accepted = String(request.headers['accept-encoding'] || '').toLowerCase();
    if (accepted.includes('br')) return 'br';
    if (accepted.includes('gzip')) return 'gzip';
    return '';
}

function isVersionedAsset(requestUrl, requestPath) {
    return requestPath.startsWith('/assets/')
        && /(?:^|[?&])v=[^&]+/.test(String(requestUrl || ''));
}

const COMPRESSED_STATIC_CACHE = new Map();
const COMPRESSED_STATIC_CACHE_MAX = Number(process.env.KIU_LOCAL_COMPRESS_CACHE_MAX || 64);

function compressedStaticCacheKey(filePath, mtimeMs, encoding) {
    return `${filePath}|${mtimeMs}|${encoding}`;
}

function getCachedCompressedBody(filePath, mtimeMs, encoding) {
    return COMPRESSED_STATIC_CACHE.get(compressedStaticCacheKey(filePath, mtimeMs, encoding)) || null;
}

function setCachedCompressedBody(filePath, mtimeMs, encoding, buffer) {
    const key = compressedStaticCacheKey(filePath, mtimeMs, encoding);
    if (COMPRESSED_STATIC_CACHE.has(key)) {
        COMPRESSED_STATIC_CACHE.delete(key);
    } else if (COMPRESSED_STATIC_CACHE.size >= COMPRESSED_STATIC_CACHE_MAX) {
        const oldest = COMPRESSED_STATIC_CACHE.keys().next().value;
        if (oldest) COMPRESSED_STATIC_CACHE.delete(oldest);
    }
    COMPRESSED_STATIC_CACHE.set(key, buffer);
}

function compressStaticFileSync(filePath, encoding) {
    const raw = fs.readFileSync(filePath);
    if (encoding === 'br') {
        return zlib.brotliCompressSync(raw, {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 4
            }
        });
    }
    if (encoding === 'gzip') {
        return zlib.gzipSync(raw);
    }
    return raw;
}

function getOrCreateCompressedBody(filePath, mtimeMs, encoding) {
    const cached = getCachedCompressedBody(filePath, mtimeMs, encoding);
    if (cached) return cached;
    const compressed = compressStaticFileSync(filePath, encoding);
    setCachedCompressedBody(filePath, mtimeMs, encoding, compressed);
    return compressed;
}

function buildUpstreamHeaders(clientHeaders = {}) {
    const headers = {};
    for (const [key, value] of Object.entries(clientHeaders || {})) {
        if (HOP_BY_HOP_HEADERS.has(String(key || '').toLowerCase())) continue;
        headers[key] = value;
    }
    headers.host = `${BACKEND_HOST}:${BACKEND_PORT}`;
    return headers;
}

function isRetryableProxyError(error) {
    const code = String(error && error.code || '').toUpperCase();
    return code === 'ECONNRESET'
        || code === 'ECONNREFUSED'
        || code === 'ETIMEDOUT'
        || code === 'EPIPE'
        || code === 'ECONNABORTED';
}

function writeOfflineProxyResponse(clientRequest, clientResponse) {
    if (clientResponse.headersSent || clientResponse.writableEnded) return;
    const acceptsJson = String(clientRequest.headers.accept || '').toLowerCase().includes('application/json')
        || String(clientRequest.url || '').startsWith('/api/');
    if (acceptsJson) {
        clientResponse.writeHead(503, {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Content-Type': 'application/json; charset=utf-8',
            Expires: '0',
            Pragma: 'no-cache'
        });
        clientResponse.end(JSON.stringify({
            ok: false,
            error: 'The portal backend is offline right now.',
            code: 'offline'
        }));
        return;
    }
    sendError(clientResponse, 503, 'The portal backend is offline right now.');
}

function sendProxiedBackendRequest(clientRequest, clientResponse, body, attempt) {
    const method = String(clientRequest.method || 'GET').toUpperCase();
    const requestPath = String(clientRequest.url || '/');
    const headers = buildUpstreamHeaders(clientRequest.headers);
    if (body && body.length) {
        headers['content-length'] = String(body.length);
    } else {
        delete headers['content-length'];
        delete headers['Content-Length'];
    }
    const options = {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        method,
        path: requestPath,
        headers,
        timeout: PROXY_TIMEOUT_MS
    };

    const proxyRequest = http.request(options, (proxyResponse) => {
        const headers = {
            ...proxyResponse.headers,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0'
        };
        clientResponse.writeHead(proxyResponse.statusCode || 502, headers);
        proxyResponse.pipe(clientResponse);
    });

    proxyRequest.on('timeout', () => {
        proxyRequest.destroy(Object.assign(new Error('Upstream proxy timeout'), { code: 'ETIMEDOUT' }));
    });

    proxyRequest.on('error', (error) => {
        const code = String(error && error.code || 'UNKNOWN');
        if (attempt === 0 && isRetryableProxyError(error) && !clientResponse.headersSent) {
            console.error(`[local-dev-proxy] ${method} ${requestPath} upstream ${code}; retrying once`);
            setTimeout(() => {
                sendProxiedBackendRequest(clientRequest, clientResponse, body, 1);
            }, PROXY_RETRY_DELAY_MS);
            return;
        }
        console.error(`[local-dev-proxy] ${method} ${requestPath} upstream ${code}`);
        writeOfflineProxyResponse(clientRequest, clientResponse);
    });

    if (body && body.length) {
        proxyRequest.end(body);
    } else {
        proxyRequest.end();
    }
}

function proxyBackendRequest(clientRequest, clientResponse) {
    const chunks = [];
    let total = 0;
    let settled = false;

    const fail = () => {
        if (settled) return;
        settled = true;
        writeOfflineProxyResponse(clientRequest, clientResponse);
    };

    clientRequest.on('data', (chunk) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        chunks.push(buf);
    });
    clientRequest.on('error', fail);
    clientRequest.on('aborted', fail);
    clientRequest.on('end', () => {
        if (settled) return;
        settled = true;
        const body = chunks.length ? Buffer.concat(chunks, total) : Buffer.alloc(0);
        sendProxiedBackendRequest(clientRequest, clientResponse, body, 0);
    });
}

const server = http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(String(request.method || '').toUpperCase()) && !shouldProxyToBackend(normalizeRequestPath(request.url))) {
        response.setHeader('Allow', 'GET, HEAD');
        sendError(response, 405, 'Method not allowed');
        return;
    }
    const requestPath = normalizeRequestPath(request.url);
    if (shouldProxyToBackend(requestPath)) {
        proxyBackendRequest(request, response);
        return;
    }
    if (isBlockedStaticPath(requestPath)) {
        sendError(response, 404, 'Not found');
        return;
    }

    const filePath = resolveFilePath(requestPath);
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendError(response, 404, 'Not found');
        return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const compression = getStaticCompression(request, contentType, stat.size);
    const cacheable = isVersionedAsset(request.url, requestPath);
    const cacheControl = cacheable
        ? 'public, max-age=31536000, immutable'
        : 'no-store, no-cache, must-revalidate, max-age=0';
    const headers = {
        'Cache-Control': cacheControl,
        'Content-Type': contentType,
        'Last-Modified': stat.mtime.toUTCString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()'
    };
    if (!cacheable) {
        headers.Expires = '0';
        headers.Pragma = 'no-cache';
    }
    if (compression) {
        headers['Content-Encoding'] = compression;
        headers.Vary = 'Accept-Encoding';
    } else {
        headers['Content-Length'] = stat.size;
    }

    let memoizedBody = null;
    if (compression && cacheable && request.method !== 'HEAD') {
        try {
            memoizedBody = getOrCreateCompressedBody(filePath, stat.mtimeMs, compression);
            headers['Content-Length'] = memoizedBody.length;
        } catch (error) {
            sendError(response, 500, 'Failed to compress file');
            return;
        }
    }

    response.writeHead(200, headers);
    if (request.method === 'HEAD') {
        response.end();
        return;
    }

    if (memoizedBody) {
        response.end(memoizedBody);
        return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
        if (!response.headersSent) {
            sendError(response, 500, 'Failed to read file');
            return;
        }
        response.destroy();
    });
    if (compression === 'br') {
        stream.pipe(zlib.createBrotliCompress({
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 4
            }
        })).pipe(response);
    } else if (compression === 'gzip') {
        stream.pipe(zlib.createGzip()).pipe(response);
    } else {
        stream.pipe(response);
    }
});

if (require.main === module) {
    server.listen(PORT, LISTEN_HOST, () => {
        console.log(`KIU local dev server listening on http://${LISTEN_HOST}:${PORT}`);
    });
}

module.exports = {
    BLOCKED_PATH_RE,
    HOP_BY_HOP_HEADERS,
    PROXY_TIMEOUT_MS,
    buildUpstreamHeaders,
    getCachedCompressedBody,
    getOrCreateCompressedBody,
    isBlockedStaticPath,
    isRetryableProxyError,
    normalizeRequestPath,
    resolveFilePath,
    setCachedCompressedBody,
    shouldProxyToBackend,
    getStaticCompression,
    isVersionedAsset
};
