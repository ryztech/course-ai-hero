import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import {
  toggleBookmark,
  isLessonBookmarked,
  getBookmarkedLessonIds,
} from "./bookmarkService";

function seedLesson(moduleId: number, position = 1) {
  return testDb
    .insert(schema.lessons)
    .values({ moduleId, title: "Lesson", position })
    .returning()
    .get();
}

function seedModule() {
  return testDb
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Module", position: 1 })
    .returning()
    .get();
}

describe("bookmarkService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("toggleBookmark", () => {
    it("creates a bookmark and returns bookmarked: true", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      const result = toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(result.bookmarked).toBe(true);
    });

    it("removes an existing bookmark and returns bookmarked: false", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      const result = toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(result.bookmarked).toBe(false);
    });

    it("toggling twice leaves the lesson bookmarked", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      const result = toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(result.bookmarked).toBe(true);
    });

    it("bookmarks for different users are independent", () => {
      const student2 = testDb
        .insert(schema.users)
        .values({ name: "Student Two", email: "s2@example.com", role: schema.UserRole.Student })
        .returning()
        .get();

      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(isLessonBookmarked({ userId: base.user.id, lessonId: lesson.id })).toBe(false);
      expect(isLessonBookmarked({ userId: student2.id, lessonId: lesson.id })).toBe(false);
    });
  });

  describe("isLessonBookmarked", () => {
    it("returns false when the lesson is not bookmarked", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      expect(isLessonBookmarked({ userId: base.user.id, lessonId: lesson.id })).toBe(false);
    });

    it("returns true after bookmarking a lesson", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(isLessonBookmarked({ userId: base.user.id, lessonId: lesson.id })).toBe(true);
    });

    it("returns false after unbookmarking a lesson", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      expect(isLessonBookmarked({ userId: base.user.id, lessonId: lesson.id })).toBe(false);
    });

    it("is scoped to the user — another user's bookmark does not affect the result", () => {
      const student2 = testDb
        .insert(schema.users)
        .values({ name: "Student Two", email: "s2@example.com", role: schema.UserRole.Student })
        .returning()
        .get();

      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: student2.id, lessonId: lesson.id });

      expect(isLessonBookmarked({ userId: base.user.id, lessonId: lesson.id })).toBe(false);
    });
  });

  describe("getBookmarkedLessonIds", () => {
    it("returns an empty array when the user has no bookmarks", () => {
      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toEqual([]);
    });

    it("returns the bookmarked lesson id", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toContain(lesson.id);
      expect(ids).toHaveLength(1);
    });

    it("returns all bookmarked lesson ids for a course", () => {
      const mod = seedModule();
      const lesson1 = seedLesson(mod.id, 1);
      const lesson2 = seedLesson(mod.id, 2);

      toggleBookmark({ userId: base.user.id, lessonId: lesson1.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson2.id });

      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toHaveLength(2);
      expect(ids).toContain(lesson1.id);
      expect(ids).toContain(lesson2.id);
    });

    it("does not include lessons from a different course", () => {
      const course2 = testDb
        .insert(schema.courses)
        .values({
          title: "Course Two",
          slug: "course-two",
          description: "Second course",
          instructorId: base.instructor.id,
          categoryId: base.category.id,
          status: schema.CourseStatus.Published,
        })
        .returning()
        .get();

      const mod1 = seedModule();
      const mod2 = testDb
        .insert(schema.modules)
        .values({ courseId: course2.id, title: "Module 2", position: 1 })
        .returning()
        .get();

      const lesson1 = seedLesson(mod1.id);
      const lesson2 = seedLesson(mod2.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson1.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson2.id });

      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toContain(lesson1.id);
      expect(ids).not.toContain(lesson2.id);
    });

    it("does not include unbookmarked lessons", () => {
      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });
      toggleBookmark({ userId: base.user.id, lessonId: lesson.id });

      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toHaveLength(0);
    });

    it("is scoped to the requesting user", () => {
      const student2 = testDb
        .insert(schema.users)
        .values({ name: "Student Two", email: "s2@example.com", role: schema.UserRole.Student })
        .returning()
        .get();

      const mod = seedModule();
      const lesson = seedLesson(mod.id);

      toggleBookmark({ userId: student2.id, lessonId: lesson.id });

      const ids = getBookmarkedLessonIds({ userId: base.user.id, courseId: base.course.id });
      expect(ids).toHaveLength(0);
    });
  });
});
