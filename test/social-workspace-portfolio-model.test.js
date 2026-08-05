import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadPortfolioModel(extraHooks = {}) {
    const accounts = {
        u1: { id: 'u1', role: 'student', facultyCode: 'ECON', faculty: 'ECON' },
        admin1: { id: 'admin1', role: 'admin', facultyCode: 'ECON' }
    };
    const sandbox = {
        window: {
            __kiuSocialWorkspaceHooks: {
                text: (value) => String(value == null ? '' : value).trim(),
                uniqueStrings: (values) => {
                    const seen = new Set();
                    const out = [];
                    (Array.isArray(values) ? values : []).forEach((item) => {
                        const v = String(item == null ? '' : item).trim();
                        if (!v || seen.has(v)) return;
                        seen.add(v);
                        out.push(v);
                    });
                    return out;
                },
                accountById: (id) => accounts[id] || null,
                currentUserId: () => 'u1',
                currentUser: () => accounts.u1,
                currentFacultyCode: () => 'ECON',
                ...extraHooks
            }
        }
    };
    sandbox.window.window = sandbox.window;
    const source = readFileSync(
        join(process.cwd(), 'assets/js/pages/social-workspace-portfolio-model.js'),
        'utf8'
    );
    vm.runInNewContext(source, sandbox);
    return sandbox.window;
}

describe('social-workspace-portfolio-model', () => {
    let win;

    beforeEach(() => {
        win = loadPortfolioModel();
    });

    it('exports portfolio helpers on window and KiuSocialWorkspacePortfolioModel', () => {
        expect(win.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_MODEL_LOADED).toBe(true);
        expect(typeof win.normalizePortfolioEntry).toBe('function');
        expect(win.KiuSocialWorkspacePortfolioModel.normalizePortfolioEntry).toBe(win.normalizePortfolioEntry);
        expect(typeof win.canViewerAccessPortfolioEntry).toBe('function');
        expect(typeof win.portfolioStatus).toBe('function');
        expect(typeof win.portfolioVisibilityMode).toBe('function');
        expect(typeof win.portfolioFieldValue).toBe('function');
    });

    it('maps status and legacy visibility on normalizePortfolioEntry', () => {
        const published = win.normalizePortfolioEntry({
            id: 'p1',
            title: 'Demo',
            ownerUserId: 'u1',
            showcaseEnabled: true,
            visibility: 'public'
        });
        expect(published.status).toBe('published');
        expect(published.visibilityMode).toBe('all_logged_in');
        expect(published.canEdit).toBe(true);

        const draft = win.normalizePortfolioEntry({
            id: 'p2',
            ownerUserId: 'other',
            status: 'draft',
            visibilityMode: 'students_only'
        });
        expect(draft.status).toBe('draft');
        expect(draft.visibilityMode).toBe('students_only');
        expect(draft.canEdit).toBe(false);
    });

    it('enforces canViewerAccessPortfolioEntry modes', () => {
        const entry = win.normalizePortfolioEntry({
            id: 'p1',
            ownerUserId: 'other',
            status: 'published',
            visibilityMode: 'students_only',
            visibleUserIds: [],
            hiddenUserIds: [],
            visibleRoles: [],
            visibleFacultyCodes: []
        });
        expect(win.canViewerAccessPortfolioEntry(entry, { id: 'u1', role: 'student' })).toBe(true);
        expect(win.canViewerAccessPortfolioEntry(entry, { id: 'u2', role: 'professor' })).toBe(false);

        const staffOnly = { ...entry, visibilityMode: 'staff_only' };
        expect(win.canViewerAccessPortfolioEntry(staffOnly, { id: 'u2', role: 'ta' })).toBe(true);
        expect(win.canViewerAccessPortfolioEntry(staffOnly, { id: 'u1', role: 'student' })).toBe(false);
    });

    it('parses and serializes portfolio links', () => {
        const parsed = win.parsePortfolioLinksInput('Docs|https://example.com/docs\nhttps://alone.example');
        expect(parsed).toEqual([
            { label: 'Docs', url: 'https://example.com/docs' },
            { label: 'https://alone.example', url: 'https://alone.example' }
        ]);
        expect(win.serializePortfolioLinks(parsed)).toContain('Docs | https://example.com/docs');
    });

    it('keeps pure portfolio helpers out of social-workspace.js function bodies', () => {
        const workspace = readFileSync(
            join(process.cwd(), 'assets/js/pages/social-workspace.js'),
            'utf8'
        );
        for (const name of [
            'portfolioStatus',
            'portfolioVisibilityMode',
            'parsePortfolioTextList',
            'parsePortfolioLinksInput',
            'serializePortfolioLinks',
            'portfolioAudienceLabel',
            'normalizePortfolioEntry',
            'canViewerAccessPortfolioEntry',
            'portfolioMatchesRoleFilter',
            'clonePortfolioDocument',
            'portfolioMakeId',
            'portfolioFieldValue'
        ]) {
            expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(workspace).toContain(name);
        }
        expect(workspace).toContain('KiuSocialWorkspacePortfolioModel');
        expect(workspace).not.toMatch(/function\s+portfolioEntriesForViewer\s*\(/);
        expect(workspace).not.toMatch(/function\s+portfolioDraftExists\s*\(/);
        expect(workspace).not.toMatch(/function\s+portfolioReadDateRange\s*\(/);
        expect(workspace).not.toMatch(/function\s+portfolioCollectDocumentFromUi\s*\(/);
    });

    it('loads portfolio model before workspace in ensureSocialWorkspaceModule', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const portfolioIdx = page.indexOf('SOCIAL_WORKSPACE_PORTFOLIO_MODEL_URL');
        const graphIdx = page.indexOf('SOCIAL_WORKSPACE_GRAPH_MODEL_URL');
        const ensureStart = page.indexOf('function ensureSocialWorkspaceModule');
        const workspaceLoad = page.indexOf('SOCIAL_WORKSPACE_MODULE_URL', ensureStart);
        expect(portfolioIdx).toBeGreaterThan(-1);
        expect(page).toMatch(/social-workspace-portfolio-model\.js/);
        expect(portfolioIdx).toBeGreaterThan(graphIdx);
        const ensureChain = page.slice(
            page.indexOf('function ensureSocialWorkspaceModule'),
            page.indexOf('function hasSocialWorkspaceModule')
        );
        expect(ensureChain.indexOf('SOCIAL_WORKSPACE_PORTFOLIO_MODEL_URL')).toBeLessThan(
            ensureChain.lastIndexOf('SOCIAL_WORKSPACE_MODULE_URL')
        );
        expect(workspaceLoad).toBeGreaterThan(portfolioIdx);
    });
});
