/**
 * Canonical LMS interaction module chain for source-lock tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

export const LMS_INTERACTION_MODULE_PATHS = Object.freeze([
    'assets/js/shared/messenger-gradebook-runtime.js',
    'assets/js/shared/messenger-chrome-runtime.js',
    'assets/js/shared/messenger.js',
    'assets/js/pages/lms-interaction-messages-runtime.js',
    'assets/js/pages/lms-classroom-tabs-shell-runtime.js'
]);

export function readLmsInteractionSource(root = ROOT) {
    return LMS_INTERACTION_MODULE_PATHS
        .map((path) => readFileSync(join(root, path), 'utf8'))
        .join('\n')
        + '\n'
        + readFileSync(join(root, 'assets/js/pages/lms-classroom-tabs-runtime.js'), 'utf8');
}

export function readLmsInteractionShellRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-classroom-tabs-shell-runtime.js'), 'utf8');
}

export function readLmsContentSource(root = ROOT) {
    const paths = [
        'assets/js/pages/lms-file-storage-runtime.js',
        'assets/js/pages/lms-week-store-runtime.js',
        'assets/js/pages/lms-content-library-runtime.js',
        'assets/js/pages/lms-materials-runtime.js',
        'assets/js/pages/lms-assignments-runtime.js'
    ];
    return paths.map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
}
