# Social route architecture

Live stack for `social.html` (campus social). Orphan runtimes (`public-social-runtime.js`, `social-canonical.js`) are removed; do not reintroduce.

## Boot chain

```
social-standalone-bootstrap.js
→ api / auth / state / faculty / utilities / navigation / luxury chrome
→ social-runtime-lite.js   (state + API + queueRender)
→ social-mobile.js         (static #mobile-bottom-nav + action sheet)
→ portfolio/* (eager; lazy later)
→ social-render-plan.js    (eager: reason→region paint plan)
→ social-page.js           (orchestrator + shell glue; domain click/submit handlers in modules)
→ lazy: social-{community,alerts,lost-found,photography,surveys,messages,profile,events,groups,feed,pages,workspace}.js
```

Render bridge: `queueRender` → `window.__kiuSocialLiteRenderPage` (`renderSocialPageNow`).

## Panel ids

| id | UI label | Owner |
|----|----------|--------|
| `feed` | Home | social-feed.js (hero + panel + post card + comments + **reaction/save patches** + saved-post hub helpers + compose/attach + handlers); page thin-stubs; dispatches via `isSocialFeedClickAction` |
| `community` | People | social-community.js (panel + **`renderRelationshipActions`** + `handleSocialCommunityClick` for `connection-*`/`person-*`); page thin-stubs / dispatches |
| `groups` | Groups | social-groups.js (hero + panel + create/detail/leave/invite + group-panel dialogs via `renderGroupOwnedDialog` + `handleSocialGroupsClick` for `group-*` actions); page dispatches via `isSocialGroupsClickAction` |
| `workspace` | Projects | social-workspace.js (render stack + **desk readiness/filter + tab pane cache/patch + desk refresh** + `handleSocialWorkspaceClick` / `Submit` / `Input` / `Change`); page thin-stubs / dispatches |
| `projects` | Portfolio | social-workspace.js (panel/editor + shared workspace handlers); page thin stubs for remaining shell glue |
| `pages` | Pages | social-pages.js (hero + panel + create/post-compose/about/members via `renderPagesOwnedDialog` + `handleSocialPagesClick` for `page-*` / `pages-search-clear`); page dispatches via `isSocialPagesClickAction` |
| `events` | Events | social-events.js (hero + panel + create/edit + `handleSocialEventsClick` for `event-*`/`events-*`); page dispatches via `isSocialEventsClickAction` |
| `surveys` | Surveys | social-surveys.js (panel + hero + create dialog + `handleSocialSurveysClick` for `survey-*`/`surveys-*`); page dispatches via `isSocialSurveysClickAction` |
| `photography` | Exposé | social-photography.js (`handleSocialPhotographyClick` for `photography-*`); page dispatches via `isSocialPhotographyClickAction` |
| `lost-and-found` | Lost & Found | social-lost-found.js (panel + hero + create/confirm + `handleSocialLostFoundClick` for `lost-found-*`); page dispatches via `isSocialLostFoundClickAction` |
| `messages` | Messages | social-messages.js (`handleSocialMessagesClick` for message/chat/call/thread + directory-message); page dispatches via `isSocialMessagesClickAction` |
| `alerts` | Alerts | social-alerts.js (`handleSocialAlertsClick` for notifications/report-resolve); page dispatches via `isSocialAlertsClickAction` |
| `profile` | Profile | social-profile.js (`handleSocialProfileClick` for `profile-*`); page dispatches via `isSocialProfileClickAction` |

## Shell regions

`#social-neo-flash-region`, `#social-neo-topbar-region`, `#social-neo-command-region`,
`#social-neo-workspace-nav-region`, `#social-neo-center-region`, `#social-neo-drawer-region`,
`#social-neo-mobile-tab-region` (kept empty — mobile uses `#mobile-bottom-nav`),
`#social-neo-toast-region`, overlay portal (dialog / story slots retired).

## Backend domains

| Service | File |
|---------|------|
| state / bootstrap / lost-found | `social-state-service.js` |
| posts, pages, groups, events, reports, profiles | `social-content-service.js` |
| projects, tasks, budget, risks, graph | `social-projects-service.js` |
| connections, follows | `social-relationships-service.js` |
| surveys | `social-surveys-service.js` |
| portfolio documents | `portfolio-service.js` |
| HTTP | `routes/social-routes.js` (~71 endpoints under `/api/social/*`) |


## Domain action ownership

Each lazy domain module owns:

- `handle*Click` / `is*ClickAction` for UI actions
- `handle*Submit` / `is*SubmitForm` for `data-form` posts
- `handle*Input` / `is*InputTarget` and `handle*Change` / `is*ChangeTarget` when the domain has live fields
- workspace also owns project/portfolio input/change and the bulk of project/portfolio render

`social-page.js` dispatches via `routeSocialDomain` (click/submit/input/change) and keeps shell-only handlers (`panel-*` via `beginShellPanelTabSwitch` where shared, nav, dialog-close) plus shared patch/boot glue.

## Contribution rule (do not regress)

**Domain logic never lands in `social-page.js`.**

| Belongs on the page (shell) | Belongs in a domain module |
|-----------------------------|----------------------------|
| Boot, event binding, overlay portal | Click / submit / input / change for that panel |
| `panel-*` navigation, drawer, workspace-nav chrome | Panel/hero markup and domain dialogs |
| `routeSocialDomain` + `ensure*Module` / `has*Module` | Business rules, API calls for that domain |
| Shared flash/toast/dialog shell helpers | Domain-owned render + patches |

When editing a domain, prefer **one** implementation: delete thin page stubs that only forward to `window.handleSocial…` if the module is already SSOT. Update dual-source tests (page **or** module) in the same change.

### PR checklist (social)

1. Which **domain** owns this change?
2. Did logic land on **`social-page.js`**? If yes, is it truly shell?
3. Dual-source / regression tests updated?
4. Can a new dev find the handler in **under two minutes**?

## Domain module export contract

Every lazy domain file should expose the same shape (names use the domain PascalCase token, e.g. `Feed`, `LostFound`, `Workspace`):

```
isSocialXClickAction / handleSocialXClick
isSocialXSubmitForm / handleSocialXSubmit     (omit only if domain has no forms)
isSocialXInputTarget / handleSocialXInput     (omit only if no live input)
isSocialXChangeTarget / handleSocialXChange   (omit only if no file/select change)
render* panel / owned dialogs as applicable
window.__KIU_SOCIAL_X_MODULE_LOADED = true
```

Page responsibilities stay limited to:

- matching via `is*` (with prefix fallbacks when module not loaded)
- calling `handle*` after `has*Module` / `ensure*Module`
- shell `panel-*`, nav, dialog-close, boot

Template modules for copy-paste consistency: `social-feed.js`, `social-events.js`.

## Quality roadmap (A+)

1. **Ship & freeze** — this doc + modularization commit; boundary rule above. *(done)*
2. **Stub death on touch** — remove dual paths when a domain is edited (no mega-PR).
3. **Uniform exports** — audit all 12 domains against the contract; locked by `test/social-domain-export-contract.test.js`. *(done)*
4. **Workspace split** — when next editing workspace, extract one seam (see below); keep `handleSocialWorkspace*` as façade.
5. **Shell thin** — only if glue still blocks work; success = zero domain business rules on the page.

Gates: `npm run test:social` (or `node node_modules/vitest/vitest.mjs run test/social-*.test.js`). Do not extract for line-count vanity.

## Workspace internal seams (split candidates)

`social-workspace.js` stays one public entry (`handleSocialWorkspaceClick` / `Submit` / `Input` / `Change`). Prefer extracting **one** seam per PR when product work lands there:

| Seam | What lives there | Split priority |
|------|------------------|----------------|
| **task-graph** | Graph SVG/canvas, edges, inspector rail, fullscreen, PERT/CPM helpers | Highest (largest surface) |
| **task-desk** | Desk tree/cards, week plan, matrix/board views; **owned:** `resolveDeskTaskReadiness`, board filter/sort, tab pane cache, `refreshProjectTasksTabBody/Pane`, `patchProjectWorkspaceTab`, `revealDeskExpandTarget` | High — first seam extracted (logic + patch helpers on module; page stubs) |
| **budget / actuals** | Budget settings, expenses, plan vs baseline strips | Medium |
| **risks** | Risk list/register UI | Medium |
| **portfolio** | Portfolio discover/editor panels shared with `projects` panel | Medium |
| **team / chat** | Members, invites, project chat parity | Lower unless messaging changes |
| **public handlers** | `is*` / `handle*` façade only — stay in workspace entry file | Never extract away |

Do **not** move workspace domain logic back into `social-page.js`.

## Verification

```bash
npm run test:social
# with server:
npm run verify:social
```
