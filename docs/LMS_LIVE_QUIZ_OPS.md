# LMS Live Quiz — operations and QA

## Required data for a working session

Live Quiz scope keys look like `ECON-DEMO-101::G1__lmssec_lecture` (course, group, section type).

| Layer | What must exist |
|-------|-----------------|
| **Professor access** | Account on the **group roster** (`portal.state.availableGroups[courseId]` with matching `professorId`), **or** `sections[*].professorId`, **or** LMS `teachingTeam`, **or** portal curriculum staff for that course/group |
| **Student access** | Backend `enrollments` row for the student with `courseId` + section/group matching the resource key |
| **Browser roster (UI)** | `KIU_STATE.availableGroups[courseId]` and student grades/schedule so `getLmsQuizEligibleStudents` is non-empty |
| **Server roster (answers)** | Participants seeded when staff goes **live** (`ensureLmsLiveRosterParticipants` + successful sync). Students can also be auto-provisioned on first answer if the session is already live |

## Recommended QA accounts (local demo state)

| Role | Account id | Notes |
|------|------------|--------|
| Professor | `admin-testing-econ-professor` | QA persona on ECON testing rosters |
| Student | `admin-testing-econ-student` | Paired QA student |
| Alternative | `econ-professor-demo` / `econ-student-demo` | Only if assigned to the **same** `courseId::group` you open in LMS |

Avoid using a professor who appears in the UI but is **not** on the backend roster for that group (symptom: `403` / “access denied”).

## Manual two-browser checklist

1. Hard-refresh both browsers (`lms.html` scripts use `?v=20260604-livequiz-complete1`).
2. Professor: open LMS → same subject/group/section → **Live Quiz** tab.
3. **New session** → add question → **Start live session** (or **Show**).
4. Confirm sync banner shows **Synced with server** and roster panel shows `N of M roster students`.
5. Student: same group/section → Live Quiz → answer the active question.
6. Professor: within ~1–2s, leaderboard / “answered” counts update (no full tab refresh required).
7. Professor edits session title while student answers: student answers must still appear.

## Automated checks

```bash
# Store + merge integration
npm test -- --run test/lms-live-quiz-integration.test.js test/lms-live-quiz-http-e2e.test.js

# Dual-browser UI smoke (static server + mocked live-quiz API; professor answered-count refresh)
npm run test:live-quiz-smoke

# Real HTTP answer path (isolated platform server + roster seed state)
npm run test:live-quiz-http-e2e

# Full runtime shell suite (includes other routes)
npm run test:runtime-shell
```

## HTTP API (multiplayer)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/lms/live-quizzes/:resourceKey` | Staff or enrolled student |
| POST | `/api/lms/live-quizzes/:resourceKey` | Staff full workspace merge; student answer merge via body |
| POST | `/api/lms/live-quizzes/:resourceKey/answers` | Student only — `{ sessionId, questionId, selectedOption }` |

Session header: `x-portal-session: <token>` (or `Authorization: Bearer <token>`).

## Admin testing helper

On the Live Quiz tab, admins (not view-as) see **Seed roster for testing**, which runs `ensureLmsLiveRosterParticipants` and syncs to the backend.