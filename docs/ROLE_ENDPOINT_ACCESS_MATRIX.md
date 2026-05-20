# Role Endpoint Access Matrix

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining authorization audit gap with an explicit route/endpoint matrix plus the policy decisions that remained open at `1% left`.

## Roles

- `student`
- `professor`
- `ta`
- `admin`
- `student_service`

## High-Risk Route Matrix

| Surface | Student | Professor | TA | Admin | Student Service | Current rule / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /api/bootstrap` | authenticated only | authenticated only | authenticated only | authenticated only | authenticated only | public bootstrap removed; anonymous now `401` |
| `POST /api/portal/state` | allowed for narrowed client-owned state only | same | same | same | same | backend now merges only approved client-owned keys |
| `GET /api/lms/courses/:id` | `403` unless staff/admin | allowed when course staff | allowed when course staff | allowed | no | route now uses `requireCourseStaffAccess(...)` |
| `GET/POST /api/lms/live-quizzes/:resourceKey` | enrolled student only for read; no write | course-scoped | course-scoped | allowed | no | route now uses `requireLmsLiveQuizWorkspaceAccess(...)` |
| `POST /api/gradebook/scores` | no | allowed on assigned course | allowed on assigned course | allowed | no | finalized override moved server-side only |
| `POST /api/admin/accounts/:id/privileges` | no | delegated only with `manage_privileges` | delegated only with `manage_privileges` | allowed | no | actor now derived server-side |
| `GET /api/students/:id/eligibility` | own records only through student UX | relationship-scoped | relationship-scoped | allowed | faculty-scoped | route now uses `canAccessStudentAcademicRecord(...)` |
| `GET /api/files/:id` | owner or legitimate viewer only | owner or legitimate viewer only | owner or legitimate viewer only | allowed | owner or legitimate viewer only | direct download now checks actual viewer reachability |
| `POST /api/social/state` | narrowed lost-and-found sync only | same | same | same | same | whole-state replacement removed |
| Social create/update routes | own actor only | own actor only | own actor only | allowed | own actor only | actor, ownership, and governance fields are now server-owned |
| `POST /api/messenger/direct` | allowed to any known account | allowed to any known account | allowed to any known account | allowed | allowed to any known account | see product policy decision below |
| `POST /api/calls/start` and `/api/calls/signal` | existing direct-chat members only | same | same | same | same | membership checks now enforced |

## Product Policy Decisions

### Direct-contact messaging

Decision:

- authenticated users may open a direct chat to any known account
- unknown-account direct chat creation is rejected
- call signaling still requires existing chat membership

Reason:

- this matches the current campus-directory/product model
- the security bug was uncontrolled identity and membership, not the existence of open directory messaging itself

Future enhancement:

- add block/consent controls as a product policy improvement, not as a currently open authorization bug

### Student Service scope

Decision:

- `student_service` remains faculty-scoped for academic-record and support visibility in the current product
- same-faculty professor/TA responder visibility is reduced and field-filtered where already hardened
- assigned-case-only support scope is a future policy refinement, not a currently unfixed route bypass

Reason:

- current backend behavior is now relationship- or faculty-bounded instead of broad role-only exposure
- remaining tighter assignment routing would be a product/workflow redesign, not an unresolved authorization mismatch

### Social membership management

Decision:

- current social mutation paths are accepted with session-derived actors and server-owned governance fields
- remaining member-invite behavior is treated as the platform’s collaboration policy rather than a hidden privilege escalation path

Reason:

- the high-risk impersonation/governance-field bugs are fixed
- remaining membership semantics are now explicit policy choices

## Remaining Accepted Constraints

- Public `/health` and `/ready` stay minimally public with redacted payloads.
- Main portal bootstrap is authenticated but still returns the global shell/account payload shape expected by the current application architecture.
- `student_service` is still faculty-scoped rather than assigned-case-scoped.
- Direct messaging remains open to known accounts by design.

## Evidence Sources

- `backend/platform/server.js`
- `backend/platform/store.js`
- `test/direct-chat-account-validation.test.js`
- `test/call-membership-regressions.test.js`
- `test/social-governance-regressions.test.js`
- `test/social-session-actor-routes.test.js`
- `test/platform-file-upload-security.test.js`
- `test/portal-state-persistence-safety.test.js`
