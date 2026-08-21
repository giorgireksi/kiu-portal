const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_MAX_FIELD_BYTES = 1024 * 1024;
const DEFAULT_MAX_REQUEST_BYTES = 110 * 1024 * 1024;

function uploadError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parseMultipartBoundary(contentType = '') {
    const match = String(contentType || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    return String(match?.[1] || match?.[2] || '').trim();
}

function parsePartHeaders(raw = '') {
    const headers = {};
    String(raw || '').split(/\r?\n/).forEach((line) => {
        const separator = line.indexOf(':');
        if (separator <= 0) return;
        headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
    });
    return headers;
}

function parseContentDisposition(value = '') {
    const name = String(value || '').match(/(?:^|;)\s*name="([^"]*)"/i)?.[1]
        || String(value || '').match(/(?:^|;)\s*name=([^;\s]+)/i)?.[1]
        || '';
    const filename = String(value || '').match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1]
        || String(value || '').match(/(?:^|;)\s*filename=([^;\s]+)/i)?.[1]
        || '';
    return {
        name: String(name).trim(),
        filename: path.basename(String(filename).replace(/\\/g, '/')).trim()
    };
}

/**
 * Stream one multipart/form-data upload to a temporary file.
 * This intentionally avoids buffering the binary in a JSON string or a
 * single Buffer, which is what made large Background Gallery uploads put
 * unnecessary pressure on the backend process.
 */
function parseMultipartUpload(request, options = {}) {
    const boundaryText = parseMultipartBoundary(request.headers?.['content-type']);
    if (!boundaryText || boundaryText.length > 200) {
        return Promise.reject(uploadError(400, 'Invalid multipart upload boundary.'));
    }
    const maxFileBytes = Math.max(1, Number(options.maxFileBytes) || 100 * 1024 * 1024);
    const maxRequestBytes = Math.max(
        maxFileBytes + 1024 * 1024,
        Number(options.maxRequestBytes) || DEFAULT_MAX_REQUEST_BYTES
    );
    const maxFieldBytes = Math.max(1024, Number(options.maxFieldBytes) || DEFAULT_MAX_FIELD_BYTES);
    const boundary = Buffer.from(`--${boundaryText}`);
    const delimiter = Buffer.from(`\r\n--${boundaryText}`);
    const tempPath = path.join(
        os.tmpdir(),
        `kiu-multipart-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );

    return new Promise((resolve, reject) => {
        let settled = false;
        let totalBytes = 0;
        let buffer = Buffer.alloc(0);
        let state = 'preamble';
        let currentPart = null;
        let output = null;
        let fileResult = null;
        let outputBackpressured = false;
        const fields = {};

        const cleanup = () => {
            try { output?.destroy(); } catch (_) {}
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
        };
        const fail = (error) => {
            if (settled) return;
            settled = true;
            cleanup();
            try { request.destroy(); } catch (_) {}
            reject(error instanceof Error ? error : uploadError(400, String(error || 'Invalid upload.')));
        };
        const succeed = () => {
            if (settled) return;
            if (!fileResult) {
                fail(uploadError(400, 'Multipart upload is missing a file.'));
                return;
            }
            output.end(() => {
                if (settled) return;
                settled = true;
                resolve({ fields, file: { ...fileResult, path: tempPath } });
            });
            request.resume();
        };
        const emitPartData = (chunk) => {
            if (!chunk.length || !currentPart) return;
            if (currentPart.filename) {
                currentPart.size += chunk.length;
                if (currentPart.size > maxFileBytes) {
                    fail(uploadError(413, 'Upload is too large for the server limit.'));
                    return;
                }
                if (!output.write(chunk) && !outputBackpressured) {
                    outputBackpressured = true;
                    request.pause();
                    output.once('drain', () => {
                        outputBackpressured = false;
                        if (!settled) request.resume();
                    });
                }
                return;
            }
            currentPart.size += chunk.length;
            if (currentPart.size > maxFieldBytes) {
                fail(uploadError(413, 'Multipart field is too large.'));
                return;
            }
            currentPart.chunks.push(chunk);
        };
        const finishPart = () => {
            if (!currentPart) return;
            if (currentPart.filename) {
                if (fileResult) {
                    fail(uploadError(400, 'Only one file is allowed per upload.'));
                    return;
                }
                fileResult = {
                    name: currentPart.filename,
                    type: currentPart.headers['content-type'] || 'application/octet-stream',
                    size: currentPart.size
                };
            } else if (currentPart.name) {
                fields[currentPart.name] = Buffer.concat(currentPart.chunks).toString('utf8');
            }
            currentPart = null;
        };
        const processBuffer = () => {
            while (!settled) {
                if (state === 'end') return;
                if (state === 'preamble') {
                    const index = buffer.indexOf(boundary);
                    if (index < 0) {
                        buffer = buffer.slice(Math.max(0, buffer.length - boundary.length));
                        return;
                    }
                    const afterInitialBoundary = buffer.slice(index + boundary.length);
                    if (afterInitialBoundary.length < 2) return;
                    buffer = afterInitialBoundary;
                    if (buffer.subarray(0, 2).equals(Buffer.from('--'))) {
                        fail(uploadError(400, 'Multipart upload has no file.'));
                        return;
                    }
                    if (!buffer.subarray(0, 2).equals(Buffer.from('\r\n'))) {
                        fail(uploadError(400, 'Malformed multipart upload.'));
                        return;
                    }
                    buffer = buffer.slice(2);
                    state = 'headers';
                    continue;
                }
                if (state === 'headers') {
                    const index = buffer.indexOf(Buffer.from('\r\n\r\n'));
                    if (index < 0) {
                        if (buffer.length > 64 * 1024) fail(uploadError(400, 'Multipart headers are too large.'));
                        return;
                    }
                    const headers = parsePartHeaders(buffer.slice(0, index).toString('utf8'));
                    const disposition = parseContentDisposition(headers['content-disposition']);
                    if (!disposition.name && !disposition.filename) {
                        fail(uploadError(400, 'Multipart part is missing Content-Disposition.'));
                        return;
                    }
                    currentPart = {
                        name: disposition.name,
                        filename: disposition.filename,
                        headers,
                        chunks: [],
                        size: 0
                    };
                    if (currentPart.filename && !output) {
                        output = fs.createWriteStream(tempPath, { flags: 'wx' });
                        output.on('error', fail);
                    }
                    buffer = buffer.slice(index + 4);
                    state = 'body';
                    continue;
                }
                if (state === 'body') {
                    const index = buffer.indexOf(delimiter);
                    if (index < 0) {
                        const keep = delimiter.length + 2;
                        if (buffer.length <= keep) return;
                        emitPartData(buffer.slice(0, buffer.length - keep));
                        buffer = buffer.slice(buffer.length - keep);
                        continue;
                    }
                    const afterBoundary = buffer.slice(index + delimiter.length);
                    if (afterBoundary.length < 2) return;
                    emitPartData(buffer.slice(0, index));
                    if (settled) return;
                    finishPart();
                    if (settled) return;
                    buffer = afterBoundary;
                    if (buffer.subarray(0, 2).equals(Buffer.from('--'))) {
                        state = 'end';
                        succeed();
                        return;
                    }
                    if (!buffer.subarray(0, 2).equals(Buffer.from('\r\n'))) {
                        fail(uploadError(400, 'Malformed multipart boundary.'));
                        return;
                    }
                    buffer = buffer.slice(2);
                    state = 'headers';
                }
            }
        };

        request.on('data', (chunk) => {
            if (settled) return;
            totalBytes += chunk.length;
            if (totalBytes > maxRequestBytes) {
                fail(uploadError(413, 'Upload request is too large for the server limit.'));
                return;
            }
            buffer = Buffer.concat([buffer, chunk]);
            processBuffer();
        });
        request.on('end', () => {
            if (settled || state === 'end') return;
            fail(uploadError(400, 'Incomplete multipart upload.'));
        });
        request.on('error', fail);
    });
}

module.exports = {
    parseMultipartUpload,
    parseMultipartBoundary
};
