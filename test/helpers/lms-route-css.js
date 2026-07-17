import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'vitest';

/** Archived LMS route skins (hard-clean; not linked from lms.html). */
export const LMS_ROUTE_CSS_ARCHIVE_DIR = 'assets/css/_archive/2026-07-strip-non-dashboard';

export const LMS_ROUTE_CSS_SHEETS = [
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-route-core.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-quiz.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-workspace-chrome.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-interaction.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-quiz-live.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-gradebook-misc.css`,
    `${LMS_ROUTE_CSS_ARCHIVE_DIR}/lms-whiteboard-catalog.css`
];

/** @deprecated live pages no longer cache-bust route skins */
export const LMS_ROUTE_CSS_CACHE = 'archived';

const LIVE_BASENAMES = [
    'lms-route-core.css',
    'lms-quiz.css',
    'lms-workspace-chrome.css',
    'lms-interaction.css',
    'lms-quiz-live.css',
    'lms-gradebook-misc.css',
    'lms-whiteboard-catalog.css'
];

/** Concatenate archived LMS route sheets for content regressions. */
export function readLmsRouteCss() {
    return LMS_ROUTE_CSS_SHEETS
        .map((relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8'))
        .join('\n');
}

/**
 * Bare contract: lms.html must NOT link archived route skins;
 * body is lux-page-bare (hard-clean non-dashboard).
 */
export function expectLmsRouteCssLinks(html) {
    for (const name of LIVE_BASENAMES) {
        expect(html).not.toMatch(new RegExp(`assets/css/${name.replace('.', '\\.')}(\\?|"|')`));
    }
    expect(html).not.toMatch(/assets\/css\/lms-route\.css(\?|"|')/);
    expect(html).toMatch(/lux-page-bare\.css/);
    expect(html).toMatch(/\blux-page-bare\b/);
    expect(html).not.toMatch(/\blux-full-paint\b/);
}
