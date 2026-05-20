# [Project / Workstream Title]

Date: `YYYY-MM-DD`
Owner: `[AI / person / team]`
Purpose: [one-sentence purpose of this tracker]

## Goal

[State exactly what outcome this tracker is meant to drive.]

## Read This First

### What is actually broken / what needs to be built

- [item]
- [item]
- [item]

### `% left` meaning in this file

- `0% left` = done
- `1-15% left` = almost done
- `16-60% left` = partly done
- `61-99% left` = mostly not done
- `100% left` = untouched

### How the next LLM must use this file

1. Reproduce the relevant issue or confirm the relevant baseline before changing code.
2. Work one top-level task or one tightly related subset at a time.
3. Update this file in the same turn as any code change.
4. Lower `% left` only when implementation actually progressed.
5. Do not mark any task `0% left` unless its verification gate was actually checked.
6. Add new blockers to this file immediately.

### Mandatory update protocol

Use this exact format under any touched task:

```md
Update `YYYY-MM-DD`:
- Status: completed | partially completed | blocked | re-scoped
- % left: `NN% left`
- Files changed: `path/a`, `path/b`
- Evidence: `command`, `artifact`, `runtime observation`
- Remaining work: ...
```

### Do not trust these signals by themselves

- passing unit tests
- passing static assertions
- no syntax errors
- partial HTML rendering
- one apparently successful route

## Verified Evidence

### Commands already run

1. `[command]`
2. `[command]`
3. `[command]`

### High-signal outcomes

- [observed outcome]
- [observed outcome]
- [observed outcome]

### Reproduced errors or important observations

- `[error / behavior]`
- `[error / behavior]`
- `[error / behavior]`

## Current Inventory

### Global issues / workstreams

- [item]
- [item]

### Route-specific / module-specific issues

- `[route or module]`
  - [issue]
  - [issue]

### Validation or coverage gaps

- [gap]
- [gap]

## Root Causes Already Isolated

### Root cause A: [short name]

Evidence:

- [evidence]
- [evidence]

Consequence:

- [consequence]

### Root cause B: [short name]

Evidence:

- [evidence]
- [evidence]

Consequence:

- [consequence]

## Execution Order

Do the tasks in this order unless a newly verified blocker changes the critical path:

1. `TASK-01`
2. `TASK-02`
3. `TASK-03`

Reason:

- [reason]
- [reason]

## How To Read Each Task

Every task below uses this structure:

- `Priority`
- `Depends on`
- `Why this exists`
- `Primary files`
- `Exact work`
- `Verification gate`

## Task Backlog

### `TASK-01` `100% left` [short concrete title]

Priority: `P0`
Depends on: [none / task IDs]

Why this exists:

- [plain-language explanation]

Primary files:

- `[path/a]`
- `[path/b]`

Exact work:

1. [step]
2. [step]
3. [step]

Do not do this:

- [unsafe shortcut or common mistake]

Verification gate:

- [required evidence]
- [required evidence]

Update `YYYY-MM-DD`:
- Status: [placeholder]
- % left: `100% left`
- Files changed: [placeholder]
- Evidence: [placeholder]
- Remaining work: [placeholder]

### `TASK-02` `100% left` [short concrete title]

Priority: `P1`
Depends on: [none / task IDs]

Why this exists:

- [plain-language explanation]

Primary files:

- `[path/a]`
- `[path/b]`

Exact work:

1. [step]
2. [step]
3. [step]

Verification gate:

- [required evidence]
- [required evidence]

Update `YYYY-MM-DD`:
- Status: [placeholder]
- % left: `100% left`
- Files changed: [placeholder]
- Evidence: [placeholder]
- Remaining work: [placeholder]

### `TASK-03` `100% left` [short concrete title]

Priority: `P2`
Depends on: [none / task IDs]

Why this exists:

- [plain-language explanation]

Primary files:

- `[path/a]`
- `[path/b]`

Exact work:

1. [step]
2. [step]
3. [step]

Verification gate:

- [required evidence]
- [required evidence]

Update `YYYY-MM-DD`:
- Status: [placeholder]
- % left: `100% left`
- Files changed: [placeholder]
- Evidence: [placeholder]
- Remaining work: [placeholder]

## Verification Matrix

### Required routes / modules / flows

- `[route / flow / module]`
- `[route / flow / module]`
- `[route / flow / module]`

### Required checks

- [check]
- [check]
- [check]

### Extra checks

- `[area]`
  - [extra check]

## Important Note For The Next Session

[Write the one mistake future sessions are most likely to make, and tell them not to make it.]
