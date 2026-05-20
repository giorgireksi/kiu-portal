# Task Tracker Standard

Date: `2026-05-17`
Owner: `Codex`
Purpose: define the professional standard for task-tracker markdown files that future AI sessions can create, update, and continue without guessing.

## Goal

Use this standard when you want an AI to produce a task markdown file that is:

- structured
- professional
- actionable
- easy to continue in a new session
- strict about evidence and progress updates

The file should not be a vague note. It should function like an execution ledger for real work.

## What a good task tracker must do

A strong task tracker must let a new LLM answer these questions immediately:

1. What is broken or what needs to be built?
2. What is already verified?
3. What is only a theory?
4. What exact tasks exist?
5. What files are most likely to change?
6. What should be done first?
7. What evidence is required before lowering `% left`?
8. How should the tracker be updated after code changes?

If the file does not answer those questions, it is not detailed enough.

## When to use this format

Use this format for:

- bug-fix backlogs
- runtime breakage repair plans
- refactor plans
- migration plans
- feature delivery plans
- production-readiness plans
- cleanup projects with many moving parts

Do not use this format for:

- one small TODO
- a single short bug with one obvious fix
- brainstorming with no implementation intent

## Non-negotiable rules

1. The file must be understandable without thread memory.
2. Every important claim must be tied to evidence or clearly labeled as an open hypothesis.
3. Every task must have a clear owner area, not just a vague idea.
4. Every task must have `% left`.
5. No task may be marked `0% left` without a real verification gate being checked.
6. Passing tests alone is not enough unless those tests truly cover the task.
7. The file must tell future sessions how to update it.
8. The file must distinguish:
   - confirmed issue
   - likely issue
   - blocked issue
   - completed issue

## `% left` scale

Use this exact scale unless the project explicitly defines a different one:

- `0% left` = done
- `1-15% left` = almost done
- `16-60% left` = partly done
- `61-99% left` = mostly not done
- `100% left` = untouched

Meaning:

- `% left` is remaining implementation work
- `% left` is not research completeness
- `% left` is not elapsed time

## Required top-level structure

Every professional task tracker should have these sections in this order.

### 1. Title

Use a specific title.

Good:

- `Current Runtime Breakage Repair Plan`
- `Authentication Migration Task Tracker`
- `Admin Dashboard Reliability Backlog`

Bad:

- `Tasks`
- `Fixes`
- `Things to do`

### 2. Metadata

Always include:

- `Date`
- `Owner`
- `Purpose`

Optional when useful:

- `Status`
- `Project`
- `Applies to`
- `Last audited`

### 3. Goal

State exactly what the file is for.

It should answer:

- what outcome is expected
- what kind of work this tracker covers
- what it is not trying to cover

### 4. How to use this file

This is critical for new sessions.

It should define:

- how the next AI should work from the file
- when `% left` can change
- how blockers should be recorded
- whether the file must be updated in the same turn as code changes

### 5. Mandatory update protocol

Every tracker should include a strict update-log format.

Recommended format:

```md
Update `YYYY-MM-DD`:
- Status: completed | partially completed | blocked | re-scoped
- % left: `NN% left`
- Files changed: `path/a`, `path/b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

Why this matters:

- it prevents fake progress
- it makes partial completion visible
- it allows a new session to continue from the last real evidence

### 6. Evidence already verified

This section should list what was actually checked before the tracker was written.

Examples:

- commands run
- tests run
- runtime probes
- browser observations
- screenshots
- logs
- API responses
- file scans

This section prevents future sessions from repeating the same baseline work blindly.

### 7. Current issue inventory

List the currently known broken areas or work streams.

Use this section to separate:

- global problems
- route-specific problems
- environment problems
- validation/test gaps

This is not the task list yet. This is the inventory of known issues.

### 8. Root causes already isolated

If root causes are known, list them here.

For each one, include:

- short root-cause name
- evidence
- consequence

If the root cause is not yet confirmed, label it as a hypothesis.

### 9. Execution order

State the recommended order for top-level tasks.

Do not make the next AI infer the critical path from a random list.

### 10. How to read each task

Define the internal structure of every task section.

This keeps future updates consistent.

### 11. Task backlog

This is the core of the file.

Every task goes here in a repeatable format.

### 12. Verification matrix

Define the minimal end-to-end checks required before claiming the project is done.

### 13. Important handoff note

Use this for the one mistake future sessions are most likely to make.

Examples:

- do not start by deleting files
- do not trust green unit tests alone
- do not rewrite the whole module before reproducing the bug

## Required structure for each task

Every top-level task should use this structure:

```md
### `TASK-ID` `NN% left` Short task title

Priority: `P0` | `P1` | `P2`
Depends on: ...

Why this exists:
- plain-language explanation of the problem

Primary files:
- `path/a`
- `path/b`

Exact work:
1. ...
2. ...
3. ...

Do not do this:
- ...

Verification gate:
- ...

Update `YYYY-MM-DD`:
- Status: ...
- % left: `NN% left`
- Files changed: ...
- Evidence: ...
- Remaining work: ...
```

## How detailed tasks should be

### Minimum detail level

A task is detailed enough only if a strong LLM can begin implementation without asking:

- what file should I inspect first?
- what exactly is broken?
- how will I know I fixed it?

### Good detail

Good task:

- names the real failure
- names the likely edit files
- explains the exact remaining implementation work
- gives a verification gate
- includes warnings about unsafe shortcuts when relevant

Bad task:

- `Fix theme issue`
- `Check navigation`
- `Repair auth`
- `Make this page work`

### Split tasks when

Split a task when the parts:

- can be verified independently
- affect different owners/modules
- can be completed in parallel
- have different blockers

Keep one task together when:

- it is one root cause
- it has one verification gate
- splitting it would only create fake granularity

## What every task must include

Every task must include:

- a task ID
- `% left`
- priority
- dependency note
- why it exists
- most likely file targets
- exact work
- verification gate

Optional but recommended:

- reproduced error string
- command to reproduce
- anti-pattern or "do not do this" note
- linked artifact name

## What not to do

Do not create trackers that:

- only list symptoms
- only list files
- only list TODO bullets
- hide uncertainty
- mark tasks done without evidence
- mix completed work and open work with no percentages
- use huge changelog-style update logs with no remaining-work summary

## Evidence rules

Use evidence that matches the task type.

### For runtime bugs

Prefer:

- browser reproduction
- console errors
- pageerror events
- DOM state checks
- screenshot or artifact capture

### For backend or integration bugs

Prefer:

- HTTP status codes
- request/response examples
- auth/session observations
- CORS checks
- health checks

### For refactors

Prefer:

- before/after ownership map
- removed dependency list
- bundle/runtime load verification
- regression tests

### For features

Prefer:

- feature acceptance checks
- user flow verification
- test coverage
- screenshots or artifacts if UI-heavy

## Test and verification policy

Every tracker should say explicitly that these are not enough by themselves:

- passing unit tests
- passing static source assertions
- no syntax errors
- partial HTML rendering

Why:

- AI systems often over-trust green tests
- real apps can still be broken in browser/runtime

## Recommended task granularity

Use these rough rules.

### Good size for one top-level task

One top-level task should usually represent:

- one root cause
- one subsystem repair
- one feature slice
- one environment/integration fix stream

### Good size for one sub-step

One numbered step inside `Exact work` should usually represent:

- one concrete code move
- one concrete audit
- one concrete verification action

## Templates by use case

### Bug-fix tracker

Best for:

- runtime failures
- broken pages
- missing dependencies
- regressions

Must emphasize:

- reproduction
- root cause
- verification gate

### Feature-delivery tracker

Best for:

- building a new feature
- cross-file delivery work

Must emphasize:

- scope boundaries
- dependencies
- acceptance criteria

### Migration/refactor tracker

Best for:

- ownership moves
- bundle splits
- compatibility retirement

Must emphasize:

- old owner
- new owner
- rollout order
- compatibility risks

## Copy-paste prompt for future sessions

Use this when you want an AI to create a professional task tracker from scratch:

```text
Create a professional markdown task tracker for this project/workstream.

Requirements:
- The file must be understandable in a completely new session with no thread memory.
- Use a strict `% left` system:
  - 0% left = done
  - 1-15% left = almost done
  - 16-60% left = partly done
  - 61-99% left = mostly not done
  - 100% left = untouched
- Include:
  - Title
  - Date
  - Owner
  - Purpose
  - Goal
  - How the next LLM must use this file
  - Mandatory update protocol
  - Evidence already verified
  - Current issue/feature inventory
  - Root causes already isolated or current hypotheses
  - Execution order
  - "How to read each task"
  - Detailed task backlog
  - Verification matrix
  - Important handoff note
- Every task must include:
  - task ID
  - % left
  - priority
  - depends on
  - why this exists
  - primary files
  - exact work
  - verification gate
- Use concrete file paths and commands when known.
- Do not use vague tasks like "fix UI" or "check bug".
- Do not mark tasks done without evidence.
- Add a mandatory update block format under the rules section.
- Make the file professional, structured, and suitable for a strong LLM to continue in a fresh session.
```

## Copy-paste prompt for updating an existing tracker

```text
Update this markdown task tracker after your code changes.

Rules:
- Update the touched task sections in the same turn as the code changes.
- Lower `% left` only if implementation actually progressed.
- Add an update block under each touched task in this format:

Update `YYYY-MM-DD`:
- Status: ...
- % left: `NN% left`
- Files changed: ...
- Evidence: ...
- Remaining work: ...

- Do not mark a task `0% left` unless the verification gate was actually checked.
- If you find a new blocker, add it to the tracker immediately.
- Keep the tracker understandable for a new session with no memory of this thread.
```

## Quality checklist

Before accepting a task tracker, ask:

1. Can a new LLM start from this file alone?
2. Are the tasks actionable rather than vague?
3. Does every task have `% left`?
4. Does every task have a verification gate?
5. Does the file explain how to update itself?
6. Does it separate confirmed issues from assumptions?
7. Does it avoid over-trusting tests?
8. Does it define execution order?

If any answer is no, the file is not ready.
