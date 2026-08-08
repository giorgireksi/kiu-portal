import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('shared staged shell reveal', () => {
    it('keeps the pre-paint guard separate from the reveal coordinator', () => {
        const primer = readSource('assets/js/theme-primer.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(primer).toContain('window.__kiuShellLoadState');
        expect(primer).toContain('window.__kiuSetShellLoadState = setShellLoadState');
        expect(primer).toContain('window.__kiuStartShellReveal');
        expect(primer).toContain('revealDeadlineMs = 1400');
        expect(navigation).toContain('const KIU_SHELL_REVEAL_TIMINGS');
        expect(navigation).toContain('function startKiuShellReveal');
        expect(navigation).toContain('window.__kiuStartShellReveal = startKiuShellReveal');
    });

    it('makes readiness idempotent and handles reduced motion and slow routes', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('let kiuShellRevealFinished = false');
        expect(navigation).toContain('if (kiuShellRevealFinished) return getKiuShellLoadState()');
        expect(navigation).toContain("'(prefers-reduced-motion: reduce)'");
        expect(navigation).toContain("setKiuShellLoadState({ degraded: false, phase: 'revealing' })");
        expect(navigation).toContain('if (!kiuShellRouteReady) finishKiuShellReveal()');
        expect(navigation).toContain("root.classList.add('kiu-shell-ready')");
    });

    it('animates only stable shell roots and disables motion accessibly', () => {
        const shellCss = readSource('assets/css/lux-shell.css');

        expect(shellCss).toContain('html.kiu-shell-revealing body :is(#lux-topbar, #lux-shell, #app-content, #mobile-bottom-nav, #mobile-action-sheet)');
        expect(shellCss).toContain('data-kiu-load-stage="shell"');
        expect(shellCss).toContain('data-kiu-load-stage="panel"');
        expect(shellCss).toContain('html[data-kiu-load-phase="degraded"]::after');
        expect(shellCss).toContain('@media (prefers-reduced-motion: reduce)');
        expect(shellCss).toContain('transition: none !important;');
        const revealCss = shellCss.slice(shellCss.indexOf('/* Shared staged shell reveal'));
        expect(revealCss).not.toContain('backdrop-filter');
        expect(revealCss).not.toContain('box-shadow');
    });

    it('routes normal readiness paths through the coordinator', () => {
        const news = readSource('assets/js/pages/news/news-feed-render.js');
        const social = readSource('assets/js/pages/social-page-shell-runtime.js');
        const students = readSource('assets/js/pages/students-command-center.js');
        const staff = readSource('assets/js/pages/staff-command-center.js');
        const studentService = readSource('assets/js/pages/student-service-page-runtime.js');

        expect(news).toContain('function revealNewsShell()');
        expect(news).toContain('markPortalShellReady()');
        expect(social).toContain('window.__kiuStartShellReveal({ degraded: true })');
        expect(students).toContain('markPortalShellReady()');
        expect(staff).toContain('markPortalShellReady()');
        expect(studentService).toContain('markPortalShellReady()');
    });
});
