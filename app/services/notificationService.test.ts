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

// Import after mock so the module picks up our test db
import {
  createNotification,
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "./notificationService";
import { enrollUser } from "./enrollmentService";

describe("notificationService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("createNotification", () => {
    it("creates a notification with all fields", () => {
      const notification = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "New Enrollment",
        "Alice enrolled in Test Course",
        "/instructor/1/students"
      );

      expect(notification).toBeDefined();
      expect(notification.recipientUserId).toBe(base.instructor.id);
      expect(notification.type).toBe(schema.NotificationType.Enrollment);
      expect(notification.title).toBe("New Enrollment");
      expect(notification.message).toBe("Alice enrolled in Test Course");
      expect(notification.linkUrl).toBe("/instructor/1/students");
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeDefined();
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for a user ordered newest first", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "First",
        "msg1",
        "/link1"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "Second",
        "msg2",
        "/link2"
      );

      const results = getNotifications(base.instructor.id, 10, 0);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe("Second");
      expect(results[1].title).toBe("First");
    });

    it("respects the limit parameter", () => {
      for (let i = 0; i < 6; i++) {
        createNotification(
          base.instructor.id,
          schema.NotificationType.Enrollment,
          `Notification ${i}`,
          "msg",
          "/link"
        );
      }

      const results = getNotifications(base.instructor.id, 5, 0);
      expect(results).toHaveLength(5);
    });

    it("respects the offset parameter", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "First",
        "msg",
        "/link"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "Second",
        "msg",
        "/link"
      );

      const results = getNotifications(base.instructor.id, 10, 1);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("First");
    });

    it("returns empty array when user has no notifications", () => {
      expect(getNotifications(base.instructor.id, 10, 0)).toHaveLength(0);
    });

    it("does not return another user's notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "For instructor",
        "msg",
        "/link"
      );

      expect(getNotifications(base.user.id, 10, 0)).toHaveLength(0);
    });
  });

  describe("getUnreadCount", () => {
    it("returns count of unread notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/link"
      );

      expect(getUnreadCount(base.instructor.id)).toBe(2);
    });

    it("excludes read notifications from count", () => {
      const n1 = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/link"
      );

      markAsRead(n1.id);

      expect(getUnreadCount(base.instructor.id)).toBe(1);
    });

    it("returns 0 when user has no notifications", () => {
      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });

    it("does not count another user's unread notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );

      expect(getUnreadCount(base.user.id)).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("marks a notification as read", () => {
      const n = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );

      const updated = markAsRead(n.id);
      expect(updated?.isRead).toBe(true);
    });

    it("does not affect other notifications", () => {
      const n1 = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/link"
      );

      markAsRead(n1.id);

      expect(getUnreadCount(base.instructor.id)).toBe(1);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all unread notifications as read", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/link"
      );

      markAllAsRead(base.instructor.id);

      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });

    it("does not affect another user's notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/link"
      );
      createNotification(
        base.user.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/link"
      );

      markAllAsRead(base.instructor.id);

      expect(getUnreadCount(base.user.id)).toBe(1);
    });
  });
});

describe("enrollment → notification integration", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  it("creates a notification for the instructor when a student enrolls", () => {
    enrollUser(base.user.id, base.course.id, false, false);

    const notifications = getNotifications(base.instructor.id, 10, 0);
    expect(notifications).toHaveLength(1);

    const notification = notifications[0];
    expect(notification.type).toBe(schema.NotificationType.Enrollment);
    expect(notification.title).toBe("New Enrollment");
    expect(notification.message).toBe(
      `${base.user.name} enrolled in ${base.course.title}`
    );
    expect(notification.linkUrl).toBe(
      `/instructor/${base.course.id}/students`
    );
    expect(notification.recipientUserId).toBe(base.instructor.id);
    expect(notification.isRead).toBe(false);
  });

  it("does not create a notification for the enrolling student", () => {
    enrollUser(base.user.id, base.course.id, false, false);

    expect(getNotifications(base.user.id, 10, 0)).toHaveLength(0);
  });
});
