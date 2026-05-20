# DOM Rendering Standard

Date: `2026-05-18`
Owner: `Codex`
Purpose: define the first repeatable rendering policy for route-owned UI so large string-render modules can be reduced without guessing.

## Goal

Use this standard when changing first-party route or shared UI owners.

It defines:

- when markup strings are acceptable
- when dynamic DOM builders are preferred
- how to handle user/content data safely
- one current reference route that already follows the pattern

## Policy

1. Static shell skeletons may use owned template strings when the markup is fixed and route-local.
2. Dynamic collections should prefer DOM node builders plus `DocumentFragment` and `replaceChildren(...)`.
3. Untrusted or user-authored text must go through `textContent` or an existing escaping helper before entering markup.
4. Picker/options, table rows, repeated cards, and stateful list items should not be assembled with ad hoc `innerHTML` if a small DOM builder is practical.
5. If `innerHTML` is still used, keep it to one of these cases:
   - fixed route shell markup
   - fully escaped dynamic text inside a route-local renderer
   - compatibility seams that are explicitly tracked for later reduction

## Reference Implementation

Current reference route family:

- `assets/js/pages/library.js`

Current reference shared owner:

- `assets/js/shared/orders-workspace.js`

Current standard shape in that owner:

- the page shell is route-owned through `renderLibraryPageShellContext()`
- dynamic table rows are built with DOM nodes
- picker options are built with DOM nodes and `replaceChildren(...)`
- filter `<option>` elements are built with DOM nodes instead of string concatenation
- the shared Orders inbox list and admin recipient selector now render their repeated interactive rows through DOM builders and `replaceChildren(...)` instead of route-wide string concatenation

## Adoption Order

Apply this standard next to:

1. route-local pickers and filter panels
2. dynamic tables and repeated lists
3. medium-sized route workspaces before touching the largest legacy shells

Do not start by rewriting the biggest HTML-string owner in one pass.

## Non-Goals

- banning all `innerHTML` immediately
- forcing verbose DOM code for every static block
- mixing rendering cleanup with unrelated feature redesign
