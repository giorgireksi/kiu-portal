import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
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
            'createSocialProjectCheckin',
            'createSocialProjectDeliverable',
            'createSocialProjectMilestone',
            'createSocialProjectShowcasePage',
            'createSocialProjectTask',
            'decorateSocialProject',
            'deleteSocialProject',
            'deleteSocialProjectDeliverable',
            'deleteSocialProjectMilestone',
            'deleteSocialProjectTask',
            'getSocialProjectAdvisorIds',
            'getSocialProjectByChatId',
            'getSocialProjectByGroupId',
            'getSocialProjectMemberIds',
            'getSocialProjectMemberRole',
            'getSocialProjectRecord',
            'inviteSocialProjectMember',
            'removeSocialProjectMember',
            'setSocialProjectMembership',
            'updateSocialProject',
            'updateSocialProjectMemberRole',
            'updateSocialProjectMilestone',
            'updateSocialProjectTask'
        ]);
        expect(source).toContain("} = require('./domains/social-projects-service');");
        expect(source).toContain('return createSocialProject.call(this, payload, actorId);');
        expect(source).toContain('return createSocialProjectTask.call(this, projectId, payload, actorId);');
        expect(source).toContain('return createSocialProjectShowcasePage.call(this, projectId, actorId);');
    });

    it('preserves social project workspace behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['member-1'] = { id: 'member-1', displayName: 'Member One', email: 'member@example.com', role: 'student', facultyCode: 'ECON' };

        const project = store.createSocialProject({ title: 'Capstone', summary: 'Build showcase' }, 'owner-1');
        expect(project?.name).toBe('Capstone');

        const task = store.createSocialProjectTask(project.id, { title: 'Draft proposal' }, 'owner-1');
        expect(task?.title).toBe('Draft proposal');

        const milestone = store.createSocialProjectMilestone(project.id, { title: 'Review checkpoint' }, 'owner-1');
        expect(milestone?.title).toBe('Review checkpoint');

        const deliverable = store.createSocialProjectDeliverable(project.id, { title: 'Submission Pack' }, 'owner-1');
        expect(deliverable?.title).toBe('Submission Pack');

        const checkin = store.createSocialProjectCheckin(project.id, { whatDone: 'Initial draft' }, 'owner-1');
        expect(checkin?.whatDone).toBe('Initial draft');

        const invited = store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        expect(invited?.project?.id).toBe(project.id);
    });
});
