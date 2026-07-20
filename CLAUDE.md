# For Claude Code

## Shell / panel design (read first for visual work)

- Contract: [`docs/shell-panels.md`](docs/shell-panels.md)
- Edit glass: `assets/css/lux-tokens.css` → `--lux-panel-*` / `--lux-elev-*` (not per-route recipes)
- Guards: `npm run check:panels` (snowflakes + fade→panel alias check)
- New panels: prefer `.lux-panel-pro` / `.lux-soft-chrome`; no new `--*-fade-*` literals

## MCP code-review-graph: USE FIRST before Grep/Read/Glob

This project has a knowledge graph. Before reading any file or grepping, call ToolSearch with "select:query_graph,semantic_search_nodes,get_impact_radius,detect_changes,get_architecture_overview" then use those tools — they are faster, cheaper, and give structural context.

- Exploring code → `semantic_search_nodes` or `query_graph`
- Understanding impact → `get_impact_radius` (avoids manual import tracing)
- Code review → `detect_changes` + `get_review_context`
- Finding relationships → `query_graph` with callers_of/callees_of/imports_of/tests_for
- Architecture → `get_architecture_overview`

Fall back to Grep/Read **only** when graph tools don't cover what you need.

## Token optimization
- Skip pleasantries, conversational filler
- Use Edit not Write for existing files
- Do not re-read a file you just wrote or edited
- Prefer targeted grep/glob over reading large files in full
- For git, use --short or --oneline
- Early returns, ternary, guard clauses
- Show only relevant lines, not full tracebacks
- Keep answers to 3-4 sentences unless asked for details

## Output style
- Give the answer directly, no preambles
- Reference file paths and line numbers instead of re-reading content
