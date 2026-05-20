## Tools

This folder contains copied helper scripts that were previously mixed into the project root.

The original root scripts are still kept in place for compatibility, but new maintenance work should prefer the copies in this folder.

Use `sync_compatibility_assets.ps1` if you want to refresh the old root compatibility CSS/JS files from the organized `assets/` source after future edits.

That script is mainly for fallback compatibility files now; the live pages already point at `assets/` directly.

`build_admin_tools_standalone.py` generates a non-source admin-tools standalone artifact into `artifacts/generated/admin-tools/`. That output is intentionally kept out of the live page root and should never be edited by hand.
