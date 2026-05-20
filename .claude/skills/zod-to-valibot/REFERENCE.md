# Zod → Valibot Complete Reference

## Import

```ts
// Before
import { z } from 'zod';

// After
import * as v from 'valibot';
```

---

## Full name mapping

| Zod | Valibot | Notes |
|-----|---------|-------|
| `z.string()` | `v.string()` | |
| `z.number()` | `v.number()` | |
| `z.boolean()` | `v.boolean()` | |
| `z.bigint()` | `v.bigint()` | |
| `z.date()` | `v.date()` | |
| `z.symbol()` | `v.symbol()` | |
| `z.undefined()` | `v.undefined_()` | note trailing `_` |
| `z.null()` | `v.null_()` | note trailing `_` |
| `z.void()` | `v.void_()` | note trailing `_` |
| `z.any()` | `v.any()` | |
| `z.unknown()` | `v.unknown()` | |
| `z.never()` | `v.never()` | |
| `z.literal(x)` | `v.literal(x)` | |
| `z.object({})` | `v.object({})` | strips unknown keys (same as Zod default) |
| `z.object({}).strict()` | `v.strictObject({})` | |
| `z.object({}).passthrough()` | `v.looseObject({})` | |
| `z.object({}).catchall(s)` | `v.objectWithRest({}, s)` | |
| `z.array(s)` | `v.array(s)` | |
| `z.tuple([s1, s2])` | `v.tuple([s1, s2])` | |
| `z.tuple([s1]).rest(s2)` | `v.tuple([s1], s2)` | rest is second arg |
| `z.record(s)` | `v.record(v.string(), s)` | key schema required |
| `z.record(k, v)` | `v.record(k, v)` | |
| `z.map(k, v)` | `v.map(k, v)` | |
| `z.set(s)` | `v.set(s)` | |
| `z.enum(['a','b'])` | `v.picklist(['a','b'])` | |
| `z.nativeEnum(MyEnum)` | `v.enum(MyEnum)` | TS enum only |
| `z.union([s1, s2])` | `v.union([s1, s2])` | |
| `z.or` | `v.union` | alias |
| `z.discriminatedUnion('type', [...])` | `v.variant('type', [...])` | |
| `z.intersection(a, b)` | `v.intersect([a, b])` | array, not two args |
| `z.and` | `v.intersect` | |
| `z.optional(s)` | `v.optional(s)` | or wrap: `v.optional(v.string())` |
| `z.nullable(s)` | `v.nullable(s)` | |
| `z.nullish(s)` | `v.nullish(s)` | |
| `z.default(s, val)` | `v.optional(s, val)` | |
| `z.catch(s, val)` | `v.fallback(s, val)` | |
| `z.promise(s)` | `v.promise(s)` | |
| `z.function()` | `v.function_()` | |
| `z.lazy(() => s)` | `v.lazy(() => s)` | |
| `z.instanceof(Class)` | `v.instance(Class)` | |
| `z.custom<T>(fn)` | `v.custom<T>(fn)` | |
| `z.preprocess(fn, s)` | `v.pipe(v.unknown(), v.transform(fn), s)` | |

---

## Type inference

```ts
// Before
type User = z.infer<typeof UserSchema>;
type UserInput = z.input<typeof UserSchema>;
type UserOutput = z.output<typeof UserSchema>;

// After
type User = v.InferOutput<typeof UserSchema>;
type UserInput = v.InferInput<typeof UserSchema>;
type UserOutput = v.InferOutput<typeof UserSchema>;
```

---

## Parse / safeParse / is

```ts
// Before
schema.parse(data)
schema.safeParse(data)     // { success, data, error }
schema.parseAsync(data)
schema.safeParseAsync(data)

// After
v.parse(schema, data)
v.safeParse(schema, data)  // { success, output, issues }  ← note: .output not .data
v.parseAsync(schema, data)
v.safeParseAsync(schema, data)
```

> **Gotcha:** `safeParse` result uses `.output` (not `.data`) and `.issues` (not `.error`).

---

## Method chaining → pipe

```ts
// Before
z.string().email().endsWith('@example.com').min(5)

// After
v.pipe(v.string(), v.email(), v.endsWith('@example.com'), v.minLength(5))
```

### Common validators inside pipe

| Zod chain | Valibot action |
|-----------|---------------|
| `.min(n)` on string | `v.minLength(n)` |
| `.max(n)` on string | `v.maxLength(n)` |
| `.length(n)` | `v.length(n)` |
| `.email()` | `v.email()` |
| `.url()` | `v.url()` |
| `.uuid()` | `v.uuid()` |
| `.cuid()` | `v.cuid2()` |
| `.regex(r)` | `v.regex(r)` |
| `.startsWith(s)` | `v.startsWith(s)` |
| `.endsWith(s)` | `v.endsWith(s)` |
| `.includes(s)` | `v.includes(s)` |
| `.trim()` | `v.trim()` |
| `.toLowerCase()` | `v.toLowerCase()` |
| `.toUpperCase()` | `v.toUpperCase()` |
| `.min(n)` on number | `v.minValue(n)` |
| `.max(n)` on number | `v.maxValue(n)` |
| `.int()` | `v.integer()` |
| `.positive()` | `v.minValue(1)` / `v.gtValue(0)` |
| `.negative()` | `v.maxValue(-1)` / `v.ltValue(0)` |
| `.nonnegative()` | `v.minValue(0)` |
| `.nonpositive()` | `v.maxValue(0)` |
| `.gt(n)` | `v.gtValue(n)` |
| `.gte(n)` | `v.minValue(n)` |
| `.lt(n)` | `v.ltValue(n)` |
| `.lte(n)` | `v.maxValue(n)` |
| `.safe()` | `v.safeInteger()` |
| `.finite()` | `v.finite()` |
| `.multipleOf(n)` | `v.multipleOf(n)` |
| `.datetime()` | `v.isoDateTime()` |
| `.date()` on string | `v.isoDate()` |
| `.nonempty()` | `v.nonEmpty()` |
| `.min(n)` on array | `v.minLength(n)` |
| `.max(n)` on array | `v.maxLength(n)` |

---

## Error messages

```ts
// Before
z.string({ invalid_type_error: 'Not a string', required_error: 'Required' })
  .min(5, { message: 'Too short' })

// After — single string, not an object
v.pipe(v.string('Not a string'), v.minLength(5, 'Too short'))
```

> There is no `required_error` equivalent — Valibot uses the type schema message for both cases.

---

## Object extend / merge

```ts
// Before
const Base = z.object({ id: z.string() });
const Extended = Base.extend({ name: z.string() });
const Merged = Base.merge(Other);

// After
const Base = v.object({ id: v.string() });
const Extended = v.object({ ...Base.entries, name: v.string() });
const Merged = v.object({ ...Base.entries, ...Other.entries });
```

---

## pick / omit / partial / required / keyof

```ts
// Before
Schema.pick({ name: true })
Schema.omit({ id: true })
Schema.partial()
Schema.required()
Schema.keyof()

// After
v.pick(Schema, ['name'])
v.omit(Schema, ['id'])
v.partial(Schema)
v.required(Schema)
v.keyof(Schema)
```

---

## Type coercion

```ts
// Before
z.coerce.number()
z.coerce.string()
z.coerce.boolean()
z.coerce.date()

// After — explicit pipeline, safer
v.pipe(v.unknown(), v.transform(Number))
v.pipe(v.unknown(), v.transform(String))
v.pipe(v.unknown(), v.transform(Boolean))
v.pipe(v.unknown(), v.transform((v) => new Date(v as string)))

// Better (validates input type first)
v.pipe(v.string(), v.decimal(), v.transform(Number))
```

---

## refine / superRefine

```ts
// Before — refine
z.string().refine((val) => val.length > 0, { message: 'Required' })

// After
v.pipe(v.string(), v.check((val) => val.length > 0, 'Required'))

// Before — superRefine
z.object({ pass: z.string(), confirm: z.string() }).superRefine((data, ctx) => {
  if (data.pass !== data.confirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mismatch', path: ['confirm'] });
  }
})

// After — rawCheck (full issue access)
v.pipe(
  v.object({ pass: v.string(), confirm: v.string() }),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed && dataset.value.pass !== dataset.value.confirm) {
      addIssue({ message: 'Mismatch', path: [{ key: 'confirm' }] });
    }
  })
)

// After — forward (attach issue to nested field)
v.pipe(
  v.object({ pass: v.string(), confirm: v.string() }),
  v.forward(
    v.check((data) => data.pass === data.confirm, 'Mismatch'),
    ['confirm']
  )
)
```

---

## transform

```ts
// Before
z.string().transform((val) => val.trim().toLowerCase())

// After
v.pipe(v.string(), v.transform((val) => val.trim().toLowerCase()))
```

---

## Async validation

```ts
// Before
z.string().refine(async (val) => await isAvailable(val), 'Taken')

// After
v.pipeAsync(
  v.string(),
  v.checkAsync(async (val) => await isAvailable(val), 'Taken')
)

// Parse async
await v.parseAsync(schema, data)
const result = await v.safeParseAsync(schema, data)
```

---

## default / fallback

```ts
// Before
z.string().default('hello')
z.string().catch('fallback')

// After
v.optional(v.string(), 'hello')     // undefined → 'hello'
v.fallback(v.string(), 'fallback')  // invalid → 'fallback'
```

---

## Branded types

```ts
// Before
z.string().brand<'UserId'>()

// After
v.pipe(v.string(), v.brand('UserId'))
type UserId = v.InferOutput<typeof UserIdSchema>
```

---

## ZodError → ValiError

```ts
// Before
try {
  schema.parse(data);
} catch (err) {
  if (err instanceof ZodError) {
    console.log(err.issues);
    const flat = err.flatten();
  }
}

// After
try {
  v.parse(schema, data);
} catch (err) {
  if (err instanceof v.ValiError) {
    console.log(err.issues);
    const flat = v.flatten(err.issues);
    // flat.root — top-level errors
    // flat.nested — field errors
  }
}

// Or with safeParse
const result = v.safeParse(schema, data);
if (!result.success) {
  const flat = v.flatten(result.issues);
}
```

---

## describe / brand / pipe metadata

```ts
// Before
z.string().describe('User email')

// After
v.pipe(v.string(), v.description('User email'))
// or
v.pipe(v.string(), v.metadata({ description: 'User email' }))
```

---

## Recursive schemas

```ts
// Before
type Category = { name: string; subcategories: Category[] };
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({ name: z.string(), subcategories: z.array(CategorySchema) })
);

// After
type Category = { name: string; subcategories: Category[] };
const CategorySchema: v.GenericSchema<Category> = v.lazy(() =>
  v.object({ name: v.string(), subcategories: v.array(CategorySchema) })
);
```

---

## Codemod known gaps (fix manually)

- `superRefine` → `rawCheck` / `rawTransform` / `forward`
- `.extend()` and `.merge()` → spread `.entries`
- `z.coerce.*` → explicit `pipe` + `transform`
- Differentiated error objects → single strings
- `ZodError` → `v.ValiError` in catch blocks
- `safeParse` result: `.data` → `.output`, `.error.issues` → `.issues`
- `z.undefined()` → `v.undefined_()` (trailing underscore)
- `z.null()` → `v.null_()`
- `z.void()` → `v.void_()`
