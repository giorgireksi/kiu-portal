import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('fog parameters modal layout regressions', () => {
    it('routes fog params typography and field paint through lux-modals.css', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const studio = readSource('assets/css/lux-studio.css');

        expect(modals).toContain(
            '[data-lux-transparency-exempt="1"] #lux-bg-mode-params-backdrop .lux-bg-mode-params-title'
        );
        expect(modals).toMatch(
            /\[data-lux-transparency-exempt="1"\] #lux-bg-mode-params-backdrop \.lux-bg-mode-params-title[\s\S]*?font-family:\s*inherit/
        );
        expect(modals).toContain(
            '[data-lux-transparency-exempt="1"] #lux-bg-mode-params-backdrop .lux-fog-profile-add-row .lux-modern-field'
        );
        expect(modals).toContain('--lux-modal-glass-border');
        expect(studio).not.toMatch(/\.lux-bg-mode-params-title[\s\S]*?Playfair Display/);
        expect(studio).not.toMatch(
            /#lux-bg-mode-params-backdrop \.lux-fog-profile-add-row \.lux-modern-field[\s\S]*?background:\s*rgba\(255,\s*255,\s*255/
        );
    });

    it('keeps fog params shell layout in lux-studio.css without duplicate dialog frost', () => {
        const studio = readSource('assets/css/lux-studio.css');

        expect(studio).toContain('.lux-bg-mode-params-dialog');
        expect(studio).toContain('width: min(520px, 100%)');
        expect(studio).not.toMatch(
            /:is\(\s*#lux-studio-backdrop \.lux-studio-panel,\s*\.lux-bg-mode-params-dialog,/
        );
    });
});
