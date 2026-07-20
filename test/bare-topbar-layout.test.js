import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('bare topbar horizontal layout', () => {
    it('lux-shell defines topbar main/actions/spacer row flex', () => {
        const css = read('assets/css/lux-shell.css');
        expect(css).toContain('#lux-topbar .lux-topbar-main');
        expect(css).toContain('#lux-topbar .lux-topbar-actions');
        expect(css).toContain('#lux-topbar .lux-topbar-spacer');
        expect(css).toMatch(/\.lux-topbar-main\s*\{[^}]*flex-direction:\s*row/s);
        expect(css).toMatch(/\.lux-topbar-actions\s*\{[^}]*flex-direction:\s*row/s);
        expect(css).toMatch(/\.lux-topbar-spacer\s*\{[^}]*flex:\s*1/s);
        expect(css).toContain('margin-left: auto');
    });

    it('lux-shell owns topbar shell row flex (bare-lite is layout-only)', () => {
        const shell = read('assets/css/lux-shell.css');
        const bare = read('assets/css/lux-page-bare-lite.css');
        expect(shell).toMatch(/#lux-topbar \.lux-topbar-shell\s*\{[^}]*flex-direction:\s*row/s);
        expect(bare).toContain('Bare portal layout helpers');
        expect(bare).not.toMatch(/#lux-topbar \.lux-topbar-shell[\s\S]{0,200}flex-direction:\s*column/);
    });

    it('programs loads lux-shell + bare', () => {
        const html = read('programs.html');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).toMatch(/lux-page-bare-lite\.css/);
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare');
    });
});
