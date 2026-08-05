import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readSocialPageSource, readWorkspaceSurface } from './helpers/social-page-source.js';

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
        const source = readSocialPageSource();

        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const projectChrome = readSource('assets/js/pages/social-workspace-project-chrome.js');
        const dialogRoute = readSource('assets/js/pages/social-workspace-dialog-route.js');
        expect(source + readSource('assets/js/pages/social-workspace-stubs.js')).toContain("'renderProjectSettingsDialog'");
        expect(source).toContain('createSocialWorkspaceStub');
        expect(projectChrome).toContain('function renderProjectSettingsDialog(');
        expect(dialogRoute).toContain("if (kind === 'project-settings')");
        expect((source + readWorkspaceSurface())).toContain("action === 'project-settings-open'");
        expect(projectChrome).toContain('data-form="project-settings"');
        expect(projectChrome).toContain('name="projectAdvisorUserId"');
        expect(projectChrome).toContain('name="projectRecommendedTeamSize"');
        expect(projectChrome).toContain('name="projectMinTeamSize"');
        expect(projectChrome).toContain('name="projectShowcaseSummary"');
        expect(workspaceModule).toContain('createKiuSocialWorkspaceProjectChromeApi');

        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = readSource('assets/js/pages/social-workspace-panel.js');
        expect(classicBlock).toContain('data-action="project-settings-open"');
        // Manager-gated: settings button wrapped in isManager check
        expect(classicBlock).toMatch(/activeProject\.isManager \? [`][\s\S]*?project-settings-open/);
    });

    it('forwards advisor, team size, and showcase summary through the settings submit', () => {
        const source = readSocialPageSource();
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-settings'[\s\S]*?advisorUserId: text\(form\.projectAdvisorUserId/);
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-settings'[\s\S]*?recommendedTeamSize: Number\(form\.projectRecommendedTeamSize/);
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-settings'[\s\S]*?minTeamSize: Number\(form\.projectMinTeamSize/);
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-settings'[\s\S]*?showcaseSummary: text\(form\.projectShowcaseSummary/);
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
