import { describe, expect, it } from 'vitest';
import { readLmsRouteCss } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

const SHELL_TOPBAR_ALIAS_BLOCK = `--lux-shell-topbar-surface-soft:`;

describe('route-owned shell topbar regressions', () => {
  it('defines shared shell topbar primitive and scopes legacy nonhome glass away from lux-route pages', () => {
    const luxuryCss = readSource('assets/css/index-luxury.css');

    expect(luxuryCss).toContain('/* Route-owned shell topbar — uses --lux-shell-topbar-* aliases on body.lux-route-* */');
    expect(luxuryCss).toContain('body.lux-nonhome-page[class*="lux-route-"]:not(.lux-route-home) #lux-topbar .lux-topbar-shell');
    expect(luxuryCss).toContain('background: var(--lux-shell-topbar-surface-soft) !important');
    expect(luxuryCss).toContain('body.lux-nonhome-page:not([class*="lux-route-"]) #lux-topbar .lux-search input');
    expect(luxuryCss).toContain('body:not(.lux-light-mode):not([class*="lux-route-"]) #lux-topbar .lux-topbar-shell');
    expect(luxuryCss).not.toContain(':not(.lux-route-registration) #lux-topbar');
  });

  it('skips transparency inline paint for shell topbar on route pages', () => {
    const utilitiesSource = readSource('assets/js/shared/utilities.js');

    expect(utilitiesSource).toContain('function shouldKeepShellTopbarFadeCssBackground(el)');
    expect(utilitiesSource).toContain("className.startsWith('lux-route-') && className !== 'lux-route-home'");
    expect(utilitiesSource).toContain('if (shouldKeepShellTopbarFadeCssBackground(el))');
  });

  it('keeps LMS shell topbar aliases in archived route skins (hard-clean)', () => {
    // Live LMS is bare; aliases remain in archive for future shared redesign cherry-picks.
    const lmsCss = readLmsRouteCss();
    expect(lmsCss).toContain(SHELL_TOPBAR_ALIAS_BLOCK);
    expect(lmsCss).toContain('--lux-shell-topbar-control:');
    expect(lmsCss).toContain('--lux-shell-topbar-blur:');
    expect(lmsCss).toContain('--lux-shell-topbar-surface-soft: var(--lms-fade-surface-soft)');
  });
});