import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
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
        expect(primer).not.toContain('window.__kiuStartShellReveal');
        expect(primer).not.toContain('revealDeadlineMs = 1400');
        expect(navigation).toContain('function startKiuShellReveal');
        expect(navigation).not.toContain('KIU_SHELL_REVEAL_TIMINGS');
        expect(navigation).toContain('window.__kiuStartShellReveal = startKiuShellReveal');
    });

    it('finishes readiness immediately without staged shell timers', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('let kiuShellRevealFinished = false');
        expect(navigation).toContain('if (kiuShellRevealFinished) return getKiuShellLoadState()');
        expect(navigation).toContain('finishKiuShellReveal();');
        expect(navigation).not.toContain("root.classList.add('kiu-shell-revealing')");
        expect(navigation).not.toContain('KIU_SHELL_REVEAL_TIMINGS.shell');
        expect(navigation).toContain("root.classList.add('kiu-shell-ready')");
    });

    it('authors the sidebar before deferred route scripts on every unified route', () => {
        readdirSync(process.cwd())
            .filter((name) => name.endsWith('.html'))
            .forEach((name) => {
                const page = readFileSync(join(process.cwd(), name), 'utf8');
                if (!page.includes('lux-unified-shell')) return;
                const shellIndex = page.indexOf('<aside id="lux-shell"');
                const contentIndex = page.indexOf('<main id="app-content"');
                expect(shellIndex).toBeGreaterThan(-1);
                if (contentIndex < 0) return;
                expect(shellIndex).toBeLessThan(contentIndex);
                expect(page.slice(shellIndex, shellIndex + 180)).toContain('z-index:2147483647 !important');
            });
    });

    it('does not animate route content during shell readiness', () => {
        const shellCss = readSource('assets/css/lux-shell.css');

        expect(shellCss).not.toContain('@keyframes luxRouteContentFade');
        expect(shellCss).not.toContain('.lux-route-content-fade');
        expect(shellCss).not.toContain('html.kiu-shell-revealing body :is(#lux-topbar, #lux-shell, #app-content, #mobile-bottom-nav, #mobile-action-sheet)');
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
