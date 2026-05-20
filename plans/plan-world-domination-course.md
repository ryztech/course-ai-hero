# Plan: How to Achieve Total World Domination Course

> Source PRD: `plans/prd-world-domination-course.md`

## Architectural decisions

- **Scope**: All changes are in `scripts/seed.ts` only — no schema changes, no migrations, no UI work required
- **Insertion order**: `users` and `categories` must be inserted before `courses`; `courses` before `modules`; `modules` before `lessons`; `lessons` before `enrollments` and `lessonProgress`
- **Key models**: `users` (instructor), `categories`, `courses`, `modules`, `lessons`, `enrollments`, `lessonProgress`
- **Existing data**: The seed script drops and recreates all tables on each run — additions must sit alongside the existing two courses and nine users, not replace them

---

## Phase 1: Foundation

**User stories**: 1 (category), 2 (instructor)

### What to build

Insert a new "Self Help / Personal Development" category and a new instructor user "Dr. Evil" into the seed script. Both records must be captured as variables so their IDs are available to all later phases.

Dr. Evil's user record should include a `bio` field (the schema supports it, as confirmed by the existing instructor records).

### Acceptance criteria

- [ ] A "Self Help / Personal Development" category exists after seeding
- [ ] A user named "Dr. Evil" with role `instructor` exists after seeding
- [ ] Both records are captured as variables in scope for subsequent inserts
- [ ] `npx tsx scripts/seed.ts` completes without errors
- [ ] All pre-existing users and categories are still present

---

## Phase 2: Course Record

**User stories**: 3 (browseable), 4 (description & sales copy), 5 ($666 price), 16 (published), 18 (PPP)

### What to build

Insert the course row referencing the Phase 1 instructor and category IDs. The course must include a multi-paragraph `description` and `salesCopy` written in the parody self-help tone established by the PRD. Price is 66600 cents ($666); status is published; PPP is enabled.

### Acceptance criteria

- [ ] Course "How to Achieve Total World Domination" exists with slug `how-to-achieve-total-world-domination`
- [ ] `price` is exactly `66600`
- [ ] `status` is `published`
- [ ] `pppEnabled` is `true`
- [ ] `description` and `salesCopy` are non-empty markdown strings
- [ ] `instructorId` points to Dr. Evil; `categoryId` points to Self Help / Personal Development
- [ ] `npx tsx scripts/seed.ts` completes without errors

---

## Phase 3: Modules & Lessons

**User stories**: 6 (five modules), 7–11 (per-module content), 12 (~4 lessons each), 13 (title + markdown content), 14 (duration)

### What to build

Insert all five modules and their twenty lessons in a single slice. The modules follow the arc defined in the PRD: Mindset → Resources → Influence → Control → Endgame. Each module gets four lessons with a title, markdown `content` paragraph, and a `durationMinutes` value. Lesson positions are 1–4 within each module; module positions are 1–5 within the course.

Capture at least the first two lessons of Module 1 as variables for use in Phase 4.

### Acceptance criteria

- [ ] Five modules exist under the course, positions 1–5, with correct titles
- [ ] Each module contains exactly four lessons, positions 1–4
- [ ] Every lesson has a non-empty `content` string and a `durationMinutes` value greater than zero
- [ ] `npx tsx scripts/seed.ts` completes without errors

---

## Phase 4: Student Activity

**User stories**: 15 (progress tracking), 17 (enrolled student)

### What to build

Enrol an existing student (Emma Wilson, `students[0]`) in the course and seed two `lessonProgress` records for the first two lessons of Module 1: the first completed, the second in-progress. This makes the platform look active without requiring a purchase record.

### Acceptance criteria

- [ ] One enrolment record exists linking Emma Wilson to the course
- [ ] Lesson 1 of Module 1 has `status: completed` with a non-null `completedAt`
- [ ] Lesson 2 of Module 1 has `status: in_progress` with a null `completedAt`
- [ ] No other lesson progress records exist for this course in the seed
- [ ] `npx tsx scripts/seed.ts` completes without errors and all foreign keys are satisfied
- [ ] Pre-existing enrolments and progress records for the other two courses are unaffected
