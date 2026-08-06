const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('study card route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('study-card.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'study-card-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).not.toContain('study-card-control-band');
        expect(html).not.toContain('study-card-program-select');
        expect(html).not.toContain('Program View');
        expect(html).toContain('study-card-command-deck');
        expect(html).toMatch(/study-card-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(bare).toContain('body.lux-route-study-card');
        expect(bare).not.toContain('.study-card-control-band');
        expect(bare).toContain('.study-card-gradebook-overlay .gb-weight-row');
        const studyCardJs = readSource('assets/js/pages/study-card-page.js');
        expect(studyCardJs).not.toContain('study-card-summary-region');
        expect(studyCardJs).not.toContain('renderStudyCardSummaryRegion');
        expect(studyCardJs).not.toContain('study-card-summary-stage');
        expect(studyCardJs).not.toContain('Academic Record Snapshot');
        expect(studyCardJs).toContain('study-card-terms-region');
        expect(studyCardJs).toContain('study-card-term-row lux-soft-chrome home-hover-chip');
        expect(studyCardJs).toContain('study-card-term-header lux-soft-chrome home-hover-chip');
        expect(bare).not.toContain('.study-card-summary-stage');
        expect(bare).not.toContain('.study-card-summary-focus');
        expect(studyCardJs).toContain('lms-route-field-label study-card-heading');
        expect(studyCardJs).toContain('scope="col" class="study-card-heading');
        expect(bare).toContain('body.lux-route-study-card .study-card-semester-table > thead {\n    display: table-header-group;');
        expect(bare).toContain('body.lux-route-study-card .study-card-semester-table > thead > tr {\n    display: table-row;');
        expect(bare).toContain('body.lux-route-study-card .study-card-semester-table > thead > tr > th {\n    display: table-cell;');
        expect(bare).toContain('body.lux-route-study-card .study-card-semester-table > thead {\n        display: none !important;');
        expect(studyCardJs).toContain('assessmentWindowCache[assessmentCacheKey] = subject');
        expect(studyCardJs).toContain('lux-empty-state__title lms-route-empty-title');
        expect(studyCardJs).toContain('resolveStudyCardScheduleRefs');
        expect(studyCardJs).toContain('studyCardDomToken');
        expect(bare).toContain('body.lux-route-study-card #page-study-card .lms-route-card-title');
        expect(bare).toContain('body.lux-route-study-card #page-study-card .lms-route-meta-12');
        expect(html).toContain('noprogview1');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-study-card #page-study-card');
        expect(fouc).not.toContain('.study-card-summary-main');
        expect(fouc).not.toContain('.study-card-summary-focus');
        expect(fouc).toContain('body.lux-unified-shell :is(.page-hero, .lux-panel, .lux-alert, [data-lux-glass-root="1"]:not(.lux-glass-dialog-card))');
    });

    it('assessment overlay uses shared modal shell, portal paint, and typography', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        const studyCardJs = readSource('assets/js/pages/study-card-page.js');
        const gradebookModel = readSource('assets/js/pages/gradebook-model.js');

        expect(modals).toContain('.study-card-assessment-overlay');
        expect(fouc).toContain('#study-card-assessment-window .study-card-assessment-window');
        expect(fouc).toContain('var(--lux-panel-fill)');
        expect(fouc).toContain('#study-card-assessment-window .study-card-assessment-panel.lux-soft-chrome');
        expect(bare).not.toMatch(/study-card-assessment-window\.lux-soft-chrome\s*\{[^}]*background/);
        expect(bare).not.toMatch(/study-card-assessment-overlay\s*\{[^}]*background:/);
        expect(bare).toContain('.study-card-assessment-layout:has(.study-card-assessment-panel--activity)');
        expect(primitives).toContain('#study-card-assessment-window .study-card-assessment-window__title');
        expect(studyCardJs).toContain('data-lux-transparency-exempt');
        expect(studyCardJs).toContain('openLuxGlassDialogOverlay');
        expect(studyCardJs).toContain('closeLuxGlassDialogOverlay');
        const html = readSource('study-card.html');
        const glassIdx = html.indexOf('lux-glass-dialog.js');
        const workspaceIdx = html.indexOf('gradebook-workspace.js');
        expect(glassIdx).toBeGreaterThan(-1);
        expect(workspaceIdx).toBeGreaterThan(glassIdx);
        expect(studyCardJs).toContain('lux-section-kicker study-card-assessment-panel-kicker');
        expect(studyCardJs).toContain('lux-panel-copy study-card-assessment-panel-copy');
        expect(studyCardJs).not.toContain('study-card-assessment-window lux-soft-chrome');
        expect(gradebookModel).toContain('study-card-activity-item lux-soft-chrome home-hover-chip');
    });

    it('gradebook overlay uses shared panel padding and overflow contract', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(bare).toMatch(
            /body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) \.lms-route-panel-compact[\s\S]*padding:\s*16px/
        );
        expect(bare).toContain('.study-card-gradebook-overlay .gb-scheme-progress-section.is-study-card-overlay');
        expect(bare).toMatch(
            /\.study-card-gradebook-overlay \.gb-scheme-progress-section\.is-study-card-overlay[\s\S]*gap:\s*10px/
        );
        expect(fouc).toMatch(
            /\.study-card-gradebook-overlay \.gb-weight-card\.lux-soft-chrome\.home-hover-chip[\s\S]*overflow:\s*visible/
        );
        expect(fouc).toMatch(
            /\.study-card-gradebook-overlay \.gb-weight-card\.lux-soft-chrome\.home-hover-chip[\s\S]*contain:\s*none/
        );
    });

    it('category history modal uses shared layout, paint, and study-card overlay stacking', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(bare).toMatch(
            /body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) #gradebook-category-history-modal \.gb-category-history-card[\s\S]*padding:\s*14px 16px/
        );
        expect(bare).toContain('body.lux-route-study-card #gradebook-category-history-modal.gb-category-history-overlay');
        expect(bare).toMatch(/#gradebook-category-history-modal\.gb-category-history-overlay[\s\S]*z-index:\s*7500/);
        expect(bare).toMatch(
            /#gradebook-category-history-modal \.gb-category-history-card\.lux-soft-chrome[\s\S]*overflow:\s*visible/
        );
        expect(fouc).toMatch(
            /body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) #gradebook-category-history-modal :is\([\s\S]*\.gb-category-history-card\.lux-soft-chrome/
        );
    });

    it('evaluation history modal uses shared layout, paint, and study-card overlay stacking', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(bare).toMatch(
            /body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) button\.gb-modal-category-card[\s\S]*padding:\s*16px/
        );
        expect(bare).toContain('body.lux-route-study-card #student-evaluation-history-modal.gb-modal-overlay');
        expect(bare).toMatch(/#student-evaluation-history-modal\.gb-modal-overlay[\s\S]*z-index:\s*7400/);
        expect(bare).toMatch(
            /#student-evaluation-history-modal :is\([\s\S]*\.gb-modal-history-card\.lux-soft-chrome[\s\S]*overflow:\s*visible/
        );
        expect(bare).toMatch(
            /:is\(#lms-gradebook-wrapper, #faculty-master-container, #student-evaluation-history-modal, #gradebook-category-history-modal\)[\s\S]*gb-score-history-row/
        );
        expect(fouc).toMatch(
            /body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) #student-evaluation-history-modal :is\([\s\S]*\.gb-modal-history-card\.lux-soft-chrome/
        );
    });
});
