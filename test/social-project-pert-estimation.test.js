import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccount(store, id) {
    store.state.accounts[id] = {
        id,
        displayName: id,
        email: `${id}@example.com`,
        role: 'student',
        facultyCode: 'ECON'
    };
}

describe('social project PERT estimation', () => {
    function seedProject(store) {
        seedAccount(store, 'owner-1');
        const project = store.createSocialProject({ title: 'PERT lab' }, 'owner-1');
        store.updateSocialProject(project.id, { scheduleStartAt: '2026-07-01T09:00:00.000Z' }, 'owner-1');
        return project;
    }

    it('derives timeEstimate from valid O/M/P on create and update', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);

        const created = store.createSocialProjectTask(project.id, {
            title: 'Design',
            timeOptimistic: 2,
            timeMostLikely: 4,
            timePessimistic: 8,
            timeUnit: 'h'
        }, 'owner-1');

        expect(created.timeEstimate).toBe(4.3);

        const updated = store.updateSocialProjectTask(project.id, created.id, {
            timeOptimistic: 1,
            timeMostLikely: 2,
            timePessimistic: 5
        }, 'owner-1');

        expect(updated.timeEstimate).toBe(2.3);
    });

    it('uses CPM duration from derived PERT expected hours', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const a = store.createSocialProjectTask(project.id, {
            title: 'A',
            timeOptimistic: 2,
            timeMostLikely: 4,
            timePessimistic: 8
        }, 'owner-1');
        const b = store.createSocialProjectTask(project.id, {
            title: 'B',
            timeOptimistic: 1,
            timeMostLikely: 2,
            timePessimistic: 3,
            dependsOnTaskIds: [a.id]
        }, 'owner-1');

        expect(a.timeEstimate).toBe(4.3);
        expect(b.timeEstimate).toBe(2);
        const baseline = store.setSocialProjectBaseline(project.id, 'owner-1');
        expect(baseline.baselineSnapshot?.projectEndHours).toBe(6.3);
    });

    it('exposes PERT helpers and fields in the client stack', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const service = readSource('backend/platform/domains/social-projects-service.js');

        expect(page).toContain("createSocialWorkspaceStub('computePertExpected'");
        expect((page + readSource('assets/js/pages/social-workspace.js'))).toContain('name="projectTaskTimeOptimistic"');
        expect(page).not.toContain('name="projectTaskRiskTimeImpact"');
        expect(page).not.toContain('function taskHasQuantifiedRisk(');
        expect(runtime).toMatch(/createProjectTask[\s\S]*?timeOptimistic:/);
        expect(runtime).not.toMatch(/createProjectTask[\s\S]*?riskTimeImpact:/);
        expect(service).toContain('function computeTaskPertExpected(');
        expect(service).toContain('function syncTaskTimeEstimateFromPert(');
    });
});
