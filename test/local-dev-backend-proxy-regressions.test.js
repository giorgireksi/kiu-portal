import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('local dev backend proxy regressions', () => {
    it('routes loopback frontend traffic through the same-origin local server proxy', () => {
        const api = readSource('assets/js/app/api.js');
        const login = readSource('assets/js/pages/login-runtime.js');
        const examPortal = readSource('assets/js/pages/exam-portal.js');
        const server = readSource('tools/local_dev_server.js');

        expect(api).toContain('return window.location.origin;');
        expect(login).toContain('return window.location.origin;');
        expect(examPortal).toContain("if (/^(127\\.0\\.0\\.1|localhost)$/i.test(host)) {");
        expect(examPortal).toContain("window.location?.port ? `:${window.location.port}` : ''");
        expect(server).toContain("return requestPath.startsWith('/api/')");
        expect(server).toContain("|| requestPath === '/health'");
        expect(server).toContain("|| requestPath === '/ready'");
        expect(server).toContain("|| requestPath === '/download'");
        expect(server).toContain("error: 'The portal backend is offline right now.'");
    });
});
