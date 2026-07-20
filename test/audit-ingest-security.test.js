import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('audit ingest security regressions', () => {
    it('stores manual audit submissions as client annotations instead of raw forensic events', () => {
        const routeModule = readSource('backend/platform/routes/admin-support-routes.js');

        expect(routeModule).toContain("app.post('/api/audit/events'");
        expect(routeModule).toContain("eventDomain: 'client-annotation'");
        expect(routeModule).toContain("eventType: 'annotation-recorded'");
        expect(routeModule).toContain("entityType: 'client_annotation'");
        expect(routeModule).toContain('annotation: {');
        expect(routeModule).not.toContain("...(request.body?.event || request.body || {}),");
    });
});
