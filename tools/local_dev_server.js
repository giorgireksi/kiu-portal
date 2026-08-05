const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 8876);
const LISTEN_HOST = String(process.env.KIU_LOCAL_BIND_HOST || process.env.KIU_LOCAL_LMS_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_HOST = String(process.env.KIU_LOCAL_BACKEND_PROXY_HOST || process.env.KIU_LOCAL_BACKEND_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_PORT = Number(process.env.KIU_LOCAL_BACKEND_PORT || 48933);
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

function proxyBackendRequest(clientRequest, clientResponse) {
    const options = {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        method: clientRequest.method || 'GET',
        path: clientRequest.url || '/',
        headers: {
            ...clientRequest.headers,
            host: `${BACKEND_HOST}:${BACKEND_PORT}`
        }
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

    proxyRequest.on('error', () => {
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
    });

    clientRequest.pipe(proxyRequest);
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

    response.writeHead(200, headers);
    if (request.method === 'HEAD') {
        response.end();
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
    isBlockedStaticPath,
    normalizeRequestPath,
    resolveFilePath,
    shouldProxyToBackend,
    getStaticCompression,
    isVersionedAsset
};
