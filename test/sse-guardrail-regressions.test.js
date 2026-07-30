import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('SSE guardrail regressions', () => {
    it('caps live event stream registrations and replaces oldest per-user streams', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/portal-support-routes.js');
        const registerBlock = server.split('function registerSseClient(')[1]?.split('\nfunction ')[0] || '';

        expect(server).toContain('const SSE_MAX_CONNECTIONS_PER_USER = Math.max(1, Number(process.env.KIU_SSE_MAX_CONNECTIONS_PER_USER || 4));');
        expect(server).toContain('const SSE_MAX_CONNECTIONS_TOTAL = Math.max(SSE_MAX_CONNECTIONS_PER_USER, Number(process.env.KIU_SSE_MAX_CONNECTIONS_TOTAL || 200));');
        expect(server).toContain('function getSseConnectionCount() {');
        expect(registerBlock).toContain('if (getSseConnectionCount() >= SSE_MAX_CONNECTIONS_TOTAL) return false;');
        expect(registerBlock).toContain('while (currentCount >= SSE_MAX_CONNECTIONS_PER_USER && currentSet?.size)');
        expect(registerBlock).toContain('const oldest = currentSet.values().next().value');
        expect(registerBlock).toContain('unregisterSseClient(key, oldest)');
        expect(routeModule).toContain("sendError(response, 429, 'Too many live event streams are already open for this session.')");
    });
});
