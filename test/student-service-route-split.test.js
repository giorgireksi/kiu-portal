import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
    STUDENT_SERVICE_API_MANIFEST,
    extractStudentServiceRoutePatterns
} from '../tools/student-service-api-manifest.mjs';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student service route split', () => {
    it('mounts the student-service backend route family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/student-service-routes.js');
        const backendRoutes = extractStudentServiceRoutePatterns(routeModule);
        const backendKeys = new Set(backendRoutes.map(route => `${route.method} ${route.pattern}`));

        expect(server).toContain("require('./routes/student-service-routes')");
        expect(server).toContain('registerStudentServiceRoutes(app, {');
        expect(routeModule).toContain("broadcastAll({ type: 'student-service:updated'");
        expect(routeModule).toContain('request.kiuSessionAccount || requireSessionAccount(request, response)');

        const missing = STUDENT_SERVICE_API_MANIFEST
            .filter(entry => !backendKeys.has(`${entry.method} ${entry.pattern}`))
            .map(entry => `${entry.method} ${entry.pattern}`);

        expect(missing).toEqual([]);
    });

    it('invalidates student-service render cache on SSE inbox updates', () => {
        const auth = readSource('assets/js/app/auth.js');
        const sseBlock = auth.split("case 'student-service:updated':")[1]?.split('case ')[0] || '';

        expect(sseBlock).toContain('fetchStudentServiceBootstrap(true)');
        expect(sseBlock).toContain('invalidateStudentServiceRenderSignature');
        expect(sseBlock).toContain('studentServiceChromeSignature');
        expect(sseBlock).toContain('kiuPortalFetch');
        expect(sseBlock).toContain("document.getElementById('page-student-service')");
        expect(sseBlock).toContain('renderStudentServicePage()');
        expect(sseBlock).not.toContain("getActivePageId() === 'student-service'");
    });

    it('dedupes parallel SSE connects with an in-flight guard', () => {
        const auth = readSource('assets/js/app/auth.js');
        const connectBlock = auth.split('function connectKiuRealtimeEventStream(')[1]?.split('\nfunction ')[0] || '';

        expect(connectBlock).toContain('sseConnectInFlight');
        expect(connectBlock).toContain('if (runtime.sseConnectInFlight) return');
    });
});