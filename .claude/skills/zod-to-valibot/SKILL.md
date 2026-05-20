---
name: zod-to-valibot
description: Migrate an entire codebase from Zod to Valibot schema validation. Handles all common patterns: pipelines, object strictness, error messages, coercion, discriminated unions, async validation, and type inference. Use when user asks to migrate from Zod to Valibot, convert Zod schemas, replace Zod with Valibot, or reduce validation bundle size.
---

# Zod to Valibot Migration

## Quick start

```bash
# Try the official codemod first (beta — covers ~80% of cases)
npx @valibot/zod-to-valibot src/**/* --dry   # preview
npx @valibot/zod-to-valibot src/**/*          # apply

# Then install valibot and remove zod
pnpm add valibot
pnpm remove zod
```

Run the codemod, then fix remaining issues manually using the patterns in [REFERENCE.md](REFERENCE.md).

## Migration workflow

1. **Audit first** — find all Zod usage before touching anything:
   ```bash
   grep -r "from 'zod'\|from \"zod\"\|require('zod')" --include="*.ts" --include="*.tsx" -l
   ```

2. **Run codemod** on the full file list discovered above.

3. **Fix residual patterns** the codemod misses (see [REFERENCE.md](REFERENCE.md)):
   - `.superRefine` → `rawCheck` / `rawTransform`
   - `.extend` → `v.object({ ...schema.entries, newKey: v.string() })`
   - `.merge` → `v.object({ ...a.entries, ...b.entries })`
   - `z.coerce.*` → explicit `pipe` + `transform`
   - Differentiated error objects `{ invalid_type_error, required_error }` → single strings

4. **Fix type imports** — replace `z.infer<typeof X>` with `v.InferOutput<typeof X>`.

5. **Verify** — run `tsc --noEmit` and your test suite.

## Rules for autonomous migration

- Rewrite the entire repo in one pass without pausing.
- Only stop to ask the user if a pattern is genuinely ambiguous (e.g. a custom `.superRefine` with complex logic, or a Zod plugin that has no Valibot equivalent).
- Never leave `zod` in `package.json` imports after migration is complete.
- Prefer `v.pipe(v.string(), ...)` over the codemod's output when it produces unclear code.

## Key mental model shift

| Zod | Valibot |
|-----|---------|
| Method chaining on schema | `v.pipe(schema, ...actions)` |
| `schema.parse(data)` | `v.parse(schema, data)` |
| `schema.safeParse(data)` | `v.safeParse(schema, data)` |
| `z.infer<typeof S>` | `v.InferOutput<typeof S>` |

See [REFERENCE.md](REFERENCE.md) for the complete mapping table and all pattern recipes.
