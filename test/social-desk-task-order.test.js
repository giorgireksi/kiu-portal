import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Mirror of desk parent-first DFS used in social-page.js orderDeskTasksByDependency.
 * Kept pure so we can lock ordering without booting the page IIFE.
 */
function orderDeskTasksByDependency(tasks) {
    const text = (v) => String(v ?? '').trim();
    const PRIORITY = { urgent: 0, high: 1, medium: 2, low: 3 };
    const list = (Array.isArray(tasks) ? tasks : []).filter((t) => t && text(t.id));
    if (!list.length) return [];
    const ids = new Set(list.map((t) => text(t.id)));
    const byId = new Map(list.map((t) => [text(t.id), t]));
    const dependsOn = (task) => [...new Set((task.dependsOnTaskIds || []).map(text).filter(Boolean))];
    const priorityRank = (task) => PRIORITY[text(task.priority || 'medium').toLowerCase()] ?? 9;
    const dueMs = (task) => {
        const ms = Date.parse(text(task.dueAt || ''));
        return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
    };
    const compareTasks = (a, b) => {
        const pr = priorityRank(a) - priorityRank(b);
        if (pr) return pr;
        const dd = dueMs(a) - dueMs(b);
        if (dd) return dd;
        return text(a.title || '').localeCompare(text(b.title || ''), undefined, { sensitivity: 'base' });
    };
    const childrenOf = new Map();
    ids.forEach((id) => childrenOf.set(id, []));
    const primaryParent = new Map();
    list.forEach((task) => {
        const tid = text(task.id);
        const inListParents = dependsOn(task)
            .filter((depId) => ids.has(depId))
            .map((depId) => byId.get(depId))
            .filter(Boolean)
            .sort(compareTasks);
        if (!inListParents.length) return;
        const pid = text(inListParents[0].id);
        primaryParent.set(tid, pid);
        childrenOf.get(pid).push(task);
    });
    childrenOf.forEach((kids, pid) => {
        kids.sort(compareTasks);
        childrenOf.set(pid, kids);
    });
    const roots = list.filter((task) => !primaryParent.has(text(task.id))).sort(compareTasks);
    const ordered = [];
    const visited = new Set();
    const walk = (task, depth) => {
        const id = text(task.id);
        if (!id || visited.has(id)) return;
        visited.add(id);
        ordered.push({ task, depth: Math.max(0, Math.min(8, depth)) });
        (childrenOf.get(id) || []).forEach((child) => walk(child, depth + 1));
    };
    roots.forEach((task) => walk(task, 0));
    list.filter((task) => !visited.has(text(task.id))).sort(compareTasks).forEach((task) => walk(task, 0));
    return ordered;
}

/**
 * Mirror of buildDeskTaskForest — nested droplist nodes (child may have children).
 */
function buildDeskTaskForest(tasks) {
    const text = (v) => String(v ?? '').trim();
    const PRIORITY = { urgent: 0, high: 1, medium: 2, low: 3 };
    const list = (Array.isArray(tasks) ? tasks : []).filter((t) => t && text(t.id));
    if (!list.length) return [];
    const ids = new Set(list.map((t) => text(t.id)));
    const byId = new Map(list.map((t) => [text(t.id), t]));
    const dependsOn = (task) => [...new Set((task.dependsOnTaskIds || []).map(text).filter(Boolean))];
    const priorityRank = (task) => PRIORITY[text(task.priority || 'medium').toLowerCase()] ?? 9;
    const dueMs = (task) => {
        const ms = Date.parse(text(task.dueAt || ''));
        return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
    };
    const compareTasks = (a, b) => {
        const pr = priorityRank(a) - priorityRank(b);
        if (pr) return pr;
        const dd = dueMs(a) - dueMs(b);
        if (dd) return dd;
        return text(a.title || '').localeCompare(text(b.title || ''), undefined, { sensitivity: 'base' });
    };
    const childrenOf = new Map();
    ids.forEach((id) => childrenOf.set(id, []));
    const primaryParent = new Map();
    list.forEach((task) => {
        const tid = text(task.id);
        const inListParents = dependsOn(task)
            .filter((depId) => ids.has(depId))
            .map((depId) => byId.get(depId))
            .filter(Boolean)
            .sort(compareTasks);
        if (!inListParents.length) return;
        const pid = text(inListParents[0].id);
        primaryParent.set(tid, pid);
        childrenOf.get(pid).push(task);
    });
    childrenOf.forEach((kids, pid) => {
        kids.sort(compareTasks);
        childrenOf.set(pid, kids);
    });
    const buildNode = (task, depth) => {
        const id = text(task.id);
        const kids = childrenOf.get(id) || [];
        return {
            task,
            depth: Math.max(0, Math.min(8, depth)),
            childCount: kids.length,
            children: kids.map((child) => buildNode(child, depth + 1))
        };
    };
    const roots = list.filter((task) => !primaryParent.has(text(task.id))).sort(compareTasks);
    const forest = roots.map((task) => buildNode(task, 0));
    const seen = new Set();
    const mark = (node) => {
        seen.add(text(node.task.id));
        node.children.forEach(mark);
    };
    forest.forEach(mark);
    list.filter((task) => !seen.has(text(task.id))).sort(compareTasks).forEach((task) => {
        forest.push(buildNode(task, 0));
    });
    return forest;
}

describe('desk parent-first task order', () => {
    it('keeps children under their own parent (not flat depth buckets)', () => {
        const tasks = [
            { id: 'a', title: 'Parent A', priority: 'high', dependsOnTaskIds: [] },
            { id: 'b', title: 'Parent B', priority: 'high', dependsOnTaskIds: [] },
            { id: 'a1', title: 'Child A1', priority: 'urgent', dependsOnTaskIds: ['a'] },
            { id: 'b1', title: 'Child B1', priority: 'urgent', dependsOnTaskIds: ['b'] }
        ];
        const ids = orderDeskTasksByDependency(tasks).map((row) => row.task.id);
        // Parents first in their trees; children immediately after own parent
        expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('a1'));
        expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('b1'));
        // Not flat: all depth-0 then all depth-1 would put a,b then a1,b1 —
        // but a1 must come before b if a is before b and a1 is under a.
        // With equal priority parents sorted by title: A before B
        expect(ids).toEqual(['a', 'a1', 'b', 'b1']);
        const depths = Object.fromEntries(orderDeskTasksByDependency(tasks).map((r) => [r.task.id, r.depth]));
        expect(depths.a).toBe(0);
        expect(depths.a1).toBe(1);
        expect(depths.b1).toBe(1);
    });

    it('treats cross-list parents as roots (parent not in section)', () => {
        const tasks = [
            { id: 'child', title: 'Child only', priority: 'medium', dependsOnTaskIds: ['outside'] },
            { id: 'solo', title: 'Solo', priority: 'low', dependsOnTaskIds: [] }
        ];
        const ordered = orderDeskTasksByDependency(tasks);
        expect(ordered.map((r) => r.task.id)).toEqual(['child', 'solo']);
        expect(ordered.every((r) => r.depth === 0)).toBe(true);
    });

    it('page source uses primary-parent DFS order helper', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        // Real impl lives in workspace; page keeps a thin stub.
        expect(page).toContain("createSocialWorkspaceStub('orderDeskTasksByDependency'");
        expect(workspace).toContain('function orderDeskTasksByDependency');
        expect(workspace).toContain('primaryParent');
        expect(workspace).toContain('childrenOf');
        expect(workspace).toContain('roots.forEach((task) => walk(task, 0))');
    });
});


describe('page source uses single DFS orderDeskTasksByDependency', () => {
    it('has exactly one orderDeskTasksByDependency and no depthMemo flat sort', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        // One stub on page + one real impl in workspace
        expect(page).toContain("createSocialWorkspaceStub('orderDeskTasksByDependency'");
        expect((workspace.match(/function orderDeskTasksByDependency/g) || []).length).toBe(1);
        expect(workspace).toContain('primaryParent');
        expect(workspace).toContain('childrenOf');
        // Flat second implementation must not remain
        const after = workspace.split('function orderDeskTasksByDependency')[1] || '';
        expect(after).not.toMatch(/const depthMemo = new Map/);
    });
});

describe('desk nested droplist forest', () => {
    it('nests grandchild under child under parent', () => {
        const tasks = [
            { id: 'p', title: 'Parent', priority: 'high', dependsOnTaskIds: [] },
            { id: 'c', title: 'Child', priority: 'medium', dependsOnTaskIds: ['p'] },
            { id: 'g', title: 'Grandchild', priority: 'low', dependsOnTaskIds: ['c'] },
            { id: 'solo', title: 'Solo', priority: 'urgent', dependsOnTaskIds: [] }
        ];
        const forest = buildDeskTaskForest(tasks);
        // urgent solo first among roots, then parent
        expect(forest.map((n) => n.task.id)).toEqual(['solo', 'p']);
        const parent = forest.find((n) => n.task.id === 'p');
        expect(parent.depth).toBe(0);
        expect(parent.childCount).toBe(1);
        expect(parent.children[0].task.id).toBe('c');
        expect(parent.children[0].depth).toBe(1);
        expect(parent.children[0].children[0].task.id).toBe('g');
        expect(parent.children[0].children[0].depth).toBe(2);
        expect(parent.children[0].children[0].childCount).toBe(0);
    });

    it('page source wires collapsible multi-level tree render', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(page).toContain("createSocialWorkspaceStub('buildDeskTaskForest'");
        expect(workspace).toContain('function buildDeskTaskForest');
        expect(workspace).toContain('function renderDeskTaskTreeForest');
        expect(workspace).toContain('project-task-desk-tree-toggle');
        expect(workspace).toContain('spt-desk-tree-children');
        expect(page).toContain('projectTaskDeskCollapsedTreeIds');
        const css = readFileSync(join(process.cwd(), 'assets/css/social-projects-lms.css'), 'utf8');
        expect(css).toContain('.spt-desk-tree-toggle');
        expect(css).toContain('.spt-desk-tree-children.is-collapsed');
    });
});
