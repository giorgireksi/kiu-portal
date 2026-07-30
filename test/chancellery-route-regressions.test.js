const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('chancellery route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('chancellery.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'chancellery-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(readSource('assets/js/pages/chancellery.js')).toMatch(/data-chancellery-shell="1"[\s\S]*data-lux-glass-root="1"/);
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('loads shared layout primitives and fwdvis1 cache', () => {
        const html = readSource('chancellery.html');
        expect(html).toContain('appealword1');
        expect(html).toContain('fwdvis1');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('chancellery-document.js');
        expect(html).not.toContain('chancellery-filters.js');
    });

    it('runtime uses shared shell classes and home-hover-chip on matte inners', () => {
        const js = readSource('assets/js/pages/chancellery.js');
        expect(js).toContain('page-hero lux-hero lux-chancellery-hero-card');
        expect(js).not.toMatch(/lux-chancellery-hero-card[^\n]*home-hover-chip/);
        expect(js).toContain('lux-section-kicker lux-page-kicker');
        expect(js).not.toContain('lux-summary-surface--hero');
        expect(js).toContain('lux-chancellery-hero-side lux-timetable-hero-focus lux-focus-panel home-hover-chip');
        expect(js).toContain('filter-shell lux-chancellery-command-bar home-hover-chip');
        expect(js).toContain('lux-chancellery-list-panel home-hover-chip');
        expect(js).toContain('lux-chancellery-detail-panel home-hover-chip');
        expect(js).toContain('lux-page-title lux-chancellery-card-title');
        expect(js).toContain('lux-chancellery-subcard lux-soft-chrome home-hover-chip');
        expect(js).toContain('chancellery-case-submission');
        expect(js).toContain('resolveChancelleryGroupLabel');
        expect(js).toContain('lux-focus-panel__chip lux-status-pill home-hover-chip');
        expect(js).toContain('lux-status-pill ${getChancelleryKindPillClass');
        expect(js).toContain("getChancelleryStatusPill(request.status, { hoverChip: false })");
        expect(js).toContain('lux-chancellery-queue-side');
        expect(js).not.toContain('getChancelleryLatestPreview(request).slice(0, 170)');
        expect(js).not.toContain('Open a request from the queue.');
        expect(js).toContain("listCopy: ''");
        expect(js).not.toContain('<div class="lux-focus-panel__title">');
        expect(js).not.toContain('<p class="lux-focus-panel__copy">${headingCopy}</p>');
        expect(js).toContain('${isStudent ? `<div class="page-hero-copy lux-page-copy">${headingCopy}</div>` : \'\'}');
        expect(js).toContain('lux-status-pill home-hover-chip is-muted');
        expect(js).toContain('class="lux-pill home-hover-chip">${count} case');
        expect(js).not.toContain('lux-chancellery-main-panel');
        expect(js).not.toContain('lux-chancellery-routing-pill');
        expect(js).not.toContain('lux-chancellery-view-pill');
        expect(js).not.toContain('lux-chancellery-kind-pill');
        expect(js).not.toContain('wantsPanel !== hasPanel');
        expect(js).not.toContain('[data-chancellery-forward-panel="1"]');
        expect(js).toContain('chancellery-forward-overlay');
        expect(js).toContain('openChancelleryForwardModal');
        expect(js).toContain('chancellery-case-overlay');
        expect(js).toContain('openChancelleryCaseModal');
        expect(js).toContain('chancellery-case-header');
        expect(js).toContain('chancellery-case-scroll');
        expect(js).toContain('chancellery-case-decision-banner');
        expect(js).toContain('chancellery-case-decision-form');
        expect(js).not.toContain('chancellery-case-private-notes');
        expect(js).toContain('function decideChancelleryCase');
        expect(js).toContain('function updateChancelleryDecisionComment');
        expect(js).not.toContain('function addChancelleryInternalNote');
        expect(js).not.toContain('submit-staff-reply');
        expect(js).not.toContain('chancellery-staff-reply');
        expect(js).not.toContain('chancellery-case-composer');
        expect(js).toContain('chancellery-case-identity');
        expect(js).toContain('chancellery-case-avatar');
        expect(js).toContain('function resolveChancelleryCaseStudent');
        expect(js).toContain('Group ${groupLabel}');
        expect(js).toContain('Course ${course}');
        expect(js).not.toContain('chancellery-case-modal-toolbar');
        expect(js).toContain('is-list-only');
        expect(js).toContain('function setChancellerySelectedCase');
        expect(js).toContain('openChancelleryCaseModal(nextId)');
    });

    it('shared layout primitives define chancellery text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lux-chancellery-card-title.lux-page-title');
        expect(primitives).toContain('.lux-chancellery-subcard-copy.lux-panel-copy');
        expect(primitives).toContain('.lux-thread-author.lux-card-copy');
        expect(primitives).toContain('.lux-chancellery-stat-label');
        expect(primitives).toContain('.lux-chancellery-queue-subject');
        expect(primitives).toContain('.lux-check-row-wrap');
        expect(primitives).toContain('.lux-check-row');
    });

    it('bare-lite chancellery block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const chanBlock = bare.split('/* ── Chancellery route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(chanBlock).toContain('body.lux-route-chancellery #page-chancellery');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-workspace-split');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-queue-item');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-card-head');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-thread-entry.lux-soft-chrome.home-hover-chip');
        expect(chanBlock).toContain('body.lux-route-chancellery #page-chancellery .lux-chancellery-hero-side.home-hover-chip');
        expect(chanBlock).toContain('body.lux-route-chancellery #page-chancellery .lux-chancellery-hero-signals.lux-hero-signal-list');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-command-bar > .lux-picker-field.lux-chancellery-filter-field');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-command-bar > .lux-chancellery-routing-filter');
        expect(chanBlock).toContain('.lux-chancellery-workspace-split.is-list-only');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-queue-side');
        expect(chanBlock).toMatch(/\.lux-chancellery-list-panel[\s\S]*?padding:\s*12px 14px/);
        expect(chanBlock).toMatch(/\.lux-chancellery-queue-item[\s\S]*?padding:\s*10px 12px/);
        expect(chanBlock).toMatch(/\.lux-chancellery-hero-side\.home-hover-chip\s*\{[\s\S]*?padding:\s*12px 12px 10px/);
        expect(chanBlock).not.toContain('[data-chancellery-forward-panel="1"]');
        expect(chanBlock).toContain('width: auto');
        expect(chanBlock).not.toContain('--home-chip-hover-lift-nested: var(--home-chip-hover-lift, -3px)');
        expect(chanBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--chan-fade-');
        expect(bare).toContain('.lux-chancellery-routing-filter.lux-tab-strip--segmented');
    });

    it('fouc-ht matte paints chancellery shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-chancellery #page-chancellery');
        expect(fouc).toMatch(/body\.lux-route-chancellery #page-chancellery :is\([\s\S]*\.lux-chancellery-list-panel/);
        expect(fouc).toContain('.lux-chancellery-subcard.lux-soft-chrome');
        expect(fouc).toContain('.lux-chancellery-thread-entry.lux-soft-chrome');
        expect(fouc).toContain('[data-lux-glass-root="1"]):not(.home-hover-chip)');
        expect(fouc).toContain('transition: none');
        expect(fouc).toMatch(/body\.lux-route-chancellery #page-chancellery :is\([\s\S]*\.lux-chancellery-hero-side \.lux-hero-signal\.home-hover-chip/);
        expect(fouc).not.toContain('.lux-chancellery-hero-side .lux-focus-panel__chip.lux-status-pill.home-hover-chip');
        expect(fouc).toContain('body.lux-route-chancellery #page-chancellery .lux-picker-field');
        expect(fouc).toContain('.lux-chancellery-hero-side.home-hover-chip');
        expect(fouc).toMatch(/\.lux-chancellery-hero-side\.home-hover-chip[\s\S]*?contain:\s*none/);
        expect(fouc).toMatch(/\.lux-chancellery-hero-side\.home-hover-chip[\s\S]*?overflow:\s*visible/);
        expect(fouc).toMatch(/body\.lux-unified-shell :is\(\.page-hero, \[data-lux-glass-root="1"\]\):not\(\.home-hover-chip\)/);
    });
});
