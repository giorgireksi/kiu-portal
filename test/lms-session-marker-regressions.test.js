import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

const MARKER_TYPES = ['quiz', 'oral_quiz', 'exam', 'presentation', 'project', 'lab', 'deadline', 'important'];

function markerClassToken(type) {
    return String(type || 'important').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

describe('lms session marker regressions', () => {
    const runtimeSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
    const sessionsRuntimeSource = readSource('assets/js/pages/lms-classroom-sessions-runtime.js');
    const indexRuntimeJs = readSource('assets/js/features/luxury-index-runtime.js');
    const bareLiteCss = readSource('assets/css/lux-page-bare-lite.css');

    it('defines parseLmsWeekNumberInput for comma and range syntax', () => {
        expect(runtimeSource).toContain('function parseLmsWeekNumberInput(raw, maxWeek = 16)');
        expect(runtimeSource).toContain("trimmed.includes('-')");
    });

    it('stores sessionKey on normalized markers and dedupes on create', () => {
        expect(runtimeSource).toContain('function buildLmsSessionMarkerSessionKey(slot = {})');
        expect(runtimeSource).toContain('sessionKey,');
        expect(runtimeSource).toContain('function upsertLmsSessionMarkerInList(markers = [], marker = {}, groupKey = \'\')');
        expect(runtimeSource).toContain('upsertLmsSessionMarkerInList(markers, {');
    });

    it('replaces multi-select weeks with week input and schedule preview', () => {
        expect(runtimeSource).toContain('id="lms-session-marker-week-input"');
        expect(runtimeSource).toContain('id="lms-session-marker-preview"');
        expect(runtimeSource).toContain('lms-session-marker-slot-check');
        expect(runtimeSource).toContain('Mark selected sessions');
        expect(runtimeSource).not.toContain('id="lms-session-marker-weeks"');
        expect(runtimeSource).not.toContain('select[multiple]');
    });

    it('exposes clear selected-state styling for marker type chips', () => {
        expect(sessionsRuntimeSource).toContain('is-picking');
        expect(runtimeSource).toContain('aria-pressed');
        expect(bareLiteCss).toContain('.lms-session-marker-type-chip:is(.is-active, [aria-pressed="true"])');
        expect(bareLiteCss).toContain('.lms-session-marker-type-chip.is-picking');
    });

    it('defines a distinct shared palette token per marker type', () => {
        MARKER_TYPES.forEach(type => {
            expect(bareLiteCss).toContain(`.marker-${markerClassToken(type)}`);
            expect(bareLiteCss).toContain(`[data-marker-type="${type}"]`);
        });
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });

    it('uses per-type timetable rules instead of grouping quiz with deadline', () => {
        expect(bareLiteCss).toMatch(
            /body\.lux-route-timetable \.marker-quiz\s*\{[^}]*--session-marker-accent:\s*#3b82f6/s
        );
        expect(bareLiteCss).toMatch(
            /body\.lux-route-timetable \.marker-deadline\s*\{[^}]*--session-marker-accent:\s*#eab308/s
        );
        expect(bareLiteCss).not.toMatch(
            /body\.lux-route-timetable \.marker-quiz,\s*\nbody\.lux-route-timetable \.marker-deadline\s*\{[^}]*--session-marker-accent:\s*#f59e0b/s
        );
    });

    it('styles marked LMS UI with marker-{type} classes', () => {
        expect(runtimeSource).toContain('lms-session-marker-card is-${escapeHtml(status)} marker-${lmsSessionMarkerClassToken(marker.type)}');
        expect(sessionsRuntimeSource).toContain('lms-session-marker-slot-badge marker-${lmsSessionMarkerClassToken');
        expect(runtimeSource).toContain('class="lms-session-marker-type-chip');
        expect(runtimeSource).not.toContain('lms-session-marker-type-chip marker-${lmsSessionMarkerClassToken(type)}');
    });

    it('skips lux-modern-button decoration on session marker type chips', () => {
        expect(indexRuntimeJs).toContain("node.closest?.('.lms-session-marker-type-chips')");
        expect(indexRuntimeJs).toContain("node.classList?.contains('lms-session-marker-type-chip')");
    });

    it('forces per-type chip button colors over lux-modern-button', () => {
        MARKER_TYPES.forEach(type => {
            expect(bareLiteCss).toContain(`[data-marker-type="${type}"]`);
            expect(bareLiteCss).toContain('--session-marker-accent');
        });
    });

    it('styles the new marker workspace and slot cards', () => {
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-session-marker-workspace');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-session-marker-preview-grid');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-session-marker-slot');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-session-marker-list');
        expect(bareLiteCss).toContain('.lms-session-marker-composer.is-collapsed .lms-session-marker-body');
    });

    it('keeps timetable marker tone classes visible', () => {
        expect(bareLiteCss).toContain('body.lux-route-timetable .has-session-marker');
        expect(bareLiteCss).toContain('body.lux-route-timetable .schedule-marker-badge');
        expect(bareLiteCss).toContain('body.lux-route-timetable .schedule-session-marker-banner');
    });

    it('resolves next session across upcoming weeks from scheduler data', () => {
        expect(sessionsRuntimeSource).toContain('function getLmsNextSessionForGroup(courseKey = currentCourseId, options = {})');
        expect(sessionsRuntimeSource).toContain('shiftWeekStartISO(weekStart, 1)');
        expect(sessionsRuntimeSource).toContain('function formatLmsNextSessionRelative(startDate, now = new Date(), isHappeningNow = false)');
        expect(sessionsRuntimeSource).toContain('function renderLmsNextSessionHtml(model, variant = \'hero\')');
        expect(sessionsRuntimeSource).toContain('Object.assign(window, api)');
    });

    it('surfaces next session on sessions hero, group tiles, and student subject deck', () => {
        expect(runtimeSource).toContain('renderLmsNextSessionHtml(nextSession, \'hero\')');
        expect(sessionsRuntimeSource).toContain('class="lms-group-next-session"');
        expect(sessionsRuntimeSource).toContain('Next session');
        expect(runtimeSource).not.toContain('Official weekly session');
    });

    it('syncs next session in course workspace header from lms.js', () => {
        const lmsJs = readSource('assets/js/pages/lms.js');
        expect(lmsJs).toContain('function syncLmsNextSessionContext(courseKey = \'\')');
        expect(lmsJs).toContain('getLmsNextSessionForGroup(resolvedKey)');
        expect(runtimeSource).toContain('syncLmsNextSessionContext(courseKey)');
    });

    it('styles next session presentation variants in LMS route CSS shards', () => {
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-next-session-inline');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-next-session-badge.is-live');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-next-session-badge.is-today');
        expect(bareLiteCss).toContain('body.lux-route-lms .lms-next-session-card.is-empty');
    });
});
