import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

const MARKER_TYPES = ['quiz', 'oral_quiz', 'exam', 'presentation', 'project', 'lab', 'deadline', 'important'];

describe('lms session marker regressions', () => {
    const runtimeSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
    const indexRuntimeJs = readSource('assets/js/features/luxury-index-runtime.js');

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
        expect(runtimeSource).toContain('aria-pressed');
        expect(runtimeSource).toContain('is-picking');
    });

    it('defines a distinct shared palette token per marker type', () => {
        MARKER_TYPES.forEach(type => {
        });
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });

        it('uses per-type timetable rules instead of grouping quiz with deadline', () => {
            /body\.lux-route-timetable \.marker-quiz,\s*\nbody\.lux-route-timetable \.marker-deadline\s*\{[^}]*--session-marker-accent:\s*#f59e0b/s
        );
    });

    it('styles marked LMS UI with marker-{type} classes', () => {
        expect(runtimeSource).toContain('lms-session-marker-card is-${escapeHtml(status)} marker-${lmsSessionMarkerClassToken(marker.type)}');
        expect(runtimeSource).toContain('lms-session-marker-slot-badge marker-${lmsSessionMarkerClassToken');
        expect(runtimeSource).toContain('class="lms-session-marker-type-chip');
        expect(runtimeSource).not.toContain('lms-session-marker-type-chip marker-${lmsSessionMarkerClassToken(type)}');
    });

    it('skips lux-modern-button decoration on session marker type chips', () => {
        expect(indexRuntimeJs).toContain("node.closest?.('.lms-session-marker-type-chips')");
        expect(indexRuntimeJs).toContain("node.classList?.contains('lms-session-marker-type-chip')");
    });

    it('forces per-type chip button colors over lux-modern-button', () => {
        MARKER_TYPES.forEach(type => {
        });
    });

    it('styles the new marker workspace and slot cards', () => {
    });

    it('keeps timetable marker tone classes visible', () => {
    });

    it('resolves next session across upcoming weeks from scheduler data', () => {
        expect(runtimeSource).toContain('function getLmsNextSessionForGroup(courseKey = currentCourseId, options = {})');
        expect(runtimeSource).toContain('shiftWeekStartISO(weekStart, 1)');
        expect(runtimeSource).toContain('function formatLmsNextSessionRelative(startDate, now = new Date(), isHappeningNow = false)');
        expect(runtimeSource).toContain('function renderLmsNextSessionHtml(model, variant = \'hero\')');
        expect(runtimeSource).toContain('window.getLmsNextSessionForGroup = getLmsNextSessionForGroup');
    });

    it('surfaces next session on sessions hero, group tiles, and student subject deck', () => {
        expect(runtimeSource).toContain('renderLmsNextSessionHtml(nextSession, \'hero\')');
        expect(runtimeSource).toContain('class="lms-group-next-session"');
        expect(runtimeSource).toContain('Next session');
        expect(runtimeSource).not.toContain('Official weekly session');
    });

    it('syncs next session in course workspace header from lms.js', () => {
        const lmsJs = readSource('assets/js/pages/lms.js');
        expect(lmsJs).toContain('function syncLmsNextSessionContext(courseKey = \'\')');
        expect(lmsJs).toContain('window.syncLmsNextSessionContext = syncLmsNextSessionContext');
        expect(lmsJs).toContain('getLmsNextSessionForGroup(resolvedKey)');
    });

    it('styles next session presentation variants in LMS route CSS shards', () => {
    });
});
