const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 8876);
const LISTEN_HOST = String(process.env.KIU_LOCAL_BIND_HOST || process.env.KIU_LOCAL_LMS_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_HOST = String(process.env.KIU_LOCAL_BACKEND_PROXY_HOST || process.env.KIU_LOCAL_BACKEND_HOST || '127.0.0.1').trim() || '127.0.0.1';
const BACKEND_PORT = Number(process.env.KIU_LOCAL_BACKEND_PORT || 48933);
const BLOCKED_PATH_RE = /^\/(?:artifacts(?:\/|$)|admin-tools-standalone(?:\.dom)?\.html$)/i;

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
    if (!absolutePath.startsWith(ROOT)) return null;
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
    const requestPath = normalizeRequestPath(request.url);
    if (shouldProxyToBackend(requestPath)) {
        proxyBackendRequest(request, response);
        return;
    }
    if (BLOCKED_PATH_RE.test(requestPath)) {
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
    const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Expires': '0',
        'Last-Modified': stat.mtime.toUTCString(),
        'Pragma': 'no-cache'
    };

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
    stream.pipe(response);
});

server.listen(PORT, LISTEN_HOST, () => {
    console.log(`KIU local dev server listening on http://${LISTEN_HOST}:${PORT}`);
});
