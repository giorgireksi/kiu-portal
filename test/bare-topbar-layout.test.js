import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('bare topbar horizontal layout', () => {
    it('shell-nav defines topbar main/actions/spacer row flex', () => {
        const css = read('assets/css/lux-shell-nav.css');
        expect(css).toContain('#lux-topbar .lux-topbar-main');
        expect(css).toContain('#lux-topbar .lux-topbar-actions');
        expect(css).toContain('#lux-topbar .lux-topbar-spacer');
        expect(css).toMatch(/\.lux-topbar-main\s*\{[^}]*flex-direction:\s*row/s);
        expect(css).toMatch(/\.lux-topbar-actions\s*\{[^}]*flex-direction:\s*row/s);
        expect(css).toMatch(/\.lux-topbar-spacer\s*\{[^}]*flex:\s*1/s);
        expect(css).toContain('margin-left: auto');
    });

    it('bare CSS does not force topbar shell to stack as block columns', () => {
        const bare = read('assets/css/lux-page-bare.css');
        expect(bare).toContain('Topbar flex layout wins');
        expect(bare).toMatch(/#lux-topbar \.lux-topbar-shell[\s\S]*flex-direction:\s*row/);
    });

    it('programs loads shell-nav + bare', () => {
        const html = read('programs.html');
        expect(html).toMatch(/lux-shell-nav\.css/);
        expect(html).toMatch(/lux-page-bare\.css/);
        expect(html).toContain('lux-page-bare');
    });
});
