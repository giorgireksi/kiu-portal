import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social groups hub card + detail dialog', () => {
    it('clamps long descriptions on slim group cards and opens a detail popup', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const groupsModule = readSource('assets/js/pages/social-groups.js');
        const css = readSource('assets/css/social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(source).toContain('function renderGroupDetailDialog(');
        expect(groupsModule).toContain('function renderGroupDetailDialog(');
        expect((source + groupsModule)).toContain("if (action === 'group-detail-open')");
        expect((source + groupsModule)).toContain("openDialog('group-detail'");
        expect(readSource('assets/js/pages/social-groups.js')).toContain("if (kind === 'group-detail')");
        expect(groupsModule).toContain('data-action="group-detail-open"');
        expect(groupsModule).toContain('social-neo-dialog-card--group-detail');
        expect(groupsModule).toContain('social-neo-group-detail-desc');

        const cardFn = groupsModule.match(/const renderGroupCard = \(group\) => \{[\s\S]*?\n        \};/)?.[0] || '';
        expect(cardFn).toContain('group-detail-open');
        expect(cardFn).toContain('social-neo-group-card-desc');
        expect(cardFn).not.toContain('Manager tools');
        expect(cardFn).not.toContain('group-visibility-set');
        expect(cardFn).not.toContain('group-approve');

        const detailFn = groupsModule.match(/function renderGroupDetailDialog\([\s\S]*?\n    function /)?.[0]
            || groupsModule.match(/function renderGroupDetailDialog\([\s\S]*?\n    window\./)?.[0]
            || '';
        expect(detailFn).toContain('About');
        expect(detailFn).toContain('Manager tools');
        expect(detailFn).toContain('group-visibility-set');
        expect(detailFn).toContain('social-neo-group-detail-desc');

        expect(css).toContain('.social-neo-group-card-desc');
        expect(css).toMatch(/\.social-neo-group-card-desc\s*\{[^}]*overflow-wrap:\s*anywhere/s);
        expect(css).toMatch(/\.social-neo-group-card-desc\s*\{[^}]*-webkit-line-clamp:\s*3/s);
        expect(css).toContain('.social-neo-dialog-card--group-detail');
        expect(css).toContain('.social-neo-group-detail-desc');
        expect(css).toMatch(/\.social-neo-group-detail-desc\s*\{[^}]*overflow-wrap:\s*anywhere/s);

        expect(utilities).toContain("'.social-neo-dialog-card--group-detail'");
    });

    it('refreshes the open group-detail dialog after group mutations', () => {
        const plan = readSource('assets/js/pages/social-render-plan.js');
        const block = plan.match(/if \(groupMutationReasons\.has\(reason\)\) \{[\s\S]*?\n        \}/)?.[0] || '';
        expect(block).toContain("text(activeDialog()?.type || '') === 'group-detail'");
        expect(block).toContain('dialog: text(activeDialog()?.type || \'\') === \'group-detail\'');
    });
});
