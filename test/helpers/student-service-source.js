/**
 * Canonical student-service hub + peel chain for source-lock tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

export const STUDENT_SERVICE_MODULE_PATHS = Object.freeze([
    'assets/js/pages/student-service-qa.js',
    'assets/js/pages/student-service-model.js',
    'assets/js/pages/student-service.js',
    'assets/js/pages/student-service-page-runtime.js',
    'assets/js/pages/student-service-inbox-runtime.js',
    'assets/js/pages/student-service-ops-runtime.js',
    'assets/js/pages/student-service-modules-runtime.js',
    'assets/js/pages/student-service-bootstrap-runtime.js',
    'assets/js/pages/student-service-chrome.js',
    'assets/js/pages/student-service-events.js',
    'assets/js/pages/student-service-tickets.js',
    'assets/js/pages/student-service-attachments.js',
    'assets/js/pages/student-service-qa-staff-runtime.js',
    'assets/js/pages/student-service-qa-thread-runtime.js',
    'assets/js/pages/student-service-filters.js'
]);

export function readStudentServiceSource(root = ROOT) {
    return STUDENT_SERVICE_MODULE_PATHS
        .map((path) => readFileSync(join(root, path), 'utf8'))
        .join('\n');
}
