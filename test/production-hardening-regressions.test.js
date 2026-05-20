import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('production hardening regressions', () => {
    it('runs the backend as the node user after root-only setup work', () => {
        const dockerfile = readSource('Dockerfile');
        const compose = readSource('docker-compose.production.yml');

        expect(dockerfile).toContain('apk add --no-cache su-exec');
        expect(dockerfile).toContain("exec su-exec node sh -c 'node backend/platform/server.js'");
        expect(compose).toContain("exec su-exec node sh -c 'node tools/migrate-postgres.js && exec node backend/platform/server.js'");
        expect(compose).toContain('read_only: true');
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
        expect(caddyfile).toContain('hide /package.json');
    });
});
