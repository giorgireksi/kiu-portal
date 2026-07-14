import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function seedAccount(store, id, role = 'student') {
    store.state.accounts[id] = {
        id,
        displayName: id,
        email: `${id}@example.com`,
        role,
        facultyCode: 'ECON'
    };
}

describe('social project risks service', () => {
    function seedProject(store) {
        seedAccount(store, 'owner-1');
        seedAccount(store, 'member-1');
        const project = store.createSocialProject({ title: 'Capstone' }, 'owner-1');
        store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: [{ id: 'grp-1', name: 'Build', memberTaskIds: [] }]
        }, 'owner-1');
        return project;
    }

    it('creates, updates, and deletes project risks', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);

        const risk = store.createSocialProjectRisk(project.id, {
            title: 'Vendor delay',
            groupId: 'grp-1',
            likelihood: 5,
            impact: 3,
            status: 'open',
            response: 'mitigate',
            mitigation: 'Order early'
        }, 'member-1');
        expect(risk.title).toBe('Vendor delay');
        expect(risk.groupId).toBe('grp-1');
        expect(risk.likelihood).toBe(5);
        expect(risk.impact).toBe(3);

        const updated = store.updateSocialProjectRisk(project.id, risk.id, {
            status: 'watching',
            likelihood: 1
        }, 'owner-1');
        expect(updated.status).toBe('watching');
        expect(updated.likelihood).toBe(1);

        const deleted = store.deleteSocialProjectRisk(project.id, risk.id, 'owner-1');
        expect(deleted).toEqual({ ok: true, riskId: risk.id });
    });

    it('rejects invalid graph group ids', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const risk = store.createSocialProjectRisk(project.id, {
            title: 'Scope creep',
            groupId: 'missing-group'
        }, 'owner-1');
        expect(risk.groupId).toBe('');
    });

    it('validates linked task ids against project tasks', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const task = store.createSocialProjectTask(project.id, { title: 'Prototype' }, 'owner-1');
        const risk = store.createSocialProjectRisk(project.id, {
            title: 'Integration risk',
            linkedTaskIds: [task.id, 'bogus-task']
        }, 'owner-1');
        expect(risk.linkedTaskIds).toEqual([task.id]);
    });

    it('computes risk rollups in decorateSocialProject', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        store.createSocialProjectRisk(project.id, { title: 'Global', groupId: '' }, 'owner-1');
        store.createSocialProjectRisk(project.id, { title: 'Build risk', groupId: 'grp-1' }, 'owner-1');

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        expect(decorated.riskCount).toBe(2);
        expect(decorated.risks.length).toBe(2);
        expect(decorated.riskCountByGroupId['']).toBe(1);
        expect(decorated.riskCountByGroupId['grp-1']).toBe(1);
    });

    it('normalizes legacy low/medium/high and clamps 1–5 scale', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);

        const legacy = store.createSocialProjectRisk(project.id, {
            title: 'Legacy',
            likelihood: 'high',
            impact: 'low'
        }, 'owner-1');
        expect(legacy.likelihood).toBe(5);
        expect(legacy.impact).toBe(1);

        const mid = store.createSocialProjectRisk(project.id, {
            title: 'Default mid',
            likelihood: 'medium',
            impact: 99
        }, 'owner-1');
        expect(mid.likelihood).toBe(3);
        expect(mid.impact).toBe(3);

        const scored = store.createSocialProjectRisk(project.id, {
            title: 'Hot',
            likelihood: 5,
            impact: 5
        }, 'owner-1');
        expect(scored.likelihood * scored.impact).toBe(25);
    });

    it('cascade-deletes risks when the project is deleted', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        store.createSocialProjectRisk(project.id, { title: 'Retired risk' }, 'owner-1');

        store.deleteSocialProject(project.id, 'owner-1');

        expect(store.state.social.projectRisks.filter((entry) => entry.projectId === project.id)).toEqual([]);
    });
});
