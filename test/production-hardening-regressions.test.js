import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('production hardening regressions', () => {
    it('runs the backend as the node user after root-only setup work', () => {
        const dockerfile = readSource('Dockerfile');
        const compose = readSource('docker-compose.production.yml');

        expect(dockerfile).toContain('\nUSER node\n');
        expect(dockerfile).not.toContain('su-exec');
        expect(dockerfile).toContain('node tools/migrate-postgres.js && exec node backend/platform/server.js');
        expect(compose).toContain('node tools/migrate-postgres.js && exec node backend/platform/server.js');
        expect(compose).toContain('read_only: true');
        expect(compose).toContain('cap_drop:\n      - ALL');
        expect(compose).toContain('no-new-privileges:true');
    });

    it('uses the production env source and hides internal repo material from Caddy file serving', () => {
        const compose = readSource('docker-compose.production.yml');
        const caddyfile = readSource('infra/caddy/Caddyfile');

        expect(compose).toContain('- .env.production');
        expect(compose).not.toContain('- .env\n');
        expect(caddyfile).toContain('hide /.env');
        expect(caddyfile).toContain('hide /backend');
        expect(caddyfile).toContain('hide /docs');
        expect(caddyfile).toContain('hide /tools');
        expect(caddyfile).toContain('hide /.git');
        expect(caddyfile).toContain('hide /anti-cheat');
        expect(caddyfile).toContain('hide /package.json');
    });

    it('keeps local static serving bounded and adds browser isolation headers', () => {
        const server = readSource('tools/local_dev_server.js');

        expect(server).toContain("if (!['GET', 'HEAD'].includes(String(request.method || '').toUpperCase())");
        expect(server).toContain("'X-Content-Type-Options': 'nosniff'");
        expect(server).toContain("'X-Frame-Options': 'SAMEORIGIN'");
    });

    it('rejects weak production credentials in readiness gates', () => {
        const checker = readSource('tools/check-production-readiness.js');

        expect(checker).toContain('hasStrongSecret');
        expect(checker).toContain('KIU_ADMIN_PASSWORD');
        expect(checker).toContain('KIU_FIREBASE_SERVICE_ACCOUNT_FILE or JSON');
    });
});
