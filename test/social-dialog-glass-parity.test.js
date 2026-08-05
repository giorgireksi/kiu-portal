import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social dialog glass parity', () => {
    it('keeps social-glass on shared popup-shell surface chain', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-popup-shell-surface: var(--lux-frosted-glass-surface)');
        expect(tokens).toMatch(/--lux-frosted-glass-surface:\s*rgba\(8,\s*12,\s*21,\s*0\.50\)/);
        expect(modals).toMatch(
            /#social-neo-overlay-portal \.lux-glass-dialog-card--social-glass[\s\S]*?background:\s*var\(--lux-popup-shell-surface/
        );
        expect(modals).toMatch(
            /\[data-lux-transparency-exempt="1"\]\.lux-glass-dialog-card--social-glass[\s\S]*?backdrop-filter:\s*var\(--lux-popup-shell-blur/
        );
        expect(modals).toMatch(
            /\[data-lux-transparency-exempt="1"\]\.lux-glass-dialog-card[\s\S]*?background:\s*var\(--lux-modal-glass-surface, var\(--lux-popup-shell-surface\)\)/
        );
    });

    it('excludes social-glass from hub modal button flattening', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(/\.lux-glass-dialog-card:not\(\.lux-glass-dialog-card--social-glass\)/);
        expect(modals).toContain('[data-lux-transparency-exempt="1"] .lux-primary-btn:not(:is(');
        expect(modals).toContain('.lux-glass-dialog-card--social-glass *,');
        expect(modals).not.toMatch(
            /\.lux-glass-dialog-card--social-glass\s*\{[^}]*border-width:\s*1px/
        );
    });

    it('keeps social-glass controls on shared lux-control layout chain', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(
            /body\.lux-full-paint\.lux-unified-shell[\s\S]*\.lux-glass-dialog-card\)\s*:is\([\s\S]*\.lux-control/
        );
        expect(modals).toMatch(
            /body\.lux-full-paint\.lux-unified-shell[\s\S]*\.lux-glass-dialog-card\)\s*\.lux-picker-field\s*>\s*\.lux-picker-btn--compact/
        );
    });

    it('scopes opaque social-neo-card paint to page root only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-social .social-neo-card');
        expect(bare).toMatch(/body\.lux-route-social :is\(#page-social, #public-social-root/);
    });
});
