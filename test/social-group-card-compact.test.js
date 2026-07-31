import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social group cards compact layout', () => {
    it('groups panel uses expandable description and description dialog', () => {
        const groups = readSource('assets/js/pages/social-groups.js');

        expect(groups).toContain('social-neo-groups-grid');
        expect(groups).toContain('GROUP_DESC_PREVIEW_MAX');
        expect(groups).toContain('is-expandable');
        expect(groups).toContain('data-action="group-description-open"');
        expect(groups).toContain("'group-description'");
        expect(groups).toContain('function renderGroupDescriptionDialog');
        expect(groups).toContain('lux-glass-dialog-card--compact');
        expect(groups).toContain('Full group description');
        expect(groups).toContain("openDialog('group-description'");
    });

    it('bare-lite CSS clamps descriptions in a two-column groups grid', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');

        expect(css).toContain('.social-neo-groups-grid');
        expect(css).toMatch(
            /\.social-neo-groups-grid[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
        );
        expect(css).toContain('.social-neo-group-card-desc');
        expect(css).toMatch(
            /\.social-neo-group-card-desc[\s\S]*?-webkit-line-clamp:\s*2/
        );
        expect(css).toContain('.social-neo-group-card-desc.is-expandable');
    });
});
