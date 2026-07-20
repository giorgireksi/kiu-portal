# Task report: Projects Studio structure (Hub + Tasks + Graph)

**Date:** 2026-07-09  
**Status:** DONE  
**Scope:** Tasks 1–3 from `docs/superpowers/plans/2026-07-09-projects-structure-implementation.md`

## Summary

Implemented the Projects hub 3-column discovery layout, Tasks tab Board/List/Graph modes with extended filters and dependency chips, and localStorage persistence for graph node positions. Clear-deps already used `window.confirm()` — left as-is.

## Task 1 — Hub 3-column discovery

### Changes
- Replaced dual-list hub (`Your workspaces` / `Most active studios`) with:
  - Search (`name=projectDiscoverSearch`)
  - Optional attention strip (overdue / due today / blocked assigned)
  - Scope chips: mine | faculty | all | recruiting (`project-hub-scope`)
  - Layout: filters | main grid/list | context rail
- Filters: status pills (`projectHubStatus`), faculty select (existing `projectDiscoverFaculty`), skill tags (`projectDiscoverTag` via `project-hub-skill`)
- Main: Grid/List toggle (`projectHubViewMode`)
- Rail: My Work (top 5 assigned open tasks → `project-hub-open-task`), Trending (featured), Contribution counts
- Enhanced `renderProjectCard` / `renderProjectRow`: role badge, skill chips (max 3), capacity when max fields present
- Handlers + fingerprint: `projectHubScope`, `projectHubStatus`, `projectHubViewMode`
- CSS: `.social-project-hub-*` with responsive stack at 1100px / 760px
- Kept `social-neo-workspace-shell--merged` + `sectionsHtml` merge pattern

### Filtering
| Scope | Rule |
|-------|------|
| mine | role in owner/member/advisor/instructor-viewer |
| faculty | facultyCodes includes discover faculty / current faculty |
| all | all projects in list |
| recruiting | status idea\|active and members &lt; max (or &lt; 8) |
| status / search / skill | `projectHubStatus`, text blob, `projectDiscoverTag` |

## Task 2 — Tasks list mode + filters + dep chips

### Changes
- View toggle Board | List | Graph (`projectTaskViewMode`, default board)
- Priority select includes `urgent`
- Filter toggles: unassigned, overdue, has deps
- `filterProjectBoardTasks` implements the three new flags
- List mode: table with status/title/priority/assignee/due/deps; row opens detail
- Graph mode: `renderTaskDependencyGraphPreview` as main body
- Board mode: existing kanban + compact graph preview strip
- `renderProjectTaskCard`: deps chip when blocked-by or blocks &gt; 0 → `project-task-graph-open` (button so card detail does not steal click)
- Overview My tasks rows: `data-action="project-task-detail-open"` with project/task ids
- Handlers + fingerprint for new UI keys

## Task 3 — Graph layout localStorage

### Changes
- Helpers:
  - `projectTaskGraphPositionsStorageKey(projectId)` → `kiu.projectTaskGraph.positions.<id>`
  - `loadProjectTaskGraphPositions` / `saveProjectTaskGraphPositions` / `ensureProjectTaskGraphPositionsLoaded`
- Persist on drag end and graph quick-create position write
- Load into `runtime.ui` when empty on canvas markup, fullscreen render, and graph open
- Clear-deps: already `window.confirm('Clear all task dependencies in this project?')` — verified, no change required

## Files changed

| File | Role |
|------|------|
| `assets/js/pages/social-page.js` | Hub, tasks views, filters, cards, handlers, fingerprint, graph positions |
| `assets/css/social-projects-lms.css` | Hub layout, list table, deps chip, responsive |
| `test/social-project-hub-structure.test.js` | **new** hub structure assertions |
| `test/social-project-task-views.test.js` | **new** task view/filter/chip assertions |
| `test/social-project-task-graph.test.js` | localStorage helpers + clear-deps confirm |
| `test/social-workspace-hub-merge.test.js` | updated for new hub classes (kept merged shell) |
| `.superpowers/sdd/briefs/task-1-report.md` | this report |

## Tests

```bash
node node_modules/vitest/vitest.mjs run \
  test/social-project-hub-structure.test.js \
  test/social-project-task-views.test.js \
  test/social-project-task-graph.test.js \
  test/social-workspace-hub-merge.test.js \
  test/social-project-overview-widgets.test.js
```

**Result:** 5 files / 29 tests passed.

## Concerns / follow-ups

1. **No commit** — dirty tree assumed; only listed files were modified for this feature.
2. **Hub scope defaults to `mine`** — campus-wide discovery requires switching to All; intentional for “your work first.”
3. **Graph mode uses preview component**, not the fullscreen immersive dialog; Expand still opens full graph.
4. **Positions are per-browser localStorage** — not shared across devices/users; session `runtime.ui` remains primary while dialog open.
5. **Task 4 (extra CSS polish suite)** not run beyond the listed tests.

## Verification checklist

- [x] Hub 3-col layout + scope + rail
- [x] Card role + skills
- [x] Tasks Board/List/Graph
- [x] Urgent + unassigned/overdue/has-deps filters
- [x] Dep chips on cards
- [x] Overview my tasks clickable
- [x] Graph positions localStorage
- [x] Clear-deps confirm present
- [x] Fingerprint keys added
- [x] Vitest green for required suites
