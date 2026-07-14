# Student Service route architecture

Live stack for `student-service.html` (campus Student Service Center: tickets, Q&A, articles).

Backend domain ownership is already split (`backend/platform/domains/student-service-service.js` + routes). This document covers the **frontend** modularization campaign (post-social playbook).

## Boot chain

```
student-service.html
→ shell chrome (luxury / navigation)
→ student-service-api-paths.js
→ student-service.js          (orchestrator hub — boot, lanes, stores, ensure*, click routing)
→ lazy: student-service-service.js   (service lane shells)
→ lazy: student-service-qa.js        (Q&A lane shells)
→ lazy: student-service-filters.js     (inbox filters + editor)
→ planned lazy: student-service-attachments.js
→ planned lazy: student-service-tickets.js
```

Hub loads eagerly. Service and Q&A modules load via `ensureStudentServiceServiceModule` / `ensureStudentServiceQaModule` when the active lane needs them.

## Lanes

| Lane id | UI | Owner (today) |
|---------|-----|----------------|
| `service` | Tickets, inbox, guidance, staff workbench | Shells in `student-service-service.js`; most markup/helpers still hub |
| `qa` | Q&A feed / staff feed | Thin shells in `student-service-qa.js`; markup still hub |

Lane preference persists via `STUDENT_SERVICE_UI_PREFS_KEY` / `setStudentServiceLane`.

## Module table (target ownership)

| Module | Responsibility |
|--------|----------------|
| `student-service.js` | Boot, stores/bootstrap, lane chrome, modal root, ensure*, action dispatch, shared normalize until extracted |
| `student-service-service.js` | Service-lane shell mounts (student hub, my tickets, responder, staff workbench) |
| `student-service-qa.js` | Q&A-lane shell mounts; growing toward full Q&A markup/handlers |
| `student-service-filters.js` | Inbox filter layouts, published layout, dropdown/control markup, filter editor (lazy via `ensureStudentServiceFiltersModule`) |
| `student-service-attachments.js` *(planned)* | Attachment normalize + gallery/picker markup |
| `student-service-tickets.js` *(planned)* | Ticket/thread markup + ticket actions |

## Contribution rule (do not regress)

**Domain logic should not grow unbounded in `student-service.js`.**

| Belongs on the hub | Belongs in a domain module |
|--------------------|----------------------------|
| Boot, bootstrap, SSE/stores glue | Inbox filter layout + editor |
| Lane switcher / command bar / hero shell | Attachment gallery/picker |
| `ensure*Module` / lazy script load | Ticket thread/detail/reply UI |
| Shared UI state keys | Q&A feed/composer/thread markup |
| Thin stubs until module load | Domain click/submit handlers |

When editing a domain, prefer **one** implementation in its module. Update dual-source tests (hub **or** module) in the same change.

### PR checklist (student service)

1. Which **domain** owns this change?
2. Did logic land only on **`student-service.js`**? If yes, is it truly shell?
3. Dual-source / regression tests updated?
4. Can a new dev find the handler in **under two minutes**?

## Modularization roadmap

1. **Phase 0** — this doc + `npm run test:student-service` gate *(done)*  
2. **Phase 1** — extract inbox filters → `student-service-filters.js` *(done)*  
3. **Phase 2** — extract attachments → `student-service-attachments.js`  
4. **Phase 3** — tickets/thread domain module  
5. **Phase 4** — deepen Q&A module  
6. **Phase 5** — hub click-router compaction; optional articles/handoff  

## Verification

```bash
npm run test:student-service
# routes only:
npm run test:student-service-routes
# with live server (optional):
npm run test:student-service-http-e2e
npm run test:student-service-reply-e2e
```

## Relation to social

Same modularization contract as `docs/social-architecture.md`: lazy domain modules, hub orchestrator, dual-source source-locks, no big-bang rewrite.
