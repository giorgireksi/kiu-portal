import { existsSync } from 'fs';
import { join } from 'path';
import { expect } from 'vitest';

/**
 * Retired LMS route skins (hard-clean) — must not exist under assets/css/
 * or be linked from HTML. Archive tree purged 2026-07.
 */
export const RETIRED_LMS_ROUTE_CSS = [
    'lms-route-core.css',
    'lms-quiz.css',
    'lms-workspace-chrome.css',
    'lms-interaction.css',
    'lms-quiz-live.css',
    'lms-gradebook-misc.css',
    'lms-whiteboard-catalog.css',
    'timetable-route.css'
];

/**
 * Shared-paint contract: lms.html must NOT link retired route skins;
 * body keeps lux-page-bare + lux-full-paint (shared chrome paint).
 */
export function expectLmsRouteCssLinks(html) {
    for (const name of RETIRED_LMS_ROUTE_CSS) {
        if (name === 'timetable-route.css') continue;
        expect(html).not.toMatch(new RegExp(`assets/css/${name.replace('.', '\\.')}(\\?|"|')`));
    }
    expect(html).not.toMatch(/assets\/css\/lms-route\.css(\?|"|')/);
    expect(html).toMatch(/lux-shell\.css/);
    expect(html).toMatch(/lux-page-bare-lite\.css/);
    expect(html).toMatch(/lux-layout-primitives\.css/);
    expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
    expect(html).toMatch(/\blux-page-bare\b/);
    expect(html).toMatch(/\blux-full-paint\b/);
    expect(html).not.toMatch(/lux-shell-paint\.css/);
    expect(html).toMatch(/lux-focus-panel\.css/);
}

/** Assert retired LMS skins are absent from live assets/css/. */
export function expectRetiredLmsRouteCssGone() {
    for (const name of RETIRED_LMS_ROUTE_CSS) {
        expect(existsSync(join(process.cwd(), 'assets/css', name)), name).toBe(false);
    }
    expect(existsSync(join(process.cwd(), 'assets/css/_archive'))).toBe(false);
}
