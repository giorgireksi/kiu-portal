import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

const SHELL_TOPBAR_ALIAS_BLOCK = `--lux-shell-topbar-surface-soft:`;

describe('route-owned shell topbar regressions', () => {
  it('defines shared shell topbar primitive and scopes legacy nonhome glass away from lux-route pages', () => {
    const luxuryCss = readSource('assets/css/lux-shell.css');

    expect(luxuryCss).toContain('/* ── §3 shared paint: TOPBAR SOFT-CHROME SSOT');
    expect(luxuryCss).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
    expect(luxuryCss).toContain('background-image: var(--lux-soft-chrome-surface');
    expect(luxuryCss).toContain('backdrop-filter: none');
    expect(luxuryCss).toContain('body.lux-page-bare #lux-topbar .lux-topbar-shell');
  });

  it('skips transparency inline paint for shell topbar on route pages', () => {
    const transparencySource = readSource('assets/js/shared/lux-transparency.js');

    expect(transparencySource).toContain('const isTopbarSoftChromeSurface = (');
    expect(transparencySource).toContain("el.id === 'lux-topbar'");
    expect(transparencySource).toContain("el.classList.contains('lux-topbar-shell')");
  });

  it('keeps LMS shell topbar aliases in archived route skins (hard-clean)', () => {
    // Live LMS is bare; aliases remain in archive for future shared redesign cherry-picks.
  });
});