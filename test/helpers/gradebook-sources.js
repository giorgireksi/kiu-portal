/**
 * Canonical gradebook module chain for source-lock tests (Wave H5).
 * Order matches LMS_GRADEBOOK_MODULE_URLS in lms-classroom-tabs-runtime.js.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Basename paths without query strings — same order as LMS_GRADEBOOK_MODULE_URLS. */
export const GRADEBOOK_MODULE_PATHS = Object.freeze([
    'assets/js/pages/gradebook-history-ui-runtime.js',
    'assets/js/pages/gradebook-quiz-map-runtime.js',
    'assets/js/pages/gradebook-model.js',
    'assets/js/pages/gradebook-weights-runtime.js',
    'assets/js/pages/gradebook-components-runtime.js',
    'assets/js/pages/gradebook-workspace.js',
    'assets/js/pages/gradebook-staff.js'
]);

export function gradebookSources(root = ROOT) {
    return GRADEBOOK_MODULE_PATHS.map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
}
