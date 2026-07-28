import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-group-invite-ui.test', () => {
    it('group and project invite search rows use item-line not entity-card', () => {
        const groups = readSource('assets/js/pages/social-groups.js');
        const projectChrome = readSource('assets/js/pages/social-workspace-project-chrome.js');

        expect(groups).toContain('social-neo-item-line social-neo-group-creator-member');
        expect(groups).not.toMatch(/group-creator-member-add[\s\S]{0,400}social-neo-entity-card/);
        expect(groups).toContain('lux-glass-dialog-invite-list" data-lux-transparency-exempt="1"');

        expect(projectChrome).toContain('social-neo-item-line social-neo-group-creator-member');
        expect(projectChrome).not.toMatch(/project-creator-member-add[\s\S]{0,400}social-neo-entity-card/);
    });

    it('modals invite list has scroll and row layout rules', () => {
        const modals = readSource('assets/css/lux-modals.css');

        expect(modals).toContain('.lux-glass-dialog-invite-list');
        expect(modals).toContain('max-height: min(32dvh, 280px)');
        expect(modals).toContain('overflow-y: auto');
        expect(modals).toContain('grid-template-rows: auto minmax(0, 1fr)');
        expect(modals).toContain('contain: none');
    });
});
