import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS personal dashboard staff share', () => {
    it('persists per-snapshot staffShare and rejects autosave sharing', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const account = { id: 'stu-1', userId: 'stu-1' };
        const saved = dashboard.savePersonalDashboardSnapshot(
            {
                resourceKey: personalKey,
                elements: [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [2, 2]], color: '#fff', width: 2 }],
                snapshots: []
            },
            { label: 'Draft A' },
            account
        );
        const snapshotId = saved.workspace.snapshots[0].id;

        const shared = dashboard.updatePersonalDashboardSnapshotShare(
            saved.workspace,
            snapshotId,
            { staffShare: 'view' },
            account
        );
        expect(shared.snapshot.staffShare).toBe('view');

        const autosave = dashboard.updatePersonalDashboardSnapshotShare(
            saved.workspace,
            'autosave',
            { staffShare: 'edit' },
            account
        );
        expect(autosave.status).toBe(400);
    });

    it('resolves staff share level from scoped snapshots', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const snapshots = [
            { id: 'a', staffShare: 'view', groupId: 'g1', sectionType: 'lecture', isAutosave: false },
            { id: 'b', staffShare: 'edit', groupId: 'g1', sectionType: 'lecture', isAutosave: false }
        ];
        expect(dashboard.resolvePersonalStaffShareLevel(snapshots, { groupId: 'g1', sectionType: 'lecture' })).toBe('edit');
        expect(dashboard.resolvePersonalStaffShareLevel(snapshots, { groupId: 'g2', sectionType: 'lecture' })).toBe('none');
    });

    it('allows staff read only when student shared and blocks writes without edit grant', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const student = { id: 'stu-1', userId: 'stu-1' };
        const staff = { id: 'ta-1', userId: 'ta-1' };
        const workspace = dashboard.ensurePersonalDashboardWorkspace({
            resourceKey: personalKey,
            snapshots: [{
                id: 'snap-1',
                label: 'Shared draft',
                staffShare: 'view',
                groupId: 'g1',
                sectionType: 'lecture',
                elements: [],
                savedAt: '2026-07-07T10:00:00.000Z'
            }]
        }, personalKey);

        const denied = dashboard.assertLmsPersonalBoardReadAccess(personalKey, staff, 'ta', { resourceKey: personalKey, snapshots: [] });
        expect(denied.ok).toBe(false);

        const allowed = dashboard.assertLmsPersonalBoardReadAccess(personalKey, staff, 'ta', workspace);
        expect(allowed.ok).toBe(true);
        expect(allowed.staffShareLevel).toBe('view');

        const writeDenied = dashboard.assertLmsPersonalBoardWriteAccess(personalKey, staff, 'ta', workspace);
        expect(writeDenied.ok).toBe(false);

        expect(dashboard.assertLmsPersonalBoardWriteAccess(personalKey, student, 'student', workspace).ok).toBe(true);
    });

    it('lists only shared snapshots for staff history queries', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const account = { id: 'stu-1', userId: 'stu-1' };
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const stroke = [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [4, 4]], color: '#fff', width: 2 }];
        const privateSaved = dashboard.savePersonalDashboardSnapshot(
            { resourceKey: personalKey, elements: stroke, snapshots: [] },
            { label: 'Private draft' },
            account
        );
        const sharedSaved = dashboard.updatePersonalDashboardSnapshotShare(
            privateSaved.workspace,
            privateSaved.snapshot.id,
            { staffShare: 'view' },
            account
        );
        const listed = dashboard.listPersonalDashboardSharedHistory({
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [personalKey]: sharedSaved.workspace
                    }
                }
            }
        }, 'ECON-01-001', 'stu-1');
        expect(listed.ok).toBe(true);
        expect(listed.items).toHaveLength(1);
        expect(listed.items[0].staffShare).toBe('view');
    });

    it('lists personal dashboard share status by scoped snapshots', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const account = { id: 'stu-1', userId: 'stu-1' };
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const stroke = [{ id: 'stroke-1', type: 'stroke', points: [[0, 0], [4, 4]], color: '#fff', width: 2 }];
        const privateSaved = dashboard.savePersonalDashboardSnapshot(
            { resourceKey: personalKey, elements: stroke, snapshots: [] },
            { label: 'Private draft' },
            account
        );
        const snapshotId = privateSaved.workspace.snapshots[0].id;
        const sharedSaved = dashboard.updatePersonalDashboardSnapshotShare(
            privateSaved.workspace,
            snapshotId,
            { staffShare: 'view' },
            account
        );
        const listed = dashboard.listPersonalDashboardShareStatus({
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [personalKey]: sharedSaved.workspace
                    }
                }
            }
        }, 'ECON-01-001', { groupId: 'g1', sectionType: 'lecture' });
        expect(listed.ok).toBe(true);
        expect(listed.items).toEqual([{ studentId: 'stu-1', staffShareLevel: 'view' }]);
    });

    it('grants staff read from workspace-level staffShare without named snapshots', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const staff = { id: 'ta-1', userId: 'ta-1' };
        const workspace = dashboard.ensurePersonalDashboardWorkspace({
            resourceKey: personalKey,
            staffShare: 'view',
            snapshots: []
        }, personalKey);
        const allowed = dashboard.assertLmsPersonalBoardReadAccess(personalKey, staff, 'ta', workspace);
        expect(allowed.ok).toBe(true);
        expect(allowed.staffShareLevel).toBe('view');
    });

    it('prefers strongest share level between workspace and named snapshots', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const workspace = {
            resourceKey: 'ECON-01-001::g1__lmssec_lecture__personal__stu-1',
            staffShare: 'view',
            snapshots: [{
                id: 'snap-1',
                label: 'Milestone',
                staffShare: 'edit',
                groupId: 'g1',
                sectionType: 'lecture',
                elements: [],
                savedAt: '2026-07-07T10:00:00.000Z'
            }]
        };
        expect(dashboard.getPersonalStaffShareLevel(workspace, { groupId: 'g1', sectionType: 'lecture' })).toBe('edit');
    });

    it('lists workspace share status without named snapshots', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-2';
        const listed = dashboard.listPersonalDashboardShareStatus({
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [personalKey]: dashboard.ensurePersonalDashboardWorkspace({
                            resourceKey: personalKey,
                            staffShare: 'edit',
                            snapshots: []
                        }, personalKey)
                    }
                }
            }
        }, 'ECON-01-001', { groupId: 'g1', sectionType: 'lecture' });
        expect(listed.ok).toBe(true);
        expect(listed.items).toEqual([{ studentId: 'stu-2', staffShareLevel: 'edit' }]);
    });

    it('resolves impersonated actor account for personal board owner access', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__admin-testing-econ-student';
        const persona = { id: 'admin-testing-econ-student', userId: 'admin-testing-econ-student' };
        const allowed = dashboard.assertLmsPersonalBoardReadAccess(personalKey, persona, 'student', { resourceKey: personalKey });
        expect(allowed.ok).toBe(true);
        expect(allowed.isOwner).toBe(true);
    });

    it('wires members modal dashboard section and staff monitor overlay', () => {
        const whiteboardRuntime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');
        const workspaceRuntime = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const api = readSource('assets/js/app/api.js');
        const routes = readSource('backend/platform/routes/lms-personal-dashboard-routes.js');
        expect(whiteboardRuntime).toContain('lms-whiteboard-members-section--dashboards');
        expect(whiteboardRuntime).toContain('open-student-workspace');
        expect(whiteboardRuntime).toContain('openLmsPersonalDashboardForStaff');
        expect(whiteboardRuntime).toContain('fetchLmsPersonalDashboardShareStatus');
        expect(whiteboardRuntime).toContain('filter-dashboard-share');
        expect(whiteboardRuntime).toContain('lms-whiteboard-dashboard-share-badge');
        expect(whiteboardRuntime).toMatch(/open-student-workspace[\s\S]*disabled/);
        expect(runtime).toContain('isLmsPersonalDashboardStaffMonitor');
        expect(runtime).toContain('set-share');
        expect(runtime).toContain('patchLmsPersonalDashboardSnapshotShare');
        expect(runtime).toContain('patchLmsPersonalDashboardWorkspaceShare');
        expect(runtime).toContain('set-workspace-share');
        expect(runtime).toContain('open-share-panel');
        expect(runtime).toContain('lms-personal-dashboard-share-overlay');
        expect(runtime).toContain('lms-personal-dashboard-share-panel');
        expect(runtime).toContain('lms-personal-dashboard-share-seg');
        expect(runtime).toContain('data-share-level');
        expect(runtime).toContain('aria-modal="true"');
        expect(runtime).toContain('lms-personal-dashboard-share-callout');
        expect(runtime).toContain('shouldBlockLmsPersonalDashboardStaffBoard');
        expect(workspaceRuntime).toMatch(/isLmsPersonalDashboardStaffMonitor[\s\S]*staffShareLevel/);
        expect(api).toContain('patchLmsPersonalDashboardSnapshotShare');
        expect(api).toContain('patchLmsPersonalDashboardWorkspaceShare');
        expect(api).toContain('fetchLmsPersonalDashboardSharedHistory');
        expect(api).toContain('fetchLmsPersonalDashboardShareStatus');
        expect(routes).toContain('/personal-dashboards/:resourceKey/share');
        expect(routes).toContain('/snapshots/:snapshotId/share');
        expect(routes).toContain('/share-status');
        expect(routes).toContain('resolveSessionActorAccount');
        expect(routes).toContain('studentId');
        expect(readSource('backend/platform/routes/lms-whiteboard-routes.js')).toContain('resolveSessionActorAccount');
        expect(readSource('backend/platform/server.js')).toContain('function resolveSessionActorAccount');
        expect(css).toContain('.lms-personal-dashboard-share-panel');
        expect(css).toContain('.lms-personal-dashboard-share-seg-btn');
        expect(css).toContain('.lms-whiteboard-members-section--dashboards');
        expect(css).toContain('.lms-whiteboard-dashboard-filter');
    });

    it('hydrates workspace staffShare on apply so instructor access select persists', () => {
        const workspaceRuntime = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');
        const applyBlock = workspaceRuntime.match(/function applyLmsWhiteboardWorkspace[\s\S]*?^}/m)?.[0] || '';
        expect(applyBlock).toContain('staffShare');
        expect(applyBlock).toMatch(/local\.staffShare\s*=/);
        expect(applyBlock).toContain('peerShares');
        expect(applyBlock).toContain('groupShare');
        expect(workspaceRuntime).toMatch(/staffShare:\s*'none'/);
        expect(runtime).toContain('workspace.staffShare = level');
        expect(runtime).toContain('patchLmsPersonalDashboardWorkspaceShare(targetKey, { staffShare: level })');
        expect(runtime).toContain('getLmsPersonalDashboardWorkspaceStaffShare(targetKey)');
    });

    it('supports per-classmate peer shares and shared-with-me listing', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const owner = { id: 'stu-1', userId: 'stu-1' };
        const peer = { id: 'stu-2', userId: 'stu-2' };
        const outsider = { id: 'stu-3', userId: 'stu-3' };
        const workspace = dashboard.ensurePersonalDashboardWorkspace({
            resourceKey: personalKey,
            staffShare: 'none',
            peerShares: {}
        }, personalKey);

        const granted = dashboard.updatePersonalDashboardPeerShares(
            workspace,
            { userId: 'stu-2', level: 'edit' },
            owner
        );
        expect(granted.workspace.peerShares['stu-2']).toBe('edit');

        expect(dashboard.assertLmsPersonalBoardReadAccess(personalKey, peer, 'student', granted.workspace).ok).toBe(true);
        expect(dashboard.assertLmsPersonalBoardWriteAccess(personalKey, peer, 'student', granted.workspace).ok).toBe(true);
        expect(dashboard.assertLmsPersonalBoardReadAccess(personalKey, outsider, 'student', granted.workspace).ok).toBe(false);

        const store = {
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [personalKey]: granted.workspace
                    }
                }
            }
        };
        const listed = dashboard.listPersonalDashboardSharedWithMe(store, 'ECON-01-001', 'stu-2', {
            groupId: 'g1',
            sectionType: 'lecture'
        });
        expect(listed.ok).toBe(true);
        expect(listed.items).toHaveLength(1);
        expect(listed.items[0].ownerId).toBe('stu-1');
        expect(listed.items[0].shareLevel).toBe('edit');
    });

    it('wires peer share UI and collaborator edit parity hooks', () => {
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');
        const workspaceRuntime = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const whiteboardRuntime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const api = readSource('assets/js/app/api.js');
        const routes = readSource('backend/platform/routes/lms-personal-dashboard-routes.js');

        expect(runtime).toContain('set-peer-share');
        expect(runtime).toContain('set-group-share');
        expect(runtime).toContain('open-share-panel');
        expect(runtime).toContain('renderLmsPersonalDashboardShareLevelGroup');
        expect(runtime).toContain('data-share-level');
        expect(runtime).toContain('openLmsPersonalDashboardForGuest');
        expect(runtime).toContain('Shared with me');
        expect(runtime).toContain('Whole group');
        expect(runtime).toContain('patchLmsPersonalDashboardPeerShares');
        expect(runtime).not.toContain('lms-personal-dashboard-share-level-select');
        expect(api).toContain('patchLmsPersonalDashboardPeerShares');
        expect(api).toContain('fetchLmsPersonalDashboardSharedWithMe');
        expect(api).toContain('groupShare');
        expect(routes).toContain('/peer-shares');
        expect(routes).toContain('/shared-with-me');
        expect(workspaceRuntime).toContain('getLmsPersonalBoardCollaboratorShareLevel');
        expect(workspaceRuntime).toMatch(/function clearLmsWhiteboardBoard[\s\S]*canEditLmsWhiteboard/);
        expect(whiteboardRuntime).toContain('Clear this shared personal board?');
    });

    it('supports whole-group classmate share combined with peer overrides', () => {
        const dashboard = require('../backend/platform/domains/lms-personal-dashboard-service.js');
        const personalKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const owner = { id: 'stu-1', userId: 'stu-1' };
        const peer = { id: 'stu-2', userId: 'stu-2' };
        const peerEdit = { id: 'stu-3', userId: 'stu-3' };
        const base = dashboard.ensurePersonalDashboardWorkspace({
            resourceKey: personalKey,
            staffShare: 'none',
            groupShare: 'none',
            peerShares: {}
        }, personalKey);

        const withGroup = dashboard.updatePersonalDashboardWorkspaceShare(
            base,
            { groupShare: 'view' },
            owner
        );
        expect(withGroup.workspace.groupShare).toBe('view');
        expect(dashboard.assertLmsPersonalBoardReadAccess(personalKey, peer, 'student', withGroup.workspace).shareLevel).toBe('view');
        expect(dashboard.assertLmsPersonalBoardWriteAccess(personalKey, peer, 'student', withGroup.workspace).ok).toBe(false);

        const withPeerEdit = dashboard.updatePersonalDashboardPeerShares(
            withGroup.workspace,
            { userId: 'stu-3', level: 'edit' },
            owner
        );
        expect(dashboard.assertLmsPersonalBoardWriteAccess(personalKey, peerEdit, 'student', withPeerEdit.workspace).ok).toBe(true);

        const store = {
            state: {
                portal: {
                    whiteboardWorkspaces: {
                        [personalKey]: withPeerEdit.workspace
                    }
                }
            }
        };
        const listed = dashboard.listPersonalDashboardSharedWithMe(store, 'ECON-01-001', 'stu-2', {
            groupId: 'g1',
            sectionType: 'lecture'
        });
        expect(listed.items.some(item => item.ownerId === 'stu-1' && item.shareLevel === 'view')).toBe(true);
    });
});