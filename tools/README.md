## Tools

This folder contains copied helper scripts that were previously mixed into the project root.

The original root scripts are still kept in place for compatibility, but new maintenance work should prefer the copies in this folder.

The old compatibility asset sync workflow is retired; live pages already point at `assets/` directly.

`build_admin_tools_standalone.py` generates a non-source admin-tools standalone artifact into `artifacts/generated/admin-tools/`. That output is intentionally kept out of the live page root, is tooling-only rather than a live portal route, and may embed self-contained inline assets as part of the bundle format. It should never be edited by hand.

Known root compatibility copies still exist beside these canonical `tools/` files:

- `apply_cache_bust.py`
- `apply_fixes.py`
- `deploy_admin_upgrade.py`
- `inject_admin_nav.py`
- `inject_admin_role.py`
- `inject_faculty_switcher.py`
- `inject_header_changes.py`
- `parse_better.py`
- `parse_original.py`
- `temp_replace.js`

Those root copies remain for compatibility/manual workflows. New maintenance work should update the `tools/` copy first and remove the root copy only after operator signoff and explicit reference proof.

`start-local-server.bat` at the repo root is an active launcher entry point and is intentionally not identical to `tools/start-local-server.bat`.
