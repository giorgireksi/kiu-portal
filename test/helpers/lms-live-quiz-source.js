/**
 * Canonical live-quiz module chain for source-lock tests.
 * Order matches LMS_LIVE_QUIZ_MODULE_URLS in lms-classroom-tabs-runtime.js.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

export const LMS_LIVE_QUIZ_MODULE_PATHS = Object.freeze([
    'assets/js/pages/lms-week-store-runtime.js',
    'assets/js/pages/lms-workspace-sync-timing.js',
    'assets/js/pages/lms-live-quiz-access-runtime.js',
    'assets/js/pages/lms-live-quiz-workspace-runtime.js',
    'assets/js/pages/lms-live-quiz-podium-runtime.js',
    'assets/js/pages/lms-live-quiz-session-runtime.js',
    'assets/js/pages/lms-live-quiz-ui-staff-runtime.js',
    'assets/js/pages/lms-live-quiz-ui-runtime.js'
]);

export function readLmsLiveQuizSource(root = ROOT) {
    return LMS_LIVE_QUIZ_MODULE_PATHS
        .map((path) => readFileSync(join(root, path), 'utf8'))
        .join('\n');
}

export function readLmsLiveQuizAccessRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-live-quiz-access-runtime.js'), 'utf8');
}

export function readLmsLiveQuizWorkspaceRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-live-quiz-workspace-runtime.js'), 'utf8');
}

export function readLmsLiveQuizSessionRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-live-quiz-session-runtime.js'), 'utf8');
}

export function readLmsLiveQuizUiStaffRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-live-quiz-ui-staff-runtime.js'), 'utf8');
}

export function readLmsLiveQuizMainUiRuntime(root = ROOT) {
    return readFileSync(join(root, 'assets/js/pages/lms-live-quiz-ui-runtime.js'), 'utf8');
}

/** Session + staff + main UI peels (order matches lazy module chain tail). */
export function readLmsLiveQuizUiChain(root = ROOT) {
    return [
        readLmsLiveQuizSessionRuntime(root),
        readLmsLiveQuizUiStaffRuntime(root),
        readLmsLiveQuizMainUiRuntime(root)
    ].join('\n');
}
