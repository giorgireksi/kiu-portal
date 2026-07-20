# Task Fix Report — Projects structure Important findings

**STATUS:** PASS  
**Date:** 2026-07-09

## Summary

Four Important review findings fixed in `assets/js/pages/social-page.js` with targeted test updates. No CSS changes.

## Files touched

| File | Change |
|------|--------|
| `assets/js/pages/social-page.js` | All four runtime fixes |
| `test/social-project-task-views.test.js` | Board vs graph body separation |
| `test/social-project-task-graph.test.js` | Per-project positions helpers + clear-deps full tasks |
| `test/social-project-hub-structure.test.js` | Independent faculty filter + All faculties |
| `.superpowers/sdd/briefs/task-fix-report.md` | This report |

## Fixes

### 1. Board mode must not embed graph preview — FIXED

`renderTasksTab` now branches cleanly:

```js
taskViewMode === 'list' ? listBody : taskViewMode === 'graph' ? graphBody : boardBody
```

- **board** → kanban only (`boardBody`)
- **graph** → graph preview only (`graphBody` → `renderTaskDependencyGraphPreview`)
- **list** → list table only
- Stats / filters / view toggle unchanged in shell header
- Overview tab still shows graph preview (intentional)

### 2. Faculty filter independent of scope — FIXED

- Hub faculty select options: `['all', ...facultyCodes]` with label **All faculties**
- Default: `'all'` when scope ≠ `faculty`; current faculty when scope is `faculty` and unset
- Scope `faculty` still scopes to selected faculty, or current faculty when select is `all`
- When `discoverFaculty !== 'all'`, faculty membership filter applies for non-faculty scopes (`mine` / `all` / `recruiting`)
- Select change handler stores `'all'` instead of forcing `currentFacultyCode()`

### 3. Graph positions per projectId — FIXED

- Added `runtime.ui.projectTaskGraphPositionsByProject` map `{ [projectId]: positions }`
- Helpers:
  - `getProjectTaskGraphPositions(runtime, projectId)` — load/cache per project; mirrors current project onto legacy `projectTaskGraphPositions`
  - `setProjectTaskGraphPositions(runtime, projectId, positions)` — write map + localStorage (via `saveProjectTaskGraphPositions`)
  - `ensureProjectTaskGraphPositionsLoaded` → delegates to `get…` (never returns another project's positions)
- Drag-end and quick-create write sites use get/set helpers
- localStorage key remains `kiu.projectTaskGraph.positions.${projectId}`

### 4. clear-deps uses full project tasks — FIXED

Handler `project-task-graph-clear-deps` now:

```js
const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
```

Confirm copy unchanged: `"Clear all task dependencies in this project?"`  
No longer uses `filterProjectBoardTasks` (which could skip filtered-out tasks with deps).

## Tests

```bash
node node_modules/vitest/vitest.mjs run test/social-project-hub-structure.test.js test/social-project-task-views.test.js test/social-project-task-graph.test.js test/social-workspace-hub-merge.test.js test/social-project-overview-widgets.test.js
```

**Result:** 5 files, 29 tests, all passed.

## Concerns / residual notes

1. **Faculty + portfolio share `projectDiscoverFaculty` UI key.** Hub now defaults to `'all'`; portfolio discover still has its own path and already supported `all`. Empty/missing value falls back to `'all'` on change — portfolio previously fell back to `currentFacultyCode()` on empty, which is unlikely when options always include values.
2. **Legacy mirror `runtime.ui.projectTaskGraphPositions`** still updated for the active project so existing read sites (open dialog layout) keep working after `ensure…`. Multi-project concurrent graphs are not a product path.
3. **Fingerprint** does not deep-hash per-project positions (optional; live graph dialog handles updates without full page fingerprint).
4. **No CSS** changes required for these fixes.
