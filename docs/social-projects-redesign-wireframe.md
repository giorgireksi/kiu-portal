# Social Projects Redesign Wireframe

## Scope
Redesign the project area in the social network page to feel calmer, clearer, and more professional.

Reviewed source files:
- `social.html`
- `assets/js/pages/social-page.js`
- `assets/js/pages/social-mobile.js`
- `assets/css/social-rebuild.css`
- `assets/css/social-projects-lms.css`

## What Feels Off Today
- Too many project controls appear at once.
- Create-workspace flow is long and visually heavy.
- Workspace discovery and workspace detail are mixed together too tightly.
- Metrics, tabs, people, tasks, and forms compete for attention.
- Mobile needs a simpler stack with fewer simultaneous choices.

## Proposed Structure

### 1. Project Hub Entry
Use one calm hub with two clearly separated entry paths:
- `Team Workspaces` for class/project execution
- `Portfolio Showcase` for public discovery and publishing

Keep one primary action per zone:
- Hub header: `Create workspace`
- Workspace cards: `Open workspace`
- Portfolio cards: `Open entry`

### 2. Workspace Detail
Make the active project page feel like a dashboard, not a form wall.

Use this order:
1. Hero summary
2. KPI strip
3. Sticky tabs
4. Main content area
5. Secondary right rail for next actions

### 3. Create Workspace Flow
Turn the current long create form into a 3-step flow:
- Basics
- Team
- Review and publish

## Desktop Wireframe

```text
PROJECT HUB
--------------------------------------------------------------------------------
[ Project Hub ]  [ Team Workspaces ] [ Portfolio Showcase ]   [ Search... ] [ + ]
Short helper text: "Create, manage, and present project work in one place."

[ Summary Strip ]
| My workspaces | Active | Due this week | Published | Drafts | Members online |

[ Two Primary Entry Cards ]
+--------------------------------------+--------------------------------------+
| TEAM WORKSPACES                      | PORTFOLIO SHOWCASE                   |
| Build and run private team projects. | Present polished work publicly.      |
| Tasks, milestones, meetings, chat.   | Tags, media, audience, publishing.   |
| [ Open Workspaces ]                  | [ Open Portfolio ]                   |
+--------------------------------------+--------------------------------------+

[ Workspace List / Discovery ]
+--------------------------------------+--------------------------------------+
| Search workspaces... [filters]       | Sort: activity / due / status       |
| chips: all / mine / active / review  | chips: faculty / role / privacy     |
+--------------------------------------+--------------------------------------+

[ Workspace Cards Grid ]
+---------------------+---------------------+---------------------+
| Card                | Card                | Card                |
| name + role         | name + role         | name + role         |
| status / due / team  | status / due / team  | status / due / team  |
| [ Open ]            | [ Open ]            | [ Open ]            |
+---------------------+---------------------+---------------------+
```

## Workspace Detail Wireframe

```text
WORKSPACE DETAIL
--------------------------------------------------------------------------------
[ Back ]  Project Name  [ Status ] [ Role ] [ Visibility ] [ Owner ]
One-sentence summary that explains the project in plain language.

[ Open Chat ]  [ Meetings ]  [ Share / Publish ]  [ More ]

[ KPI Strip ]
| Completion | Milestones | Deliverables | Team mix | Activity pulse |

[ Sticky Tabs ]
| Overview | Tasks | Milestones | Deliverables | Team | Meetings | Activity |

+----------------------------------------------+--------------------------------+
| MAIN LANE                                    | RIGHT RAIL                     |
|----------------------------------------------|--------------------------------|
| Overview tab:                                | Next actions                   |
| - summary cards                              | - due soon                     |
| - scope / course / faculty                   | - blockers                     |
| - advisor block                              | - unread chat                  |
| - recent activity                            |                                |
|                                              | Team snapshot                  |
| Tasks tab:                                   | - owner                        |
| - compact kanban board                       | - advisors                     |
| - one primary action: Add task               | - pending invites              |
|                                              |                                |
| Milestones tab:                              | Progress notes                 |
| - timeline with due dates                    | - health summary               |
| - one primary action: Add milestone          | - last update                  |
+----------------------------------------------+--------------------------------+
```

## Create Workspace Flow Wireframe

```text
CREATE WORKSPACE
--------------------------------------------------------------------------------
[ Step 1 of 3 ]  Basics -> Team -> Review

STEP 1: BASICS
| Project title | Course / module |
| Summary | Description |
| Status | Visibility | Advisor |
| Faculties involved |
[ Next ]

STEP 2: TEAM
| Search people | Faculty filter |
| Selected people chips |
| Suggested people list |
[ Back ] [ Next ]

STEP 3: REVIEW
| Final summary card |
| Team count | Faculty mix | Visibility |
| [ Save Draft ] [ Create Workspace ]
```

## Mobile Wireframe

```text
MOBILE
--------------------------------------------------------------------------------
[ Back ] Project Name
[ Status ] [ Role ] [ Visibility ]
[ Chat ] [ Tasks ] [ Publish ]

[ KPI cards - horizontal scroll ]
Completion | Milestones | Deliverables | Team | Activity

[ Tabs - horizontal scroll ]
Overview | Tasks | Milestones | Deliverables | Team | Activity

[ Main content ]
- stacked cards
- one primary action per section
- secondary actions moved into "More"

[ Sticky bottom bar ]
[ + Task ]  [ Invite ]  [ More ]
```

## Interaction Rules
- Keep the hero short and readable.
- Make search/filter controls a single row or compact stack.
- Keep secondary actions in menus, not beside every headline.
- Show counts, progress, and status before deep details.
- On mobile, collapse long forms into steps and hide advanced controls behind `More`.
- Any long list must live inside a bounded container with `max-height` and `overflow-y: auto`.
- Apply that to workspace lists, invite results, team members, tasks, milestones, deliverables, activity feeds, and audit/history panels.
- Do not let repeatable content expand the page indefinitely.

## Visual Direction
- Keep the current luxe/glass visual language.
- Reduce card density and visual noise.
- Use clearer spacing, fewer simultaneous buttons, and stronger hierarchy.
- Favor calm dashboard composition over a form-heavy layout.
