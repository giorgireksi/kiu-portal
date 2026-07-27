const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('student-service route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('student-service.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'student-service-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(readSource('assets/js/pages/student-service-page-runtime.js')).toMatch(/data-student-service-page-shell="1"[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared layout primitives and ssshare7 cache', () => {
        const html = readSource('student-service.html');
        expect(html).toContain('ssshare7');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-fouc-ht.css');
    });

    it('runtime uses shared shell classes and home-hover-chip on lane chooser', () => {
        const chrome = readSource('assets/js/pages/student-service-chrome.js');
        expect(chrome).toContain('student-service-command-bar-shell student-service-command-bar-shell--chooser home-hover-chip');
        expect(chrome).toContain('student-service-command-bar-shell home-hover-chip" data-student-service-command-bar="true"');
        expect(chrome).toContain('student-service-lane-choice-card student-service-lane-choice-card--service home-hover-chip');
        expect(chrome).toContain('lux-section-kicker lux-page-kicker');
        expect(chrome).toContain('lux-pill home-hover-chip');
        expect(chrome).toContain('student-service-lane-choice-title lux-page-title');
        expect(chrome).toContain('student-service-command-bar-title lux-page-title');
    });

    it('shared layout primitives define student-service text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.student-service-command-bar-title');
        expect(primitives).toContain('.student-service-lane-choice-title');
        expect(primitives).toContain('.student-service-lane-choice-cta');
        expect(primitives).toContain('.lux-panel-title');
        expect(primitives).toContain('.student-service-kicker');
        expect(primitives).toContain('.student-service-command-bar-stat');
        expect(primitives).toContain('.student-service-qa-card-title');
    });

    it('bare-lite student-service block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const block = bare.split('/* ── Student Service route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(block).toContain('body.lux-route-student-service .student-service-lane-choice-grid');
        expect(block).toContain('body.lux-route-student-service .student-service-canvas');
        expect(block).toContain('body.lux-route-student-service .student-service-zone');
        expect(block).toContain('body.lux-route-student-service .student-service-request-form');
        expect(block).toContain('body.lux-route-student-service .student-service-find-search');
        expect(block).toContain('body.lux-route-student-service .student-service-ticket-inbox-row');
        expect(block).toContain('body.lux-route-student-service .student-service-ticket-chat-log');
        expect(block).toContain('#student-service-modal-root');
        expect(block).toContain('.student-service-qa-composer-modal-backdrop');
        expect(block).toContain('.student-service-qa-mode-switch');
        expect(block).not.toMatch(/student-service-lane-choice-card\s*\{[^}]*background:/);
        expect(block).not.toMatch(/student-service-lane-choice-card\s*\{[^}]*box-shadow:/);
        expect(block).not.toMatch(/student-service-zone\s*\{[^}]*background:/);
        expect(block).not.toMatch(/student-service-zone\s*\{[^}]*box-shadow:/);
        expect(block).not.toMatch(/student-service-qa-card\s*\{[^}]*background:/);
        expect(block).not.toMatch(/student-service-qa-composer-modal\s*\{[^}]*background:/);
    });

    it('fouc-ht student-service block paints matte workspace inners', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const block = fouc.split('/* Student Service page:')[1]?.split('/* Student Service modal portal:')[0] || '';
        expect(block).toContain('body.lux-route-student-service #page-student-service');
        expect(block).toContain('.student-service-student-hub-track-compact');
        expect(block).toContain('.student-service-attachment-chip');
        expect(block).toContain('.student-service-find-search');
        expect(block).toContain('.student-service-ticket-inbox-row');
        expect(block).toContain('.student-service-ticket-msg-bubble');
        expect(block).toContain('var(--lux-soft-chrome-chip-shadow, var(--lux-elev-2))');
        const matteList = block.slice(
            block.indexOf('body.lux-route-student-service #page-student-service :is('),
            block.indexOf(') {', block.indexOf('body.lux-route-student-service #page-student-service :is('))
        );
        expect(matteList).not.toContain('.student-service-zone');
        expect(matteList).not.toContain('.student-service-command-bar-shell');
        expect(matteList).not.toContain('.student-service-lane-choice-card');
        expect(block).toContain('#page-student-service.lux-page-shell');
        expect(block).toContain('.student-service-shell[data-lux-glass-root="1"]');
        expect(block).toContain('.student-service-zone');
        expect(fouc).toContain('Student Service primary shells: frosted panel glass');
        expect(fouc).toContain('body.lux-unified-shell #page-student-service :is(');
        expect(fouc).toContain('--lux-panel-blur-filter');
        const modalBlock = fouc.split('/* Student Service modal portal:')[1]?.split('/* Social soft-chrome shells')[0] || '';
        expect(modalBlock).toContain('#student-service-modal-root');
        expect(modalBlock).toContain('.student-service-qa-composer-modal');
    });

    it('qa composer modal uses shared typography on title', () => {
        const qa = readSource('assets/js/pages/student-service-qa.js');
        expect(qa).toContain('id="student-service-question-composer-modal-title" class="lux-page-title"');
    });

    it('qa feed markup uses shared typography classes', () => {
        const qaThread = readSource('assets/js/pages/student-service-qa-thread-runtime.js');
        expect(qaThread).toContain('student-service-kicker lux-section-kicker');
        expect(qaThread).toContain('lux-panel-title lux-page-title');
    });

    it('service request form uses lux-control fields', () => {
        const service = readSource('assets/js/pages/student-service-service.js');
        expect(service).toContain('id="student-service-ticket-title" class="lux-control"');
        expect(service).toContain('id="student-service-ticket-message" class="lux-control"');
        expect(service).toContain('id="student-service-article-title" class="lux-control"');
        expect(service).toContain('id="student-service-article-summary" class="lux-control"');
        expect(service).toContain('id="student-service-article-content" class="lux-control"');
        expect(service).toContain('student-service-kicker lux-section-kicker');
    });
});
