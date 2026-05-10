import { eq, and, avg, count, sql } from "drizzle-orm";
import { db } from "~/db";
import { courseReviews } from "~/db/schema";

export function getCourseRating(courseId: number) {
  const result = db
    .select({
      average: avg(courseReviews.rating),
      total: count(courseReviews.id),
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId))
    .get();

  const average = result?.average ? parseFloat(result.average as string) : null;
  return { average, total: result?.total ?? 0 };
}

export function getCourseRatings(courseIds: number[]) {
  if (courseIds.length === 0) return new Map<number, { average: number | null; total: number }>();

  const results = db
    .select({
      courseId: courseReviews.courseId,
      average: avg(courseReviews.rating),
      total: count(courseReviews.id),
    })
    .from(courseReviews)
    .where(sql`${courseReviews.courseId} IN ${courseIds}`)
    .groupBy(courseReviews.courseId)
    .all();

  const map = new Map<number, { average: number | null; total: number }>();
  for (const r of results) {
    map.set(r.courseId, {
      average: r.average ? parseFloat(r.average as string) : null,
      total: r.total,
    });
  }
  return map;
}

export function getUserCourseRating(userId: number, courseId: number) {
  const result = db
    .select({ rating: courseReviews.rating })
    .from(courseReviews)
    .where(
      and(
        eq(courseReviews.userId, userId),
        eq(courseReviews.courseId, courseId)
      )
    )
    .get();
  return result?.rating ?? null;
}

export function upsertCourseRating(userId: number, courseId: number, rating: number) {
  const existing = db
    .select({ id: courseReviews.id })
    .from(courseReviews)
    .where(
      and(
        eq(courseReviews.userId, userId),
        eq(courseReviews.courseId, courseId)
      )
    )
    .get();

  const now = new Date().toISOString();

  if (existing) {
    return db
      .update(courseReviews)
      .set({ rating, updatedAt: now })
      .where(eq(courseReviews.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(courseReviews)
    .values({ userId, courseId, rating, createdAt: now, updatedAt: now })
    .returning()
    .get();
}
