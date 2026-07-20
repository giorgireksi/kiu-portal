/* CONTRACT: Browser/client manifest routes stay registered on the backend student-service route module. — see docs/test-as-map.md */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import {
    STUDENT_SERVICE_API_MANIFEST,
    STUDENT_SERVICE_CLIENT_MANIFEST,
    STUDENT_SERVICE_API_MANIFEST_VERSION,
    buildStudentServiceSamplePaths,
    extractStudentServiceRoutePatterns,
    normalizeStudentServiceApiPath
} from '../tools/student-service-api-manifest.mjs';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student service API route contract', () => {
    it('keeps manifest version aligned between node, browser, and backend contract', () => {
        const browserSource = readSource('assets/js/shared/student-service-api-paths.js');
        const contractSource = readSource('backend/platform/contracts/student-service-api-contract.js');
        expect(browserSource).toContain(`STUDENT_SERVICE_API_MANIFEST_VERSION = '${STUDENT_SERVICE_API_MANIFEST_VERSION}'`);
        expect(contractSource).toContain(`STUDENT_SERVICE_API_MANIFEST_VERSION: '${STUDENT_SERVICE_API_MANIFEST_VERSION}'`);
    });

    it('registers every client manifest route on the backend route module', () => {
        const routeSource = readSource('backend/platform/routes/student-service-routes.js');
        const backendRoutes = extractStudentServiceRoutePatterns(routeSource);
        const backendKeys = new Set(backendRoutes.map(route => `${route.method} ${route.pattern}`));

        const missing = STUDENT_SERVICE_CLIENT_MANIFEST
            .filter(entry => !backendKeys.has(`${entry.method} ${entry.pattern}`))
            .map(entry => `${entry.method} ${entry.pattern}`);

        expect(missing).toEqual([]);
    });

    it('maps every client path builder sample to a registered backend route', () => {
        const routeSource = readSource('backend/platform/routes/student-service-routes.js');
        const backendRoutes = extractStudentServiceRoutePatterns(routeSource);
        const backendKeys = new Set(backendRoutes.map(route => `${route.method} ${route.pattern}`));
        const samplePaths = buildStudentServiceSamplePaths();

        const missing = Object.entries(samplePaths)
            .map(([id, path]) => {
                const manifestEntry = STUDENT_SERVICE_CLIENT_MANIFEST.find(entry => entry.id === id);
                const method = manifestEntry?.method || 'POST';
                const normalized = normalizeStudentServiceApiPath(path);
                return backendKeys.has(`${method} ${normalized}`) ? null : `${method} ${normalized} (${id})`;
            })
            .filter(Boolean);

        expect(missing).toEqual([]);
    });

    
