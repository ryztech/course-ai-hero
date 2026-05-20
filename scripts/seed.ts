import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../app/db/schema";
import {
  UserRole,
  CourseStatus,
  LessonProgressStatus,
  QuestionType,
  TeamMemberRole,
} from "../app/db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, "../drizzle");

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

// ─── Helpers ───

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Seed Data ───

async function seed() {
  console.log("Seeding database...");

  // Drop and recreate tables for a clean seed
  sqlite.exec(`
    DROP TABLE IF EXISTS video_watch_events;
    DROP TABLE IF EXISTS lesson_comments;
    DROP TABLE IF EXISTS quiz_answers;
    DROP TABLE IF EXISTS quiz_attempts;
    DROP TABLE IF EXISTS quiz_options;
    DROP TABLE IF EXISTS quiz_questions;
    DROP TABLE IF EXISTS quizzes;
    DROP TABLE IF EXISTS lesson_progress;
    DROP TABLE IF EXISTS course_ratings;
    DROP TABLE IF EXISTS coupons;
    DROP TABLE IF EXISTS team_members;
    DROP TABLE IF EXISTS teams;
    DROP TABLE IF EXISTS purchases;
    DROP TABLE IF EXISTS enrollments;
    DROP TABLE IF EXISTS lesson_bookmarks;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS modules;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS __drizzle_migrations;
  `);

  // Create tables using the same Drizzle migrations as the live database
  migrate(db, { migrationsFolder });

  console.log("Tables created.");

  // ─── Users ───
  // 1 admin, 2 instructors, 5 students

  const [admin] = db
    .insert(schema.users)
    .values({
      name: "Alex Rivera",
      email: "alex.rivera@ralph.dev",
      role: UserRole.Admin,
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
      createdAt: daysAgo(120),
    })
    .returning()
    .all();

  const [instructor1] = db
    .insert(schema.users)
    .values({
      name: "Sarah Chen",
      email: "sarah.chen@ralph.dev",
      role: UserRole.Instructor,
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sarah",
      bio: "Senior TypeScript engineer with 10 years of experience building large-scale web applications. Previously at Stripe and Vercel. Passionate about type safety and developer tooling.",
      createdAt: daysAgo(100),
    })
    .returning()
    .all();

  const [instructor2] = db
    .insert(schema.users)
    .values({
      name: "Marcus Johnson",
      email: "marcus.johnson@ralph.dev",
      role: UserRole.Instructor,
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=marcus",
      bio: "Full-stack developer and API architect specializing in Node.js and cloud infrastructure. Has built and scaled APIs serving millions of requests daily. Conference speaker and open-source contributor.",
      createdAt: daysAgo(95),
    })
    .returning()
    .all();

  const [instructor3] = db
    .insert(schema.users)
    .values({
      name: "Dr. Evil",
      email: "dr.evil@ralph.dev",
      role: UserRole.Instructor,
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=drEvil",
      bio: "Visionary strategist, self-made megalomaniac, and the world's foremost authority on global power acquisition. Formerly of several unnamed shadow organisations. Author of the unpublished manuscript 'You Too Can Rule Everything'. Currently accepting students — for a price.",
      createdAt: daysAgo(90),
    })
    .returning()
    .all();

  const students = db
    .insert(schema.users)
    .values([
      {
        name: "Emma Wilson",
        email: "emma.wilson@student.dev",
        role: UserRole.Student,
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=emma",
        createdAt: daysAgo(60),
      },
      {
        name: "James Park",
        email: "james.park@student.dev",
        role: UserRole.Student,
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=james",
        createdAt: daysAgo(55),
      },
      {
        name: "Olivia Martinez",
        email: "olivia.martinez@student.dev",
        role: UserRole.Student,
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=olivia",
        createdAt: daysAgo(45),
      },
      {
        name: "Liam Thompson",
        email: "liam.thompson@student.dev",
        role: UserRole.Student,
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=liam",
        createdAt: daysAgo(30),
      },
      {
        name: "Sophia Davis",
        email: "sophia.davis@student.dev",
        role: UserRole.Student,
        avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sophia",
        createdAt: daysAgo(20),
      },
    ])
    .returning()
    .all();

  const [bossy] = db
    .insert(schema.users)
    .values({
      name: "Bossy McBossface",
      email: "bossy.mcbossface@student.dev",
      role: UserRole.Student,
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=bossy",
      createdAt: daysAgo(40),
    })
    .returning()
    .all();

  console.log(
    `Created ${1 + 3 + students.length + 1} users (1 admin, 3 instructors, ${students.length + 1} students).`
  );

  // ─── Categories ───

  const categoriesData = db
    .insert(schema.categories)
    .values([
      { name: "Programming", slug: "programming" },
      { name: "Design", slug: "design" },
      { name: "Data Science", slug: "data-science" },
      { name: "DevOps", slug: "devops" },
      { name: "Marketing", slug: "marketing" },
      { name: "Self Help / Personal Development", slug: "self-help-personal-development" },
    ])
    .returning()
    .all();

  const catBySlug = Object.fromEntries(categoriesData.map((c) => [c.slug, c]));

  console.log(`Created ${categoriesData.length} categories.`);

  // ─── Course 1: Introduction to TypeScript (Sarah Chen) ───

  const [course1] = db
    .insert(schema.courses)
    .values({
      title: "Introduction to TypeScript",
      slug: "introduction-to-typescript",
      description:
        "Master TypeScript from the ground up. Learn type annotations, interfaces, generics, and advanced patterns that will make your JavaScript code safer and more maintainable. Includes hands-on projects and real-world examples.",
      salesCopy: `## Why TypeScript?

If you've been writing JavaScript and wondering why your code breaks in production with cryptic "undefined is not a function" errors, TypeScript is the answer you've been looking for.

TypeScript adds a powerful type system on top of JavaScript that catches bugs before they ever reach your users. It's not just about finding errors — it's about writing code with confidence, knowing that your editor understands your code as well as you do.

## What You'll Learn

This course takes you from zero TypeScript knowledge to confidently using advanced patterns in real projects. We start with the basics — type annotations, interfaces, and simple generics — and build up to discriminated unions, mapped types, conditional types, and template literal types.

Every concept is taught through practical examples. You won't just learn what a generic is — you'll learn when and why to use one, and how to constrain them for maximum type safety.

### Course Highlights

- **19 lessons** across 5 modules, from setup to advanced patterns
- **Hands-on quizzes** to test your understanding as you go
- **Real-world React examples** showing TypeScript in production code
- **Error handling patterns** using Result types and discriminated unions

## Who Is This Course For?

This course is perfect for JavaScript developers who want to level up their code quality. Whether you're working on a personal project or a large team codebase, TypeScript will make your development experience faster, safer, and more enjoyable.

No prior TypeScript experience required — just a solid understanding of JavaScript fundamentals.

## What Makes This Course Different

Unlike courses that just show you syntax, this course focuses on *thinking in types*. You'll learn to design your types first and let them guide your implementation, catching entire categories of bugs at compile time instead of runtime.

By the end of this course, you'll understand why TypeScript has become the default choice for serious JavaScript development.`,
      instructorId: instructor1.id,
      categoryId: catBySlug["programming"].id,
      status: CourseStatus.Published,
      coverImageUrl: "/images/course-typescript.svg",
      price: 4999,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(10),
    })
    .returning()
    .all();

  // Course 1 modules and lessons
  const c1Modules = [
    {
      title: "Getting Started with TypeScript",
      lessons: [
        {
          title: "What is TypeScript?",
          duration: 8,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          githubRepoUrl:
            "https://github.com/total-typescript/ts-intro-what-is-ts",
          content: `## What is TypeScript?

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing and class-based object-oriented programming to the language.

### Why TypeScript?

- Catch errors at compile time instead of runtime
- Better IDE support with autocompletion
- Easier to refactor large codebases
- Self-documenting code through types`,
        },
        {
          title: "Installing and Configuring TypeScript",
          duration: 12,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Setting Up TypeScript

Let's get TypeScript installed and configured in your development environment.

### Installation

\`\`\`bash
npm install -g typescript
tsc --version
\`\`\`

### tsconfig.json

The \`tsconfig.json\` file configures the TypeScript compiler options for your project.`,
        },
        {
          title: "Your First TypeScript Program",
          duration: 15,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          githubRepoUrl:
            "https://github.com/total-typescript/ts-intro-first-program",
          content: `## Hello, TypeScript!

Let's write our first TypeScript program and see the compilation process in action.

\`\`\`typescript
function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`;
}

console.log(greet('World'));
\`\`\``,
        },
      ],
    },
    {
      title: "Type System Fundamentals",
      lessons: [
        {
          title: "Primitive Types",
          duration: 10,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Primitive Types

TypeScript supports the same primitive types as JavaScript, plus a few extras.

- \`string\` — text values
- \`number\` — numeric values (integer and float)
- \`boolean\` — true/false
- \`null\` and \`undefined\`
- \`symbol\` and \`bigint\``,
        },
        {
          title: "Arrays and Tuples",
          duration: 12,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Arrays and Tuples

Learn how to type arrays and fixed-length tuples in TypeScript.

\`\`\`typescript
const numbers: number[] = [1, 2, 3];
const pair: [string, number] = ['age', 25];
\`\`\``,
        },
        {
          title: "Type Aliases and Interfaces",
          duration: 18,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Type Aliases vs Interfaces

Both type aliases and interfaces let you define custom types, but they have subtle differences.

### Type Alias

\`\`\`typescript
type User = {
  name: string;
  age: number;
};
\`\`\`

### Interface

\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\``,
        },
        {
          title: "Union and Intersection Types",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Union and Intersection Types

Combine types in powerful ways using unions (\`|\`) and intersections (\`&\`).

\`\`\`typescript
type StringOrNumber = string | number;
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;
\`\`\``,
        },
      ],
    },
    {
      title: "Functions and Generics",
      lessons: [
        {
          title: "Function Types",
          duration: 11,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Typing Functions

TypeScript lets you type function parameters, return values, and even the function itself.

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}

const multiply: (a: number, b: number) => number = (a, b) => a * b;
\`\`\``,
        },
        {
          title: "Generics Basics",
          duration: 20,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          githubRepoUrl:
            "https://github.com/total-typescript/ts-generics-basics",
          content: `## Introduction to Generics

Generics let you write reusable code that works with multiple types while maintaining type safety.

\`\`\`typescript
function identity<T>(value: T): T {
  return value;
}

const str = identity('hello'); // string
const num = identity(42); // number
\`\`\``,
        },
        {
          title: "Generic Constraints",
          duration: 16,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Constraining Generics

Use \`extends\` to limit what types a generic can accept.

\`\`\`typescript
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength('hello'); // OK
getLength([1, 2, 3]); // OK
// getLength(42); // Error!
\`\`\``,
        },
        {
          title: "Utility Types",
          duration: 15,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Built-in Utility Types

TypeScript provides several utility types for common type transformations.

- \`Partial<T>\` — makes all properties optional
- \`Required<T>\` — makes all properties required
- \`Pick<T, K>\` — selects specific properties
- \`Omit<T, K>\` — excludes specific properties
- \`Record<K, V>\` — creates an object type with keys K and values V`,
        },
      ],
    },
    {
      title: "Advanced Patterns",
      lessons: [
        {
          title: "Discriminated Unions",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Discriminated Unions

A pattern that combines union types with literal types to create type-safe tagged unions.

\`\`\`typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
  }
}
\`\`\``,
        },
        {
          title: "Type Guards and Narrowing",
          duration: 13,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Type Guards

Type guards are expressions that narrow a type within a conditional block.

\`\`\`typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: string | number) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // string
  } else {
    console.log(value.toFixed(2)); // number
  }
}
\`\`\``,
        },
        {
          title: "Mapped Types",
          duration: 17,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Mapped Types

Create new types by transforming each property of an existing type.

\`\`\`typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};
\`\`\``,
        },
        {
          title: "Conditional Types",
          duration: 19,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Conditional Types

Types that depend on a condition, similar to ternary expressions but at the type level.

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>; // false
\`\`\``,
        },
        {
          title: "Template Literal Types",
          duration: 10,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Template Literal Types

Construct string types using template literal syntax.

\`\`\`typescript
type Color = 'red' | 'blue' | 'green';
type CSSProperty = \\\`color-\\\${Color}\\\`;
// 'color-red' | 'color-blue' | 'color-green'
\`\`\``,
        },
      ],
    },
    {
      title: "Real-World TypeScript",
      lessons: [
        {
          title: "TypeScript with React",
          duration: 22,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          githubRepoUrl:
            "https://github.com/total-typescript/ts-react-examples",
          content: `## TypeScript + React

Learn how to use TypeScript effectively in React applications.

\`\`\`typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{label}</button>;
}
\`\`\``,
        },
        {
          title: "Error Handling Patterns",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
          content: `## Error Handling in TypeScript

Strategies for handling errors in a type-safe way.

\`\`\`typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: new Error('Division by zero') };
  return { ok: true, value: a / b };
}
\`\`\``,
        },
        {
          title: "Course Wrap-Up and Next Steps",
          duration: 8,
          content: `## Congratulations!

You've completed the Introduction to TypeScript course. Here's what we covered:

- TypeScript fundamentals and type system
- Functions, generics, and utility types
- Advanced patterns like discriminated unions and mapped types
- Real-world usage with React

### Next Steps

Practice by converting an existing JavaScript project to TypeScript. Start with strict mode enabled and work through the errors one by one.`,
        },
      ],
    },
  ];

  const course1LessonIds: number[] = [];

  for (let mi = 0; mi < c1Modules.length; mi++) {
    const modData = c1Modules[mi];
    const [mod] = db
      .insert(schema.modules)
      .values({
        courseId: course1.id,
        title: modData.title,
        position: mi + 1,
        createdAt: daysAgo(90 - mi),
      })
      .returning()
      .all();

    for (let li = 0; li < modData.lessons.length; li++) {
      const lessonData = modData.lessons[li];
      const [lesson] = db
        .insert(schema.lessons)
        .values({
          moduleId: mod.id,
          title: lessonData.title,
          content: lessonData.content,
          videoUrl: lessonData.videoUrl ?? null,
          githubRepoUrl:
            ("githubRepoUrl" in lessonData ? lessonData.githubRepoUrl : null) ??
            null,
          position: li + 1,
          durationMinutes: lessonData.duration,
          createdAt: daysAgo(90 - mi),
        })
        .returning()
        .all();
      course1LessonIds.push(lesson.id);
    }
  }

  console.log(
    `Created course "${course1.title}" with ${c1Modules.length} modules and ${course1LessonIds.length} lessons.`
  );

  // ─── Course 2: Building REST APIs with Node.js (Marcus Johnson) ───

  const [course2] = db
    .insert(schema.courses)
    .values({
      title: "Building REST APIs with Node.js",
      slug: "building-rest-apis-with-nodejs",
      description:
        "Learn to build production-ready REST APIs using Node.js and Express. Covers routing, middleware, authentication, database integration, error handling, testing, and deployment best practices.",
      salesCopy: `## Build APIs That Actually Work in Production

Most API tutorials teach you how to return JSON from an endpoint. This course teaches you how to build APIs that handle real traffic, real users, and real problems — the kind you'll face on the job.

From your first Express route to deploying a production-ready API, you'll learn every layer of the stack: routing, middleware, validation, authentication, database integration, testing, and deployment.

## What You'll Build

Throughout this course, you'll build a complete REST API from scratch. Not a toy project — a properly structured API with authentication, input validation, error handling, pagination, and tests.

### Topics Covered

- **Express fundamentals** — routing, middleware chains, request/response lifecycle
- **Input validation with Zod** — never trust user input, validate everything
- **Database integration** — Drizzle ORM with SQLite, CRUD operations, transactions
- **JWT authentication** — secure your endpoints with industry-standard tokens
- **Security hardening** — rate limiting, CORS, security headers with Helmet
- **Testing** — unit tests with Vitest, integration tests with Supertest
- **Deployment** — environment config, process management, CI/CD basics

## Who Should Take This Course?

This course is designed for developers who know JavaScript and want to build backend services. If you've built frontends but never created your own API, this is the perfect next step.

You should be comfortable with JavaScript basics — functions, async/await, and working with objects. No backend experience required.

## Why Node.js for APIs?

Node.js lets you use the same language on both frontend and backend. Its non-blocking I/O model handles concurrent requests efficiently, and the npm ecosystem gives you battle-tested libraries for every common backend task.

Express is the most widely-used Node.js web framework for a reason — it's minimal, flexible, and has a massive community. The patterns you learn here will transfer to any Node.js framework.

## 20 Lessons, 5 Modules, Zero Fluff

Every lesson is focused and practical. No 45-minute lectures where 40 minutes are filler. Each lesson teaches one concept, shows you how to implement it, and moves on.`,
      instructorId: instructor2.id,
      categoryId: catBySlug["programming"].id,
      status: CourseStatus.Published,
      coverImageUrl: "/images/course-nodejs.svg",
      price: 5999,
      createdAt: daysAgo(75),
      updatedAt: daysAgo(5),
    })
    .returning()
    .all();

  const c2Modules = [
    {
      title: "API Fundamentals",
      lessons: [
        {
          title: "What is a REST API?",
          duration: 10,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## REST API Fundamentals

REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use HTTP methods to perform CRUD operations on resources.

### Key Principles

- Stateless communication
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON as the data format`,
        },
        {
          title: "Setting Up Express",
          duration: 15,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          githubRepoUrl:
            "https://github.com/total-typescript/rest-api-express-setup",
          content: `## Express.js Setup

Express is the most popular Node.js web framework for building APIs.

\`\`\`javascript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
\`\`\``,
        },
        {
          title: "HTTP Methods and Status Codes",
          duration: 12,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## HTTP Methods

- **GET** — Retrieve resources (200 OK)
- **POST** — Create resources (201 Created)
- **PUT** — Update resources (200 OK)
- **DELETE** — Remove resources (204 No Content)

### Common Status Codes

- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 404 Not Found
- 500 Internal Server Error`,
        },
        {
          title: "Request and Response Objects",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Working with Request & Response

Express provides rich request and response objects for handling HTTP communication.

\`\`\`javascript
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  // ... create user
  res.status(201).json({ id: 1, name, email });
});
\`\`\``,
        },
      ],
    },
    {
      title: "Routing and Middleware",
      lessons: [
        {
          title: "Express Router",
          duration: 13,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Organizing Routes

Use Express Router to organize your API endpoints into logical groups.

\`\`\`javascript
import { Router } from 'express';

const userRouter = Router();
userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);

app.use('/api/users', userRouter);
\`\`\``,
        },
        {
          title: "Custom Middleware",
          duration: 16,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Middleware in Express

Middleware functions have access to the request, response, and next function in the request-response cycle.

\`\`\`javascript
function logger(req, res, next) {
  console.log(\\\`\\\${req.method} \\\${req.url}\\\`);
  next();
}

function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
\`\`\``,
        },
        {
          title: "Error Handling Middleware",
          duration: 11,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Centralized Error Handling

Express supports error-handling middleware with four parameters.

\`\`\`javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});
\`\`\``,
        },
        {
          title: "Validation with Zod",
          duration: 18,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Request Validation

Use Zod to validate request bodies, query parameters, and URL parameters.

\`\`\`javascript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional()
});

app.post('/api/users', (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);
  // ... create user with result.data
});
\`\`\``,
        },
      ],
    },
    {
      title: "Database Integration",
      lessons: [
        {
          title: "Connecting to a Database",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Database Setup

Learn how to connect your API to a database using an ORM.

\`\`\`javascript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('app.db');
const db = drizzle(sqlite);
\`\`\``,
        },
        {
          title: "CRUD Operations",
          duration: 20,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          githubRepoUrl:
            "https://github.com/total-typescript/rest-api-crud-operations",
          content: `## Building CRUD Endpoints

Implement Create, Read, Update, Delete operations for your API resources.

\`\`\`javascript
// Create
app.post('/api/posts', async (req, res) => {
  const post = await db.insert(posts).values(req.body).returning();
  res.status(201).json(post);
});

// Read
app.get('/api/posts/:id', async (req, res) => {
  const post = await db.select().from(posts).where(eq(posts.id, req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});
\`\`\``,
        },
        {
          title: "Pagination and Filtering",
          duration: 15,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Pagination

Implement cursor-based and offset-based pagination for list endpoints.

\`\`\`javascript
app.get('/api/posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const results = await db.select().from(posts)
    .limit(limit).offset(offset);
  res.json({ data: results, page, limit });
});
\`\`\``,
        },
        {
          title: "Transactions",
          duration: 12,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Database Transactions

Use transactions to ensure data consistency when multiple operations must succeed or fail together.

\`\`\`javascript
await db.transaction(async (tx) => {
  const [order] = await tx.insert(orders).values({ userId, total }).returning();
  for (const item of items) {
    await tx.insert(orderItems).values({ orderId: order.id, ...item });
  }
});
\`\`\``,
        },
      ],
    },
    {
      title: "Authentication and Security",
      lessons: [
        {
          title: "JWT Authentication",
          duration: 22,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## JSON Web Tokens

Implement JWT-based authentication for your API.

\`\`\`javascript
import jwt from 'jsonwebtoken';

app.post('/api/login', async (req, res) => {
  const user = await findUser(req.body.email);
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
  res.json({ token });
});
\`\`\``,
        },
        {
          title: "Rate Limiting",
          duration: 10,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Rate Limiting

Protect your API from abuse by limiting the number of requests per client.

\`\`\`javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

app.use('/api/', limiter);
\`\`\``,
        },
        {
          title: "CORS and Security Headers",
          duration: 11,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## CORS Configuration

Configure Cross-Origin Resource Sharing for your API.

\`\`\`javascript
import cors from 'cors';
import helmet from 'helmet';

app.use(cors({ origin: 'https://yourapp.com' }));
app.use(helmet());
\`\`\``,
        },
      ],
    },
    {
      title: "Testing and Deployment",
      lessons: [
        {
          title: "Unit Testing API Routes",
          duration: 18,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Testing with Vitest and Supertest

Write tests for your API endpoints using Vitest and Supertest.

\`\`\`javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('GET /api/users', () => {
  it('returns a list of users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
\`\`\``,
        },
        {
          title: "Integration Testing",
          duration: 16,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Integration Tests

Test complete request flows including database interactions.

\`\`\`javascript
describe('User CRUD', () => {
  it('creates and retrieves a user', async () => {
    const createRes = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@test.com' });
    expect(createRes.status).toBe(201);

    const getRes = await request(app)
      .get(\\\`/api/users/\\\${createRes.body.id}\\\`);
    expect(getRes.body.name).toBe('Test');
  });
});
\`\`\``,
        },
        {
          title: "Environment Variables and Config",
          duration: 9,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Configuration Management

Manage environment-specific settings with environment variables.

\`\`\`javascript
const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL || 'sqlite:app.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret'
};
\`\`\``,
        },
        {
          title: "Deploying Your API",
          duration: 14,
          videoUrl: "https://www.youtube.com/watch?v=lsMQRaeKNDk",
          content: `## Deployment

Deploy your Node.js API to production. We'll cover various hosting options and best practices.

### Deployment Checklist

- Set NODE_ENV=production
- Use a process manager (PM2)
- Set up logging and monitoring
- Configure HTTPS
- Set up CI/CD pipeline`,
        },
        {
          title: "Course Wrap-Up",
          duration: 7,
          content: `## Congratulations!

You've completed the Building REST APIs course. You now have the skills to build, test, and deploy production-ready APIs with Node.js.

### Key Takeaways

- RESTful design principles
- Express routing and middleware
- Database integration and transactions
- Authentication and security
- Testing and deployment`,
        },
      ],
    },
  ];

  const course2LessonIds: number[] = [];

  for (let mi = 0; mi < c2Modules.length; mi++) {
    const modData = c2Modules[mi];
    const [mod] = db
      .insert(schema.modules)
      .values({
        courseId: course2.id,
        title: modData.title,
        position: mi + 1,
        createdAt: daysAgo(75 - mi),
      })
      .returning()
      .all();

    for (let li = 0; li < modData.lessons.length; li++) {
      const lessonData = modData.lessons[li];
      const [lesson] = db
        .insert(schema.lessons)
        .values({
          moduleId: mod.id,
          title: lessonData.title,
          content: lessonData.content,
          videoUrl: lessonData.videoUrl ?? null,
          githubRepoUrl:
            ("githubRepoUrl" in lessonData ? lessonData.githubRepoUrl : null) ??
            null,
          position: li + 1,
          durationMinutes: lessonData.duration,
          createdAt: daysAgo(75 - mi),
        })
        .returning()
        .all();
      course2LessonIds.push(lesson.id);
    }
  }

  console.log(
    `Created course "${course2.title}" with ${c2Modules.length} modules and ${course2LessonIds.length} lessons.`
  );

  // ─── Course 3: How to Achieve Total World Domination (Dr. Evil) ───

  const [course3] = db
    .insert(schema.courses)
    .values({
      title: "How to Achieve Total World Domination",
      slug: "how-to-achieve-total-world-domination",
      description: `You have ambitions. Grand ones. The kind that make lesser people uncomfortable at dinner parties.

This course is your blueprint. Structured across five ruthlessly logical modules, it covers everything a serious world domination candidate needs: the correct mindset, the acquisition of resources, the cultivation of influence, the consolidation of control, and the final, glorious execution of your endgame.

Dr. Evil has spent decades refining these methods through trial, error, and a handful of near-misses that were frankly the fault of incompetent henchmen. Now, for the first time, he is sharing the complete system with a select group of motivated students.

**Five modules. Twenty lessons. One planet.**

If you are reading this, you are already ahead of 99.9% of the population. The only question is whether you are ready to act.`,
      salesCopy: `## Are You Thinking Small Enough?

Most self-help courses will tell you to set "SMART goals." Specific. Measurable. Achievable. Relevant. Time-bound.

*Achievable.*

What a tragically limited word. What a monument to mediocrity. What an insult to your potential.

This course does not deal in achievable. This course deals in **inevitable**.

## What You Will Master

Over five precisely engineered modules, you will learn to think, resource, influence, control, and execute at a scale your current self cannot yet comprehend.

### Module 1 — Mindset
You cannot dominate the world with the psychology of someone who celebrates finishing a 5K. We will rewire your thinking from the ground up. Ambition calibration. Patience as a weapon. The strategic value of being underestimated.

### Module 2 — Resources
Every empire requires a material base. You will learn how to acquire capital, assets, and infrastructure from a standing start — through leverage, positioning, and methods that are technically legal in most jurisdictions.

### Module 3 — Influence
Direct power is brittle. Influence is resilient. You will learn to build alliances, shape narratives, and cultivate followers who believe they are acting of their own free will. They are not. But they will be happy.

### Module 4 — Control
Acquiring power is one thing. Keeping it is another. This module covers the consolidation of control, the neutralisation of opposition, and the construction of systems so resilient that your position becomes, for all practical purposes, unassailable.

### Module 5 — Endgame
Everything has been leading here. The final execution. The moment when all the preparation, patience, and planning converges into a single, decisive act of total global dominance.

## Who Is This Course For?

This course is for individuals who have tried conventional success and found it wanting. For those who look at the world and think: *I could run this better.* For the rare few who are not deterred by the word "impossible" but are, in fact, energised by it.

It is not for the faint of heart. It is not for those who need encouragement. It is for those who simply need a plan.

## About Your Instructor

Dr. Evil has operated at the highest levels of global power acquisition for longer than most governments have existed. He has built organisations, dismantled others, and maintained an impeccable record of zero successful prosecutions. He teaches because he can afford to. He teaches you because he has decided you are worth teaching.

This may be the most important decision either of you ever makes.

**Enrol now. The world will not dominate itself.**`,
      instructorId: instructor3.id,
      categoryId: catBySlug["self-help-personal-development"].id,
      status: CourseStatus.Published,
      price: 66600,
      pppEnabled: true,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(2),
    })
    .returning()
    .all();

  console.log(`Created course "${course3.title}".`);

  // ─── Course 3 Modules & Lessons ───

  const c3Modules = [
    {
      title: "Mindset",
      lessons: [
        {
          title: "The Megalomaniac Mindset",
          duration: 14,
          content: `## The Megalomaniac Mindset

Most people are trained from birth to want just enough. A comfortable salary. A nice house. Recognition from peers they secretly resent. This is not ambition. This is managed disappointment.

World domination begins with a fundamental reorientation of desire. You must want *everything* — not out of greed, but out of a deep conviction that you are the correct person to have it.

### The Three Pillars

1. **Unconditional self-belief** — not confidence, which is contingent on evidence, but belief, which precedes it
2. **Scope expansion** — the deliberate practice of making your goals larger every time you achieve one
3. **Immunity to consensus** — the ability to hold a position that no one around you agrees with, indefinitely, without wavering

Begin this week by identifying the largest thing you currently want. Then double it. Then double it again. Notice the discomfort. That discomfort is the boundary of your current ambition. We will be expanding it considerably.`,
        },
        {
          title: "Patience as a Strategic Weapon",
          duration: 12,
          content: `## Patience as a Strategic Weapon

The amateur wants the world by Friday. The professional understands that the most powerful moves in history took decades to execute and were invisible until the moment they became inevitable.

Patience is not passivity. It is the disciplined accumulation of advantage while your opposition grows complacent.

### The Compounding Effect of Time

Consider: a person who makes one well-timed, well-prepared move per year will, over a decade, have executed ten such moves. Their opponent, who reacts impulsively to every development, will have exhausted themselves on dozens of moves that cancel each other out.

**Patience is leverage.** It costs you nothing and costs your opposition everything, because they do not know how to wait.

### Exercise

Identify one thing you are currently rushing. Stop rushing it. Let it develop at the speed it requires. Observe what changes when you remove artificial urgency from the equation.`,
        },
        {
          title: "The Art of Being Underestimated",
          duration: 10,
          content: `## The Art of Being Underestimated

This is, perhaps, the most valuable skill in this entire course — and the one that most people with genuine ambition refuse to practise, because their ego gets in the way.

Being underestimated is a **strategic asset of the highest order**. When your opponents do not take you seriously, they do not prepare for you. When they do not prepare for you, they are vulnerable to you.

### How to Cultivate Underestimation

- Speak less than you know
- Achieve more than you announce
- Allow others to take credit for small wins while you accumulate large ones
- Present as agreeable in meetings you do not intend to honour

The goal is not to be invisible — it is to be *legible as non-threatening*. There is a difference. One invites curiosity. The other invites dismissal. You want the latter.

Study those who have used this technique throughout history. They are, by definition, not the people you immediately think of.`,
        },
        {
          title: "Visualising Total Victory",
          duration: 11,
          content: `## Visualising Total Victory

Visualisation is not wishful thinking. It is cognitive rehearsal — the practice of running your success scenario in sufficient detail that your brain begins to treat it as an expected outcome rather than a fantasy.

The difference between a fantasy and a plan is specificity.

### The Visualisation Protocol

Set aside fifteen minutes each day. Do not use this time to imagine *having* succeeded. Use it to imagine the moment of transition — the exact sequence of events that moves you from your current position to total victory.

What do you see? Who is in the room? What are they saying? What do you say back?

Run the scenario until it bores you. Boredom is the signal that your brain has accepted it as plausible. Once something is plausible to your brain, it will begin routing your behaviour toward it automatically.

This is not mysticism. This is how preparation works at scale.`,
        },
      ],
    },
    {
      title: "Resources",
      lessons: [
        {
          title: "Bootstrapping Your Evil Empire",
          duration: 15,
          content: `## Bootstrapping Your Evil Empire

Every empire begins with nothing. Or more precisely: with what is available, which is always more than it appears.

The first resource error most aspiring dominators make is waiting until they have sufficient resources before beginning. This is backwards. Resources follow commitment. Commitment precedes resources.

### Starting Points

- **Information asymmetry** — knowing something useful that others do not is a resource
- **Time arbitrage** — being willing to work on a longer timescale than competitors is a resource
- **Network access** — a single well-placed relationship can unlock more than years of individual effort

### The Bootstrap Sequence

1. Identify the smallest viable unit of your empire
2. Execute that unit to completion
3. Reinvest everything into the next unit
4. Do not diversify until you have mastered consolidation

Empires are not built in parallel. They are built in sequence, each stage funding the next. Do not attempt to run five initiatives simultaneously. Run one, dominate it, and move.`,
        },
        {
          title: "Acquiring Assets Through Leverage",
          duration: 16,
          content: `## Acquiring Assets Through Leverage

Leverage is the use of something you have to obtain something you want, without parting with what you have. It is the fundamental mechanism by which individuals accumulate power disproportionate to their starting position.

### Forms of Leverage

**Financial leverage** — using borrowed capital to control assets larger than your equity. The key is that the asset must generate returns exceeding the cost of borrowing.

**Reputational leverage** — the ability to open doors, attract partners, and deter opposition based solely on how you are perceived. Reputation compounds silently and, once established, operates without effort.

**Informational leverage** — controlling access to knowledge that others need. Data, relationships, proprietary processes — anything that others must come to you to access.

### The Golden Rule of Leverage

Never use leverage on something you cannot afford to lose. Leverage amplifies outcomes in both directions. The experienced operator uses it surgically. The novice uses it recklessly and wonders why they keep starting over.`,
        },
        {
          title: "Building Infrastructure That Scales",
          duration: 13,
          content: `## Building Infrastructure That Scales

Amateur operators build things that require them personally to function. Professional operators build things that function regardless of whether they are personally present.

This distinction is the difference between owning a job and owning an empire.

### Principles of Scalable Infrastructure

**Systematise everything** — if you have done something twice, document it. If you have documented it, delegate it. If you have delegated it, measure it.

**Build for ten times your current scale** — infrastructure designed for your current size will need to be rebuilt the moment you grow. Design for where you are going, not where you are.

**Single points of failure are existential risks** — any component of your operation that can bring everything down if it fails must be either redundant or eliminated.

### The Infrastructure Audit

Map every critical function in your current operation. For each one, ask: what happens if this fails tonight? If the answer is "everything stops," you have an infrastructure problem. Fix it before you scale.`,
        },
        {
          title: "Financial Instruments for the Aspiring Overlord",
          duration: 18,
          content: `## Financial Instruments for the Aspiring Overlord

Money is not wealth. Money is a claim on wealth that other people have agreed to honour. Understanding this distinction is the beginning of financial sophistication.

The aspiring overlord does not accumulate money. They accumulate *positions* — ownership stakes, contractual rights, and strategic options that generate money as a by-product.

### Key Instruments

**Equity** — ownership in productive enterprises. The only instrument that, in principle, has no upper bound.

**Options and warrants** — the right, but not the obligation, to acquire something at a predetermined price. Asymmetric upside with capped downside.

**Debt instruments** — both as borrower (cheap capital for acquisition) and lender (returns plus influence over the borrower's decision-making).

**Real assets** — land, infrastructure, productive capacity. Things that exist regardless of what financial markets decide to believe on any given day.

The goal is not to master all of these. The goal is to understand them well enough to deploy each at the appropriate moment and to never be exploited by someone who understands them better than you do.`,
        },
      ],
    },
    {
      title: "Influence",
      lessons: [
        {
          title: "The Architecture of Alliance",
          duration: 12,
          content: `## The Architecture of Alliance

No one dominates the world alone. This is not a limitation — it is a design feature. Alliances multiply your effective reach by orders of magnitude. The skill is in constructing them so that they serve your purposes even when your allies believe they are serving their own.

### Types of Alliance

**Transactional alliances** — built on mutual self-interest, explicit terms, and finite duration. Clean, reliable, and unsentimental. Appropriate for most purposes.

**Ideological alliances** — built on shared belief. These are more durable than transactional alliances because they survive the expiry of the original terms. They are also harder to exit.

**Asymmetric alliances** — where one party benefits more than they realise. Ethically complex, strategically powerful, and dangerous if the asymmetry is discovered.

### Building Durable Alliances

Make it more valuable for your allies to stay allied with you than to defect. This means continuously generating value for them, maintaining information advantages they cannot replicate elsewhere, and ensuring that the cost of defection is visible and credible without ever being stated.`,
        },
        {
          title: "Narrative Control at Scale",
          duration: 14,
          content: `## Narrative Control at Scale

Whoever controls the story controls the outcome. This has been true in every domain — political, commercial, social — throughout recorded history. It is more true now than it has ever been.

### The Three Layers of Narrative

**The surface narrative** — what people say publicly about you, your organisation, and your intentions. This is the most visible and the easiest to manage.

**The ambient narrative** — the background assumptions that people bring to every interaction with you. Harder to manage, but far more powerful. This is the layer where reputations operate.

**The internal narrative** — what your allies, employees, and opponents say to themselves when they think about you. The most difficult to influence and the most decisive.

### Narrative Intervention

You cannot control what people think. You can control what information is available to them, what frameworks they have been given to interpret it, and what they stand to gain or lose by adopting particular conclusions.

Master these three levers and narrative control follows naturally.`,
        },
        {
          title: "Building a Loyal Following",
          duration: 11,
          content: `## Building a Loyal Following

Followers are not employees. Employees do what they are paid to do. Followers do what they believe in — which, if you have done your work correctly, happens to be what you need them to do.

The distinction matters because followers are self-motivating. They recruit other followers. They defend you without being asked. They interpret your setbacks as temporary and your successes as confirmation of destiny.

### The Follower Acquisition Framework

**Give them an enemy** — belonging to a cause requires having something to be against. Define the opposition clearly, credibly, and memorably.

**Give them a role** — people follow leaders who make them feel important to the outcome. Every follower should understand precisely how their contribution connects to the larger mission.

**Give them wins** — early, frequent, visible victories create the psychological momentum that sustains a following through the difficult middle period of any long campaign.

**Give them identity** — the most loyal followers are those for whom following you has become part of who they are. This is the highest level of follower commitment and must be earned, not manufactured.`,
        },
        {
          title: "Managing Defectors and Doubters",
          duration: 10,
          content: `## Managing Defectors and Doubters

In any sufficiently large operation, defection and doubt are inevitable. The question is not how to prevent them — it is how to manage them so that they do not propagate.

### The Defector Typology

**The disappointed loyalist** — believed in you and feels let down by a specific event or decision. Recoverable with direct engagement, honest acknowledgement, and a credible path back.

**The opportunist** — was never truly committed and is leaving for a better offer. Not worth recovering. Ensure they leave with nothing that can harm you.

**The ideological defector** — has concluded that your mission is wrong. The most dangerous type because they will not merely leave — they will organise opposition. Isolate before they consolidate.

### The Doubter

Doubters who express their doubts privately are valuable intelligence assets. They tell you where your operation is vulnerable. Create conditions in which private doubt is surfaced safely.

Doubters who express their doubts publicly are a different matter. Address their specific concerns where they are valid. Where they are not, do not argue — demonstrate.`,
        },
      ],
    },
    {
      title: "Control",
      lessons: [
        {
          title: "Consolidating Power Without Leaving Fingerprints",
          duration: 16,
          content: `## Consolidating Power Without Leaving Fingerprints

The consolidation of power is the most delicate phase of any dominance campaign. It is the phase at which most promising operations are exposed, reversed, or destroyed — not because they lacked power, but because they acquired it visibly.

Power consolidated in the open invites resistance. Power consolidated quietly becomes structural — woven into the fabric of how things work — before anyone has had the opportunity to object.

### Consolidation Techniques

**Institutional capture** — placing your people in positions of structural authority within existing institutions rather than building new ones. This is slower but far more durable.

**Process dependency** — making the systems others rely on pass through your points of control. Over time, what begins as convenience becomes necessity.

**Information centralisation** — ensuring that the most important information flows to you before it flows to anyone else. Not through restriction, which creates resentment, but through positioning yourself as the most useful node in every relevant network.

### The Fingerprint Rule

If you can trace a decision back to you through fewer than three steps, you are operating too directly. Add intermediaries. Introduce complexity. Let the consolidation happen through processes rather than people.`,
        },
        {
          title: "Neutralising Opposition",
          duration: 13,
          content: `## Neutralising Opposition

Opposition is not a problem to be eliminated. It is a force to be redirected, absorbed, or rendered irrelevant.

Elimination is rarely necessary and always costly. It creates martyrs, draws scrutiny, and consumes resources. The sophisticated operator neutralises opposition through other means.

### Neutralisation Strategies

**Incorporation** — bring the opposition inside the tent. Give them a role, a title, a stake. Most opposition is motivated by exclusion. Inclusion resolves it.

**Exhaustion** — oppose the opposition's initiatives with enough friction that they expend their energy on navigation rather than action. Committees are the traditional instrument of this strategy.

**Discrediting** — ensure that the opposition's record, credibility, or associations are visible and unflattering to the audiences they most need to persuade. This does not require fabrication; it requires curation.

**Irrelevance** — move the field of play to terrain where the opposition's strengths do not apply. If they are strong on one dimension, compete on another.

The goal in each case is the same: a former opponent who is either on your side, too tired to continue, no longer credible, or fighting a battle that no longer matters.`,
        },
        {
          title: "Building Resilient Systems of Control",
          duration: 15,
          content: `## Building Resilient Systems of Control

A system of control that depends on any single person — including you — is not a system. It is a vulnerability.

The goal of this module is to construct systems so robust that they continue to function under conditions of significant disruption, including the disruption of your own absence.

### Resilience Principles

**Redundancy** — every critical function must have at least one backup. Not a theoretical backup — an operational one that is regularly tested.

**Decentralisation** — distribute decision-making authority to the lowest level at which it can be competently exercised. Central systems are efficient until they fail catastrophically. Distributed systems fail gracefully.

**Feedback loops** — build mechanisms by which the system monitors its own health and surfaces problems before they become crises. A system that only reports successes is a system that surprises you with failures.

**Succession** — at every level of your operation, there must be a person who can step into the role above them immediately. This is uncomfortable to implement because it requires investing in people who could theoretically replace you. Do it anyway. The alternative is fragility.`,
        },
        {
          title: "The Loyal Inner Circle",
          duration: 12,
          content: `## The Loyal Inner Circle

At the centre of every durable power structure is a small group of people whose loyalty is genuine, deep, and not primarily contingent on their personal gain.

This group is not your largest asset. It is your most important one. Everything else can be rebuilt. If the inner circle fails, it cannot be rebuilt — only replaced, which is a different thing entirely.

### Selecting the Inner Circle

The primary criterion is not competence. Competence can be found and hired. The primary criterion is **alignment of character** — people who, when tested in a situation you did not anticipate, will make the choice you would want them to make, because it is the choice they believe is right.

Secondary criteria: discretion, resilience, and the ability to disagree with you privately without defecting publicly.

### Maintaining the Inner Circle

- Create conditions in which honesty is rewarded and flattery is penalised
- Ensure their material interests are genuinely served by your success
- Invest in their development and visibility — people stay where they feel they are growing
- Never ask them to do something that would compromise their honour. You may need their honour intact later.`,
        },
      ],
    },
    {
      title: "Endgame",
      lessons: [
        {
          title: "Timing the Final Move",
          duration: 14,
          content: `## Timing the Final Move

Everything in this course has been preparation for this moment. The final move is not the most difficult — if you have done the preceding work correctly, it may be almost anticlimactic. What is difficult is knowing when the moment has arrived.

### Indicators of Readiness

**Resource sufficiency** — you have the material base required to execute and sustain the outcome you are seeking. Not comfort — sufficiency. There is a difference.

**Opposition weakness** — your primary opposition is either neutralised, incorporated, or exhausted. The landscape has no significant force capable of reversing your move within the window required.

**Alliance stability** — your key allies are committed, informed (to the degree necessary), and prepared to act.

**Narrative readiness** — the story of what is happening can be told in a way that is either accepted or at least not effectively contested.

### The Cost of Mistiming

Moving too early means exposure before your position is consolidated. Moving too late means allowing a window of vulnerability to reopen. The experienced operator moves when the indicators are met, not when the calendar demands it.

Patience, as we covered in Module 1, is a strategic weapon. This is where it pays off.`,
        },
        {
          title: "Executing the Plan",
          duration: 17,
          content: `## Executing the Plan

Execution is where plans meet reality, and reality, as you have no doubt noticed, does not read plans before it shows up.

The goal of execution is not to follow the plan precisely. It is to achieve the outcome the plan was designed to achieve, adapting as necessary to conditions as they are rather than as they were anticipated.

### Execution Principles

**Speed through the critical window** — the moment you begin, time begins working against you. Opposition organises, information leaks, circumstances shift. Move quickly through the irreversible phases.

**Decision authority** — at each level of your operation, the people executing must have clear authority to make decisions within their domain without waiting for approval. Approval chains kill execution velocity.

**Communication discipline** — during execution, communications should be minimal, precise, and authenticated. This is not the time for nuance or consultation. It is the time for instructions and confirmations.

**Contingency activation** — you have prepared contingencies. If the trigger conditions are met, activate them without hesitation. The contingency exists precisely so that you do not have to make a high-stakes decision under pressure.

### After the First Move

The first move rarely ends the game. It changes the game. Your job after the first move is to read the new game clearly and continue executing toward the outcome, not toward the original plan.`,
        },
        {
          title: "Managing the Transition",
          duration: 11,
          content: `## Managing the Transition

The transition period — between the execution of the final move and the stabilisation of the new order — is the most dangerous phase in any dominance campaign. More operations have failed in the transition than in the execution.

### Why Transitions Fail

**Victory euphoria** — the tendency to relax operational discipline at precisely the moment when it is most required. Celebrate later. Consolidate now.

**Coalition fracture** — alliances built to achieve an outcome do not automatically persist after the outcome is achieved. The shared enemy is gone; the shared interests may not survive contact with actual power.

**Legitimacy deficit** — new orders require legitimacy to stabilise. Legitimacy comes from outcomes people value, not from the fact of power. Move quickly to deliver visible, concrete benefits to the constituencies whose ongoing support you require.

### Transition Architecture

Before you execute the final move, you must have a transition plan that covers at minimum: the first 72 hours, the first 30 days, and the first year. Each phase has different priorities and different risks. Know them in advance.`,
        },
        {
          title: "Securing Your Legacy",
          duration: 13,
          content: `## Securing Your Legacy

You have achieved total world domination. Congratulations. This is, statistically speaking, a remarkable outcome, and you should allow yourself a moment to acknowledge it.

The moment has passed. Now: the legacy.

### What Legacy Requires

Power that dies with you is not a legacy — it is an episode. A legacy requires that what you have built continues to function and compound after you are no longer directing it personally.

This means:

**Institutional durability** — your systems must be embedded in institutions that outlast any individual, including you. Laws, structures, norms, and processes that perpetuate the order you have established.

**Successor cultivation** — identify, develop, and position the person or people who will carry this forward. This is the most emotionally difficult task for most leaders. It requires confronting your own mortality and your own replaceability. Do it anyway.

**Narrative permanence** — the story of what you built and why must be told in a form that persists and that frames your legacy as you intend it to be understood. History is written by the winners, but only if the winners bother to write it.

**The Final Lesson**: The truest measure of total world domination is not whether you rule everything while you are alive. It is whether the world you built continues to reflect your vision long after you are gone.

You have the tools. Go build it.`,
        },
      ],
    },
  ];

  const course3LessonIds: number[] = [];
  let course3Lesson1Id: number;
  let course3Lesson2Id: number;

  for (let mi = 0; mi < c3Modules.length; mi++) {
    const modData = c3Modules[mi];
    const [mod] = db
      .insert(schema.modules)
      .values({
        courseId: course3.id,
        title: modData.title,
        position: mi + 1,
        createdAt: daysAgo(60 - mi),
      })
      .returning()
      .all();

    for (let li = 0; li < modData.lessons.length; li++) {
      const lessonData = modData.lessons[li];
      const [lesson] = db
        .insert(schema.lessons)
        .values({
          moduleId: mod.id,
          title: lessonData.title,
          content: lessonData.content,
          position: li + 1,
          durationMinutes: lessonData.duration,
          createdAt: daysAgo(60 - mi),
        })
        .returning()
        .all();
      course3LessonIds.push(lesson.id);
      if (mi === 0 && li === 0) course3Lesson1Id = lesson.id;
      if (mi === 0 && li === 1) course3Lesson2Id = lesson.id;
    }
  }

  console.log(
    `Created ${c3Modules.length} modules and ${course3LessonIds.length} lessons for "${course3.title}".`
  );

  // ─── Quizzes ───
  // Add quizzes to some lessons in both courses

  // Quiz 1: TypeScript Basics Quiz (attached to "Your First TypeScript Program", lesson 3 of course 1)
  const [quiz1] = db
    .insert(schema.quizzes)
    .values({
      lessonId: course1LessonIds[2], // "Your First TypeScript Program"
      title: "TypeScript Basics Quiz",
      passingScore: 0.7,
    })
    .returning()
    .all();

  const quiz1Questions = [
    {
      text: "What does TypeScript compile to?",
      type: QuestionType.MultipleChoice,
      options: [
        { text: "JavaScript", correct: true },
        { text: "WebAssembly", correct: false },
        { text: "Java bytecode", correct: false },
        { text: "Machine code", correct: false },
      ],
    },
    {
      text: "TypeScript is a superset of JavaScript.",
      type: QuestionType.TrueFalse,
      options: [
        { text: "True", correct: true },
        { text: "False", correct: false },
      ],
    },
    {
      text: "Which file configures the TypeScript compiler?",
      type: QuestionType.MultipleChoice,
      options: [
        { text: "tsconfig.json", correct: true },
        { text: "package.json", correct: false },
        { text: "typescript.config.js", correct: false },
        { text: ".tsrc", correct: false },
      ],
    },
  ];

  const quiz1OptionIds: {
    questionId: number;
    optionId: number;
    correct: boolean;
  }[] = [];

  for (let qi = 0; qi < quiz1Questions.length; qi++) {
    const q = quiz1Questions[qi];
    const [question] = db
      .insert(schema.quizQuestions)
      .values({
        quizId: quiz1.id,
        questionText: q.text,
        questionType: q.type,
        position: qi + 1,
      })
      .returning()
      .all();

    for (const opt of q.options) {
      const [option] = db
        .insert(schema.quizOptions)
        .values({
          questionId: question.id,
          optionText: opt.text,
          isCorrect: opt.correct,
        })
        .returning()
        .all();
      quiz1OptionIds.push({
        questionId: question.id,
        optionId: option.id,
        correct: opt.correct,
      });
    }
  }

  // Quiz 2: Generics Quiz (attached to "Generics Basics", lesson index 5 in course 1)
  const [quiz2] = db
    .insert(schema.quizzes)
    .values({
      lessonId: course1LessonIds[7], // "Generics Basics" (module 3, lesson 2)
      title: "Generics Knowledge Check",
      passingScore: 0.6,
    })
    .returning()
    .all();

  const quiz2Questions = [
    {
      text: "What is the primary benefit of generics?",
      type: QuestionType.MultipleChoice,
      options: [
        { text: "Code reusability with type safety", correct: true },
        { text: "Faster execution speed", correct: false },
        { text: "Smaller bundle size", correct: false },
        { text: "Better error messages", correct: false },
      ],
    },
    {
      text: "Generic type parameters can be constrained using the 'extends' keyword.",
      type: QuestionType.TrueFalse,
      options: [
        { text: "True", correct: true },
        { text: "False", correct: false },
      ],
    },
  ];

  const quiz2OptionIds: {
    questionId: number;
    optionId: number;
    correct: boolean;
  }[] = [];

  for (let qi = 0; qi < quiz2Questions.length; qi++) {
    const q = quiz2Questions[qi];
    const [question] = db
      .insert(schema.quizQuestions)
      .values({
        quizId: quiz2.id,
        questionText: q.text,
        questionType: q.type,
        position: qi + 1,
      })
      .returning()
      .all();

    for (const opt of q.options) {
      const [option] = db
        .insert(schema.quizOptions)
        .values({
          questionId: question.id,
          optionText: opt.text,
          isCorrect: opt.correct,
        })
        .returning()
        .all();
      quiz2OptionIds.push({
        questionId: question.id,
        optionId: option.id,
        correct: opt.correct,
      });
    }
  }

  // Quiz 3: REST API Basics (attached to "HTTP Methods and Status Codes", lesson index 2 in course 2)
  const [quiz3] = db
    .insert(schema.quizzes)
    .values({
      lessonId: course2LessonIds[2], // "HTTP Methods and Status Codes"
      title: "HTTP Methods Quiz",
      passingScore: 0.7,
    })
    .returning()
    .all();

  const quiz3Questions = [
    {
      text: "Which HTTP method is used to create a new resource?",
      type: QuestionType.MultipleChoice,
      options: [
        { text: "POST", correct: true },
        { text: "GET", correct: false },
        { text: "PUT", correct: false },
        { text: "PATCH", correct: false },
      ],
    },
    {
      text: "A 404 status code means the server encountered an internal error.",
      type: QuestionType.TrueFalse,
      options: [
        { text: "True", correct: false },
        { text: "False", correct: true },
      ],
    },
    {
      text: "Which status code indicates successful resource creation?",
      type: QuestionType.MultipleChoice,
      options: [
        { text: "201 Created", correct: true },
        { text: "200 OK", correct: false },
        { text: "204 No Content", correct: false },
        { text: "202 Accepted", correct: false },
      ],
    },
  ];

  const quiz3OptionIds: {
    questionId: number;
    optionId: number;
    correct: boolean;
  }[] = [];

  for (let qi = 0; qi < quiz3Questions.length; qi++) {
    const q = quiz3Questions[qi];
    const [question] = db
      .insert(schema.quizQuestions)
      .values({
        quizId: quiz3.id,
        questionText: q.text,
        questionType: q.type,
        position: qi + 1,
      })
      .returning()
      .all();

    for (const opt of q.options) {
      const [option] = db
        .insert(schema.quizOptions)
        .values({
          questionId: question.id,
          optionText: opt.text,
          isCorrect: opt.correct,
        })
        .returning()
        .all();
      quiz3OptionIds.push({
        questionId: question.id,
        optionId: option.id,
        correct: opt.correct,
      });
    }
  }

  console.log("Created 3 quizzes with questions and options.");

  // ─── Enrollments ───
  // Varied enrollment patterns:
  // - Emma: enrolled in all three courses (nearly complete in course 1, mid-way in course 2, just started course 3)
  // - James: enrolled in course 1 only (completed)
  // - Olivia: enrolled in both courses 1 & 2 (just started course 1, mid-way in course 2)
  // - Liam: enrolled in course 2 only (just started, abandoned)
  // - Sophia: enrolled in course 1 only (recently enrolled, barely started)

  db.insert(schema.enrollments)
    .values([
      { userId: students[0].id, courseId: course1.id, enrolledAt: daysAgo(50) },
      { userId: students[0].id, courseId: course2.id, enrolledAt: daysAgo(40) },
      { userId: students[0].id, courseId: course3.id, enrolledAt: daysAgo(5) },
      {
        userId: students[1].id,
        courseId: course1.id,
        enrolledAt: daysAgo(45),
        completedAt: daysAgo(10),
      },
      { userId: students[2].id, courseId: course1.id, enrolledAt: daysAgo(35) },
      { userId: students[2].id, courseId: course2.id, enrolledAt: daysAgo(30) },
      { userId: students[3].id, courseId: course2.id, enrolledAt: daysAgo(25) },
      { userId: students[4].id, courseId: course1.id, enrolledAt: daysAgo(15) },
    ])
    .run();

  console.log("Created 8 enrollments.");

  // ─── Lesson Progress ───

  // Helper to mark lessons as complete
  function markComplete(
    userId: number,
    lessonId: number,
    daysAgoCompleted: number
  ) {
    db.insert(schema.lessonProgress)
      .values({
        userId,
        lessonId,
        status: LessonProgressStatus.Completed,
        completedAt: daysAgo(daysAgoCompleted),
      })
      .run();
  }

  function markInProgress(userId: number, lessonId: number) {
    db.insert(schema.lessonProgress)
      .values({
        userId,
        lessonId,
        status: LessonProgressStatus.InProgress,
      })
      .run();
  }

  // Emma (students[0]) — nearly complete in course 1 (17 of 19 lessons done)
  for (let i = 0; i < 17; i++) {
    markComplete(students[0].id, course1LessonIds[i], 50 - i);
  }
  markInProgress(students[0].id, course1LessonIds[17]);

  // Emma — mid-way through course 2 (10 of 20 lessons done)
  for (let i = 0; i < 10; i++) {
    markComplete(students[0].id, course2LessonIds[i], 40 - i);
  }
  markInProgress(students[0].id, course2LessonIds[10]);

  // James (students[1]) — completed all of course 1
  for (let i = 0; i < course1LessonIds.length; i++) {
    markComplete(students[1].id, course1LessonIds[i], 45 - i);
  }

  // Olivia (students[2]) — just started course 1 (3 lessons done)
  for (let i = 0; i < 3; i++) {
    markComplete(students[2].id, course1LessonIds[i], 30 - i);
  }
  markInProgress(students[2].id, course1LessonIds[3]);

  // Olivia — mid-way through course 2 (8 lessons done)
  for (let i = 0; i < 8; i++) {
    markComplete(students[2].id, course2LessonIds[i], 28 - i);
  }

  // Liam (students[3]) — just started course 2, abandoned (2 lessons done)
  for (let i = 0; i < 2; i++) {
    markComplete(students[3].id, course2LessonIds[i], 22 - i);
  }

  // Sophia (students[4]) — barely started course 1 (1 lesson done)
  markComplete(students[4].id, course1LessonIds[0], 12);
  markInProgress(students[4].id, course1LessonIds[1]);

  // Emma — just started course 3 (lesson 1 completed, lesson 2 in progress)
  markComplete(students[0].id, course3Lesson1Id!, 4);
  markInProgress(students[0].id, course3Lesson2Id!);

  console.log("Created lesson progress records.");

  // ─── Quiz Attempts ───

  // Helper to record a quiz attempt with answers
  function recordQuizAttempt(
    userId: number,
    quizId: number,
    optionIds: { questionId: number; optionId: number; correct: boolean }[],
    selectedCorrectIndices: number[], // which questions (0-based) the student got right
    attemptDaysAgo: number
  ) {
    const totalQuestions = new Set(optionIds.map((o) => o.questionId)).size;
    const correctCount = selectedCorrectIndices.length;
    const score = correctCount / totalQuestions;

    // Determine passing based on quiz passingScore (we'll just use 0.7 as default)
    const passed = score >= 0.7;

    const [attempt] = db
      .insert(schema.quizAttempts)
      .values({
        userId,
        quizId,
        score,
        passed,
        attemptedAt: daysAgo(attemptDaysAgo),
      })
      .returning()
      .all();

    // Build answer selections
    const questionIds = [...new Set(optionIds.map((o) => o.questionId))];
    for (let qi = 0; qi < questionIds.length; qi++) {
      const qId = questionIds[qi];
      const qOptions = optionIds.filter((o) => o.questionId === qId);
      let selectedOption: (typeof qOptions)[0];

      if (selectedCorrectIndices.includes(qi)) {
        // Pick correct answer
        selectedOption = qOptions.find((o) => o.correct)!;
      } else {
        // Pick wrong answer
        selectedOption = qOptions.find((o) => !o.correct)!;
      }

      db.insert(schema.quizAnswers)
        .values({
          attemptId: attempt.id,
          questionId: qId,
          selectedOptionId: selectedOption.optionId,
        })
        .run();
    }
  }

  // Emma — passed quiz 1 (3/3 correct)
  recordQuizAttempt(students[0].id, quiz1.id, quiz1OptionIds, [0, 1, 2], 35);

  // Emma — passed quiz 2 (2/2 correct)
  recordQuizAttempt(students[0].id, quiz2.id, quiz2OptionIds, [0, 1], 30);

  // Emma — passed quiz 3 (2/3 correct, just barely at 67% with 70% passing = fail, then retake)
  recordQuizAttempt(students[0].id, quiz3.id, quiz3OptionIds, [0, 2], 28);
  // Retake — all correct
  recordQuizAttempt(students[0].id, quiz3.id, quiz3OptionIds, [0, 1, 2], 27);

  // James — passed quiz 1 (3/3 correct)
  recordQuizAttempt(students[1].id, quiz1.id, quiz1OptionIds, [0, 1, 2], 40);

  // James — passed quiz 2 (2/2 correct)
  recordQuizAttempt(students[1].id, quiz2.id, quiz2OptionIds, [0, 1], 35);

  // Olivia — failed quiz 1 first attempt (1/3 correct), then passed on retry (3/3)
  recordQuizAttempt(students[2].id, quiz1.id, quiz1OptionIds, [0], 25);
  recordQuizAttempt(students[2].id, quiz1.id, quiz1OptionIds, [0, 1, 2], 24);

  // Olivia — passed quiz 3 (3/3 correct)
  recordQuizAttempt(students[2].id, quiz3.id, quiz3OptionIds, [0, 1, 2], 20);

  // Sophia — failed quiz 1 (1/3 correct, hasn't retaken yet)
  recordQuizAttempt(students[4].id, quiz1.id, quiz1OptionIds, [1], 10);

  console.log("Created quiz attempts and answers.");

  // ─── Video Watch Events ───
  // Sprinkle some realistic watch events

  function addWatchEvent(
    userId: number,
    lessonId: number,
    eventType: string,
    positionSeconds: number,
    eventDaysAgo: number
  ) {
    db.insert(schema.videoWatchEvents)
      .values({
        userId,
        lessonId,
        eventType,
        positionSeconds,
        createdAt: daysAgo(eventDaysAgo),
      })
      .run();
  }

  // Emma watching course 1 lesson 1 (8 min video)
  addWatchEvent(students[0].id, course1LessonIds[0], "play", 0, 50);
  addWatchEvent(students[0].id, course1LessonIds[0], "pause", 180, 50);
  addWatchEvent(students[0].id, course1LessonIds[0], "play", 180, 49);
  addWatchEvent(students[0].id, course1LessonIds[0], "ended", 480, 49);

  // James watching course 1 lesson 1
  addWatchEvent(students[1].id, course1LessonIds[0], "play", 0, 45);
  addWatchEvent(students[1].id, course1LessonIds[0], "ended", 480, 45);

  // Liam started watching course 2 lesson 1 but stopped mid-way
  addWatchEvent(students[3].id, course2LessonIds[0], "play", 0, 22);
  addWatchEvent(students[3].id, course2LessonIds[0], "pause", 300, 22);
  addWatchEvent(students[3].id, course2LessonIds[0], "seek", 150, 21);
  addWatchEvent(students[3].id, course2LessonIds[0], "play", 150, 21);
  addWatchEvent(students[3].id, course2LessonIds[0], "pause", 360, 21);

  console.log("Created video watch events.");

  // ─── Lesson Comments ───

  db.insert(schema.lessonComments)
    .values({
      lessonId: course1LessonIds[0],
      userId: students[0].id, // Emma
      content:
        "Great introduction! I finally understand why TypeScript is worth learning.",
      createdAt: daysAgo(48),
    })
    .run();

  db.insert(schema.lessonComments)
    .values({
      lessonId: course1LessonIds[0],
      userId: students[1].id, // James
      content:
        "The comparison between TypeScript and plain JavaScript was really helpful. Would love to see more examples of real-world type errors that TypeScript catches.",
      createdAt: daysAgo(44),
    })
    .run();

  db.insert(schema.lessonComments)
    .values({
      lessonId: course1LessonIds[2],
      userId: students[2].id, // Olivia
      content:
        "I got stuck on the tsconfig setup but figured it out. Make sure you have Node 18+ installed!",
      createdAt: daysAgo(28),
    })
    .run();

  db.insert(schema.lessonComments)
    .values({
      lessonId: course1LessonIds[7],
      userId: students[0].id, // Emma
      content:
        "Generics clicked for me after the identity function example. The constraint part with extends is really powerful.",
      createdAt: daysAgo(25),
    })
    .run();

  db.insert(schema.lessonComments)
    .values({
      lessonId: course2LessonIds[0],
      userId: students[0].id, // Emma
      content:
        "Coming from the TypeScript course, this is a nice change of pace. Looking forward to building an actual API!",
      createdAt: daysAgo(38),
    })
    .run();

  db.insert(schema.lessonComments)
    .values({
      lessonId: course2LessonIds[4],
      userId: students[2].id, // Olivia
      content:
        "The Router pattern makes so much more sense now. I was putting all my routes in one file before.",
      createdAt: daysAgo(22),
    })
    .run();

  console.log("Created 6 lesson comments.");

  // ─── Purchases ───
  // Individual purchases for enrolled students

  const [purchase1] = db
    .insert(schema.purchases)
    .values({
      userId: students[0].id, // Emma — bought course 1 individually
      courseId: course1.id,
      pricePaid: 4999,
      country: "US",
      createdAt: daysAgo(50),
    })
    .returning()
    .all();

  db.insert(schema.purchases)
    .values({
      userId: students[0].id, // Emma — bought course 2 individually
      courseId: course2.id,
      pricePaid: 5999,
      country: "US",
      createdAt: daysAgo(40),
    })
    .run();

  db.insert(schema.purchases)
    .values({
      userId: students[1].id, // James — bought course 1 with PPP discount (India)
      courseId: course1.id,
      pricePaid: 2500,
      country: "IN",
      createdAt: daysAgo(45),
    })
    .run();

  db.insert(schema.purchases)
    .values({
      userId: students[2].id, // Olivia — bought course 1 individually
      courseId: course1.id,
      pricePaid: 4999,
      country: "US",
      createdAt: daysAgo(35),
    })
    .run();

  db.insert(schema.purchases)
    .values({
      userId: students[4].id, // Sophia — bought course 1 individually
      courseId: course1.id,
      pricePaid: 4999,
      country: "US",
      createdAt: daysAgo(15),
    })
    .run();

  console.log("Created 5 individual purchases.");

  // ─── Teams, Team Members, and Coupons ───
  // Bossy McBossface bought 5 team seats for course 2; Olivia and Liam redeemed coupons

  const [team1] = db
    .insert(schema.teams)
    .values({ createdAt: daysAgo(30) })
    .returning()
    .all();

  db.insert(schema.teamMembers)
    .values({
      teamId: team1.id,
      userId: bossy.id,
      role: TeamMemberRole.Admin,
      createdAt: daysAgo(30),
    })
    .run();

  // Team purchase by Bossy McBossface for course 2 (5 seats)
  const [teamPurchase] = db
    .insert(schema.purchases)
    .values({
      userId: bossy.id,
      courseId: course2.id,
      pricePaid: 5999 * 5,
      country: "US",
      createdAt: daysAgo(30),
    })
    .returning()
    .all();

  // Generate 5 coupons for the team purchase
  const couponCodes = [
    "TEAM-NODEJS-A1B2C3",
    "TEAM-NODEJS-D4E5F6",
    "TEAM-NODEJS-G7H8I9",
    "TEAM-NODEJS-J0K1L2",
    "TEAM-NODEJS-M3N4O5",
  ];

  const seededCoupons = db
    .insert(schema.coupons)
    .values(
      couponCodes.map((code) => ({
        teamId: team1.id,
        courseId: course2.id,
        code,
        purchaseId: teamPurchase.id,
        createdAt: daysAgo(30),
      }))
    )
    .returning()
    .all();

  // Redeem 2 coupons: Olivia (students[2]) and Liam (students[3])
  // Olivia already has an enrollment for course 2 from the enrollments section above
  db.update(schema.coupons)
    .set({
      redeemedByUserId: students[2].id,
      redeemedAt: daysAgo(30),
    })
    .where(eq(schema.coupons.id, seededCoupons[0].id))
    .run();

  // Liam already has an enrollment for course 2 from the enrollments section above
  db.update(schema.coupons)
    .set({
      redeemedByUserId: students[3].id,
      redeemedAt: daysAgo(25),
    })
    .where(eq(schema.coupons.id, seededCoupons[1].id))
    .run();

  console.log(
    `Created 1 team with Bossy McBossface as admin, 1 team purchase, and ${seededCoupons.length} coupons (2 redeemed, 3 available).`
  );

  console.log("\n✓ Seed complete!");
  console.log("  Users: 10 (1 admin, 3 instructors, 6 students)");
  console.log("  Categories: 6");
  console.log(
    `  Courses: 3 (${course1LessonIds.length} + ${course2LessonIds.length} + ${course3LessonIds.length} lessons)`
  );
  console.log("  Quizzes: 3");
  console.log("  Enrollments: 8");
  console.log("  Comments: 6");
  console.log("  Purchases: 6 (5 individual + 1 team)");
  console.log("  Teams: 1 (with 5 coupons)");
}

seed().catch(console.error);
