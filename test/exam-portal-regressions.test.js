import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('exam portal regressions', () => {
    it('loads the LMS asset stack and avoids conflicting lux-summary surfaces', () => {
        const html = readSource('exam-portal.html');
        const css = readSource('assets/css/exam-portal-route.css');

        expect(html).toContain('assets/vendor/fontawesome/css/all.min.css');
        expect(html).toContain('assets/js/theme-primer.js');
        expect(html).toContain('assets/css/base.css');
        expect(html).toContain('assets/css/layout.css');
        expect(html).toContain('assets/css/lux-tokens.css');
        expect(html).toContain('assets/css/lux-surfaces.css');
        expect(html).toContain('assets/css/lux-controls.css');
        expect(html).toContain('assets/css/lux-layout-primitives.css');
        expect(html).toContain('assets/css/index-luxury.css');
        expect(html).toContain('assets/css/lms-route.css');
        expect(html).toContain('assets/css/exam-portal-route.css');
        expect(html).toContain('body class="lux-route-lms lux-route-exam"');
        expect(html).toContain('id="exam-backend-status"');
        expect(html).toContain('id="exam-frontend-status"');
        expect(html).not.toContain('lux-summary-surface');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('cdnjs.cloudflare.com');
        expect(css).not.toMatch(/\.exam-panel::after/);
        expect(css).not.toMatch(/\.exam-hero\s*\{/);
        expect(css).not.toMatch(/\.exam-step-row/);
        expect(css).toContain('body.lux-route-exam .exam-portal-stage');
    });

    it('keeps session launch buttons delegated instead of inline', () => {
        const source = readSource('assets/js/pages/exam-portal.js');

        expect(source).toContain('function bindLaunchSessionButtons()');
        expect(source).toContain("data-exam-launch-session=");
        expect(source).not.toContain('onclick="launchScheduledExam(');
        expect(source).not.toContain('lux-summary-surface');
    });

    it('uses targeted timer updates instead of full-list rerenders', () => {
        const source = readSource('assets/js/pages/exam-portal.js');

        expect(source).toContain('data-session-countdown');
        expect(source).toContain('data-session-spotlight-countdown');
        expect(source).toContain('setInterval(updateSessionCountdowns, 1000);');
        expect(source).not.toContain('setInterval(renderSessionCards, 1000);');
        expect(source.match(/function renderSessionCards\(/g) || []).toHaveLength(1);
        expect(source.match(/function renderProtectedShell\(/g) || []).toHaveLength(1);
        expect(source).not.toContain('style=');
    });

    it('records protected-attempt timer gating and manual-answer ownership in source', () => {
        const source = readSource('assets/js/pages/exam-portal.js');

        expect(source).toContain("document.addEventListener('visibilitychange', syncTimerVisibility);");
        expect(source).toContain("window.addEventListener('pagehide', stopAllTimers);");
        expect(source).toContain('function stopAllTimers()');
        expect(source).toContain('type,');
        expect(source).toContain('data-question-flag');
    });

    it('stores exam portal session state in sessionStorage and clears local leftovers', () => {
        const source = readSource('assets/js/pages/exam-portal.js');

        expect(source).toContain('sessionStorage.setItem(TOKEN_KEY, runtime.token);');
        expect(source).toContain('sessionStorage.setItem(STUDENT_KEY, JSON.stringify(runtime.student));');
        expect(source).toContain('sessionStorage.setItem(getProtectedDraftKey(), JSON.stringify({');
        expect(source).toContain("sessionStorage.getItem(getProtectedDraftKey()) || localStorage.getItem(getProtectedDraftKey())");
        expect(source).toContain("localStorage.removeItem(TOKEN_KEY)");
        expect(source).toContain("localStorage.removeItem(STUDENT_KEY)");
        expect(source).not.toContain("localStorage.setItem(TOKEN_KEY, runtime.token);");
        expect(source).not.toContain("localStorage.setItem(STUDENT_KEY, JSON.stringify(runtime.student));");
    });
});
