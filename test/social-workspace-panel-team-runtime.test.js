import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-workspace-panel-team-runtime', () => {
    it('requires activeProject and team closure helpers in peel deps', () => {
        const peel = readSource('assets/js/pages/social-workspace-panel-team-runtime.js');
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        for (const name of ['activeProject', 'memberSummaries', 'renderTeamMemberCard', 'pendingMembers', 'nextOwner']) {
            expect(peel).toMatch(new RegExp(`\\b${name}\\b`));
            expect(panel).toMatch(new RegExp(`__kiuCreateSocialWorkspacePanelTeamApi\\([\\s\\S]*\\b${name}\\b`));
        }
    });

    it('renders team tab without throwing when peel deps are wired', () => {
        const sandbox = { window: {}, String, Boolean, Number, Array, Object, Math, JSON, console };
        sandbox.window.window = sandbox.window;
        vm.runInNewContext(readSource('assets/js/pages/social-workspace-panel-team-runtime.js'), sandbox);

        const activeProject = {
            id: 'p1',
            role: 'member',
            memberCount: 2,
            isManager: false,
            workloadByMember: []
        };
        const api = sandbox.window.__kiuCreateSocialWorkspacePanelTeamApi({
            escape: (v) => String(v),
            text: (v) => String(v == null ? '' : v).trim(),
            displayName: () => 'User',
            avatar: () => '',
            accountById: () => null,
            accountSubtitle: () => '',
            isStaffAccount: () => false,
            countNum: (v) => Number(v || 0),
            formatProjectScheduleHours: (v) => String(v),
            activeProject,
            runtime: { ui: {} },
            memberSummaries: [{ userId: 'u1', role: 'member' }],
            pendingMembers: [],
            nextOwner: null,
            roleLabels: { member: 'Member' },
            facultyMix: [],
            roleMix: [],
            inviteFaculty: 'all',
            facultyOptions: [],
            filteredInviteCandidates: [],
            renderTeamMemberCard: () => '<member></member>',
            scrollList: (_modifier, content) => content
        });

        const html = api.renderTeamTab();
        expect(html).toContain('social-project-team-shell');
        expect(html).toContain('Leave workspace');
    });
});
