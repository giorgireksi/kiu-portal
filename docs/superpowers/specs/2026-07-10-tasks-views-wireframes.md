# Tasks Work Desk (ops console — wide detailed)

**View modes:** Desk · List · Map  

## Shell

```text
WORK DESK                    [Total|Overdue|Active|Blocked|Done|Ready]  Desk List Map  +New  Map
Packages · dependencies · next actions

FOCUS  [ All | Ready | My next | Waiting | Overdue | Due 7d ]
FILTERS  [ Search… ] [ Priority ] [ Assignee ]
```

## P0 dashboard chrome

```text
NEXT UP  3 ready · 2 waiting · 1 critical · $1.2k open · next due Fri
[ Ready 3 ] [ Waiting 2 ] [ Overdue 1 ] [ My next n ]  Unassigned 2 · No estimate 4

MY QUEUE
1. Legal review     Waiting on: Vendor  · Discovery · Due Thu
2. UI polish        Ready · Mine
…
```

Expand adds: Package name · Blocked by (status+open) · Blocks (status+open).

## P2 time window + saved views

```text
WINDOW  [ All | This week | 2 weeks ]
VIEWS   [ Load view… ▾ ] [ Save view ] [ Delete ]

Package subline includes: Updated {relative}
```

Time window filters by due/start (keeps overdue + undated). Saved views persist focus + window + search/priority/assignee in localStorage.

## P1 hygiene + package health

```text
NEEDS ATTENTION
[ 2 unassigned ] [ 1 overdue ] [ 3 no due ] [ 1 empty package ]  [× dismiss]

▼ ▣ Discovery  [AT RISK]
  …
  ⚠ 2 open risks · highest: Schedule slip (16)   → risk panel
```

Health: Done | On track | At risk | Blocked

## Package lane (detailed)

```text
▼ ▣ Discovery
  4 tasks · 2 open · 1 ready · 1 waiting · 1 critical
  3 wired · 12h left · 1 unassigned
  [1 ready][1 wait][1 crit][1 risk][$4.2k]   ████ 40%   [+ Add]
```

## Task row (columns + secondary detail)

```text
STATUS │ TASK (+ expand)              │ SIGNAL │ PRI │ OWNER │ DUE │ EST │ DEPS │ MOVE
To do  │ ▸ Vendor contract            │ Ready  │ HI  │ Alex  │ …   │ 8h  │ 0↑2↓ │ [··][Map]
       │   ◆ Milestone · ✓2/5 · $1.2k · ▶ start
       │   Waiting on: Legal review   (if blocked by deps)
```

Chevron expands inline panel: Plan / Actual / Schedule (ES·EF·float) / Window / description / checklist / Open detail · Map.

## Hierarchy
- Same-package dependency parents above children; indent depth 1–4.
- Cross-package blockers show as “Waiting on: …” only.

## Width
- Desk card padding zeroed; fills project center.
- Package body min-width ~980px with horizontal scroll if needed.
- Hide workspace nav for even more width.


## Desk connect (no graph required)

- Expand row → **Add parent** / **Add child** selects + Link
- Unlink × on parent/child chips
- Row **link** icon → connect mode → **Parent**/**Child** pick on another row
- Uses same `dependsOnTaskIds` + cycle check as map wiring
