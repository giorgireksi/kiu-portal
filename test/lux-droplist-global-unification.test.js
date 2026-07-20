import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';
import {
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';
    LUX_DROPLIST_CONTRACT,
    LUX_DROPLIST_TOKEN_NAMES,
} from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function cssExists(relativePath) {
    return existsSync(join(process.cwd(), relativePath));
}

function extractFunctionBody(source, functionName) {
    const start = source.indexOf(`function ${functionName}`);
    if (start < 0) return '';
    const braceStart = source.indexOf('{', start);
    if (braceStart < 0) return '';
    let depth = 0;
    for (let index = braceStart; index < source.length; index += 1) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    return '';
}

describe('lux droplist global unification', () => {
    it('ships applyLuxPickerPanelVariants and lux-droplist-panel in shell chrome', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toContain('function applyLuxPickerPanelVariants');
        expect(shellChrome).toContain('lux-droplist-panel');
    });

    it('ships global droplist shell tokens and panel class in lux-droplist', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const droplist = readSource('assets/css/lux-droplist.css');

        expect(controls + droplist).toContain('.lux-droplist-panel');
        expect(droplist).toContain('.lux-droplist-panel');
        expect(droplist).toContain(
            `${LUX_DROPLIST_TOKEN_NAMES.shellRadius}: ${LUX_DROPLIST_CONTRACT.shellRadius}`
        );
        expect(droplist).toContain(
            `${LUX_DROPLIST_TOKEN_NAMES.optionHeight}: ${LUX_DROPLIST_CONTRACT.optionHeight}`
        );
        expect(droplist).toContain(
            `${LUX_DROPLIST_TOKEN_NAMES.animDuration}: ${LUX_DROPLIST_CONTRACT.animDuration}`
        );
        expect(droplist).toContain(
            `${LUX_DROPLIST_TOKEN_NAMES.slideOffset}: ${LUX_DROPLIST_CONTRACT.slideOffset}`
        );
        expect(droplist).toContain(
            `${LUX_DROPLIST_TOKEN_NAMES.scaleClosed}: ${LUX_DROPLIST_CONTRACT.scaleClosed}`
        );
    });

    it('uses lux-droplist-panel as primary class in enhanceUniversalPicker', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const enhanceBody = extractFunctionBody(shellChrome, 'enhanceUniversalPicker');
        const variantsBody = extractFunctionBody(shellChrome, 'applyLuxPickerPanelVariants');

        expect(enhanceBody).toMatch(/applyLuxPickerPanelVariants\(panel,\s*(select|button)\)/);
        expect(variantsBody).toContain("panel.classList.add('lux-droplist-panel')");
        expect(enhanceBody).not.toContain("panel.classList.add('sch-session-picker-panel')");
    });

    it('requires scheduler route CSS to use lux-droplist-panel instead of sch-session-picker-panel', () => {
        const droplist = readSource('assets/css/lux-droplist.css');

        // Bare-shell era: admin-scheduler-route.css deleted; droplist SSOT is lux-droplist.css.
        expect(droplist).toContain('.lux-droplist-panel');
        expect(existsSync(join(process.cwd(), 'assets/css/admin-scheduler-route.css'))).toBe(false);
    });

    it('does not let route CSS override lux-droplist-panel shell paint', () => {
        const socialSurveys = readSource('assets/css/social-surveys-lms.css');

        // File may be empty/archived; when present, must guard droplist panels.
        if (socialSurveys.trim()) {
            expect(socialSurveys).toContain('.lux-picker-panel:not(.lux-droplist-panel)');
            expect(socialSurveys).not.toMatch(
                /\.social-neo-dialog-card--survey-create \.lux-picker-panel\s*\{[^}]*background:\s*var\(--survey-create-surface\)/
            );
        } else {
            expect(socialSurveys).toBe('');
        }
    });

    it('does not let retired social-rebuild override lux-droplist-panel shell paint', () => {
        expectRetiredCss('social-rebuild.css');
        const droplist = readSource('assets/css/lux-droplist.css');
        const modals = readSource('assets/css/lux-modals.css');

        expect(droplist).toContain('.lux-droplist-panel');
        expect(modals).toContain('.lux-picker-panel');
        expect(modals).not.toMatch(/\.lux-droplist-panel\s*\{[^}]*background:/);
    });

    it('does not let retired index-luxury override lux-droplist-panel shell paint', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        const droplist = readSource('assets/css/lux-droplist.css');
        const home = readHomeDashboardCss();
        const shellPaint = readSource('assets/css/lux-shell.css');

        expect(droplist).toContain('.lux-droplist-panel');
        expect(home).not.toMatch(/\.lux-droplist-panel\s*\{[^}]*background:/);
        expect(shellPaint).not.toMatch(/\.lux-droplist-panel\s*\{[^}]*background:/);
    });

    it('does not let library-route CSS override lux-droplist-panel shell paint', () => {
        // Bare-shell era: library-route.css deleted — no route override possible.
        expect(existsSync(join(process.cwd(), 'assets/css/library-route.css'))).toBe(false);
    });

    it('ships warm light-mode glass tokens in lux-droplist', () => {
        const droplist = readSource('assets/css/lux-droplist.css');

        expect(droplist).toContain('--lux-droplist-glass-shadow:');
        expect(droplist).toContain('--lux-droplist-glass-inset:');
        expect(droplist).toContain('rgba(247, 241, 232, 0.44)');
    });

    it('does not skip admin-orders selects in shouldEnhanceSelect', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const shouldEnhanceBody = extractFunctionBody(shellChrome, 'shouldEnhanceSelect');

        expect(shouldEnhanceBody).not.toContain('#admin-orders-root');
    });

    it('does not let admin-orders route CSS override lux-droplist-panel shell paint', () => {
        // Bare-shell era: admin-orders-route.css deleted — no route override possible.
        expect(existsSync(join(process.cwd(), 'assets/css/admin-orders-route.css'))).toBe(false);
    });

    it('does not let admin-orders route CSS override lux-droplist-panel option paint without guard', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/admin-orders-route.css'))).toBe(false);
    });
});