import { readFileSync } from 'fs';
import { join } from 'path';

/** Order matches LMS_WHITEBOARD_MODULE_URLS in lms-classroom-tabs-runtime.js (minus sync-timing). */
export const LMS_WHITEBOARD_MODULE_PATHS = Object.freeze([
    'assets/js/pages/lms-whiteboard-workspace-runtime.js',
    'assets/js/pages/lms-whiteboard-collab-runtime.js',
    'assets/js/pages/lms-whiteboard-history-runtime.js',
    'assets/js/pages/lms-whiteboard-minimap-runtime.js',
    'assets/js/pages/lms-whiteboard-document-runtime.js',
    'assets/js/pages/lms-whiteboard-model.js',
    'assets/js/pages/lms-whiteboard-model-bridge.js',
    'assets/js/pages/lms-whiteboard-pointer-runtime.js',
    'assets/js/pages/lms-whiteboard-paint-runtime.js',
    'assets/js/pages/lms-whiteboard-chrome-runtime.js',
    'assets/js/pages/lms-whiteboard-session-runtime.js',
    'assets/js/pages/lms-whiteboard-selection-runtime.js',
    'assets/js/pages/lms-whiteboard-runtime.js'
]);

const WHITEBOARD_MODULES = LMS_WHITEBOARD_MODULE_PATHS.map((p) => p.replace('assets/js/pages/', ''));

export function readLmsWhiteboardSource() {
    return LMS_WHITEBOARD_MODULE_PATHS
        .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
        .join('\n');
}

/** Main whiteboard runtime peel only (not workspace/paint/pointer peels). */
export function readLmsWhiteboardMainRuntime() {
    return readFileSync(join(process.cwd(), 'assets/js/pages/lms-whiteboard-runtime.js'), 'utf8');
}

export function readLmsWhiteboardSessionRuntime() {
    return readFileSync(join(process.cwd(), 'assets/js/pages/lms-whiteboard-session-runtime.js'), 'utf8');
}
