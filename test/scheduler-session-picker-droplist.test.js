import { describe, expect, it } from 'vitest';
import {
    LUX_DROPLIST_CONTRACT,
} from './fixtures/lux-droplist-contract.js';
import { expectRetiredCss, readDroplistCss, readSource } from './helpers/bare-shell-css.js';

describe('scheduler session picker droplist regressions', () => {
    it('uses global lux-droplist shell; scheduler route CSS is retired', () => {
        const droplist = readDroplistCss();

        expectRetiredCss('admin-scheduler-route.css');
        expect(droplist).toContain('.lux-droplist-panel');
        expect(droplist).toContain(`--lux-droplist-shell-radius: ${LUX_DROPLIST_CONTRACT.shellRadius}`);
        expect(droplist).toContain(`--lux-droplist-option-height: ${LUX_DROPLIST_CONTRACT.optionHeight}`);
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel[\s\S]*?border-radius: var\(--lux-droplist-shell-radius\)/
        );
    });

    it('applies warmglass shell depth and selection check disc from lux-droplist', () => {
        const droplist = readDroplistCss();
        const html = readSource('admin-scheduler.html');

        expect(droplist).toMatch(
            /\.lux-droplist-panel::before[\s\S]*?inset 0 1px 0 rgba\(255, 255, 255/
        );
        expect(droplist).toMatch(
            /\.lux-droplist-panel \.lux-picker-option\.is-active::after[\s\S]*?\\f00c/
        );
        expect(droplist).toContain('--lux-droplist-glass-surface:');
        expect(droplist).toContain('rgba(247, 241, 232, 0.44)');
        expect(droplist).toContain('--lux-droplist-glass-shadow:');
        expect(droplist).toMatch(
            /:is\(html\.lux-light-mode, body\.lux-light-mode\) \.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel[\s\S]*?var\(--lux-droplist-glass-surface\)/
        );
        expect(html).toMatch(/lux-controls\.css\?v=/);
        expect(html).toContain('lux-page-bare-lite.css');
    });

    it('ships transition-based panel open/close without option stagger in lux-droplist', () => {
        const droplist = readDroplistCss();

        expect(droplist).not.toContain('@keyframes schPickerPanelFade');
        expect(droplist).not.toContain('@keyframes schPickerPanelBloom');
        expect(droplist).not.toContain('@keyframes schPickerOptionIn');
        expect(droplist).not.toContain('@keyframes schPickerActivePulse');
        expect(droplist).toContain('.lux-droplist-panel:is(.is-open, .is-closing)');
        expect(droplist).not.toContain('--sch-picker-option-stagger');
        expect(droplist).not.toMatch(
            /\.lux-droplist-panel\.is-open \.lux-picker-option:nth-child\(1\)[\s\S]*?animation-delay/
        );
        expect(droplist).toMatch(
            /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lux-droplist-panel[\s\S]*?transition:\s*none/
        );
        expect(droplist).toContain(`--lux-droplist-anim-duration: ${LUX_DROPLIST_CONTRACT.animDuration}`);
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\.is-open[\s\S]*?opacity:\s*1/
        );
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\.is-open[\s\S]*?scale\(1\)/
        );
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\.is-closing:not\(\.is-open\)[\s\S]*?opacity:\s*0/
        );
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel:not\(\.is-open\):not\(\.is-closing\)[\s\S]*?opacity:\s*0/
        );
        expect(droplist).toContain('--lux-droplist-hover-duration: 120ms');
        const optionBaseRule = droplist.match(
            /\.lux-droplist-panel \.lux-picker-option\s*\{\s*\n\s*position: relative;[\s\S]*?\n\}/
        )?.[0] || '';
        expect(optionBaseRule).toContain('var(--lux-droplist-hover-duration)');
        expect(optionBaseRule).not.toContain('box-shadow');
        expect(droplist).toMatch(
            /\.lux-droplist-panel \.lux-picker-option:hover[\s\S]*?transform:\s*none/
        );
        expect(droplist).not.toMatch(
            /\.lux-droplist-panel\.is-open \.lux-picker-option\.is-active[\s\S]*?schPickerActivePulse/
        );
    });
});
