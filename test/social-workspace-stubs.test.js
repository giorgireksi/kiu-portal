import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

describe('social-workspace-stubs', () => {
    it('installs stub bag with stable fallbacks', () => {
        const sandbox = {
            window: {},
            Array,
            Object,
            String
        };
        sandbox.window.window = sandbox.window;
        vm.runInNewContext(
            readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-stubs.js'), 'utf8'),
            sandbox
        );
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_STUBS_LOADED).toBe(true);
        const created = [];
        const bag = sandbox.window.installKiuSocialWorkspaceStubs({
            createStub: (name, fallback) => {
                created.push(name);
                const stub = (...args) => (typeof fallback === 'function' ? fallback(...args) : fallback);
                stub.__name = name;
                return stub;
            },
            text: (v) => String(v == null ? '' : v).trim()
        });
        expect(created.length).toBeGreaterThan(50);
        expect(typeof bag.renderWorkspaceOwnedDialog).toBe('function');
        expect(bag.shouldRenderProjectHealthStack()).toBe(false);
        expect(bag.computePertExpected()).toBe(0);
        expect(bag.readProjectWeekPlan()).toEqual({});
        expect(bag.projectTabPaneCacheKey('p1', 'tasks')).toBe('p1:tasks');
        expect(bag.sortProjectBoardTasksByPriority([2, 1])).toEqual([2, 1]);
    });

    it('is wired before social-page', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        expect(page).toContain('installKiuSocialWorkspaceStubs');
        expect(page).not.toContain("__installSocialWorkspaceStubs([");
        expect(html).toContain('social-workspace-stubs.js');
        expect(html.indexOf('social-workspace-stubs.js')).toBeLessThan(html.indexOf('social-page.js'));
    });
});
