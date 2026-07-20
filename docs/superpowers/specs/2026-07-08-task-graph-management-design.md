# Task Graph Management Dashboard — Design Spec

**Date:** 2026-07-08  
**Status:** Approved  
**Replaces:** Obsidian-minimal graph polish (revert visual direction only; keep flicker fix + backlog removal)

## Problem

The Obsidian-inspired pass made the graph unsuitable for project management: tiny dots, hidden labels, gray hairline edges, and aggressive dimming. Managers need to scan status, dependencies, workload, and task names at a glance.

## Goals

1. **Management-first graph** — status health, dependency clarity, assignee/due visibility
2. **Rich card nodes** — compact kanban-style cards on the canvas (title, status pill, assignee, due date)
3. **Visual consistency** — reuse `social-project-task-card` design language from the task board
4. **Preserve working infra** — scoped `refreshProjectTaskGraphDialog`, RMB pan, 4-status pipeline (no backlog), detail rail

## Non-goals

- Obsidian-style minimal dots / hidden labels
- AI-suggested semantic edges
- LMS shell transparency flicker fix (separate track)

## Node model

New renderer: `renderProjectTaskGraphCardNode(project, task, options)`

Compact card (~200×76px) inside SVG `foreignObject`:

- Left status stripe (todo blue, in-progress amber, blocked rose, done green)
- Title (2-line clamp)
- Status pill + assignee chip (avatar + name or "Unassigned")
- Due date pill with overdue/today/soon styling (reuse kanban logic from `renderProjectTaskCard`)

Signals:

- `.is-overdue` — red border (existing token)
- `.is-active` — in-progress subtle pulse on stripe
- `.is-selected` / `.is-link-source` — lux border glow (no 22% opacity wipe)

## Layout

Upgrade `layoutProjectTaskGraphForce` to **box collision**:

- Card dimensions: `CARD_W = 200`, `CARD_H = 76` (compact preview: 160×64)
- Repulsion between rectangle bounds + padding
- Link target distance ~140px between card centers
- `projectTaskGraphEdgeAnchors` returns edge midpoints on card sides (not circles)

Positions store `{ x, y, w, h, degree }` instead of `{ x, y, r }`.

Drag handler updates saved positions using card center.

## Edges

| Kind | Style |
|------|-------|
| explicit | 1.8px accent stroke, arrow marker, soft glow |
| flow | 1.2px muted accent, no arrow |
| inferred | 1px dashed slate, no arrow |

Remove Obsidian gray 0.7–1.1px strokes.

## Focus behavior

**Remove** aggressive `syncProjectTaskGraphFocus` dimming (opacity 0.22).

**Optional (light):** selected node gets elevated shadow; direct neighbors get slightly brighter border — no hiding unrelated nodes.

## Management chrome

Sidebar additions (in `renderProjectTaskGraphSidebarBlocks`):

- Health row: per-status counts, overdue count, unassigned count
- Toggle: "Highlight overdue" / "Highlight blocked" (CSS class on matching cards)

Topbar summary chip (optional): `N blocked · M overdue` when counts > 0.

## Undo list (Obsidian pass)

| Remove | Restore / replace |
|--------|-------------------|
| `baseR: 12` circle metrics | Card box metrics |
| Hidden labels + `is-labels-visible` | Always-visible card content |
| `node-core`, `node-status-dot` | Card chrome |
| `is-dimmed` at 0.22 opacity | Light selection highlight only |
| Gray edges | Accent management edges |
| `transform: scale(1.15)` on SVG group hover | Card CSS hover (translateY -1px) |

## Files

| File | Change |
|------|--------|
| `assets/js/pages/social-page.js` | Card renderer, box layout, edge anchors, drag, undo Obsidian JS |
| `assets/css/social-projects-lms.css` | Graph card styles, edge styles, remove Obsidian rules |
| `test/social-project-task-graph.test.js` | Card node + layout regressions |

## Testing

- `foreignObject` + `renderProjectTaskGraphCardNode` present
- Card markup includes assignee + due when task has them
- Obsidian artifacts absent (`baseR: 12`, aggressive `is-dimmed`)
- Box layout constants present
- `node test/social-project-task-graph.test.js` passes

## Success criteria

Manager opens fullscreen graph and immediately sees: who owns what, what's blocked/overdue, how tasks depend on each other — without hovering or zooming.