import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social page members admin management', () => {
    it('members dialog supports admin actions, filters, and campus people search', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const renderPlan = readSource('assets/js/pages/social-render-plan.js');
        const fingerprint = readSource('assets/js/pages/social-fingerprint-model.js');
        const router = readSource('assets/js/pages/social-dialog-router.js');
        const page = readSource('assets/js/pages/social-page.js');
        const dialogChunk = pages.slice(
            pages.indexOf("if (kind === 'page-members')"),
            pages.indexOf("if (kind === 'page-admin-promote')")
        );

        expect(runtime).toContain('pageMembersFacultyFilter:');
        expect(runtime).toContain('pageMembersRoleFilter:');
        expect(runtime).toContain('pageAdminPromoteStep:');
        expect(dialogChunk).toContain('data-action="page-member-promote-admin"');
        expect(dialogChunk).toContain('data-action="page-member-demote-admin"');
        expect(dialogChunk).toContain('data-action="page-member-add-admin"');
        expect(dialogChunk).toContain('data-bind="page-members-faculty-filter"');
        expect(dialogChunk).toContain('data-bind="page-members-role-filter"');
        expect(dialogChunk).toContain('<strong>Find people</strong>');
        expect(pages).toContain('function updatePageAdmins(pageId, userId, mode)');
        expect(pages).toContain('updatePortalSocialPage(pageId, { adminIds })');
        expect(pages).toMatch(/page-members-open[\s\S]*?pageMembersFacultyFilter = 'all'/);
        expect(pages).toMatch(/page-members-open[\s\S]*?pageMembersRoleFilter = 'all'/);
        expect(renderPlan).toContain("'page-members-faculty-filter'");
        expect(renderPlan).toContain("'page-admins-updated'");
        expect(renderPlan).toContain("'page-admin-promote-wizard-next'");
        expect(fingerprint).toContain('page-admin-promote-wizard-next');
        expect(fingerprint).toContain('page-admins-updated');
        expect(router).toContain('page-admin-promote');
        expect(page).toContain('social-pages.js?v=20260802-page-admin-promote3');
    });

    it('requires a 3-step verification wizard before promoting page admins', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const promoteChunk = pages.slice(
            pages.indexOf('function renderPageAdminPromoteDialog(runtime, dialog)'),
            pages.indexOf('function validatePageWizardStep(step, runtime)')
        );

        expect(pages).toContain("'page-admin-promote'");
        expect(promoteChunk).toContain('data-form="dialog-page-admin-promote"');
        expect(promoteChunk).toContain("['1', 'Review']");
        expect(promoteChunk).toContain("['2', 'Impact']");
        expect(promoteChunk).toContain("['3', 'Confirm']");
        expect(promoteChunk).toContain('pageAdminPromoteToken');
        expect(pages).toMatch(/if \(action === 'page-member-promote-admin' \|\| action === 'page-member-add-admin'\)[\s\S]*?openDialog\('page-admin-promote'/);
        expect(pages).toContain("formType === 'dialog-page-admin-promote'");
        expect(pages).toMatch(/promoteStep !== 3[\s\S]*?Complete all verification steps/);
        expect(pages).toMatch(/typedToken !== expectedToken[\s\S]*?name exactly to confirm/);
        expect(pages).toMatch(/dialog-page-admin-promote[\s\S]*?await updatePageAdmins\(pageId, userId, 'promote'\)/);
    });

    it('updateSocialPage sanitizes adminIds against owner duplication and unknown accounts', () => {
        const content = readSource('backend/platform/domains/social-content-service.js');
        expect(content).toMatch(/page\.adminIds = socialIdArray\(payload\.adminIds[\s\S]*?ownerUserId[\s\S]*?getSocialAccount/);
    });
});
