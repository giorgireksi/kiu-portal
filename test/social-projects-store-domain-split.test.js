import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const socialProjectsService = require('../backend/platform/domains/social-projects-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social projects store domain split', () => {
    it('keeps social project ownership in social-projects-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(socialProjectsService).sort()).toEqual([
            'canContributeToSocialProject',
            'canManageSocialProject',
            'canViewSocialProject',
            'createSocialProject',
            'createSocialProjectBudgetCategory',
            'createSocialProjectBudgetExpense',
            'createSocialProjectRisk',
            'createSocialProjectShowcasePage',
            'createSocialProjectTask',
            'decorateSocialProject',
            'deleteSocialProject',
            'deleteSocialProjectBudgetCategory',
            'deleteSocialProjectBudgetExpense',
            'deleteSocialProjectRisk',
            'deleteSocialProjectTask',
            'getSocialProjectAdvisorIds',
            'getSocialProjectByChatId',
            'getSocialProjectByGroupId',
            'getSocialProjectMemberIds',
            'getSocialProjectMemberRole',
            'getSocialProjectRecord',
            'inviteSocialProjectMember',
            'removeSocialProjectMember',
            'setSocialProjectBaseline',
            'setSocialProjectMembership',
            'updateSocialProject',
            'updateSocialProjectBudgetCategory',
            'updateSocialProjectBudgetExpense',
            'updateSocialProjectMemberRole',
            'updateSocialProjectRisk',
            'updateSocialProjectTask',
            'updateSocialProjectTaskGraph'
        ]);
        expect(source).toContain("} = require('./domains/social-projects-service');");
        expect(source).toContain('return createSocialProject.call(this, payload, actorId);');
        expect(source).toContain('return createSocialProjectTask.call(this, projectId, payload, actorId);');
        expect(source).toContain('return createSocialProjectShowcasePage.call(this, projectId, actorId);');
        expect(source).toContain('return createSocialProjectBudgetCategory.call(this, projectId, payload, actorId);');
        expect(source).toContain('return createSocialProjectRisk.call(this, projectId, payload, actorId);');
        expect(source).toContain('return deleteSocialProjectBudgetExpense.call(this, projectId, expenseId, actorId);');
        const projectsService = readSource('backend/platform/domains/social-projects-service.js');
        expect(projectsService).toContain('function normalizeSafeExternalUrl(value = \'\') {');
        expect(projectsService).not.toContain('this.normalizeSafeExternalUrl');
    });

    it('preserves social project workspace behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['member-1'] = { id: 'member-1', displayName: 'Member One', email: 'member@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Capstone', summary: 'Build showcase' }, 'owner-1');
        expect(project?.name).toBe('Capstone');

        const task = store.createSocialProjectTask(project.id, { title: 'Draft proposal' }, 'owner-1');
        expect(task?.title).toBe('Draft proposal');

        const invited = store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        expect(invited?.project?.id).toBe(project.id);
    });

    it('lets group members create tasks even without an explicit memberRolesByUser entry', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['member-1'] = { id: 'member-1', displayName: 'Member One', email: 'member@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Capstone', summary: 'Build showcase' }, 'owner-1');
        const group = store.getSocialGroupRecord(project.groupId);
        group.memberIds.push('member-1');
        group.joinedAtByUser = { ...(group.joinedAtByUser || {}), 'member-1': new Date().toISOString() };

        expect(store.getSocialProjectMemberRole(store.getSocialProjectRecord(project.id), 'member-1')).toBe('member');
        const task = store.createSocialProjectTask(project.id, { title: 'Student task' }, 'member-1');
        expect(task?.title).toBe('Student task');
    });

    it('lets student service view unpublished projects without granting student access', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['svc-1'] = { id: 'svc-1', displayName: 'Service One', email: 'svc@example.com', role: 'student_service', facultyCode: 'ECON' };
        store.state.accounts['student-2'] = { id: 'student-2', displayName: 'Student Two', email: 'student2@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Capstone', summary: 'Build showcase' }, 'owner-1');
        expect(project?.status).toBe('draft');
        expect(store.canViewSocialProject(store.getSocialProjectRecord(project.id), 'svc-1')).toBe(true);
        expect(store.canViewSocialProject(store.getSocialProjectRecord(project.id), 'student-2')).toBe(false);
    });

    it('normalizes portfolio external links without throwing', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };

        const portfolio = store.createSocialProject({
            title: 'My Portfolio',
            summary: 'Capstone work',
            externalLinks: [{ label: 'GitHub', url: 'https://github.com/example' }],
            mediaItems: [{ name: 'demo.pdf', storageKey: 'files/demo.pdf', type: 'application/pdf' }]
        }, 'owner-1');

        expect(portfolio?.externalLinks).toEqual([{ label: 'GitHub', url: 'https://github.com/example' }]);
        expect(portfolio?.mediaItems?.[0]?.storageKey).toBe('files/demo.pdf');
    });
});
