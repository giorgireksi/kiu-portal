# Projects Studio — Structure Wireframes (ASCII)

**Date:** 2026-07-09  
**Scope:** Nav **Projects** (`panel=workspace`) — hub, project detail, tasks, graph  
**Out of scope:** Portfolio (`panel=projects`)

These wireframes describe **layout structure and hierarchy**, not final visual polish.

---

## 0. Navigation context

```text
┌─ Social shell ─────────────────────────────────────────────────────────────┐
│  [Feed] [People] [Projects★] [Portfolio] [Events] …                        │
│                         ▲                                                   │
│                    panel = workspace                                        │
└────────────────────────────────────────────────────────────────────────────┘

  No activeProjectId  →  HUB (discovery)
  activeProjectId set →  PROJECT DETAIL (tabs)
  dialog project-task-graph → FULLSCREEN GRAPH (overlay)
```

---

## 1. Projects hub (discovery)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  PROJECTS HUB                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ Hero ────────────────────────────────────────────────────────────────┐   │
│  │  Campus Workspaces · Project Studios                                  │   │
│  │  [ Search projects, skills, people… ____________________ ]  [+ Create]│   │
│  │  Stats: Workspaces | Active | Your roles | Tasks | Overdue attention  │   │
│  │  Attention:  3 overdue · 2 due today · 1 blocked   [ Open My Work → ] │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Scope chips:  ( Mine )  ( Faculty )  ( All campus )  ( Recruiting )         │
│                                                                              │
│  ┌─ Filters ─────┐  ┌─ Main (grid | list) ─────────────┐  ┌─ Context ────┐  │
│  │ MY PROJECTS   │  │  [Grid] [List]   sort: activity ▾ │  │ MY WORK      │  │
│  │  • Active (3) │  │                                   │  │  Task A  !   │  │
│  │  • Review (1) │  │  ┌──────────┐  ┌──────────┐       │  │  Task B due  │  │
│  │               │  │  │ ALPHA    │  │ DATA HUB │       │  │  [See all →] │  │
│  │ FACULTY       │  │  │ Active   │  │Recruiting│       │  ├─────────────┤  │
│  │  ☑ ECON       │  │  │ ████░ 62%│  │ ██░░░░ 20%│       │  │ TRENDING     │  │
│  │  ☐ CS         │  │  │ 4/8  · AI│  │ 2/5 · Py  │       │  │  1. Eco app  │  │
│  │               │  │  │ [Open →] │  │ [Open →] │       │  │  2. AI bot   │  │
│  │ SKILLS        │  │  └──────────┘  └──────────┘       │  ├─────────────┤  │
│  │  ☐ Python     │  │  ┌──────────┐  ┌──────────┐       │  │ FOR YOU      │  │
│  │  ☐ React      │  │  │ …        │  │ …        │       │  │  based on    │  │
│  │               │  │  └──────────┘  └──────────┘       │  │  skills      │  │
│  │ STATUS        │  │                                   │  ├─────────────┤  │
│  │  ☑ Active     │  │  [ Load more ]                    │  │ CONTRIBUTION │  │
│  │  ☐ Idea       │  │                                   │  │  3 active    │  │
│  │  ☐ Review     │  │                                   │  │  12 done     │  │
│  │  ☐ Done       │  │                                   │  │  2 overdue   │  │
│  └───────────────┘  └───────────────────────────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Hub card anatomy

```text
┌─────────────────────────────┐
│ [emoji/icon]  Project name  │
│ ● Active          role:Owner│
│ summary line clamped…       │
│ ████████░░  62% · 5 tasks   │
│ 👥 4/8   🏷 AI · Research   │
│ updated 2h ago              │
│              [ Open → ]     │
└─────────────────────────────┘
```

### Hub list row (dense)

```text
│ ● Active │ Project Alpha     │ 62% │ 4/8 │ Owner │ 2 overdue │ Open → │
```

---

## 2. Project detail shell

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  [ ← Back to Projects ]                                                      │
│                                                                              │
│  ┌─ Detail hero ─────────────────────────────────────────────────────────┐   │
│  │  Project Alpha                    [Chat] [Tasks] [Settings] [Showcase]│   │
│  │  ● Active · Owner · ECON · skills…                                    │   │
│  │  summary…                                                             │   │
│  │  👤 Owner name · 4 members                                            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Dashboard strip ─────────────────────────────────────────────────────┐   │
│  │  ( 62% )   Budget 40%   Team mix   ▁▂▄█▃ activity 7d   ⚠ 2 overdue   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Tabs:  ( Overview )  Team  Tasks  Chat  Activity  Budget                    │
│  ════════════════════════════════════════════════════════════════════════    │
│  │                                                                       │   │
│  │                    [ active tab content ]                             │   │
│  │                                                                       │   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Overview tab

```text
┌─ Overview ───────────────────────────────────────────────────────────────────┐
│                                                                              │
│  LEFT (work)                          RIGHT (people / pulse)                 │
│  ┌────────────────────────────┐       ┌────────────────────────────┐         │
│  │ MY TASKS                   │       │ TEAM ROSTER                │         │
│  │  ☐ Ship wireframes  today  │       │  👤 Ana · Owner            │         │
│  │  ☐ API review    overdue!  │       │  👤 Beka · Member · 3 open │         │
│  │  [ Open all on board → ]   │       │  [ Invite ]                │         │
│  └────────────────────────────┘       └────────────────────────────┘         │
│  ┌────────────────────────────┐       ┌────────────────────────────┐         │
│  │ HEALTH                     │       │ WORKLOAD                   │         │
│  │  done 5 · prog 2 · block 1 │       │  Ana ████░                 │         │
│  │  unassigned 1 · overdue 2  │       │  Beka ██░░░                │         │
│  └────────────────────────────┘       └────────────────────────────┘         │
│  ┌────────────────────────────┐       ┌────────────────────────────┐         │
│  │ TASK FLOW MAP (preview)    │       │ ACTIVITY                   │         │
│  │  [mini graph cards]        │       │  · Beka moved task…        │         │
│  │  [ Expand graph → ]        │       │  · Ana joined…             │         │
│  └────────────────────────────┘       └────────────────────────────┘         │
│  ┌────────────────────────────┐                                              │
│  │ STATUS CHART  todo|prog|…  │   BRIEF (collapsible) · QUICK ACTIONS        │
│  └────────────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tasks tab — structure

### 4.1 Tasks chrome (shared for all modes)

```text
┌─ Tasks tab ──────────────────────────────────────────────────────────────────┐
│  Stats:  Total 12  ·  Overdue 2  ·  In progress 3  ·  Blocked 1  ·  Done 5   │
│                                                                              │
│  [ + Create task ]                                                           │
│                                                                              │
│  Filters:  ☑ My tasks   Search [________]   Priority ▾   Assignee ▾          │
│            ☐ Unassigned  ☐ Overdue  ☐ Has deps                               │
│                                                                              │
│  View mode:  ( Board )  List  Graph-preview                                  │
│              ─────────                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Board mode (kanban)

```text
┌─ Board ──────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─ TO DO (3) ──┐  ┌─ IN PROGRESS (2) ┐  ┌─ BLOCKED (1) ─┐  ┌─ DONE (5) ──┐ │
│  │              │  │                  │  │               │  │             │ │
│  │ ┌──────────┐ │  │ ┌──────────────┐ │  │ ┌───────────┐ │  │ ┌─────────┐ │ │
│  │ │ Task card│ │  │ │ Task card    │ │  │ │ Task card │ │  │ │ Task    │ │ │
│  │ │ P:high   │ │  │ │ P:urgent     │ │  │ │ blocked by│ │  │ │ ✓       │ │ │
│  │ │ 👤 Ana   │ │  │ │ 👤 Beka      │ │  │ │ 2 deps    │ │  │ └─────────┘ │ │
│  │ │ due Fri  │ │  │ │ due today    │ │  │ └───────────┘ │  │     …       │ │
│  │ │ dep ·1   │ │  │ └──────────────┘ │  │               │  │             │ │
│  │ └──────────┘ │  │        ↕ drag    │  │               │  │             │ │
│  │     ↕ drag   │  │                  │  │               │  │             │ │
│  │ [ + Add ]    │  │ [ + Add ]        │  │ [ + Add ]     │  │ [ + Add ]   │ │
│  └──────────────┘  └──────────────────┘  └───────────────┘  └─────────────┘ │
│                                                                              │
│  Drag card across columns = change status (permission-checked)               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Task card anatomy

```text
┌────────────────────────────────┐
│ Title of the task (2 lines)    │
│ [high]  checklist 2/4   #tag   │
│ 👤 Ana          due Fri  · !   │
│ ⛓ blocked by 1 · blocks 2     │  ← opens graph focused on this node
│ [←] [→]  [edit] [delete]       │  ← keep; DnD is primary move
└────────────────────────────────┘
```

### 4.4 List mode

```text
┌─ List ───────────────────────────────────────────────────────────────────────┐
│  ☐ │ Status      │ Title              │ Priority │ Assignee │ Due    │ Deps │
│  ──┼─────────────┼────────────────────┼──────────┼──────────┼────────┼──────│
│  ☐ │ In progress │ API contract       │ urgent   │ Beka     │ Today  │ →2   │
│  ☐ │ Blocked     │ Design tokens      │ high     │ Ana      │ -2d    │ ←1   │
│  ☐ │ To do       │ User testing       │ medium   │ —        │ Fri    │ —    │
│  ☑ │ Done        │ Kickoff notes      │ low      │ Ana      │ —      │ —    │
│                                                                              │
│  Bulk (when selected):  [ Assign ▾ ] [ Status ▾ ] [ Due ] [ Delete ]         │
│  Click row → task detail dialog                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Graph-preview mode (embedded on Tasks tab)

```text
┌─ Graph preview ──────────────────────────────────────────────────────────────┐
│  Task flow map · 12 nodes max shown                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │     [card]──explicit──►[card]                                          │  │
│  │        │                  │                                            │  │
│  │      flow               flow                                           │  │
│  │        ▼                  ▼                                            │  │
│  │     [card]            [card]                                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  [ Expand fullscreen graph → ]                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Fullscreen task graph (dialog)

```text
┌─ GRAPH DASHBOARD (fullscreen overlay) ───────────────────────────────────────┐
│  Project Alpha · Task graph                                                  │
│  12 tasks · 2 blocked · 2 overdue          Mode: ( View ) Link               │
│  [ − ] [ Fit ] [ + ]     [ Hide panel ]                          [ ✕ Close ] │
├──────────────┬────────────────────────────────────────────┬──────────────────┤
│ SIDEBAR      │ CANVAS STAGE                               │ DETAIL RAIL      │
│              │                                            │                  │
│ HEALTH       │  pan: RMB / middle · zoom: ± / fit         │ SELECTED TASK    │
│  todo 3      │                                            │ ─────────────    │
│  prog 2      │     ┌────────┐      explicit      ┌──────┐ │ Title            │
│  block 1     │     │ Card A │ ─────────────────► │Card B│ │ Status · Pri     │
│  done 5      │     │ stripe │                    │      │ │ 👤 Assignee      │
│  overdue 2   │     └────────┘                    └──────┘ │ Due · Deps       │
│  unassigned 1│           \                         ▲      │                  │
│              │            \ flow                  /       │ [ Open full ]    │
│ TOGGLES      │             ▼                     /        │ [ Edit ]         │
│  ☑ Overdue   │          ┌────────┐              /         │                  │
│  ☑ Blocked   │          │ Card C │◄────────────┘          │ Upstream: …      │
│  ☐ Inferred  │          └────────┘   inferred (dashed)    │ Downstream: …    │
│  ☐ My only   │                                            │                  │
│              │  · drag card = move layout (saved)         │ (empty:          │
│ LEGEND       │  · out-port → in-port = dependency         │  Select a task)  │
│  ─ explicit  │  · click card = select + rail              │                  │
│  ─ flow      │                                            │                  │
│  ┄ inferred  │                                            │                  │
│              │                                            │                  │
│ TOOLS        │                                            │                  │
│  Chain status│                                            │                  │
│  Promote flow│                                            │                  │
│  Clear deps… │  ← confirm required                        │                  │
│              │                                            │                  │
│ PROGRESS ▓▓▓ │                                            │                  │
├──────────────┴────────────────────────────────────────────┴──────────────────┤
│  [ + Add task ]   Hint: View = explore · Link = connect dependencies         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Graph card node (on canvas)

```text
┌─ status stripe ─────────────────────────┐
│ Task title two lines max…               │
│ [In progress]  👤 Ana   🕐 Fri          │
│            (in)○               ○(out)   │  ← link ports in link mode
└─────────────────────────────────────────┘
   ~200×76 full · ~160×64 compact preview
```

### Graph stacking (child dialogs)

```text
  ┌─ Graph (anchor, stays mounted) ─────────────────────────────┐
  │  …canvas…                                                   │
  │     ┌─ Task detail / create / delete (stacked child) ────┐  │
  │     │  form fields…                           [Save]     │  │
  │     └────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────┘
```

---

## 6. My Work (hub rail + optional expanded)

```text
┌─ My Work (expanded from hub) ────────────────────────────────────────────────┐
│  Across all your workspaces                                                  │
│  Filters: ( Overdue ) ( Today ) ( Blocked ) ( All assigned )                 │
│                                                                              │
│  OVERDUE                                                                     │
│  │ Project Alpha  │ API review      │ high   │ -2d  │ [board] [done]         │
│  │ Data Hub       │ Clean dataset   │ medium │ -1d  │ [board] [done]         │
│                                                                              │
│  DUE TODAY                                                                   │
│  │ Project Alpha  │ Ship wireframes │ urgent │ today│ [board] [done]         │
│                                                                              │
│  BLOCKED                                                                     │
│  │ Eco App        │ Deploy staging  │ high   │ —    │ [deps→graph]           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Team / Budget / Chat / Activity (structure only)

```text
TEAM
┌────────────────────────────────────────┐
│ Members list · role · open tasks       │
│ Invite search · pending requests       │
│ Leave / transfer ownership (owner)     │
└────────────────────────────────────────┘

BUDGET
┌────────────────────────────────────────┐
│ Cap · spent · remaining                │
│ Categories                             │
│ Expenses table · approve workflow      │
└────────────────────────────────────────┘

CHAT
┌────────────────────────────────────────┐
│ Workspace thread (existing messages)   │
│ Optional: “Discuss task” deep-link     │
└────────────────────────────────────────┘

ACTIVITY
┌────────────────────────────────────────┐
│ Timeline · filter: tasks|team|budget   │
└────────────────────────────────────────┘
```

---

## 8. Information architecture (tree)

```text
Projects (workspace)
├── Hub
│   ├── Hero + search + create
│   ├── Attention / My Work strip
│   ├── Filters (left)
│   ├── Project grid|list (center)
│   └── Context rail (My Work · Trending · For you · Contribution)
│
└── Project detail
    ├── Hero + dashboard strip
    ├── Overview
    │   ├── My tasks · Health · Flow preview · Status chart · Brief · Actions
    │   └── Team · Workload · Activity
    ├── Team
    ├── Tasks
    │   ├── Board (default)
    │   ├── List
    │   ├── Graph preview
    │   └── → Fullscreen graph dialog
    ├── Chat
    ├── Activity
    └── Budget
```

---

## 9. Primary user paths (structure)

```text
A. Discover → open
   Hub search/filter → card Open → Overview

B. Daily work
   Hub My Work / attention → task row → detail or board
   OR Project → Tasks → Board/List → move status

C. Dependencies
   Tasks card “deps” chip  ──┐
   Overview flow preview ────┼→ Fullscreen graph → select → edit/link
   Tasks “Graph” mode ───────┘

D. Create
   Hub [+ Create] → create dialog → new project detail
   Tasks [+ Create task] → task dialog (stackable over graph)
```

---

## 10. Responsive structure (mobile)

```text
HUB (mobile)
┌────────────────────┐
│ Hero (compact)     │
│ Search             │
│ Scope chips        │
│ Filters (sheet)    │
│ Card stack (1-col) │
│ My Work (collaps.) │
└────────────────────┘

PROJECT (mobile)
┌────────────────────┐
│ Hero compact       │
│ Strip scroll-x     │
│ Tabs scroll-x      │
│ Content            │
│ Tasks: List first  │
│ Board: horizontal  │
│ Graph: “Open full” │
│   (usable compact  │
│    or desktop hint)│
└────────────────────┘
```

---

## Related

- Functional plan: `docs/superpowers/plans/2026-07-09-projects-professional-functional-plan.md`
- Earlier hub wireframe: `projects-wireframe.md` (discovery only; this doc supersedes structure for tasks + graph)
- Graph visual language: `docs/superpowers/specs/2026-07-08-task-graph-management-design.md`
