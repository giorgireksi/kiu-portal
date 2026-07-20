# Panel override audit

Generated: 2026-07-17 by `tools/audit-panel-overrides.js`.

## What this means

- **ok-token**: `background` uses `var(--lux-panel-*)` / route `--*-fade-*` / `--home-fade-*` / elev only.
- **override-risk**: raw `linear/radial-gradient` (or similar) **not** going through those tokens — can look different from timetable panel glass.
- **P0**: fingerprint matches full panel soft/rich recipe (highest priority to tokenize/delete).
- **P1**: shell/hero/card-like selector + often `!important`.
- **P2**: decorative / accent / partial gradients.
- **P3**: home dashboard exception.

Token path being green (`check-panel-token-aliases`) **does not** mean zero overrides — only that fade **variables** alias panel.

## Residual policy (post panel-glass migration)

- **P0 must stay 0** — competing full panel recipes are bugs.
- **Remaining P1 is mostly intentional** (status/danger CTAs, badges, color-mix heroes, page-shell cream, branded modal heads) — not unfinished panel glass.
- **P2** = decorative / partial; clean only when already editing a file.
- **P3** = home (`--home-fade-*`) exception.
- This report is **evidence**, not a CI fail gate. Contract: [shell-panels.md](./shell-panels.md).

## Summary

| Metric | Count |
|--------|------:|
| Glass-like backgrounds scanned | 1870 |
| Via tokens (ok) | 1394 |
| Raw override-risk | 476 |
| P0 (panel recipe copy) | 0 |
| P1 (shell/card risk) | 0 |
| P2 (decorative) | 464 |
| P3 (home exception) | 12 |
| JS `setProperty('background')` sites | 4 |

## By file (override-risk)

| File | Total | P0 | P1 | P2 | P3 |
|------|------:|---:|---:|---:|---:|
| `index-luxury.css` | 112 | 0 | 0 | 112 | 0 |
| `social-rebuild.css` | 112 | 0 | 0 | 112 | 0 |
| `social-projects-lms.css` | 50 | 0 | 0 | 50 | 0 |
| `lux-controls.css` | 20 | 0 | 0 | 20 | 0 |
| `lms-quiz-live.css` | 19 | 0 | 0 | 19 | 0 |
| `student-service-route.css` | 17 | 0 | 0 | 17 | 0 |
| `layout.css` | 15 | 0 | 0 | 15 | 0 |
| `login-route.css` | 15 | 0 | 0 | 15 | 0 |
| `index-home-dashboard.css` | 12 | 0 | 0 | 0 | 12 |
| `lms-gradebook-misc.css` | 10 | 0 | 0 | 10 | 0 |
| `admin-scheduler-route.css` | 6 | 0 | 0 | 6 | 0 |
| `lms-whiteboard-catalog.css` | 6 | 0 | 0 | 6 | 0 |
| `news-route.css` | 6 | 0 | 0 | 6 | 0 |
| `base.css` | 5 | 0 | 0 | 5 | 0 |
| `lms-quiz.css` | 5 | 0 | 0 | 5 | 0 |
| `lux-layout-primitives.css` | 5 | 0 | 0 | 5 | 0 |
| `programs-route.css` | 5 | 0 | 0 | 5 | 0 |
| `registration-route.css` | 5 | 0 | 0 | 5 | 0 |
| `social-surveys-lms.css` | 5 | 0 | 0 | 5 | 0 |
| `lms-workspace-chrome.css` | 4 | 0 | 0 | 4 | 0 |

## P0 listings (top 0 of 0)

_None._

## P1 listings (top 0 of 0)

_None._

## P2 listings (top 20 of 464)

| File | Line | Selector | Value (truncated) |
|------|-----:|----------|------------------|
| `admin-library-route.css` | 263 | `body.lux-route-admin-library .admin-library-remove-btn` | `linear-gradient(180deg, rgba(220, 116, 116, 0.18), rgba(220, 116, 116, 0.08)), rgba(var(--lux-glass-tint-rgb, 16, 23, 38` |
| `admin-library-route.css` | 717 | `body.lux-route-admin-library .lux-danger-btn` | `linear-gradient(180deg, rgba(220, 116, 116, 0.22), rgba(220, 116, 116, 0.1)), rgba(var(--lux-glass-tint-rgb), calc(var(-` |
| `admin-library-route.css` | 1077 | `body.lux-light-mode.lux-route-admin-library .admin-library-schema-field-row, html.lux-light-mode body.lux-route-admin…` | `linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 244, 237, 0.52)) !important` |
| `admin-scheduler-route.css` | 157 | `body.lux-route-admin-scheduler #page-admin-scheduler .sch-day-col.is-today` | `radial-gradient(circle at top center, rgba(var(--lux-accent-rgb), 0.16), transparent 40%), var(--sch-grid-chrome-bg) !im` |
| `admin-scheduler-route.css` | 170 | `body.lux-route-admin-scheduler #page-admin-scheduler .sch-slot-bg:hover` | `linear-gradient(180deg, rgba(var(--lux-accent-rgb), 0.06), transparent), var(--sch-grid-lane-bg) !important` |
| `admin-scheduler-route.css` | 866 | `body.lux-route-admin-scheduler .sch-day-col.is-today` | `radial-gradient(circle at top center, rgba(var(--lux-accent-rgb), 0.16), transparent 40%), var(--sch-grid-chrome-bg)` |
| `admin-scheduler-route.css` | 873 | `body.lux-light-mode.lux-route-admin-scheduler .sch-day-col.is-today` | `radial-gradient(circle at top center, rgba(var(--lux-accent-rgb), 0.18), transparent 40%), var(--sch-grid-chrome-bg)` |
| `admin-scheduler-route.css` | 955 | `body.lux-route-admin-scheduler .sch-slot-bg:hover` | `linear-gradient(180deg, rgba(var(--lux-accent-rgb), 0.06), transparent), var(--sch-grid-lane-bg)` |
| `admin-scheduler-route.css` | 961 | `body.lux-light-mode.lux-route-admin-scheduler .sch-slot-bg:hover` | `linear-gradient(180deg, rgba(var(--lux-accent-rgb), 0.10), transparent), var(--sch-grid-lane-bg)` |
| `admin-tools-luxury.css` | 2127 | `body.lux-route-admin-tools .admin-recent-avatar-initial` | `linear-gradient(135deg, var(--lux-accent), rgba(255,255,255,0.12))` |
| `admin-tools-luxury.css` | 3244 | `body.lux-unified-shell.lux-route-admin-tools #course-selection-modal-bg .admin-reg-course-item::before` | `linear-gradient(180deg, var(--admin-reg-faculty-accent, var(--lux-accent)), rgba(var(--lux-accent-rgb), 0.08))` |
| `admin-tools-luxury.css` | 3590 | `body.lux-unified-shell.lux-route-admin-tools .admin-reg-program-pane-progress` | `linear-gradient(135deg, #edf4ff, #dfeafe)` |
| `base.css` | 86 | `body.role-admin .kiu-nav-item.is-active, body.role-admin .dashboard-nav .active, body.role-admin .nav-item.active` | `linear-gradient(135deg, rgba(0, 71, 143, 0.18), rgba(216, 170, 86, 0.06))` |
| `base.css` | 135 | `#top-nav` | `linear-gradient(90deg, #0b192c 0%, #12304d 42%, #0a84ff 100%)` |
| `base.css` | 524 | `body.role-professor, body.role-ta` | `radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 28%), linear-gradient(180deg, #f7fbff 0%, #edf` |
| `base.css` | 614 | `.admin-hero` | `linear-gradient(135deg, #0b1f33 0%, #12385e 45%, #0a84ff 100%)` |
| `base.css` | 634 | `.page-hero` | `linear-gradient(135deg, rgba(11, 31, 51, 0.96) 0%, rgba(17, 82, 128, 0.94) 46%, rgba(10, 132, 255, 0.92) 100%)` |
| `chancellery-route.css` | 39 | `body.lux-route-chancellery` | `radial-gradient(circle at 18% 0%, rgba(var(--lux-accent-rgb), 0.12), transparent 32%), radial-gradient(circle at 82% 10%` |
| `exam-portal-route.css` | 481 | `.exam-protected-hero` | `radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 32%), linear-gradient(135deg, #111d34 0%, #0` |
| `exam-studio.css` | 1453 | `#admin-exams-root .ex2-rq-avatar` | `linear-gradient(135deg, rgba(var(--lux-accent-rgb), .85), rgba(var(--lux-accent-rgb), .55))` |

## JS background paint sites

From `assets/js/shared/utilities.js` (inline `!important` can override CSS if not stripped by keep-path):

| Line | Code |
|-----:|------|
| 3533 | `el.style.setProperty('background', _solidBg, 'important');` |
| 3556 | `el.style.setProperty('background', _solidBg2, 'important');` |
| 3611 | `if (_dynBg) el.style.setProperty('background', _dynBg, 'important');` |
| 3634 | `if (_dynBg2) el.style.setProperty('background', _dynBg2, 'important');` |

## Re-run

```bash
node tools/audit-panel-overrides.js
npm run check:panels
```

Related: [shell-panels.md](./shell-panels.md), `tools/check-panel-token-aliases.js`, `tools/check-panel-snowflakes.js`.
