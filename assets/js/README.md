## JS Structure

The active entry pages now load the split files in this folder directly.

The organized source layout lives here:

- `app/`: runtime bootstrap, auth, and state-related slices
- `data/`: runtime-safe bootstrap state and shared client-side defaults
- `features/`: shared UI/navigation behavior
- `pages/`: page-focused logic groups
- `shared/`: cross-page helpers and data logic
- `legacy/`: older non-canonical scripts kept for reference

The old compatibility loaders `assets/js/core.js` and the root `core.js` are retired.

Active routes now load the split files in `assets/js/` directly.
