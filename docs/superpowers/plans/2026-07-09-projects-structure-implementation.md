# Projects Structure Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkbox tracking. Keep changes surgical.

**Goal:** Implement the structure wireframes for Projects hub, Tasks (board/list), and Graph polish so the UI matches the professional layout.

**Architecture:** Extend existing `renderProjectsWorkspacePanelClassic` hub path, tasks tab inside same function, graph position persistence via localStorage keyed by projectId. CSS in `social-projects-lms.css`. No new JS modules.

**Tech Stack:** Vanilla JS `assets/js/pages/social-page.js`, CSS `assets/css/social-projects-lms.css`, Vitest source tests.

## Global Constraints

- Scope: panel `workspace` only (Projects studios). Do not change Portfolio panel behavior except copy clarity if touching shared strings.
- Keep 4 task statuses: todo, in-progress, blocked, done (no backlog column).
- Reuse existing lux/social-project tokens and class patterns.
- Preserve `refreshProjectTaskGraphDialog` scoped sync and graph card nodes.
- Do not refactor unrelated social panels.
- Match existing action/handler patterns (`data-action`, `runtime.ui.*`, `renderSocialPageNow`).
- Fingerprint any new `runtime.ui` keys in `buildSocialRenderSignature`.
- Prefer source-string regression tests like existing `test/social-project-*.test.js`.

## Wireframe reference

`docs/superpowers/specs/2026-07-09-projects-structure-wireframes.md`

---

### Task 1: Hub 3-column discovery

**Files:**
- Modify: `assets/js/pages/social-page.js` (hub branch of `renderProjectsWorkspacePanelClassic` when `!activeProject`)
- Modify: `assets/css/social-projects-lms.css`
- Test: `test/social-project-hub-structure.test.js` (create)

**UI state keys (reuse if present):**
- `projectDiscoverSearch`, `projectDiscoverFaculty`, `projectDiscoverRole`, `projectDiscoverTag`
- Add: `projectHubViewMode` (`grid`|`list`), `projectHubScope` (`mine`|`faculty`|`all`|`recruiting`), `projectHubStatus` (`all`|`idea`|`active`|`review`|`completed`)

**Requirements:**
1. Replace thin dual-list hub with layout:
   - Hero stays via `renderWorkspaceHero` but add attention strip (overdue/today/blocked counts across my projects' tasks) + search field bound to `projectDiscoverSearch`
   - Scope chips: Mine / Faculty / All / Recruiting
   - 3-column body: filters | main grid/list | context rail
2. Filters: status checkboxes/pills, faculty (from project faculties), skills/tags from project skill tags, recruiting (memberCount < max if field exists else skip capacity)
3. Main: view toggle grid/list; filtered projects as enhanced cards
4. Enhance `renderProjectCard`: role badge, up to 3 skill chips, member capacity if available, last activity if available
5. Context rail: My Work (top 5 assigned open tasks across my projects, clickable → set activeProjectId + projectTab tasks + open detail), Trending (featured by activity), Contribution counts
6. Wire input/select/chip handlers + fingerprint keys
7. CSS for `.social-project-hub-layout`, filters, rail, grid

**Do not:** implement join-request backend; DnD; server graph persist.

---

### Task 2: Tasks list mode + filters + dependency chips

**Files:**
- Modify: `assets/js/pages/social-page.js` (tasks tab inside project detail)
- Modify: `assets/css/social-projects-lms.css`
- Test: `test/social-project-task-views.test.js` (create)

**UI state:**
- `projectTaskViewMode`: `board`|`list`|`graph` (default board)
- Extend filters: priority include `urgent`; `projectTaskFilterUnassigned` bool; `projectTaskFilterOverdue` bool; `projectTaskFilterHasDeps` bool

**Requirements:**
1. View mode toggle on Tasks tab chrome
2. Board mode: keep existing kanban
3. List mode: table rows with status, title, priority, assignee, due, deps; row click opens task detail
4. Graph mode: show existing `renderTaskDependencyGraphPreview` as main body (fullscreen still via Expand)
5. Update `filterProjectBoardTasks` (or equivalent) for new filters
6. On `renderProjectTaskCard`: show dep chip `blocked by N · blocks M` with action to open graph selecting node when N/M > 0
7. Overview My tasks rows: make clickable with `project-task-detail-open`
8. Handlers + fingerprint

**Do not:** implement HTML5 DnD yet (optional stretch if time); bulk multi-select.

---

### Task 3: Graph layout localStorage persist + clear-deps confirm

**Files:**
- Modify: `assets/js/pages/social-page.js`
- Test: extend `test/social-project-task-graph.test.js`

**Requirements:**
1. When saving `projectTaskGraphPositions`, also write `localStorage` key `kiu.projectTaskGraph.positions.<projectId>`
2. When opening graph / building layout, merge localStorage positions if ui positions empty
3. On `project-task-graph-clear-deps`, use `confirm()` (or existing dialog pattern) before bulk clear
4. Keep session ui positions as primary during open session

**Do not:** backend API for positions; redesign graph chrome.

---

### Task 4: CSS polish + regression suite pass

**Files:**
- `assets/css/social-projects-lms.css`
- Run: vitest for new tests + social-project-task-graph + social-project-tab-flicker if relevant

**Requirements:**
1. Mobile: hub stacks to 1 column; filters collapse-friendly
2. Ensure new classes use `body.lux-route-social` prefix like existing rules
3. All new tests pass
