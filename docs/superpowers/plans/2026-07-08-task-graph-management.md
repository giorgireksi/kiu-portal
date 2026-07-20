# Task Graph Management Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Obsidian-minimal circle graph with compact kanban-style management cards showing status, assignee, and due date, with readable dependency edges.

**Architecture:** Box-based force layout positions `foreignObject` HTML cards inside SVG; reuses kanban card tokens and task field helpers. Obsidian visual/JS removed; scoped dialog refresh retained.

**Tech Stack:** Vanilla JS (`social-page.js`), CSS (`social-projects-lms.css`), Vitest source regressions.

## Global Constraints

- Keep 4 statuses: todo, in-progress, blocked, done (no backlog)
- Keep `refreshProjectTaskGraphDialog` scoped sync (no full-panel flicker)
- Keep RMB pan, detail rail, link mode
- Do not change LMS transparency / opacity system
- Match existing lux/social-project-task-card visual tokens

---

## Task 1: Revert Obsidian visuals (CSS + JS cleanup)

**Files:** `assets/css/social-projects-lms.css`, `assets/js/pages/social-page.js`

- [ ] Remove `is-labels-visible`, hidden label opacity rules, `is-dimmed` 0.22 rules
- [ ] Remove `syncProjectTaskGraphFocus` dimming logic (or reduce to border-only highlight)
- [ ] Remove `baseR: 12`, tiny circle defaults, `data-degree` on circles
- [ ] Run vitest — fix any tests asserting Obsidian artifacts

## Task 2: Box layout engine

**Files:** `assets/js/pages/social-page.js`

- [ ] Add `PROJECT_TASK_GRAPH_CARD_W/H` constants
- [ ] Update `getProjectTaskGraphMetrics` to return card dimensions
- [ ] Refactor `layoutProjectTaskGraphForce` for rectangle repulsion + link distances
- [ ] Update `projectTaskGraphEdgeAnchors` for box edges
- [ ] Update drag handler to use card center + saved positions

## Task 3: Graph card node renderer

**Files:** `assets/js/pages/social-page.js`, `assets/css/social-projects-lms.css`

- [ ] Add `renderProjectTaskGraphCardNode` (compact variant of task card fields)
- [ ] Replace `renderProjectTaskGraphCircleNode` calls in `renderProjectTaskGraphSvg`
- [ ] SVG structure: `foreignObject` with `social-project-task-graph-card` class
- [ ] CSS: card size, status stripe, overdue/blocked/active/selected states
- [ ] Restore accent edge styles (explicit/flow/inferred)

## Task 4: Management chrome

**Files:** `assets/js/pages/social-page.js`

- [ ] Extend sidebar with health counts (status, overdue, unassigned)
- [ ] Optional highlight toggles for overdue/blocked cards
- [ ] Update `syncProjectTaskGraphSelection` for card selection classes

## Task 5: Tests + verification

**Files:** `test/social-project-task-graph.test.js`

- [ ] Add tests for card renderer, foreignObject, box layout constants
- [ ] Assert Obsidian artifacts removed
- [ ] Run `node node_modules/vitest/vitest.mjs run test/social-project-task-graph.test.js`