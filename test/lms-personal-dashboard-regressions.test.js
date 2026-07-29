import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS personal dashboard regressions', () => {
    

    

    it('allows personal board writes without class session on backend', () => {
        const service = require('../backend/platform/domains/lms-whiteboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const account = { id: 'stu-1', userId: 'stu-1' };

        expect(service.isLmsPersonalBoardKey(personalKey)).toBe(true);
        expect(service.getLmsPersonalBoardOwnerId(personalKey)).toBe('stu-1');
        expect(service.assertLmsPersonalBoardAccess(personalKey, account).ok).toBe(true);
        expect(service.assertLmsPersonalBoardAccess(personalKey, { id: 'other' }).ok).toBe(false);

        const merged = service.mergeStudentWhiteboardWorkspace(
            { resourceKey: personalKey, sessionActive: false, elements: [] },
            { resourceKey: personalKey, elements: [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [1, 1]], color: '#fff', width: 2 }] },
            account
        );
        expect(merged.workspace?.elements?.length).toBe(1);
    });

    it('supports snapshot save and restore for personal dashboards', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const account = { id: 'stu-1', userId: 'stu-1' };
        const existing = {
            resourceKey: personalKey,
            elements: [{ id: 'rect-1', type: 'rect', x: 1, y: 2, w: 40, h: 40, color: '#fff' }],
            snapshots: []
        };

        const saved = dashboard.savePersonalDashboardSnapshot(existing, { label: 'Draft A' }, account);
        expect(saved.workspace.snapshots).toHaveLength(1);
        const snapshotId = saved.workspace.snapshots[0].id;

        const restored = dashboard.restorePersonalDashboardSnapshot(saved.workspace, snapshotId, account);
        expect(restored.workspace.elements).toHaveLength(1);
        expect(restored.workspace.activeSnapshotId).toBe(snapshotId);
    });

    it('aggregates course-wide personal dashboard history and cross-scope restore', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const account = { id: 'stu-1', userId: 'stu-1' };
        const lectureKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const workshopKey = 'ECON-01-001::g2__lmssec_workshop__personal__stu-1';
        const stroke = [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [4, 4]], color: '#fff', width: 2 }];

        const lectureSaved = dashboard.savePersonalDashboardSnapshot(
            { resourceKey: lectureKey, elements: stroke, snapshots: [] },
            { label: 'Lecture draft' },
            account
        );
        const workshopSaved = dashboard.savePersonalDashboardSnapshot(
            { resourceKey: workshopKey, elements: stroke, snapshots: [] },
            { autosave: true },
            account
        );

        const listed = dashboard.listPersonalDashboardHistory({
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [lectureKey]: lectureSaved.workspace,
                        [workshopKey]: workshopSaved.workspace
                    }
                }
            }
        }, 'ECON-01-001', 'stu-1');

        expect(listed.ok).toBe(true);
        expect(listed.items).toHaveLength(2);
        expect(listed.items.some(item => item.groupId === 'g1' && item.sectionType === 'lecture')).toBe(true);
        expect(listed.items.some(item => item.groupId === 'g2' && item.isAutosave)).toBe(true);

        const autosaveId = workshopSaved.snapshot.id;
        const restored = dashboard.restorePersonalDashboardSnapshot(
            { resourceKey: lectureKey, elements: [], snapshots: [] },
            autosaveId,
            account,
            {
                sourceResourceKey: workshopKey,
                targetResourceKey: lectureKey,
                sourceWorkspace: workshopSaved.workspace
            }
        );
        expect(restored.targetResourceKey).toBe(lectureKey);
        expect(restored.workspace.elements).toHaveLength(1);
    });

    it('scopes student history to current group and section only', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const account = { id: 'stu-1', userId: 'stu-1' };
        const lectureKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const workshopKey = 'ECON-01-001::g2__lmssec_workshop__personal__stu-1';
        const stroke = [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [4, 4]], color: '#fff', width: 2 }];
        const store = {
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [lectureKey]: dashboard.savePersonalDashboardSnapshot(
                            { resourceKey: lectureKey, elements: stroke, snapshots: [] },
                            { label: 'Lecture draft' },
                            account
                        ).workspace,
                        [workshopKey]: dashboard.savePersonalDashboardSnapshot(
                            { resourceKey: workshopKey, elements: stroke, snapshots: [] },
                            { label: 'Workshop draft' },
                            account
                        ).workspace
                    }
                }
            }
        };

        const scoped = dashboard.listPersonalDashboardHistory(
            store,
            'ECON-01-001',
            'stu-1',
            { groupId: 'g1', sectionType: 'lecture' }
        );
        expect(scoped.ok).toBe(true);
        expect(scoped.items).toHaveLength(1);
        expect(scoped.items[0].groupId).toBe('g1');
        expect(scoped.items[0].sectionType).toBe('lecture');
    });

    it('exposes unified history API and autosave hooks on the frontend', () => {
        const api = readSource('assets/js/app/api.js');
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');
        const workspaceRuntime = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const lms = readSource('assets/js/pages/lms.js');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        const routes = readSource('backend/platform/routes/lms-personal-dashboard-routes.js');

        expect(api).toContain('fetchLmsPersonalDashboardHistory');
        expect(api).toMatch(/fetchLmsPersonalDashboardHistory[\s\S]*groupId/);
        expect(api).toMatch(/restoreLmsPersonalDashboardSnapshot[\s\S]*sourceResourceKey/);
        expect(runtime).toContain('loadLmsPersonalDashboardHistory');
        expect(runtime).toContain('getLmsPersonalDashboardHistoryScopeOptions');
        expect(runtime).toMatch(/isLmsPersonalDashboardStudentViewer[\s\S]*groupId/);
        expect(runtime).toContain('resolveLmsPersonalDashboardCourseId');
        expect(runtime).not.toMatch(/function getLmsPersonalDashboardCourseId\s*\(/);
        expect(runtime).toMatch(/handleLmsPersonalDashboardSectionSwitch[\s\S]*flushLmsPersonalDashboardAutosave/);
        expect(runtime).toContain('scheduleLmsPersonalDashboardAutosave');
        expect(runtime).toContain('flushLmsPersonalDashboardAutosave');
        expect(runtime).toMatch(/flushLmsPersonalDashboardAutosave[\s\S]*flushLmsWhiteboardSync/);
        expect(runtime).toContain('handleLmsPersonalDashboardPageHide');
        expect(runtime).toContain('set-workspace-share');
        expect(runtime).toContain('open-share-panel');
        expect(runtime).toContain('set-group-share');
        expect(runtime).toContain('Save named copy');
        expect(runtime).toContain('data-lms-personal-dashboard-resource-key');
        expect(runtime).toContain('is-autosave');
        expect(workspaceRuntime).toContain('scheduleLmsPersonalDashboardAutosave');
        expect(workspaceRuntime).toMatch(/runImmediateLmsWhiteboardOpsSync[\s\S]*scheduleLmsPersonalDashboardAutosave/);
        expect(lms).toMatch(/getLmsPersonalDashboardCourseId[\s\S]*getLmsSubjectIdFromResourceKey/);
        expect(classroom).toMatch(/openLMSCourse[\s\S]*handleLmsPersonalDashboardSectionSwitch/);
        expect(routes).not.toContain('::g1');
        expect(routes).toContain('groupId');
        expect(routes).toContain('sectionType');
        const css = readSource('assets/css/lux-page-bare-lite.css');
        expect(css).toContain('.lms-personal-dashboard-history-badge');
        expect(css).toContain('.lms-personal-dashboard-history-item.is-autosave');
        expect(css).toMatch(/lms-personal-dashboard-overlay\[hidden\][\s\S]*display:\s*none\s*!important/);
    });

    it('overlay uses shared modal shell, portal paint, and typography', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(modals).toContain('.lms-glass-dialog-overlay');
        expect(fouc).toContain('#lms-personal-dashboard-overlay .lms-personal-dashboard-card');
        expect(fouc).toContain('var(--lux-panel-fill)');
        expect(fouc).toContain('#lms-personal-dashboard-overlay .lms-personal-dashboard-share-panel.lux-soft-chrome');
        expect(bare).toContain('.lms-personal-dashboard-layout.is-student-layout');
        expect(bare).not.toMatch(/#lms-personal-dashboard-overlay\s*\{[^}]*background:/);
        expect(bare).not.toMatch(/\.lms-personal-dashboard-card\s*\{[^}]*background:/);
        expect(primitives).toContain('#lms-personal-dashboard-overlay #lms-personal-dashboard-share-title.lux-page-title');
        expect(runtime).toContain('lux-section-kicker');
        expect(runtime).toContain('lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('lux-empty-state');
        expect(runtime).toContain('renderLmsGlassDialogCard');
        expect(runtime).toContain('openLuxGlassDialogOverlay');
        expect(runtime).toContain('lux-panel-copy lms-personal-dashboard-share-callout');
        expect(classroom).toContain('assets/js/pages/lms-personal-dashboard-runtime.js?v=20260729-lmspdshare1');
    });
});