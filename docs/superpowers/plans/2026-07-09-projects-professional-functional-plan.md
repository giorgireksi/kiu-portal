# Projects Studio — Professional Functional Plan

**Date:** 2026-07-09  
**Status:** Draft for review (product / functional — not an implementation checklist yet)  
**Scope:** Social nav **Projects** (`panel=workspace` only). Portfolio (`panel=projects`) is out of scope.  
**Goal:** Turn the current project studios into a product a campus team would trust for real collaboration — clear discovery, serious task delivery, and management-grade dependency visibility.

---

## 1. Current baseline (keep)

| Area | Already solid enough to build on |
|------|----------------------------------|
| **Hub** | Hero stats, “Your workspaces”, “Most active”, create workspace |
| **Detail** | Rich hero, metric strip, tabs: overview / team / tasks / chat / activity / budget |
| **Tasks** | 4-status kanban, filters, checklist, assignee, due, priority, create/edit/detail dialogs |
| **Graph** | Fullscreen dependency map with card nodes, link mode, health sidebar, detail rail |
| **Team** | Roles (owner/member/advisor/viewer), invite, promote/remove |
| **Budget** | Categories + expenses workflow |
| **Chat** | Workspace group chat |

Do **not** rebuild these from scratch. Professionalize around them.

---

## 2. What “professional” means here

A professional campus project product should let a user answer these in under 10 seconds:

1. **What should I work on?** (my tasks, due soon, blocked)
2. **Is this project healthy?** (overdue, unassigned, blocked, budget, activity)
3. **Who owns what?** (roles, workload balance)
4. **What depends on what?** (blockers and critical path)
5. **How do I join / start something real?** (discover, filter, apply or invite)

Everything below maps to those five questions.

---

## 3. Functional pillars (what to add)

### P1 — Discovery hub (highest product gap)

**Problem:** Hub is a thin list. Wireframe exists; live UI does not match. Finding and starting work feels amateur.

| Capability | Description | User value |
|------------|-------------|------------|
| **Global search** | Search name, summary, skills, faculty, owner | Find work without scrolling |
| **Filter rail** | My projects · Status · Faculty · Skills · Role (owner/member) · Recruiting | Self-serve discovery |
| **Rich project cards** | Status, progress %, members capacity, 2–3 skill chips, last activity, role badge | Decide without opening |
| **View modes** | Grid (default) + List (dense for managers) | Power users + scan |
| **Saved personal scope** | “Mine only” / “All campus” / “My faculty” as sticky chips | Faster return visits |
| **Right context rail** | Trending by activity, recommended by skills/faculty, **My contribution** (active projects, tasks done, overdue) | Engagement + ownership |
| **Empty & first-run** | Clear CTA: create workspace / join recommended / browse by faculty | Onboarding that feels productized |
| **Recruiting signal** | Badge when seats open (`members < capacity`) + optional “Request to join” | Real campus collaboration |

**Out for P1:** AI recommendations, external project marketplace.

---

### P2 — Personal work command center (inside product)

**Problem:** Overview “My tasks” is display-only; no cross-project “what’s mine today”.

| Capability | Description | User value |
|------------|-------------|------------|
| **My Work inbox** | Hub section or detail shortcut: all assigned tasks across my workspaces, sorted by due/priority | Daily driver |
| **Attention queue** | Overdue · Due today · Blocked · Unassigned (managers only) | Prevent silent failure |
| **Click-through** | Every task row opens task detail (or deep-links to project + task) | No dead UI |
| **Mark done / bump status from list** | One-click status without opening full board | Speed |
| **Digest strip on hub** | “3 overdue · 2 due today · 1 blocked” with jump links | Professional dashboard feel |

---

### P3 — Task delivery (board + list + process)

**Problem:** Kanban exists but feels mid-fidelity: no DnD, no list mode, incomplete filters, weak process cues.

| Capability | Description | User value |
|------------|-------------|------------|
| **Drag-and-drop columns** | Drag cards between todo / in-progress / blocked / done (with permission check) | Expected PM standard |
| **List / Board / Graph modes** on Tasks tab | Toggle; persist last choice per user | Same data, three work styles |
| **Complete filters** | Include `urgent` priority; add “unassigned”, “overdue”, “has dependencies” | Real triage |
| **Bulk actions** (managers) | Multi-select → assign, set due, set status, delete | Team ops |
| **Task templates** | “Meeting notes”, “Deliverable”, “Review”, custom checklist presets | Faster create |
| **Dependency UI on card** | Small “blocked by N / blocks M” chips; open graph focused on node | Graph not isolated |
| **Assignee workload hint** | On assign picker: open task count for that member | Fair distribution |
| **Activity on task** | Short trail: created, status changes, assignee changes | Accountability |
| **Notifications hooks** | Notify assignee on assign/due soon/blocked (even if channel is toast + activity first) | Professional ops |

**Keep:** 4 statuses only (no backlog revival).  
**Defer:** custom columns, story points, sprints (unless faculty explicitly needs them later).

---

### P4 — Project health & lifecycle (manager grade)

**Problem:** Metrics exist but are passive; lifecycle is soft (idea/active/review/completed) without gates.

| Capability | Description | User value |
|------------|-------------|------------|
| **Health scorecard** | One card: completion %, overdue, blocked, unassigned, budget burn, last activity age | Instant “is it OK?” |
| **Status transition rules** | e.g. complete only if open tasks = 0 (soft warn or hard block, configurable) | Prevent fake “done” |
| **Milestones (lightweight)** | Named dates with linked tasks (not full Gantt) — revive concept without old tab bloat | Deadlines that matter |
| **Risk flags** | Auto: no activity 7d, >N overdue, budget over cap, single-person bottleneck | Early warning |
| **Export summary** | PDF/print-friendly one-pager: goal, team, progress, open risks | Advisor / course reporting |
| **Archive vs delete** | Soft archive hide from hub; restore; hard delete only for owner | Safety |

---

### P5 — Graph as management tool (next layer on existing canvas)

**Problem:** Graph is already strong visually; still weak as a *managed* artifact.

| Capability | Description | User value |
|------------|-------------|------------|
| **Persist layout** | Save node positions server-side per project | Layout not lost on reload |
| **Critical path highlight** | Longest dependency chain + overdue on path | Manager scan |
| **Filter canvas** | My tasks only · overdue · blocked · by assignee | Reduce noise |
| **Focus mode** | Select node → dim non-neighbors lightly (not 0.22 wipe; keep current management style) | Dependency debugging |
| **Create edge confirm** | Clear “A blocks B” language + cycle error UX | Safer linking |
| **Protect bulk clear** | Confirm + optional undo window for “clear all deps” | Prevent accidents |
| **Snapshot / share view** | Read-only link or “copy graph summary” (task list + edges) for advisors | Teaching / review |

---

### P6 — Team & access (professional collaboration)

| Capability | Description | User value |
|------------|-------------|------------|
| **Join requests** | For faculty/public projects: request → owner approve/deny | Less awkward DMs |
| **Role matrix clarity** | Visible matrix: who can edit tasks, budget, settings, invite | Trust & security |
| **Guest / instructor view** | Read-only overview + tasks + graph; no mutations | Course advisors |
| **Pending invites UX** | Hub badge + in-project banner | Close the loop |
| **Ownership transfer** | Explicit handoff when owner leaves | Continuity |

---

### P7 — Files, brief, and communication (minimal but real)

Removed tabs left a hole. Professional teams need *light* structure, not LMS bloat.

| Capability | Description | User value |
|------------|-------------|------------|
| **Project brief as first-class** | Always visible summary + editable description + goals (not buried in `<details>` only) | Shared north star |
| **Pinned links / resources** | 5–15 links (Drive, GitHub, Figma) — not full file manager | 80/20 of “files” |
| **Chat deep links** | “Discuss task” opens chat with task mention | Close work ↔ talk loop |
| **Activity that matters** | Filter: membership / tasks / budget / settings; hide noise | Audit trail |

**Defer:** full document storage, meetings calendar, check-ins module (high cost, low uniqueness vs LMS).

---

### P8 — Polish & product integrity (quality bar)

Not features, but required for “professional”:

| Item | Why |
|------|-----|
| Rename/clarity: **Projects = workspaces**, Portfolio separate in copy everywhere | Cognitive safety |
| Fix flash/copy bugs (e.g. delete success saying “Portfolio entry removed”) | Trust |
| Remove dead UI (swimlane CSS, `renderSectionCommandCenter`, activity icons for removed tabs) | Clean surface |
| Keyboard: Esc close, `/` search focus, board arrow move keep working | Power users |
| Mobile: hub cards + task list mode first; graph as “open desktop-class” with usable compact fallback | Real usage |
| Loading / optimistic states on task move & invite | Feels alive |
| Empty states with **one** primary action each | No dead ends |
| Permission-aware CTAs (hide or disable with tooltip) | No false buttons |

---

## 4. Explicit non-goals (for this program)

- Replacing LMS courses, gradebook, or timetable  
- Full Jira (sprints, story points, custom workflows, SLA)  
- AI auto-planning of tasks (unless a later experiment)  
- Merging Portfolio media feed into Project Studios  
- Multi-workspace portfolio dashboards for admins (separate product)

---

## 5. Phased delivery (recommended order)

### Phase A — Foundation polish + My Work (2–3 slices)
1. Copy/IA clarity (Projects vs Portfolio)  
2. My Work / attention queue (hub + overview click-through)  
3. Task filter completeness + list mode on Tasks tab  
4. Dead code / dead tab icon cleanup  

**Success:** User can run a week of personal delivery without hunting.

### Phase B — Professional hub (main visual product jump)
1. Search + filters + rich cards + grid/list  
2. Right rail: contribution + trending  
3. Recruiting badge + join request (if public/faculty)  

**Success:** New user finds a relevant project and joins or creates in one session.

### Phase C — Task ops standard
1. Drag-and-drop kanban  
2. Bulk assign/status  
3. Card dependency chips + deep-link to graph  
4. Lightweight task activity trail  

**Success:** Board feels like a modern tool, not a prototype.

### Phase D — Manager & graph trust
1. Persist graph positions  
2. Health scorecard + risk flags  
3. Critical path + canvas filters  
4. Soft archive + export summary  

**Success:** Advisor/owner can review project health without asking the team in chat.

### Phase E — Collaboration depth (optional next)
1. Role matrix UX  
2. Ownership transfer  
3. Pinned resources  
4. Task ↔ chat mentions  

---

## 6. Priority matrix (impact vs effort)

| Priority | Capability | Impact | Effort | Phase |
|----------|------------|--------|--------|-------|
| **Must** | Hub search + filters + rich cards | Very high | Medium | B |
| **Must** | My Work / attention queue | Very high | Low–Med | A |
| **Must** | Task list mode + full filters + click-through | High | Low | A |
| **Must** | DnD kanban | High | Medium | C |
| **Must** | Graph position persist | High | Medium | D |
| **Must** | Health scorecard + risks | High | Low–Med | D |
| **Should** | Join requests + recruiting | High | Medium | B |
| **Should** | Bulk task actions | Medium–High | Medium | C |
| **Should** | Dependency chips on cards | Medium | Low | C |
| **Should** | Critical path on graph | Medium–High | Medium | D |
| **Should** | Archive + export summary | Medium | Medium | D |
| **Could** | Task templates | Medium | Low | C |
| **Could** | Pinned resources | Medium | Low | E |
| **Could** | Milestones (lightweight) | Medium | Medium | D/E |
| **Won’t (now)** | Full files/meetings/check-ins tabs | — | High | — |
| **Won’t (now)** | Custom statuses / sprints | — | High | — |

---

## 7. Data / API needs (functional, not code)

| Need | Why | Notes |
|------|-----|--------|
| Persist `graphPositions` on project (or per-user layout) | Graph trust | New field or small table |
| Join request entity | Public/faculty recruiting | status: pending/approved/denied |
| Soft `archivedAt` on project | Lifecycle | Filter out of default hub |
| Task activity events (or reuse project activity with taskId) | Audit | May already partially exist via activities |
| Hub filter query params or UI state keys | Shareable/filtered views | Client-first OK initially |
| Optional `milestones[]` | Lightweight deadlines | Only if Phase D includes them |

Existing APIs already cover: CRUD projects, members, tasks, deps, budget, showcase.

---

## 8. UX principles for all new work

1. **One primary action per surface** (Create / Open / Join / Add task).  
2. **Scan first, edit second** — cards and boards show health without opening.  
3. **No dead lists** — every row is actionable.  
4. **Permissions visible** — don’t show fake power.  
5. **Reuse lux / social-project tokens** — professional = consistent, not a new theme.  
6. **Progressive density** — hub rich; board dense; graph immersive.  
7. **YAGNI on process** — 4 statuses, optional milestones, no enterprise workflow engine.

---

## 9. Success metrics (qualitative + simple quantitative)

| Signal | Target |
|--------|--------|
| Time to find a project | &lt; 15s with search/filter |
| Time to update task status | &lt; 2s (DnD or list) |
| Manager health check | Possible from overview without chat |
| Graph after reload | Layout preserved |
| New user first action | Create or join without help text wall |
| Support confusion “Projects vs Portfolio” | Near zero after copy pass |

---

## 10. Suggested decision points (need your call before build)

1. **Hub ambition:** Full 3-column wireframe (filters + grid + right rail) vs lighter 2-column (filters + grid only)?  
2. **Join model:** Invite-only stays default, or open “Request to join” for faculty/public?  
3. **Complete project rule:** Soft warning vs hard block when open tasks remain?  
4. **Graph layout ownership:** Shared project layout vs per-user layout?  
5. **Phase order:** Prefer **hub beauty first** (B) or **personal My Work first** (A)?

---

## 11. Recommended starting package (if you want one default)

**Ship first (maximum professional feel per effort):**

1. Phase A: My Work + attention + task list/filters + IA copy  
2. Phase B: Discovery hub (search, filters, rich cards, contribution rail)  
3. Phase C: DnD + dependency chips  
4. Phase D: Graph persist + health scorecard  

That sequence turns the product from “feature-rich prototype” into “campus project studio” without rebuilding Portfolio or inventing Jira.

---

## 12. Related docs

- `projects-wireframe.md` — hub layout target  
- `docs/superpowers/specs/2026-07-08-task-graph-management-design.md` — graph visual language (largely done)  
- Live UI: `renderProjectsWorkspacePanelClassic` in `assets/js/pages/social-page.js`  
- Styles: `assets/css/social-projects-lms.css`

---

**Next step after approval:** turn chosen phases into a bite-sized implementation plan (files, tests, commits) — one phase at a time.
