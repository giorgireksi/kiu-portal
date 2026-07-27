import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-workspace-panel-budget-runtime', () => {
    it('requires activeProject and chart helpers in peel deps', () => {
        const peel = readSource('assets/js/pages/social-workspace-panel-budget-runtime.js');
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        for (const name of ['activeProject', 'countNum', 'renderProgressRing', 'renderMetricCard', 'when']) {
            expect(peel).toMatch(new RegExp(`\\b${name}\\b`));
            expect(panel).toMatch(new RegExp(`__kiuCreateSocialWorkspacePanelBudgetApi\\([\\s\\S]*\\b${name}\\b`));
        }
    });

    it('renders budget tab without throwing when peel deps are wired', () => {
        const sandbox = { window: {}, String, Boolean, Number, Array, Object, Math, JSON, console };
        sandbox.window.window = sandbox.window;
        vm.runInNewContext(readSource('assets/js/pages/social-workspace-panel-budget-runtime.js'), sandbox);

        const activeProject = {
            id: 'p1',
            budgetCurrency: 'USD',
            budgetSpentTotal: 100,
            budgetPlannedTotal: 500,
            budgetUtilizationPercent: 20,
            budgetCategories: [],
            budgetExpenses: [],
            budgetByCategory: [],
            isManager: false,
            viewerCanContribute: false
        };
        const api = sandbox.window.__kiuCreateSocialWorkspacePanelBudgetApi({
            escape: (v) => String(v),
            text: (v) => String(v == null ? '' : v).trim(),
            displayName: () => 'User',
            avatar: () => '',
            accountById: () => null,
            state: () => ({}),
            ensureSocialMessagesModule: () => {},
            hasSocialMessagesModule: () => false,
            ensureProjectWorkspaceChat: () => {},
            resolveProjectWorkspaceChat: () => null,
            renderMessagesThreadShell: () => '',
            setActiveChat: () => {},
            queueDeferredModuleRender: () => {},
            renderSocialPageNow: () => {},
            currentUserId: () => 'u1',
            activeProject,
            countNum: (v) => Number(v || 0),
            renderProgressRing: () => '<ring></ring>',
            renderMetricCard: () => '<metric></metric>',
            when: (v) => String(v || '')
        });

        const html = api.renderBudgetTab();
        expect(html).toContain('Spend against plan');
        expect(html).toContain('Expense log');
    });
});
