import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    socialTaskModelApi,
    installSocialTaskModel
} from '../assets/js/pages/social-task-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const {
    computeTaskMatrixScore,
    computeTaskMatrixBucket,
    normalizeTaskTime,
    normalizeTaskTimeUnit,
    normalizeProjectTaskStatusId,
    parseProjectTaskPriorityPayload,
    buildProjectTaskFlowEdges
} = socialTaskModelApi;

describe('social-task-model', () => {
    beforeEach(() => {
        // Reset install guard so each test gets a clean window surface.
        delete window.__KIU_SOCIAL_TASK_MODEL_LOADED;
        delete window.KiuSocialTaskModel;
        installSocialTaskModel(window);
    });

    it('exports matrix and time helpers', () => {
        expect(window.__KIU_SOCIAL_TASK_MODEL_LOADED).toBe(true);
        expect(window.KiuSocialTaskModel).toBe(socialTaskModelApi);
        expect(computeTaskMatrixScore(5, 1)).toBe(25);
        expect(window.computeTaskMatrixScore(5, 1)).toBe(25);
        expect(computeTaskMatrixBucket(25)).toBe('urgent');
        expect(computeTaskMatrixBucket(10)).toBe('medium');
        expect(normalizeTaskTime(3.26)).toBe(3.3);
        expect(normalizeTaskTimeUnit('d')).toBe('d');
        expect(normalizeProjectTaskStatusId('backlog')).toBe('todo');
    });

    it('parses priority payload with PERT expected estimate', () => {
        const payload = parseProjectTaskPriorityPayload({
            projectTaskImpactScore: { value: '4' },
            projectTaskEffortScore: { value: '2' },
            projectTaskTimeOptimistic: { value: '2' },
            projectTaskTimeMostLikely: { value: '4' },
            projectTaskTimePessimistic: { value: '8' },
            projectTaskTimeUnit: { value: 'h' }
        });
        expect(payload.timeEstimate).toBe(4.3);
        expect(payload.priority).toBe('high');
        expect(payload.priorityModel).toBe('matrix');
    });

    it('builds flow edges between consecutive status-ordered tasks', () => {
        const edges = buildProjectTaskFlowEdges([
            { id: 'a', status: 'todo', title: 'A', priority: 'low' },
            { id: 'b', status: 'todo', title: 'B', priority: 'low' }
        ], new Set());
        expect(edges.some((e) => e.from === 'a' && e.to === 'b' && e.kind === 'flow')).toBe(true);
    });

    it('ESM leaf loads with the workspace batch instead of Social feed boot', () => {
        const html = readSource('social.html');
        const page = readSource('assets/js/pages/social-page.js');
        const mod = readSource('assets/js/pages/social-task-model.js');
        const bridge = readSource('assets/js/pages/social-task-model-bridge.js');
        expect(mod).toContain('export function installSocialTaskModel');
        expect(mod).not.toMatch(/^\(function\s+initSocialTaskModel/m);
        expect(bridge).toContain('KiuSocialTaskModel');
        expect(html).not.toMatch(/<script[^>]+social-task-model\.js/);
        expect(html).not.toContain('social-task-model-bridge.js');
        expect(page).toContain('SOCIAL_TASK_MODEL_URL');
        expect(page).toMatch(/loadSocialDynamicModule\(SOCIAL_TASK_MODEL_URL/);
        expect(page).toContain('KiuSocialTaskModel');
        expect(page).toContain('resolveSocialTaskModelFunction');
    });
});
