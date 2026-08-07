import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-workspace-ui.test', () => {
    it('project workspace tabs use lux-secondary-btn hero-grid pattern', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');

        expect(panel).toContain('lux-secondary-btn social-project-hero-tab');
        expect(panel).toContain('social-project-hero-tab-icon');
        expect(panel).toContain('social-project-hero-tab-copy');
        expect(panel).toContain('social-project-hero-grid social-project-tab-row social-project-tab-row-rich');
        expect(panel).not.toContain('social-project-tab-pill');
        expect(panel).not.toContain('social-project-tab-shell');
    });

    it('tab runtime targets hero-tab selectors', () => {
        const runtime = readSource('assets/js/pages/social-workspace-tab-runtime.js');

        expect(runtime).toContain('.social-project-hero-tab[data-project-tab]');
        expect(runtime).toContain("pill.classList.toggle('is-focused', isActive)");
        expect(runtime).not.toContain('.social-project-tab-pill');
    });

    it('bare-lite includes project workspace paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        const messages = readSource('assets/js/pages/social-messages.js');

        expect(bare).toContain('.social-project-card-new {');
        expect(bare).toContain('.spt-desk-package-head {');
        expect(bare).toContain('.social-project-workspace-chat .social-neo-messages__thread-shell');
        expect(fouc).toContain('.social-project-workspace-chat');
        expect(panel).toMatch(/renderMessagesThreadShell\([^)]*chrome:\s*'workspace'/);
        expect(messages).toContain("text(options?.chrome || '') === 'workspace'");
        expect(messages).toContain('lux-soft-chrome home-hover-chip');
        expect(fouc).toContain('.social-project-metric-card::before');
        expect(fouc).toContain('.social-project-detail-hero-rich::after');
        expect(fouc).toMatch(/lux-route-social \[data-lux-glass-root="1"\][\s\S]*\.social-project-card-new/);
        expect(panel).toContain('social-project-detail-hero social-project-detail-hero-rich lux-soft-chrome');
        expect(panel).toContain('social-project-metric-card-wide lux-soft-chrome home-hover-chip');
        expect(bare).toContain('.social-project-detail-top {');
        expect(bare).toContain('.social-project-ring-card svg {');
        expect(bare).toContain('.social-project-hero-tab-icon');
        expect(bare).toContain('.social-projects-shell .social-project-scroll-list--activity');
        expect(bare).toContain('max-height: none;');
        expect(bare).toContain('overflow: visible;');
        expect(bare).toContain('overscroll-behavior: auto;');
        expect(bare).not.toMatch(/button\.social-project-tab-pill/);
    });

    it('wheel forwarding recognizes bounded project scroll rails', () => {
        const runtime = readSource('assets/js/pages/social-page-shell-runtime.js');
        expect(runtime).toContain('.social-project-scroll-list');
        expect(runtime).toContain('socialInnerScrollerCanAbsorbWheel(innerScroller, event.deltaY)');
    });
});
