import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadWeekPlanModel() {
    const store = {};
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
                }
            }
        },
        localStorage: {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); }
        }
    };
    sandbox.window.window = sandbox.window;
    sandbox.window.localStorage = sandbox.localStorage;
    const source = readFileSync(
        join(process.cwd(), 'assets/js/pages/social-workspace-week-plan-model.js'),
        'utf8'
    );
    vm.runInNewContext(source, sandbox);
    return { win: sandbox.window, store };
}

describe('social-workspace-week-plan-model', () => {
    let win;

    beforeEach(() => {
        ({ win } = loadWeekPlanModel());
    });

    it('exports week-plan and action helpers', () => {
        expect(win.__KIU_SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_LOADED).toBe(true);
        expect(typeof win.readProjectWeekPlan).toBe('function');
        expect(typeof win.migrateProjectPlanEntry).toBe('function');
        expect(typeof win.isSocialWorkspaceClickAction).toBe('function');
        expect(win.KiuSocialWorkspaceWeekPlanModel.readProjectWeekPlan).toBe(win.readProjectWeekPlan);
    });

    it('migrates legacy week keys and CRUD plan ids', () => {
        const migrated = win.migrateProjectPlanEntry({ week: ['a'], '2weeks': ['b'], days: ['c'] });
        expect(migrated.weeks).toEqual(['a', 'b']);
        expect(migrated.days).toEqual(['c']);
        win.addToProjectWeekPlan('p1', 'weeks', 't1');
        win.addManyToProjectWeekPlan('p1', 'weeks', ['t2', 't1']);
        expect(win.readProjectWeekPlan('p1', 'weeks')).toEqual(['t1', 't2']);
        win.removeFromProjectWeekPlan('p1', 'weeks', 't1');
        expect(win.readProjectWeekPlan('p1', 'weeks')).toEqual(['t2']);
    });

    it('classifies workspace click/submit/input/change targets', () => {
        expect(win.isSocialWorkspaceClickAction('project-open')).toBe(true);
        expect(win.isSocialWorkspaceClickAction('projects-back')).toBe(true);
        expect(win.isSocialWorkspaceClickAction('feed-like')).toBe(false);
        expect(win.isSocialWorkspaceSubmitForm('create-project')).toBe(true);
        expect(win.isSocialWorkspaceSubmitForm('dialog-project-x')).toBe(true);
        expect(win.isSocialWorkspaceSubmitForm('create-post')).toBe(false);
        const input = {
            matches: (sel) => sel === 'input[name="projectHealthPlanPickSearch"]',
            name: '',
            getAttribute: () => '',
            closest: () => null
        };
        expect(win.isSocialWorkspaceInputTarget(input)).toBe(true);
        const change = {
            matches: (sel) => sel.includes('projectInviteFaculty'),
            name: 'projectInviteFaculty'
        };
        expect(win.isSocialWorkspaceChangeTarget(change)).toBe(true);
    });

    it('keeps peels out of social-workspace.js and wires load order', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        for (const name of [
            'readProjectWeekPlansStore',
            'readProjectWeekPlan',
            'writeProjectWeekPlan',
            'addToProjectWeekPlan',
            'addManyToProjectWeekPlan',
            'removeFromProjectWeekPlan',
            'isSocialWorkspaceClickAction',
            'isSocialWorkspaceSubmitForm',
            'isSocialWorkspaceInputTarget',
            'isSocialWorkspaceChangeTarget'
        ]) {
            expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(workspace).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(page).not.toMatch(/function\s+migrateProjectPlanEntry\s*\(/);
        expect(page).toMatch(/const migrateProjectPlanEntry = window\.migrateProjectPlanEntry/);
        expect(html).toContain('social-workspace-week-plan-model.js');
        expect(html.indexOf('social-workspace-week-plan-model.js')).toBeLessThan(html.indexOf('social-page.js'));
        expect(page).toContain('SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_URL');
    });
});
