import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { socialModuleUrlToken } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-create-dialog.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('page create dialog uses shared social-glass shell and wizard chrome', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const modals = readSource('assets/css/lux-modals.css');
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        const createFormLine = pages.split('\n').find((line) => line.includes('data-form="create-page"') && line.includes('<form'));
        expect(createFormLine).toContain('lux-glass-dialog-card--social-glass');
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--social-glass \.social-neo-pages-wizard-step[\s\S]*background:\s*var\(--lux-modal-glass-section\)/
        );
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--social-glass \.social-neo-pages-preview[\s\S]*background:\s*var\(--lux-modal-glass-section\)/
        );
        expect(transparency).not.toContain("'.social-neo-pages-wizard-step'");
    });

    it('page wizard validates steps before advancing and on publish', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const page = readSource('assets/js/pages/social-page.js');
        const runtime = readSource('assets/js/shared/social-lite-content-runtime.js');

        expect(pages).toContain('function validatePageWizardStep(step, runtime)');
        expect(pages).toMatch(/action === 'page-wizard-next'[\s\S]{0,500}validatePageWizardStep\(step, runtime\)/);
        expect(pages).toMatch(/pageWizardStep = 3[\s\S]{0,120}page-create-validate/);
        expect(pages).toContain('Add a short description or about section on step 3.');
        expect(page).toContain(socialModuleUrlToken('social-pages.js'));
        expect(runtime).toContain('facultyCode: text(input.facultyCode || input.faculty || \'\')');
    });

    it('page about dialog wraps long copy inside the modal', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const modals = readSource('assets/css/lux-modals.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(pages).toContain('social-neo-page-about-dialog-copy');
        expect(modals).toMatch(/\.social-neo-page-about-dialog-body\s*\{[\s\S]{0,400}overflow-wrap:\s*anywhere/);
        expect(modals).toMatch(/\.social-neo-page-about-dialog-copy\s*\{[\s\S]{0,400}overflow-wrap:\s*anywhere/);
        expect(bare).toMatch(/\.social-neo-page-card-about-text\s*\{[\s\S]{0,500}word-break:\s*break-all/);
        expect(bare).toMatch(/\.social-neo-page-card-rich\.home-hover-chip[\s\S]{0,120}overflow:\s*hidden/);
    });

    it('page grid cards use scroll rails for tagline and about copy', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const page = readSource('assets/js/pages/social-page.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const pageCardChunk = pages.slice(
            pages.indexOf('const renderPageCardTextRail ='),
            pages.indexOf('const renderProfileComposer =')
        );

        expect(pages).toContain('const renderPageCardTextRail =');
        expect(pageCardChunk).toContain('data-page-desc-rail');
        expect(pageCardChunk).toContain('data-page-about-rail');
        expect(pageCardChunk).toContain('lux-scroll-rail__dock--vertical');
        expect(pageCardChunk).toContain('hidden aria-hidden="true"');
        expect(pageCardChunk).not.toContain('social-neo-page-card-about-more');
        expect(pages).toContain('const pageAboutPreviewText = (page) =>');
        expect(bare).toMatch(/\.social-neo-page-card-desc-rail\.is-scrollable[\s\S]{0,400}min-height:\s*calc\(1\.55em \* 6 \+ 16px \+ 12px\)/);
        expect(bare).toMatch(/\.social-neo-page-card-about-rail\.is-scrollable[\s\S]{0,400}min-height:\s*calc\(1\.5em \* 6 \+ 16px \+ 12px\)/);
        expect(bare).toMatch(/\.social-neo-page-card-desc-viewport\s*\{[\s\S]{0,300}max-height:\s*calc\(1\.55em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-page-card-about-viewport\s*\{[\s\S]{0,300}max-height:\s*calc\(1\.5em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-page-card-desc-rail\.is-scrollable \.social-neo-page-card-desc-viewport[\s\S]{0,400}min-height:\s*calc\(1\.55em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-page-card-about-rail\.is-scrollable \.social-neo-page-card-about-viewport[\s\S]{0,400}min-height:\s*calc\(1\.5em \* 6 \+ 16px\)/);
        expect(bare).not.toMatch(/:not\(\.is-scrollable\)[\s\S]{0,500}\.social-neo-page-card-desc-viewport[\s\S]{0,200}max-height:\s*none/);
        expect(bare).toMatch(/\.social-neo-page-card-desc-rail[\s\S]{0,800}:not\(\.is-scrollable\)[\s\S]{0,200}grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/:not\(\.is-scrollable\)\s*\{[\s\S]{0,400}border:\s*none/);
        expect(bare).toMatch(/:not\(\.is-scrollable\)\s*\{[\s\S]{0,400}background:\s*transparent/);
        expect(bare).toMatch(/:not\(\.is-scrollable\)\s*\{[\s\S]{0,400}padding:\s*0/);
        expect(bare).toMatch(/social-neo-survey-card-desc-viewport\s*\) \{\s*min-height: auto;\s*padding: 0;/);
        expect(bare).toMatch(/\.social-neo-page-card-support \.social-neo-page-card-about:has\(\.social-neo-page-card-about-rail\)[\s\S]{0,200}padding:\s*0/);
        expect(bare).toMatch(/\.social-neo-page-card-about:not\(:has\(\.social-neo-page-card-about-rail\)\) \.social-neo-page-card-about-text[\s\S]{0,300}-webkit-line-clamp:\s*2/);
        expect(bare).toMatch(/\.lux-scroll-rail__controls\s*\{[\s\S]{0,120}display:\s*none/);
        expect(bare).toMatch(/\.is-scrollable \.lux-scroll-rail__controls:not\(\[hidden\]\)\s*\{[\s\S]{0,120}display:\s*flex/);
        expect(bare).toMatch(/\.social-neo-page-card-about-rail \.social-neo-page-card-about-text\s*\{[\s\S]{0,300}-webkit-line-clamp:\s*unset/);
        expect(page).toContain(socialModuleUrlToken('social-pages.js'));
        expect(interactions).toMatch(/activePanel === 'pages'[\s\S]{0,120}syncEventDescScrollRails/);
    });
});
