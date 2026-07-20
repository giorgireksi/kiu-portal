import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('portal state route handler', () => {
    it('uses async handler with store guard, flush, and error handling', () => {
        const routes = readSource('backend/platform/routes/portal-support-routes.js');

        expect(routes).toContain("app.post('/api/portal/state', async (request, response) => {");
        expect(routes).toContain("sendError(response, 503, 'Platform store is not ready.');");
        expect(routes).toContain('await store.flushPendingWrites();');
        expect(routes).toContain('Number(error?.statusCode) === 400');
        expect(routes).toContain("sendError(response, 400, error.message || 'Invalid portal state.');");
        expect(routes).toContain("sendError(response, 500, 'Failed to save portal state.');");
    });

    it('persists portal state through portal-scoped writes', () => {
        const store = readSource('backend/platform/store.js');
        const localStore = readSource('backend/platform/local-record-store.js');
        const postgresStore = readSource('backend/platform/postgres-record-store.js');

        expect(store).toContain('savePortal()');
        expect(store).toMatch(/savePortalState[\s\S]*?this\.savePortal\(\);/);
        expect(localStore).toContain('async writeNamespaces(namespaces = {})');
        expect(postgresStore).toMatch(/async writeNamespaces\(namespaces = \{\}(?:, options = \{\})?\)/);
    });

    it('registers a global express error handler', () => {
        const server = readSource('backend/platform/server.js');

        expect(server).toContain('app.use((error, request, response, next) => {');
        expect(server).toContain("sendError(response, 500, 'Internal server error.');");
    });

    it('writes portal saves to a local slice file', () => {
        const localStore = readSource('backend/platform/local-record-store.js');

        expect(localStore).toContain('namespaceSlicePath(this.statePath, \'portal\')');
        expect(localStore).toContain('writeFileAtomically');
    });
});