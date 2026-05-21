import { useState, useRef, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";

interface Notification {
  id: number;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const markReadFetcher = useFetcher();
  const markAllFetcher = useFetcher();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(notification: Notification) {
    setOpen(false);
    if (!notification.isRead) {
      markReadFetcher.submit(
        { notificationId: notification.id },
        {
          method: "POST",
          action: "/api/notifications/mark-read",
          encType: "application/json",
        }
      );
    }
    navigate(notification.linkUrl);
  }

  function handleMarkAllRead() {
    markAllFetcher.submit(
      {},
      { method: "POST", action: "/api/notifications/mark-all-read", encType: "application/json" }
    );
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        title="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 z-50 w-80 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent",
                    !notification.isRead && "bg-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{notification.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {notification.message}
                  </span>
                  {!notification.isRead && (
                    <span className="mt-0.5 h-1.5 w-1.5 self-end rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
