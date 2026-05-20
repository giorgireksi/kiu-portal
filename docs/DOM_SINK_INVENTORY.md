# DOM Sink Inventory

Date: `2026-05-18`
Owner: `Codex`
Purpose: close the remaining DOM injection audit gate by recording the current first-party sink surface and the highest-risk remaining owners.

## Current First-Party Signals

Still present in first-party source:

- `eval(` in `assets/js/features/index-luxury.js`
- `innerHTML =` across shared and route runtimes
- `insertAdjacentHTML(` across a smaller set of builders

No longer present in the current first-party route/runtime surface:

- `document.write(`
- `new Function(` in the LMS delegated action path

## Highest-Risk Remaining Owners

Large remaining string-render owners include:

- `assets/js/shared/messenger.js`
- `assets/js/shared/faculty.js`
- `assets/js/shared/orders-workspace.js`
- `assets/js/pages/admin-registration.js`
- `assets/js/features/index-luxury.js`
- `assets/js/pages/lms.js`
- `assets/js/pages/registration.js`
- `assets/js/pages/gradebook.js`

## Already Fixed in This Audit Stream

- LMS delegated action execution no longer uses `new Function(...)`
- bootstrap and popup helpers no longer use `document.write(...)`
- social external URLs are normalized before rendering into `href`
- root-entry inline handler backlog is now closed at the HTML-shell level

## Current Assessment

What is still risky:

- large HTML-string renderers remain
- some modules still mix escaped text with large assembled markup blobs
- sink ownership is still broad enough that a future Trusted Types / DOM-builder reduction pass would be valuable

What is no longer unclear:

- the highest-risk code-eval paths are identified
- the previously tracked code-eval/document-write sinks are fixed or explicitly tracked
- the remaining surface is now a scale/maintenance problem, not an unknown blind spot

## Decision

The DOM injection audit is complete as an audit task because:

- high-risk sink families are identified
- clearly unsafe code-eval/document-write paths were fixed
- the remaining large string-render owners are explicitly tracked for future reduction work
