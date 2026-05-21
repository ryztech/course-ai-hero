---
name: do-work
description: End-to-end workflow for implementing a task: collaboratively plan, implement, validate with type-check and test feedback loops, then commit. Use when the user says "do work", "implement this", "build this", or describes a feature/fix and expects a complete, committed result.
---

# Do Work

Full implementation workflow: plan → build → validate → commit.

## Phase 1: Plan

Before writing any code, align on the approach.

1. **Clarify the task** — if the request is ambiguous, ask one focused question. Do not ask several at once.
2. **Explore the codebase** — read the relevant files to understand existing patterns, types, and conventions.
3. **Draft a plan** — present a short numbered list of what you will do. Include:
   - Files you will create or modify
   - Any schema or API shape decisions
   - Rough implementation order
4. **Get approval** — ask the user: _"Does this look right, or should I adjust anything before I start?"_

Do not begin implementation until the user approves the plan.

## Phase 2: Implement

Work through the plan in order. For each step:

- Make the change
- State what you did in one sentence
- Move to the next step immediately

Do not over-explain. Do not ask for permission between steps unless you discover something that materially changes the plan.

### TDD cycle (new functionality)

When adding new behaviour, follow red → green → refactor per logical unit:

1. **Red** — write a test that specifies the expected behaviour and confirm it fails (`pnpm run test`)
2. **Green** — write the minimum implementation to make it pass; don't clean up yet
3. **Refactor** — tidy the implementation without changing behaviour; re-run tests to confirm still green

Skip the TDD cycle for pure refactors, config changes, or UI-only work where unit tests don't apply.

## Phase 3: Validate

After implementing, run the feedback loop until both checks pass.

### Type check

```bash
pnpm type-check
```

- Fix every type error before moving on
- Do not suppress errors with `// @ts-ignore` or `as any` unless the type system is genuinely wrong and you explain why

### Tests

```bash
pnpm run test
```

- Fix every failing test
- If a test reveals a real bug in your implementation, fix the implementation — do not update the test to match broken behaviour
- If a test is genuinely wrong (tests something that changed intentionally), update the test and note that you did so

Repeat both checks after each fix until both pass cleanly.

## Phase 4: Commit

When all checks pass:

1. Run `git diff` to review staged changes
2. Stage the relevant files by name — do not use `git add -A`
3. Write a commit message following the repo's existing style (check `git log --oneline -5`)
4. Commit with:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Report the commit hash and a one-line summary of what was done.

## Notes

- If `pnpm type-check` or `pnpm run test` are not available, check `package.json` for the correct script names and use those instead
- If the plan changes materially mid-implementation (unexpected schema, conflicting pattern, missing dependency), stop and re-align with the user before continuing
- Keep commits atomic — one logical change per commit
