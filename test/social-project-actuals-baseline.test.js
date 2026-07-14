import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccount(store, id, role = 'student') {
    store.state.accounts[id] = {
        id,
        displayName: id,
        email: `${id}@example.com`,
        role,
        facultyCode: 'ECON'
    };
}

describe('social project actuals + baseline', () => {
    function seedProject(store) {
        seedAccount(store, 'owner-1');
        seedAccount(store, 'member-1');
        const project = store.createSocialProject({ title: 'Capstone' }, 'owner-1');
        store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        store.updateSocialProject(project.id, { scheduleStartAt: '2026-07-01T09:00:00.000Z' }, 'owner-1');
        return project;
    }

    it('persists task actuals on create and update', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);

        const created = store.createSocialProjectTask(project.id, {
            title: 'Build prototype',
            timeEstimate: 3,
            budgetEstimate: 50,
            actualTime: 5,
            actualCost: 70
        }, 'owner-1');
        expect(created.actualTime).toBe(5);
        expect(created.actualCost).toBe(70);

        const updated = store.updateSocialProjectTask(project.id, created.id, {
            actualTime: 4,
            actualCost: 55
        }, 'owner-1');
        expect(updated.actualTime).toBe(4);
        expect(updated.actualCost).toBe(55);

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        const task = decorated.tasks.find((entry) => entry.id === created.id);
        expect(task.actualTime).toBe(4);
        expect(task.actualCost).toBe(55);
    });

    it('captures baseline snapshot and exposes it on decorate', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const a = store.createSocialProjectTask(project.id, { title: 'Research', timeEstimate: 4 }, 'owner-1');
        const b = store.createSocialProjectTask(project.id, { title: 'Build', timeEstimate: 6, dependsOnTaskIds: [a.id] }, 'owner-1');
        expect(b.dependsOnTaskIds).toContain(a.id);

        const baseline = store.setSocialProjectBaseline(project.id, 'owner-1');
        expect(baseline).toBeTruthy();
        expect(text(baseline.baselineAt)).not.toBe('');
        expect(baseline.baselineSnapshot?.projectEndHours).toBe(10);
        expect(baseline.baselineSnapshot?.scheduleStartAt).toBe('2026-07-01T09:00:00.000Z');
        expect(baseline.baselineSnapshot?.tasks).toHaveLength(2);
        const snap = baseline.baselineSnapshot.tasks.find((row) => row.id === b.id);
        expect(snap.timeOptimistic).toBe(0);
        expect(snap.timeMostLikely).toBe(6);
        expect(snap.timePessimistic).toBe(0);

        store.updateSocialProjectTask(project.id, b.id, { timeEstimate: 10 }, 'owner-1');
        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        expect(decorated.baselineSnapshot?.projectEndHours).toBe(10);
        expect(decorated.baselineAt).toBe(baseline.baselineAt);
    });

    it('includes package schedule edges in baseline end hours', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const member = store.createSocialProjectTask(project.id, { title: 'Inside pkg', timeEstimate: 4 }, 'owner-1');
        const blocked = store.createSocialProjectTask(project.id, { title: 'After pkg', timeEstimate: 6 }, 'owner-1');
        store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: [{
                id: 'grp_phase',
                name: 'Phase',
                x: 0,
                y: 0,
                memberTaskIds: [member.id],
                blocksIds: [blocked.id],
                dependsOnIds: []
            }]
        }, 'owner-1');

        // Without package edges these would run in parallel (max 6). With members→pkg→blocks: 4+6=10.
        const baseline = store.setSocialProjectBaseline(project.id, 'owner-1');
        expect(baseline.baselineSnapshot?.projectEndHours).toBe(10);
    });

    it('excludes done task duration from remaining schedule end hours', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const a = store.createSocialProjectTask(project.id, { title: 'Research', timeEstimate: 4 }, 'owner-1');
        store.createSocialProjectTask(project.id, { title: 'Build', timeEstimate: 6, dependsOnTaskIds: [a.id] }, 'owner-1');
        store.updateSocialProjectTask(project.id, a.id, { status: 'done' }, 'owner-1');
        const baseline = store.setSocialProjectBaseline(project.id, 'owner-1');
        // A done → 0h remaining; B still 6h after A (0) → end 6.
        expect(baseline.baselineSnapshot?.projectEndHours).toBe(6);
    });

    it('keeps blocked task duration on the remaining schedule', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const a = store.createSocialProjectTask(project.id, { title: 'Research', timeEstimate: 4 }, 'owner-1');
        store.createSocialProjectTask(project.id, { title: 'Build', timeEstimate: 6, dependsOnTaskIds: [a.id] }, 'owner-1');
        store.updateSocialProjectTask(project.id, a.id, { status: 'blocked' }, 'owner-1');
        const baseline = store.setSocialProjectBaseline(project.id, 'owner-1');
        expect(baseline.baselineSnapshot?.projectEndHours).toBe(10);
    });

    it('blocks non-managers from setting baseline', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        store.createSocialProjectTask(project.id, { title: 'Draft' }, 'member-1');
        const blocked = store.setSocialProjectBaseline(project.id, 'member-1');
        expect(blocked).toBeNull();
    });

    it('exposes dedicated baseline route and runtime client', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(routes).toContain("app.post('/api/social/projects/:id/baseline'");
        expect(runtime).toContain('/baseline');
        expect(runtime).toContain('setPortalSocialProjectBaseline');
    });
});

function text(value) {
    return String(value == null ? '' : value).trim();
}
