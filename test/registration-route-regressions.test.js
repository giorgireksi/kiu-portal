const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('registration route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('registration.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'registration-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/registration-studio-shell[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/registration-studio-deck[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/registration-workspace[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared layout primitives and compact summary cache', () => {
        const html = readSource('registration.html');
        expect(html).toContain('lux-page-bare-lite.css?v=20260804-divider1');
        expect(html).toContain('registration-student-route.js?v=20260804-summarybalanced1');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-fouc-ht.css');
    });

    it('uses shared shell classes and home-hover-chip on matte inners', () => {
        const html = readSource('registration.html');
        expect(html).not.toContain('page-hero lux-hero lux-timetable-hero registration-hero-shell');
        expect(html).toMatch(/registration-studio-shell[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toContain('lux-section-kicker lux-page-kicker');
        expect(html).not.toContain('registration-hero-copy');
        expect(html).not.toContain('registration-hero-meta');
        expect(html).not.toContain('registration-hero-status');
        expect(html).not.toContain('registration-hero-semester');
        expect(html).not.toContain('registration-hero-faculty');
        expect(html).not.toContain('registration-hero-ects"');
        expect(html).not.toContain('lux-summary-surface--hero');
        expect(html).not.toContain('wave2-chip');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toContain('registration-summary-panel home-hover-chip');
        expect(html).toContain('registration-summary-term-field');
        expect(html).toContain('registration-summary-status-line');
        expect(html).not.toContain('page-hero-badge lux-pill home-hover-chip');
        expect(html).toContain('id="timetable-hero-focus-time"');
        expect(html).toContain('lux-hero-signal home-hover-chip');
        expect(html).toMatch(/registration-studio-deck[\s\S]*registration-metrics-band[\s\S]*registration-summary-panel[\s\S]*reg-tabs/);
        expect(html).toContain('registration-summary-grid');
        expect(html).toContain('registration-summary-facts');
        expect(html).not.toContain('registration-hero-ects-card');
        expect(html).not.toContain('registration-hero-selected-card');
        expect(html).not.toContain('data-reg-metric="hold"');
        expect(html).not.toContain('data-reg-metric="next-step"');
        expect(html).not.toContain('registration-summary-focus');
        expect(html).not.toContain('lux-timetable-command registration-command-band');
        expect(html).not.toContain('registration-command-band home-hover-chip');
        expect(html).toContain('registration-footer-bar registration-footer-bar-shell registration-progress-shell home-hover-chip');
        expect(html).toContain('lux-card-meta registration-insight-label');
        expect(html).toContain('lux-card-title registration-workspace-title');
        expect(html).toMatch(/class="reg-tab active"[^>]*data-reg-tab="program"/);
        expect(html).not.toMatch(/class="reg-tab active home-hover-chip"/);
        expect(html).toContain('class="reg-tab home-hover-chip" role="tab" aria-selected="false" data-reg-tab="free"');
    });

    it('shared layout primitives define registration text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.registration-insight-label');
        expect(primitives).toContain('.registration-insight-value');
        expect(primitives).toContain('.registration-workspace-kicker');
        expect(primitives).toContain('.registration-workspace-title');
        expect(primitives).toContain('.registration-state-summary');
        expect(primitives).toContain('.registration-footer-bar-label');
        expect(primitives).toContain('.registration-module-list-title');
    });

    it('bare-lite registration block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const regBlock = bare.split('/* ── Registration route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(regBlock).toContain('body.lux-route-registration #page-registration');
        expect(regBlock).toContain('body.lux-route-registration .registration-shell-grid');
        expect(regBlock).toContain('.registration-module-list-card');
        expect(regBlock).toContain('body.lux-route-registration .registration-studio-shell');
        expect(regBlock).toContain('.registration-studio-shell > .registration-studio-deck');
        expect(regBlock).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
        expect(regBlock).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
        expect(regBlock).toContain('font-size: 18px;');
        expect(regBlock).toContain('font-size: 12px;');
        expect(regBlock).toContain('font-size: 13px;');
        expect(regBlock).toContain('font-size: 14px;');
        expect(regBlock).toContain('align-items: start;');
        expect(regBlock).toContain('align-self: start;');
        expect(regBlock).toContain('min-height: 0;');
        expect(regBlock).toContain('body.lux-route-registration .registration-summary-panel');
        expect(regBlock).toContain('body.lux-route-registration .registration-summary-grid');
        expect(regBlock).toContain('body.lux-route-registration .registration-summary-facts');
        expect(regBlock).toContain('border-bottom: 2px solid color-mix(in srgb, var(--lux-accent) 42%, transparent);');
        expect(regBlock).toContain('border-inline-start: 2px solid color-mix(in srgb, var(--lux-accent) 42%, transparent);');
        expect(regBlock).toContain('border-top: 2px solid color-mix(in srgb, var(--lux-accent) 42%, transparent);');
        expect(regBlock).toContain('grid-template-columns: 1fr;');
        expect(regBlock).toContain('body.lux-route-registration .reg-tabs');
        expect(regBlock).not.toMatch(/body\.lux-route-registration \.reg-tab\s*\{[^}]*background:\s*transparent/);
        expect(regBlock).toMatch(/body\.lux-route-registration \.reg-tab\.active\s*\{[^}]*linear-gradient\(135deg, var\(--lux-accent\)/);
        expect(regBlock).toContain('body.lux-route-registration .registration-footer-bar');
        expect(regBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--registration-fade-');
    });

    it('fouc-ht matte paints registration shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-registration #page-registration');
        expect(fouc).toContain('body.lux-route-registration .registration-studio-shell[data-lux-glass-root="1"]');
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration :is\([\s\S]*\.registration-summary-panel/);
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration :is\([\s\S]*\.registration-command-band/);
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration \.lux-card:not\(\[data-lux-glass-root="1"\]\)/);
        expect(fouc).toMatch(/:is\(\.page-hero, \[data-lux-glass-root="1"\]\):not\(\.home-hover-chip\)[\s\S]*transition:\s*none/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).toContain('.registration-module-list-card');
        expect(fouc).toContain('.page-hero-badge.home-hover-chip');
        expect(fouc).toContain('.lux-timetable-hero-focus .lux-hero-signal.home-hover-chip');
        expect(fouc).not.toMatch(/\.registration-insight-card\.home-hover-chip[\s\S]*--lux-panel-surface-soft/);
        expect(fouc).not.toMatch(/\.reg-tab:not\(\.active\)[\s\S]*--lux-panel-surface-soft/);
    });

    it('student route meta chips use shared home-hover-chip', () => {
        const js = readSource('assets/js/pages/registration-student-route.js');
        expect(js).toContain('lux-hero-signal home-hover-chip');
    });

    it('fouc-ht does not treat picker fields as registration matte hover shells', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const regBlock = fouc.split('/* Timetable + registration pages')[1]?.split('/* Personal data page')[0] || '';
        expect(regBlock).toContain('body.lux-route-registration #page-registration .lux-picker-field');
        expect(regBlock).not.toMatch(/body\.lux-route-registration \.registration-page-stack :is\([^)]*\.lux-picker-field/);
    });

    it('admin curriculum wave2 summary pills use home-hover-chip', () => {
        const js = readSource('assets/js/pages/registration.js');
        expect(js).toContain('lux-status-pill home-hover-chip wave2-chip');
    });

    it('dynamic student registration shells use shared text primitives and home-hover-chip', () => {
        const js = readSource('assets/js/pages/student-registration.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(js).toContain("className = 'registration-state-card home-hover-chip'");
        expect(js).toContain("className = 'registration-state-summary lux-card-copy'");
        expect(js).toContain('formatStudentScheduleSectionLabel');
        expect(js).toContain("className = 'registration-course-row home-hover-chip'");
        expect(js).toContain('registration-module-choice home-hover-chip');
        expect(js).toContain('registration-render-error home-hover-chip');
        expect(js).toContain('registration-section-title lux-card-title');
        expect(js).toContain("className = 'registration-module-list-card home-hover-chip'");
        expect(js).toContain('registration-course-title lux-card-title');
        expect(js).toContain('function syncRegistrationTabHoverChip(tab)');
        expect(js).toContain("tab.classList.toggle('home-hover-chip', !tab.classList.contains('active'))");
        expect(fouc).toContain('.registration-module-pane-title.lux-card-title');
        expect(fouc).toContain('.registration-state-title.lux-card-title');
        expect(fouc).toContain('.registration-state-summary.lux-card-copy');
        expect(fouc).toContain('.registration-course-index, .registration-course-ects');
        expect(fouc).toContain('.registration-course-meta-line.is-accent');
        expect(fouc).toContain('.registration-course-picker-btn');
    });

    it('transparency engine keeps registration glass hosts on CSS blur at max transparency', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).toContain('function isRegistrationGlassHost(el)');
        expect(transparency).toContain('function shouldPreserveRegistrationCssPaint(el)');
        expect(transparency).toContain('isRegistrationGlassHost,');
        expect(transparency).toContain('shouldPreserveRegistrationCssPaint,');
        expect(transparency).toContain("'.home-hover-chip'");
        expect(transparency).toMatch(/function isRegistrationGlassHost\(el\)[\s\S]*?registration-studio-shell/);
        expect(transparency).toMatch(/function isRegistrationGlassHost\(el\)[\s\S]*?data-lux-glass-root/);
        expect(transparency).toMatch(/function shouldPreserveRegistrationCssPaint\(el\)[\s\S]*?home-hover-chip/);
        expect(transparency).toMatch(/function shouldPreserveRegistrationCssPaint\(el\)[\s\S]*?reg-tab.*active/);

        const structuralBranch = transparency.match(
            /if \(percentage >= 99 && document\.body\.classList\.contains\('lux-route-registration'\)[\s\S]*?el\.dataset\.luxTransparencySignature = transparencySignature;\s*return;\s*\}/
        )?.[0] || '';
        expect(structuralBranch).toContain('shouldPreserveRegistrationCssPaint(el)');
        expect(structuralBranch).toContain('stripInlineGlassPaint(el, transparencySignature)');

        const cssOwnedBranch = transparency.match(
            /if \(percentage >= 99 && isCssOwnedSurface\(el\) && el\.closest\?\.\('#page-registration'\)\) \{[\s\S]*?if \(el\.id === 'lux-shell'\)/
        )?.[0] || '';
        expect(cssOwnedBranch).toContain('shouldPreserveRegistrationCssPaint(el)');
        expect(cssOwnedBranch).toContain('stripInlineGlassPaint(el, transparencySignature)');
    });

    it('fouc-ht applies panel blur to glass hosts and matte fill to insight cards', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const glassHostRule = fouc.match(
            /body\.lux-unified-shell :is\(\.page-hero, \.lux-panel, \.lux-alert, \[data-lux-glass-root="1"\][\s\S]*?\}/
        )?.[0] || '';
        expect(glassHostRule).toContain('backdrop-filter: var(--lux-panel-blur-filter)');

        const regMatteBlock = fouc.split('/* Timetable + registration pages')[1]?.split('/* Social soft-chrome shells')[0] || '';
        expect(regMatteBlock).toContain('.registration-insight-card');
        expect(regMatteBlock).toMatch(/body\.lux-route-registration #page-registration[\s\S]*backdrop-filter: none/);
        expect(regMatteBlock).toMatch(/body\.lux-route-registration #page-registration \.lux-card:not\(\[data-lux-glass-root="1"\]\)/);
    });

    it('luxury runtime skips modern-surface stamp on registration glass hosts and hover chips', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        expect(runtime).toMatch(/lux-route-registration[\s\S]*?\.page-hero, \[data-lux-glass-root="1"\], \.reg-tab, \.reg-tabs/);
        expect(runtime).toContain("node.classList?.contains('home-hover-chip')");
    });
});
