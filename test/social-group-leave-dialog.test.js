import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social group leave dialog regressions', () => {
    it('removes feed from group cards and opens a 3-step leave verification dialog', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        const groupsModule = readSource('assets/js/pages/social-groups.js');
        expect((source + groupsModule)).toContain("if (action === 'group-leave-open')");
        expect((source + groupsModule)).toContain("openDialog('group-leave'");
        expect(readSource('assets/js/pages/social-groups.js')).toContain("kind === 'group-leave'");
        expect(source).toContain('function renderGroupLeaveDialog(');
        expect(groupsModule).toContain('function renderGroupLeaveDialog(');
        expect(source).toContain('function normalizeGroupLeaveToken(');
        expect(groupsModule).toContain('function normalizeGroupLeaveToken(');
        expect(source).toContain('function buildGroupLeaveVerification(');
        expect(groupsModule).toContain('function buildGroupLeaveVerification(');
        expect(groupsModule).toContain('data-form="dialog-group-leave"');
        expect(groupsModule).toContain('name="groupLeaveToken"');
        expect(groupsModule).toContain('name="expectedLeaveToken"');
        expect(groupsModule).toContain('data-action="group-leave-wizard-next"');
        expect(groupsModule).toContain('data-action="group-leave-wizard-prev"');
        expect(source).not.toContain('name="confirmGroupLeave"');
        expect(groupsModule).not.toContain('name="confirmGroupLeave"');

        expect(source).toContain('function renderGroupsPanel()');
        expect(groupsModule).toContain('function renderGroupsPanel()');
        expect(groupsModule).not.toContain('data-action="focus-feed"');
        expect(groupsModule).toContain('data-action="group-chat"');
        // Leave lives on group detail / panel chrome, not the slim card list.
        expect(groupsModule).toContain('data-action="group-leave-open"');

        expect((source + groupsModule)).toMatch(/if \(formType === 'dialog-group-leave'\)[\s\S]*?normalizeGroupLeaveToken\(form\.groupLeaveToken\?\.value\)/);
        expect((source + groupsModule)).toMatch(/if \(formType === 'dialog-group-leave'\)[\s\S]*?leaveStep !== 3/);

        expect(css).toContain('.social-neo-dialog-group-leave-steps');
        expect(css).toMatch(/\.social-neo-dialog-group-leave-steps[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);

        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
    });
});