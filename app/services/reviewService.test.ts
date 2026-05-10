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
  getCourseRating,
  getCourseRatings,
  getUserCourseRating,
  upsertCourseRating,
} from "./reviewService";

describe("reviewService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("getCourseRating", () => {
    it("returns null average and zero total when no reviews exist", () => {
      const { average, total } = getCourseRating(base.course.id);
      expect(average).toBeNull();
      expect(total).toBe(0);
    });

    it("returns the correct average and total for a single review", () => {
      upsertCourseRating(base.user.id, base.course.id, 4);
      const { average, total } = getCourseRating(base.course.id);
      expect(average).toBe(4);
      expect(total).toBe(1);
    });

    it("returns the correct average across multiple reviews", () => {
      const student2 = testDb
        .insert(schema.users)
        .values({ name: "Student Two", email: "s2@example.com", role: schema.UserRole.Student })
        .returning()
        .get();

      upsertCourseRating(base.user.id, base.course.id, 4);
      upsertCourseRating(student2.id, base.course.id, 2);

      const { average, total } = getCourseRating(base.course.id);
      expect(average).toBe(3);
      expect(total).toBe(2);
    });
  });

  describe("getCourseRatings", () => {
    it("returns an empty map for an empty course id list", () => {
      const map = getCourseRatings([]);
      expect(map.size).toBe(0);
    });

    it("returns rating data keyed by course id", () => {
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

      upsertCourseRating(base.user.id, base.course.id, 5);
      upsertCourseRating(base.user.id, course2.id, 3);

      const map = getCourseRatings([base.course.id, course2.id]);

      expect(map.get(base.course.id)?.average).toBe(5);
      expect(map.get(base.course.id)?.total).toBe(1);
      expect(map.get(course2.id)?.average).toBe(3);
      expect(map.get(course2.id)?.total).toBe(1);
    });

    it("omits courses with no reviews from the map", () => {
      const map = getCourseRatings([base.course.id]);
      expect(map.has(base.course.id)).toBe(false);
    });
  });

  describe("getUserCourseRating", () => {
    it("returns null when the user has not rated the course", () => {
      expect(getUserCourseRating(base.user.id, base.course.id)).toBeNull();
    });

    it("returns the user's rating when one exists", () => {
      upsertCourseRating(base.user.id, base.course.id, 3);
      expect(getUserCourseRating(base.user.id, base.course.id)).toBe(3);
    });
  });

  describe("upsertCourseRating", () => {
    it("creates a new review", () => {
      const review = upsertCourseRating(base.user.id, base.course.id, 5);
      expect(review).toBeDefined();
      expect(review!.userId).toBe(base.user.id);
      expect(review!.courseId).toBe(base.course.id);
      expect(review!.rating).toBe(5);
    });

    it("updates an existing review instead of creating a duplicate", () => {
      upsertCourseRating(base.user.id, base.course.id, 5);
      upsertCourseRating(base.user.id, base.course.id, 2);

      const { total, average } = getCourseRating(base.course.id);
      expect(total).toBe(1);
      expect(average).toBe(2);
    });

    it("stores the updated rating after an upsert", () => {
      upsertCourseRating(base.user.id, base.course.id, 5);
      upsertCourseRating(base.user.id, base.course.id, 1);

      expect(getUserCourseRating(base.user.id, base.course.id)).toBe(1);
    });

    it("allows different users to each rate the same course", () => {
      const student2 = testDb
        .insert(schema.users)
        .values({ name: "Student Two", email: "s2@example.com", role: schema.UserRole.Student })
        .returning()
        .get();

      upsertCourseRating(base.user.id, base.course.id, 5);
      upsertCourseRating(student2.id, base.course.id, 3);

      expect(getCourseRating(base.course.id).total).toBe(2);
    });

    it("allows the same user to rate different courses independently", () => {
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

      upsertCourseRating(base.user.id, base.course.id, 4);
      upsertCourseRating(base.user.id, course2.id, 2);

      expect(getUserCourseRating(base.user.id, base.course.id)).toBe(4);
      expect(getUserCourseRating(base.user.id, course2.id)).toBe(2);
    });
  });
});
