import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-messages-scroll-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('uses one scoped thread viewport with an accessible visual rail', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        const tokens = readSource('assets/css/lux-tokens.css');
        const messages = readSource('assets/js/pages/social-messages.js');

        expect(messages).toContain('data-social-thread-shell');
        expect(messages).toContain('data-lux-scrollport');
        expect(messages).toContain('window.initLuxCustomScrollbar');
        expect(messages).not.toContain('data-social-thread-scrollbar');
        expect(css).toMatch(/social-project-workspace-chat\s*\{[\s\S]*?height:\s*min\(74vh, calc\(100dvh - 190px\)\)/);
        expect(css).toMatch(/@media\s*\(min-width:\s*761px\)[\s\S]*?social-neo\[data-panel="messages"\][\s\S]*?min-height:\s*calc\(100dvh - var\(--social-shortcuts-top-nav-height, 60px\) - 24px \+ 56px\)[\s\S]*?height:\s*calc\(100dvh - var\(--social-shortcuts-top-nav-height, 60px\) - 24px \+ 56px\)[\s\S]*?max-height:\s*none/);
        expect(css).toMatch(/social-project-workspace-chat \.social-neo-messages__thread-scroll\s*\{[\s\S]*?flex:\s*1 1 0% !important[\s\S]*?overflow-y:\s*auto !important/);
        expect(css).toMatch(/social-project-workspace-chat \.social-neo-messages__composer\s*\{[\s\S]*?margin-top:\s*0 !important/);
        expect(css).toContain('.lux-custom-scrollbar');
        expect(tokens).toContain('body.lux-unified-shell .lux-custom-scrollbar:not(.lux-custom-scrollbar--window)');
        expect(tokens).toContain('position: absolute !important');

        const scrollbarRuntime = readSource('assets/js/shared/lux-custom-scrollbar.js');
        expect(scrollbarRuntime).not.toContain("'.social-neo-messages__thread-scroll'");

        const shellRuntime = readSource('assets/js/pages/social-page-shell-runtime.js');
        const interactionsRuntime = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(interactionsRuntime).toContain('return panel === \'messages\';');
        expect(shellRuntime).toContain('.social-neo-messages__thread-scroll, .social-neo-chat-items');
        expect(shellRuntime).not.toContain('.social-neo-messages__thread-scroll, .social-neo-thread-messages');
    });

    it('keeps inbox and thread scroll inside the messages panel on desktop', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        const messages = readSource('assets/js/pages/social-messages.js');

        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region > \.social-neo-messages[\s\S]*flex:\s*1 1 0%/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-chat-items[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__inbox[\s\S]*\.social-neo-chat-list[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-shell[\s\S]*flex-direction:\s*column/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\.social-neo-messages\.is-group-rail-open[\s\S]*grid-template-columns:\s*minmax\(300px, 340px\) minmax\(0, 1fr\)/);

        const scrollbarRuntime = readSource('assets/js/shared/lux-custom-scrollbar.js');
        expect(scrollbarRuntime).toContain('function isSocialCenterScroller(el)');
        expect(scrollbarRuntime).toContain('releaseSocialCenterScroller(el)');
        expect(scrollbarRuntime).toContain("document.documentElement.removeAttribute('data-lux-custom-scrollbar-target')");

        expect(shell).toContain('.social-neo-chat-items');
        expect(shell).toContain('.social-neo-messages__thread-scroll');

        expect(messages).toContain('class="social-neo-chat-items"');
        expect(messages).toContain('social-neo-messages__thread-chrome');
        expect(messages).toContain('social-neo-messages__thread-scroll');
        expect(messages).toContain('social-neo-messages__thread-stream');
        expect(messages).toContain('social-neo-messages__composer');
        expect(messages).toContain('data-form="send-message"');
    });
});
