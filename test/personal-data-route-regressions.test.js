const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('personal data route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'personal-data-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/personal-data-shell[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/personal-data-workspace[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/personal-data-workspace-body[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared layout primitives and blueprint for profile details', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('pdchecklist1');
        expect(html).toContain('student-schedule-refs.js');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('student-form-blueprint.js');
        expect(html).toContain('form-blueprint-runtime.js');
        expect(html).toContain('personal-data-blueprint-details');
        expect(html).toContain('personal-data-blueprint-details-root');
        expect(html).toContain('personal-data-details-copy');
        expect(html).toContain('personal-data-progress-block');
    });

    it('uses shared shell classes and home-hover-chip on matte inners', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('personal-data-shell');
        expect(html).toContain('data-personal-data-shell="1"');
        expect(html).toContain('class="personal-data-hero"');
        expect(html).not.toContain('page-hero personal-data-hero lux-hero');
        expect(html).toContain('lux-section-kicker lux-page-kicker');
        expect(html).not.toContain('lux-summary-surface--hero');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toContain('filter-shell personal-data-command personal-data-toolbar');
        expect(html).not.toContain('personal-data-toolbar home-hover-chip');
        expect(html).toContain('personal-data-workspace-body');
        expect(html).toContain('personal-data-identity-card home-hover-chip');
        expect(html).toContain('personal-data-kpi-card lux-data-card lux-metric-card lux-strip-card home-hover-chip');
        expect(html).toContain('personal-data-merged home-hover-chip');
        expect(html).toContain('personal-data-blueprint-details home-hover-chip');
        expect(html).toContain('lux-card-meta personal-data-kpi-label');
    });

    it('shared layout primitives define personal data text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.personal-data-card-kicker');
        expect(primitives).toContain('.personal-data-kpi-label');
        expect(primitives).toContain('.personal-data-kpi-value');
        expect(primitives).toContain('.personal-data-name');
    });

    it('bare-lite personal data block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const pdBlock = bare.split('/* ── Personal data route')[1]?.split('/* ── Staff / students hub')[0]
            || bare.split('/* ── Personal data route')[1]?.split('/* ── Chancellery route')[0]
            || '';
        expect(pdBlock).toContain('body.lux-route-personal-data #page-personal-data');
        expect(pdBlock).toContain('.personal-data-shell');
        expect(pdBlock).toContain('.personal-data-workspace-body');
        expect(pdBlock).not.toContain('--home-chip-hover-lift-nested: var(--home-chip-hover-lift, -3px)');
        expect(pdBlock).toContain('body.lux-route-personal-data .personal-data-layout');
        expect(pdBlock).toContain('body.lux-route-personal-data .personal-data-kpi-card');
        expect(pdBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--pd-fade-');
        expect(bare).toContain('body.lux-route-personal-data #page-personal-data .personal-data-merged.home-hover-chip');
        expect(bare).toContain('body.lux-route-personal-data .personal-data-blueprint-details');
        expect(bare).toContain('body.lux-route-personal-data .personal-data-blueprint-field');
        expect(bare).toContain('minmax(160px, 1fr)');
    });

    it('fouc-ht matte paints personal data shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-personal-data #page-personal-data');
        expect(fouc).toContain('.personal-data-shell[data-lux-glass-root="1"]');
        expect(fouc).toMatch(/\.personal-data-shell\[data-lux-glass-root="1"\][\s\S]*?overflow:\s*visible/);
        expect(fouc).toMatch(/\.personal-data-shell\[data-lux-glass-root="1"\][\s\S]*?contain:\s*none/);
        expect(fouc).toMatch(/body\.lux-route-personal-data #page-personal-data :is\([\s\S]*\.personal-data-kpi-card/);
        expect(fouc).toContain('.personal-data-merged');
        expect(fouc).toContain('.personal-data-blueprint-details');
        expect(fouc).not.toMatch(/body\.lux-route-personal-data #page-personal-data :is\([\s\S]*\.personal-data-toolbar,/);
        expect(fouc).toMatch(/:is\(\.page-hero,\s*\[data-lux-glass-root="1"\]\):not\(\.home-hover-chip\)[\s\S]*transition:\s*none/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).toContain('body.lux-route-personal-data #page-personal-data .lux-picker-field');
    });

    it('personal-data page renders role-aware blueprint fields marked showOnPersonalData', () => {
        const page = readSource('assets/js/pages/personal-data-page.js');
        expect(page).toContain('renderPersonalDataBlueprintDetails');
        expect(page).toContain('showOnPersonalData');
        expect(page).toContain('getFormSchemaForDomain');
        expect(page).toContain('resolvePersonalDataBlueprintDomain');
        expect(page).toContain('student form blueprint');
        expect(page).toContain('staff form blueprint');
        expect(page).toContain('personal-data-progress-block');
        expect(page).toContain('No profile details configured');
        expect(page).toContain('personal-data-blueprint-field lux-soft-chrome home-hover-chip');
        expect(page).toContain('personal-data-blueprint-field-label');
        expect(page).toContain('personal-data-blueprint-field-value');
    });
});
