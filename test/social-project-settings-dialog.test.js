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

describe('social project workspace settings dialog', () => {
    it('renders a manager-gated settings dialog and open action with PM fields', () => {
        const source = readSource('assets/js/pages/social-page.js');

        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect(source).toContain('function renderProjectSettingsDialog(');
        expect(workspaceModule).toContain('function renderProjectSettingsDialog(');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain("if (kind === 'project-settings')");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-settings-open'");
        expect(workspaceModule).toContain('data-form="project-settings"');
        expect(workspaceModule).toContain('name="projectAdvisorUserId"');
        expect(workspaceModule).toContain('name="projectRecommendedTeamSize"');
        expect(workspaceModule).toContain('name="projectMinTeamSize"');
        expect(workspaceModule).toContain('name="projectShowcaseSummary"');

        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        expect(classicBlock).toContain('data-action="project-settings-open"');
        // Manager-gated: settings button wrapped in isManager check
        expect(classicBlock).toMatch(/activeProject\.isManager \? [`][\s\S]*?project-settings-open/);
    });

    it('forwards advisor, team size, and showcase summary through the settings submit', () => {
        const source = readSource('assets/js/pages/social-page.js');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-settings'[\s\S]*?advisorUserId: text\(form\.projectAdvisorUserId/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-settings'[\s\S]*?recommendedTeamSize: Number\(form\.projectRecommendedTeamSize/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-settings'[\s\S]*?minTeamSize: Number\(form\.projectMinTeamSize/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-settings'[\s\S]*?showcaseSummary: text\(form\.projectShowcaseSummary/);
    });

    it('persists advisor, team size, and showcase summary through the backend', () => {
        const store = new PlatformStore({});
        seedAccount(store, 'owner-1');
        seedAccount(store, 'prof-1', 'professor');
        const project = store.createSocialProject({ title: 'Capstone' }, 'owner-1');

        const updated = store.updateSocialProject(project.id, {
            advisorUserId: 'prof-1',
            recommendedTeamSize: 6,
            minTeamSize: 3,
            showcaseSummary: 'A capstone showcase blurb.'
        }, 'owner-1');

        expect(updated.advisorUserId).toBe('prof-1');
        expect(updated.recommendedTeamSize).toBe(6);
        expect(updated.minTeamSize).toBe(3);
        expect(updated.showcaseSummary).toBe('A capstone showcase blurb.');
    });
});
