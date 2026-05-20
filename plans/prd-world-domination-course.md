## Problem Statement

The platform currently only has two courses seeded (TypeScript and Node.js REST APIs). There is no self-help content, and no "Self Help / Personal Development" category exists. A new flagship self-help course — "How to Achieve Total World Domination" — needs to be added to the platform, complete with a dedicated instructor, category, full module/lesson structure, and appropriate seed data.

## Solution

Extend the seed script to add a new category, a new instructor (Dr. Evil), and a fully populated course titled "How to Achieve Total World Domination". The course follows a five-module arc from cultivating the right mindset through to executing the endgame plan. It is priced at $666 and published immediately.

## User Stories

1. As an admin, I want a "Self Help / Personal Development" category available on the platform, so that self-help courses can be correctly classified.
2. As an admin, I want a new instructor account for Dr. Evil, so that the course has a credible, named author.
3. As a prospective student, I want to browse the "How to Achieve Total World Domination" course on the platform, so that I can evaluate whether it is right for me.
4. As a prospective student, I want to read a compelling course description and sales copy, so that I understand the value proposition before purchasing.
5. As a student, I want to purchase the course for $666, so that I can gain access to the full content.
6. As a student, I want to see the course divided into five clearly named modules, so that I can understand the overall learning journey at a glance.
7. As a student, I want Module 1 (Mindset) to teach me the psychological foundations of world domination, so that I can rewire my thinking for global ambition.
8. As a student, I want Module 2 (Resources) to teach me how to acquire capital, assets, and infrastructure from nothing, so that I have the material base needed to execute my plan.
9. As a student, I want Module 3 (Influence) to teach me how to build alliances, control narratives, and amass followers, so that I can extend my reach beyond my own direct actions.
10. As a student, I want Module 4 (Control) to teach me how to consolidate power, neutralise opposition, and build resilient systems of control, so that my position becomes unassailable.
11. As a student, I want Module 5 (Endgame) to teach me how to execute the final phase and establish lasting global dominance, so that my legacy is secured.
12. As a student, I want each module to contain approximately four lessons, so that the content is broken into digestible chunks.
13. As a student, I want each lesson to have a title and markdown content, so that I can read through the material at my own pace.
14. As a student, I want lessons to have an estimated duration, so that I can plan my study sessions.
15. As a student, I want to track my progress through each lesson (not started / in progress / completed), so that I know where I left off.
16. As an instructor (Dr. Evil), I want my course to be in "published" status from the moment it is seeded, so that students can enrol immediately.
17. As an admin, I want at least one student enrolled in the course in the seed data, so that the platform looks active from day one.
18. As an admin, I want purchasing power parity pricing enabled for the course, so that students in lower-income countries can access it affordably.

## Implementation Decisions

- A new category "Self Help / Personal Development" will be added to the categories table in the seed script.
- A new user with role `instructor` and the display name "Dr. Evil" will be added to the users table in the seed script.
- The course record will have:
  - `title`: "How to Achieve Total World Domination"
  - `slug`: "how-to-achieve-total-world-domination"
  - `status`: "published"
  - `price`: 66600 (cents, representing $666)
  - `pppEnabled`: true
  - A multi-paragraph `description` and `salesCopy` in markdown
- Five modules will be created, each with a `position` (1–5):
  1. **Mindset** — the psychological and philosophical foundation
  2. **Resources** — acquiring capital, assets, and infrastructure
  3. **Influence** — alliances, narrative control, and follower growth
  4. **Control** — consolidating power and neutralising opposition
  5. **Endgame** — executing the final plan and securing a lasting legacy
- Each module will contain four lessons with `position` values (1–4), markdown `content`, and a `durationMinutes` estimate.
- At least one existing student will be enrolled in the course in the seed data, with `lessonProgress` records seeded for a subset of lessons.
- All additions are made exclusively in `scripts/seed.ts` — no schema or migration changes are required.
- No quizzes are in scope for the initial seed (can be added later).

## Out of Scope

- Creating or modifying any database migrations (the existing schema supports all required fields).
- Building any new UI components or routes specifically for this course.
- Adding video URLs or GitHub repo links to lessons (content-only for now).
- Quiz/assessment content for this course.
- Team purchases or coupon codes for this course.
- Any AI-generated or dynamic content beyond what is written in the seed script.

## Further Notes

- The $666 price point is intentional and on-brand for the course theme; do not normalise it to a round number.
- Dr. Evil's instructor profile should have a suitably villainous bio in the seed data if the users table supports a bio/description field — check schema before assuming.
- The course slug must be unique across the platform; confirm no collision with existing slugs before finalising.
- Sales copy should lean into the self-help parody tone — grandiose, self-serious, slightly absurd.
