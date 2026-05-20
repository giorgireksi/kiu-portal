import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('SSE guardrail regressions', () => {
    it('caps live event stream registrations and rejects excess connections', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/portal-support-routes.js');

        expect(server).toContain('const SSE_MAX_CONNECTIONS_PER_USER = Math.max(1, Number(process.env.KIU_SSE_MAX_CONNECTIONS_PER_USER || 4));');
        expect(server).toContain('const SSE_MAX_CONNECTIONS_TOTAL = Math.max(SSE_MAX_CONNECTIONS_PER_USER, Number(process.env.KIU_SSE_MAX_CONNECTIONS_TOTAL || 200));');
        expect(server).toContain('function getSseConnectionCount() {');
        expect(server).toContain('if (currentCount >= SSE_MAX_CONNECTIONS_PER_USER || totalCount >= SSE_MAX_CONNECTIONS_TOTAL) return false;');
        expect(routeModule).toContain("sendError(response, 429, 'Too many live event streams are already open for this session.')");
    });
});
