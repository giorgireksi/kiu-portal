import { describe, expect, it } from 'vitest';

import {
    ROUTE_CLEARANCE_BUST,
    ROUTE_CLEARANCE_CSS,
    SHELL_PAGES,
} from '../tools/chrome-clearance-manifest.js';
import { expectRetiredCss, readBareStackCss, readSource } from './helpers/bare-shell-css.js';

describe('lux topbar overlap regressions', () => {
    it('defines shared chrome-bottom tokens for floating topbar clearance', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-topbar-offset-top: 18px');
        expect(tokens).toContain('--lux-chrome-gap: 12px');
        expect(tokens).toContain('--lux-chrome-bottom-fallback: calc(var(--lux-topbar-offset-top) + var(--lux-topbar-height) + var(--lux-chrome-gap))');
        expect(tokens).toContain(`--lux-chrome-bottom: var(--lux-chrome-bottom-fallback)`);
    });

});
