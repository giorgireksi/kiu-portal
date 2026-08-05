import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
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

describe('social project task graph sync', () => {
    function seedProject(store) {
        seedAccount(store, 'owner-1');
        seedAccount(store, 'member-1');
        seedAccount(store, 'advisor-1', 'professor');
        const project = store.createSocialProject({ title: 'Capstone' }, 'owner-1');
        store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        store.updateSocialProject(project.id, { advisorUserId: 'advisor-1' }, 'owner-1');
        const task = store.createSocialProjectTask(project.id, { title: 'Draft' }, 'owner-1');
        return { project, task };
    }

    it('persists task graph positions and exposes them on decorate', () => {
        const store = new PlatformStore({});
        const { project, task } = seedProject(store);
        const updated = store.updateSocialProjectTaskGraph(project.id, {
            taskGraphPositions: { [task.id]: { x: 100, y: 200 } }
        }, 'owner-1');
        expect(updated?.taskGraphPositions?.[task.id]).toEqual({ x: 100, y: 200 });
        expect(text(updated?.taskGraphUpdatedAt || '')).not.toBe('');

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        expect(decorated.taskGraphPositions[task.id]).toEqual({ x: 100, y: 200 });
    });

    it('lets members update graph state but blocks advisors without contribute role', () => {
        const store = new PlatformStore({});
        const { project, task } = seedProject(store);

        const memberUpdate = store.updateSocialProjectTaskGraph(project.id, {
            taskGraphPositions: { [task.id]: { x: 50, y: 60 } }
        }, 'member-1');
        expect(memberUpdate?.taskGraphPositions?.[task.id]).toEqual({ x: 50, y: 60 });

        const blocked = store.updateSocialProjectTaskGraph(project.id, {
            taskGraphPositions: { [task.id]: { x: 1, y: 2 } }
        }, 'advisor-1');
        expect(blocked).toBeNull();
    });

    it('round-trips groups and view', () => {
        const store = new PlatformStore({});
        const { project } = seedProject(store);
        const groups = [{ id: 'grp_a', name: 'Phase 1', x: 10, y: 20, memberTaskIds: [] }];
        const view = { zoom: 0.8, pan: { x: -40, y: 12 } };
        const updated = store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: groups,
            taskGraphView: view
        }, 'owner-1');
        expect(updated.taskGraphGroups).toHaveLength(1);
        expect(updated.taskGraphGroups[0].name).toBe('Phase 1');
        expect(updated.taskGraphView.zoom).toBe(0.8);
        expect(updated.taskGraphView.pan).toEqual({ x: -40, y: 12 });
    });

    it('preserves package order-link fields on groups', () => {
        const store = new PlatformStore({});
        const { project, task } = seedProject(store);
        const other = store.createSocialProjectTask(project.id, { title: 'Follow-up' }, 'owner-1');
        const groups = [{
            id: 'grp_phase',
            name: 'Phase 1',
            x: 10,
            y: 20,
            memberTaskIds: [task.id],
            blocksIds: [other.id, 'grp_next'],
            dependsOnIds: ['grp_prev'],
            assigneeUserId: 'member-1',
            description: 'Ship the MVP slice'
        }];
        const updated = store.updateSocialProjectTaskGraph(project.id, { taskGraphGroups: groups }, 'owner-1');
        const group = updated.taskGraphGroups[0];
        expect(group.memberTaskIds).toEqual([task.id]);
        expect(group.blocksIds).toEqual([other.id, 'grp_next']);
        expect(group.dependsOnIds).toEqual(['grp_prev']);
        expect(group.assigneeUserId).toBe('member-1');
        expect(group.description).toBe('Ship the MVP slice');

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        expect(decorated.taskGraphGroups[0].blocksIds).toContain('grp_next');
        expect(decorated.taskGraphGroups[0].dependsOnIds).toContain('grp_prev');
    });

    it('scrubs deleted task ids from group membership and order links', () => {
        const store = new PlatformStore({});
        const { project, task } = seedProject(store);
        const other = store.createSocialProjectTask(project.id, { title: 'Other' }, 'owner-1');
        store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: [{
                id: 'grp_a',
                name: 'Pkg',
                x: 0,
                y: 0,
                memberTaskIds: [task.id, other.id],
                blocksIds: [task.id],
                dependsOnIds: [task.id]
            }]
        }, 'owner-1');

        const deleted = store.deleteSocialProjectTask(project.id, task.id, 'owner-1');
        expect(deleted?.ok).toBe(true);

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        const group = decorated.taskGraphGroups[0];
        expect(group.memberTaskIds).toEqual([other.id]);
        expect(group.blocksIds).toEqual([]);
        expect(group.dependsOnIds).toEqual([]);
    });

    it('scrubs removed package ids from sibling order links on graph update', () => {
        const store = new PlatformStore({});
        const { project, task } = seedProject(store);
        store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: [
                { id: 'grp_a', name: 'A', x: 0, y: 0, memberTaskIds: [task.id], blocksIds: [], dependsOnIds: [] },
                { id: 'grp_b', name: 'B', x: 1, y: 1, memberTaskIds: [], blocksIds: ['grp_a'], dependsOnIds: ['grp_a'] }
            ]
        }, 'owner-1');

        const updated = store.updateSocialProjectTaskGraph(project.id, {
            taskGraphGroups: [
                { id: 'grp_b', name: 'B', x: 1, y: 1, memberTaskIds: [], blocksIds: ['grp_a'], dependsOnIds: ['grp_a'] }
            ]
        }, 'owner-1');

        expect(updated.taskGraphGroups).toHaveLength(1);
        expect(updated.taskGraphGroups[0].blocksIds).toEqual([]);
        expect(updated.taskGraphGroups[0].dependsOnIds).toEqual([]);
    });

    it('exposes dedicated task-graph route and runtime client', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        const runtime = readSource('assets/js/shared/social-lite-content-runtime.js');
        const page = readSource('assets/js/pages/social-page.js')
            + readSource('assets/js/pages/social-workspace-stubs.js');
        expect(routes).toContain("app.post('/api/social/projects/:id/task-graph'");
        expect(runtime).toContain('/task-graph');
        expect(readSource('assets/js/shared/social-runtime-lite.js')).toContain('updatePortalSocialProjectTaskGraph');
        expect(page).toContain("'queueProjectTaskGraphSync'");
        expect(page).toContain('createSocialWorkspaceStub');
        expect(page).toMatch(/setProjectTaskGraphPositions[\s\S]*?queueProjectTaskGraphSync/);
    });
});

function text(value) {
    return String(value == null ? '' : value).trim();
}
