import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  fetchStaffNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type StaffNotification
} from "@/services/engine/notifications";

export const useNotificationStore = defineStore("notifications", () => {
  const items = ref<StaffNotification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const unread = computed(() => items.value.filter(n => !n.readAt));

  async function refresh() {
    loading.value = true;
    try {
      const payload = await fetchStaffNotifications();
      items.value = payload.notifications;
      unreadCount.value = payload.unreadCount;
    } catch {
      // Session may not be ready yet — keep last known list.
    } finally {
      loading.value = false;
    }
  }

  function startPolling(ms = 45_000) {
    stopPolling();
    void refresh();
    pollTimer = setInterval(() => {
      void refresh();
    }, ms);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function markRead(id: number | string) {
    const prev = items.value.find(n => String(n.id) === String(id));
    const wasUnread = Boolean(prev && !prev.readAt);
    const updated = await markNotificationRead(id);
    const idx = items.value.findIndex(n => String(n.id) === String(id));
    if (idx >= 0) items.value[idx] = updated;
    else await refresh();
    if (wasUnread && unreadCount.value > 0) unreadCount.value -= 1;
  }

  async function markAllRead() {
    await markAllNotificationsRead();
    items.value = items.value.map(n =>
      n.readAt ? n : { ...n, readAt: new Date().toISOString() }
    );
    unreadCount.value = 0;
  }

  function clear() {
    stopPolling();
    items.value = [];
    unreadCount.value = 0;
  }

  return {
    items,
    unread,
    unreadCount,
    loading,
    refresh,
    startPolling,
    stopPolling,
    markRead,
    markAllRead,
    clear
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationStore, import.meta.hot));
}
