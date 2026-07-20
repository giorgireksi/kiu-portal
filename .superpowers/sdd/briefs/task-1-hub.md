# Task 1: Hub 3-column discovery

Read plan: `docs/superpowers/plans/2026-07-09-projects-structure-implementation.md` Task 1
Wireframe: `docs/superpowers/specs/2026-07-09-projects-structure-wireframes.md` §1, §6

## Location
- Hub markup: `renderProjectsWorkspacePanelClassic` when `!activeProject` (~line 8833)
- Card renderer: `renderProjectCard` inside same function
- Hero: `renderWorkspaceHero` (~10216) — may extend metrics for attention
- Handlers near `projectDiscoverSearch` (~18837)
- Fingerprint already has discover keys; add `projectHubViewMode`, `projectHubScope`, `projectHubStatus`

## Must update test
`test/social-workspace-hub-merge.test.js` currently requires "Your workspaces" and "Most active studios". Either keep those labels in new UI OR update test to assert new structure classes: `social-project-hub-layout`, filters, context rail, while still requiring `social-neo-workspace-shell--merged` + hero.

## Deliverables
1. 3-col hub layout in sectionsHtml
2. Filters + scope chips + grid/list toggle
3. Richer cards (skills, role)
4. Context rail: My Work top 5, trending, contribution
5. Attention counts in hero body or strip
6. Handlers + fingerprint
7. CSS in social-projects-lms.css
8. New test `test/social-project-hub-structure.test.js`
9. Update hub-merge test as needed
10. Run vitest on new + hub-merge tests

## Report
Write `.superpowers/sdd/briefs/task-1-report.md` with status, files changed, test output, concerns.
Commit only project-related files if clean enough; if huge dirty tree, skip commit and note it.
