import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expect } from 'vitest';

/* Retired CSS helpers — denylist / live stack only. See docs/active-vs-archive.md */

/** Route paint sheets retired in bare-shell era (must not exist under assets/css/). */
export const RETIRED_ROUTE_CSS = [
    'social-rebuild.css',
    'social-projects-lms.css',
    'social-photography-lms.css',
    'social-surveys-lms.css',
    'news-route.css',
    'students-admin-lms.css',
    'student-service-route.css',
    'admin-library-route.css',
    'admin-orders-route.css',
    'admin-scheduler-route.css',
    'admin-tools-luxury.css',
    'profile-view-route.css',
    'index-home-editor.css',
    'personal-data-route.css',
    'library-route.css',
    'exam-studio.css',
    'programs-route.css',
    'study-card-route.css',
    'registration-route.css',
    'orders-route.css',
    'staff-command-center.css',
    'index-luxury.css',
    'timetable-route.css',
    'lms-route-core.css',
    'lms-quiz.css',
    'lms-workspace-chrome.css',
    'lms-interaction.css',
    'lms-quiz-live.css',
    'lms-gradebook-misc.css',
    'lms-whiteboard-catalog.css',
];

const BARE_STACK = [
    'assets/css/lux-tokens.css',
    'assets/css/lux-focus-panel.css',
    'assets/css/lux-controls.css',
    'assets/css/lux-shell.css',
    'assets/css/lux-page-bare-lite.css',
];

const INDEX_STACK_EXTRA = [
    'assets/css/lux-fouc-ht.css',
    'assets/css/index-home-layout.css',
    'assets/css/index-home-widgets.css',
    'assets/css/index-home-role.css',
];

/** Concatenated index-only home dashboard CSS (layout + widgets + role). */
export const HOME_DASHBOARD_CSS_FILES = [
    'assets/css/index-home-layout.css',
    'assets/css/index-home-widgets.css',
    'assets/css/index-home-role.css',
];

export function readHomeDashboardCss() {
    return HOME_DASHBOARD_CSS_FILES.map((relativePath) => readCss(relativePath)).join('\n');
}

/** Read CSS (or any file); returns '' when missing. */
export function readCss(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Alias for HTML/JS reads. */
export function readSource(relativePath) {
    return readCss(relativePath);
}

export function readWarmglassCss() {
    return readCss('assets/css/lux-tokens.css') + '\n' + readCss('assets/css/lux-modals.css');
}

/** Droplist SSOT (tokens + panel paint live in lux-droplist.css). */
export function readDroplistCss() {
    return readCss('assets/css/lux-droplist.css');
}

export function readBareStackCss({ includeIndex = false } = {}) {
    const sheets = includeIndex ? [...BARE_STACK, ...INDEX_STACK_EXTRA] : BARE_STACK;
    return sheets.map(readCss).join('\n');
}

export function expectRetiredCss(basename) {
    expect(existsSync(join(process.cwd(), 'assets/css', basename))).toBe(false);
}

