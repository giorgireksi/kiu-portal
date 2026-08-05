import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadScheduleModel(hooks = {}) {
    const sandbox = {
        window: {
            __kiuSocialWorkspaceHooks: hooks
        }
    };
    sandbox.window.window = sandbox.window;
    sandbox.globalThis = sandbox;
    const source = readFileSync(
        join(process.cwd(), 'assets/js/pages/social-workspace-schedule-model.js'),
        'utf8'
    );
    vm.runInNewContext(source, sandbox);
    return sandbox.window;
}

describe('social-workspace-schedule-model', () => {
    let win;

    beforeEach(() => {
        win = loadScheduleModel({
            text: (value) => String(value == null ? '' : value).trim(),
            normalizeTaskTime: (value) => {
                const n = Number(value);
                return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
            },
            normalizeTaskTimeUnit: (value) => (String(value || '').toLowerCase() === 'd' ? 'd' : 'h'),
            normalizeProjectTaskStatusId: (status) => {
                const raw = String(status || 'todo').trim().toLowerCase();
                if (raw === 'backlog') return 'todo';
                if (raw === 'in_progress' || raw === 'in progress') return 'in-progress';
                return raw || 'todo';
            }
        });
    });

    it('loads once and exports namespace + window helpers', () => {
        expect(win.__KIU_SOCIAL_WORKSPACE_SCHEDULE_MODEL_LOADED).toBe(true);
        expect(win.KiuSocialWorkspaceScheduleModel).toBeTruthy();
        const model = win.KiuSocialWorkspaceScheduleModel;
        expect(typeof model.computePertExpected).toBe('function');
        expect(typeof model.formatProjectScheduleHours).toBe('function');
        const again = loadScheduleModel();
        // second load in fresh context still sets flag; same context would no-op
        expect(again.KiuSocialWorkspaceScheduleModel).toBeTruthy();
    });

    it('computes PERT expected hours (O+4M+P)/6', () => {
        expect(win.KiuSocialWorkspaceScheduleModel.computePertExpected(2, 4, 8)).toBe(4.3);
        expect(win.KiuSocialWorkspaceScheduleModel.computePertExpected(1, 2, 5)).toBe(2.3);
        expect(win.KiuSocialWorkspaceScheduleModel.taskHasPert({ timeOptimistic: 2, timeMostLikely: 4, timePessimistic: 8 })).toBe(true);
        expect(win.KiuSocialWorkspaceScheduleModel.taskHasPert({ timeOptimistic: 0, timeMostLikely: 4, timePessimistic: 8 })).toBe(false);
    });

    it('resolves duration from PERT and converts day units to hours', () => {
        const task = {
            timeOptimistic: 1,
            timeMostLikely: 2,
            timePessimistic: 3,
            timeUnit: 'd',
            status: 'todo'
        };
        expect(win.KiuSocialWorkspaceScheduleModel.resolveTaskScheduleEstimate(task).source).toBe('pert');
        expect(win.KiuSocialWorkspaceScheduleModel.taskDurationHours(task)).toBe(16); // 2d * 8h
        expect(win.KiuSocialWorkspaceScheduleModel.taskScheduleRemainingHours({ ...task, status: 'done' })).toBe(0);
    });

    it('formats schedule hours and float labels', () => {
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleHours(0)).toBe('0h');
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleHours(4)).toBe('4h');
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleHours(8)).toBe('1d');
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleFloat(4)).toBe('4h');
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleFloat(16)).toMatch(/16h/);
        expect(win.KiuSocialWorkspaceScheduleModel.formatProjectScheduleFloat(16)).toMatch(/2d/);
    });

    it('computes CPM project end hours from task estimates and dependsOn', () => {
        expect(typeof win.KiuSocialWorkspaceScheduleModel.computeProjectSchedule).toBe('function');
        const schedule = win.KiuSocialWorkspaceScheduleModel.computeProjectSchedule({
            id: 'p1',
            tasks: [
                { id: 'a', title: 'A', status: 'todo', timeEstimate: 4, timeUnit: 'h' },
                { id: 'b', title: 'B', status: 'todo', timeEstimate: 2, timeUnit: 'h', dependsOnTaskIds: ['a'] }
            ]
        }, { groups: [] });
        expect(schedule.projectEndHours).toBe(6);
        expect(schedule.byId.a.isCritical).toBe(true);
        expect(schedule.byId.b.isCritical).toBe(true);
        expect(schedule.criticalChain).toEqual(['a', 'b']);
    });

    it('is wired into social lazy load chain', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const scheduleModel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-schedule-model.js'), 'utf8');
        expect(page).toContain('social-workspace-schedule-model.js');
        expect(page).toContain('SOCIAL_WORKSPACE_SCHEDULE_MODEL_URL');
        expect(workspace).toContain('KiuSocialWorkspaceScheduleModel');
        expect(workspace).not.toMatch(/function computePertExpected\s*\(/);
        expect(workspace).not.toMatch(/function formatProjectScheduleHours\s*\(/);
        expect(workspace).not.toMatch(/function computeProjectSchedule\s*\(/);
        expect(scheduleModel).toMatch(/function computeProjectSchedule\s*\(/);
    });
});
