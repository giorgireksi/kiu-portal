import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('platform CORS regressions', () => {
    it('keeps extra frontend origins explicit and loopback defaults gated away from production', () => {
        const source = readSource('backend/platform/server.js');

        expect(source).toContain("const EXTRA_CORS_ORIGINS = String(process.env.KIU_EXTRA_CORS_ORIGINS || '')");
        expect(source).toContain("const includeDefaultLoopbackOrigins = !IS_PRODUCTION_ENVIRONMENT || isLoopbackOrigin(APP_ORIGIN);");
        expect(source).toContain("allowed.add('http://127.0.0.1:8876');");
        expect(source).toContain("allowed.add('http://localhost:8876');");
        expect(source).toContain("EXTRA_CORS_ORIGINS.forEach((origin) => allowed.add(origin));");
        expect(source).toContain("if (includeDefaultLoopbackOrigins && parsed.hostname === '127.0.0.1')");
        expect(source).toContain("} else if (includeDefaultLoopbackOrigins && parsed.hostname === 'localhost') {");
    });
});
