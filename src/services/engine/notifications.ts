import { engineAPI } from "@/helpers/api";
import { useAuthStore } from "@/stores/auth-store";

export type StaffNotification = {
  id: number | string;
  type: string;
  title: string;
  body: string;
  bookingId: number;
  hotelId: number;
  locationId: number | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string | null;
};

function notificationsBase() {
  const auth = useAuthStore();
  return auth.isDeveloper ? "/developer/notifications" : "/admin/notifications";
}

export async function fetchStaffNotifications(): Promise<{
  notifications: StaffNotification[];
  unreadCount: number;
}> {
  const payload = await engineAPI.get<{
    notifications: StaffNotification[];
    unreadCount: number;
  }>(notificationsBase());
  return {
    notifications: payload.notifications ?? [],
    unreadCount: payload.unreadCount ?? 0
  };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const payload = await engineAPI.get<{ unreadCount: number }>(
    `${notificationsBase()}/unread-count`
  );
  return payload.unreadCount ?? 0;
}

export async function markNotificationRead(
  id: number | string
): Promise<StaffNotification> {
  const { notification } = await engineAPI.post<{
    notification: StaffNotification;
  }>(`${notificationsBase()}/${id}/read`);
  return notification;
}

export async function markAllNotificationsRead(): Promise<void> {
  await engineAPI.post(`${notificationsBase()}/read-all`);
}
