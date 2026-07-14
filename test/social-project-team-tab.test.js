import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project team tab compact layout', () => {
    it('uses social-project-team-shell with social-neo-card instead of dashboard grid', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const teamBlock = (() => { const start = classicBlock.indexOf('const renderTeamTab = () => {'); if (start < 0) return ''; let depth = 0; for (let i = start; i < classicBlock.length; i++) { const ch = classicBlock[i]; if (ch === '{') depth += 1; else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); } } return ''; })();
        expect(teamBlock).toContain('social-neo-card social-project-team-shell');
        expect(teamBlock).toContain('social-project-team-layout');
        expect(teamBlock).not.toContain('social-project-dashboard-grid');
    });

    it('does not render Composition aside or toolbar duplicate search', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const teamBlock = (() => { const start = classicBlock.indexOf('const renderTeamTab = () => {'); if (start < 0) return ''; let depth = 0; for (let i = start; i < classicBlock.length; i++) { const ch = classicBlock[i]; if (ch === '{') depth += 1; else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); } } return ''; })();
        expect(teamBlock).not.toContain('Faculty composition');
        expect(teamBlock).not.toContain('<strong>Composition</strong>');
        expect(teamBlock).not.toContain('social-project-team-toolbar-search');
        expect(teamBlock).toContain('is-toolbar-driven');
    });

    it('keeps leave workspace in social-project-team-footer with project-leave-open', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const teamBlock = (() => { const start = classicBlock.indexOf('const renderTeamTab = () => {'); if (start < 0) return ''; let depth = 0; for (let i = start; i < classicBlock.length; i++) { const ch = classicBlock[i]; if (ch === '{') depth += 1; else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); } } return ''; })();
        expect(teamBlock).toContain('social-project-team-footer');
        expect(teamBlock).toContain('data-action="project-leave-open"');
    });

    it('provides glass shell CSS with transparent lanes, scroll cap, and conditional aside', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        const rebuild = readSource('assets/css/social-rebuild.css');
        expect(css).toContain('.social-project-team-shell');
        expect(css).toContain('.social-project-team-toolbar');
        expect(css).toContain('.social-project-team-body.has-team-aside');
        expect(css).toContain('.social-project-team-row');
        expect(css).toContain('.social-project-team-invite.is-toolbar-driven > summary');
        expect(css).toContain('.social-project-team-footer');
        expect(css).toMatch(/social-project-team-rows[\s\S]*?max-height: min\(420px, 52vh\)/);
        expect(css).toMatch(/social-project-team-body\.has-team-aside[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 240px/);
        expect(rebuild).toContain('.social-project-team-shell');
    });

    it('registers team-shell in lux managed classes', () => {
        const utils = readSource('assets/js/shared/utilities.js');
        expect(utils).toContain("'social-project-team-shell'");
    });

    it('cache-busts social-page.js and social-projects-lms.css for team glass rollout', () => {
        const html = readSource('social.html');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(html).toContain('assets/css/social-projects-lms.css?v=20260713-accentborder2');
    });
});
