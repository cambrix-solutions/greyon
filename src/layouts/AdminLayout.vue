<template>
  <q-layout view="hHh Lpr lFf" class="admin-layout">
    <q-header elevated class="admin-header">
      <div class="admin-topbar">
        <div class="admin-topbar__left">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Open menu"
            class="lt-md"
            color="primary"
            @click="leftOpen = !leftOpen"
          />

          <router-link to="/admin" class="admin-brand">
            <span class="admin-brand__mark" aria-hidden="true">G</span>
            <span class="admin-brand__copy">
              <span class="admin-brand__name gy-display">Greyon</span>
              <span class="admin-brand__tag">Admin</span>
            </span>
          </router-link>
        </div>

        <div class="admin-topbar__right">
          <div v-if="headerAlerts.length" class="admin-alerts gt-md">
            <router-link
              v-for="alert in headerAlerts"
              :key="alert.to"
              :to="alert.to"
              class="admin-alert"
            >
              <span class="admin-alert__count">{{ alert.count }}</span>
              {{ alert.label }}
            </router-link>
          </div>

          <button
            type="button"
            class="admin-bell"
            aria-label="Booking notifications"
            aria-haspopup="menu"
          >
            <q-icon name="notifications" size="20px" />
            <span v-if="notifications.unreadCount" class="admin-bell__badge">
              {{
                notifications.unreadCount > 99
                  ? "99+"
                  : notifications.unreadCount
              }}
            </span>
            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="admin-notify-menu"
            >
              <div class="admin-notify-menu__head">
                <p class="admin-notify-menu__title">Bookings</p>
                <button
                  v-if="notifications.unreadCount"
                  type="button"
                  class="admin-notify-menu__action"
                  @click="onMarkAllRead"
                >
                  Mark all read
                </button>
              </div>
              <q-separator />
              <div
                v-if="notifications.loading && !notifications.items.length"
                class="admin-notify-menu__empty"
              >
                Loading…
              </div>
              <div
                v-else-if="!notifications.items.length"
                class="admin-notify-menu__empty"
              >
                No booking alerts yet
              </div>
              <q-list v-else dense class="admin-notify-menu__list">
                <q-item
                  v-for="item in notifications.items"
                  :key="item.id"
                  clickable
                  v-close-popup
                  :class="{ 'is-unread': !item.readAt }"
                  @click="onOpenNotification(item)"
                >
                  <q-item-section>
                    <q-item-label class="admin-notify-menu__item-title">{{
                      item.title
                    }}</q-item-label>
                    <q-item-label caption lines="2">{{
                      item.body
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-separator />
              <q-item clickable v-close-popup to="/admin/bookings">
                <q-item-section class="text-primary"
                  >View all bookings</q-item-section
                >
              </q-item>
            </q-menu>
          </button>

          <router-link to="/" target="_blank" class="admin-link gt-xs">
            <q-icon name="open_in_new" size="16px" />
            View site
          </router-link>

          <button
            type="button"
            class="admin-account"
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <span class="admin-account__avatar">{{ initials }}</span>
            <span class="admin-account__meta gt-sm">
              <span class="admin-account__name">{{ displayName }}</span>
              <span class="admin-account__role">
                {{ roleLabel
                }}<template v-if="packageSummary">
                  · {{ packageSummary }}</template
                >
              </span>
            </span>
            <q-icon
              name="expand_more"
              size="18px"
              class="admin-account__chevron gt-xs"
            />

            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="admin-account-menu"
            >
              <div class="admin-account-menu__head">
                <span class="admin-account-menu__avatar">{{ initials }}</span>
                <div>
                  <p class="admin-account-menu__name">{{ displayName }}</p>
                  <p class="admin-account-menu__email">{{
                    auth.user?.email
                  }}</p>
                  <p class="admin-account-menu__badge">{{ roleLabel }}</p>
                  <p v-if="packageSummary" class="admin-account-menu__pkg">
                    {{ packageSummary }}
                  </p>
                </div>
              </div>
              <q-separator />
              <q-list dense padding>
                <q-item
                  v-if="auth.can('settings')"
                  clickable
                  v-close-popup
                  to="/admin/settings"
                >
                  <q-item-section avatar>
                    <q-icon name="settings" size="20px" />
                  </q-item-section>
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable v-close-popup to="/" target="_blank">
                  <q-item-section avatar>
                    <q-icon name="open_in_new" size="20px" />
                  </q-item-section>
                  <q-item-section>Open live site</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup @click="onLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" size="20px" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">Log out</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="leftOpen"
      show-if-above
      bordered
      :width="248"
      class="admin-drawer"
    >
      <div class="admin-drawer__inner">
        <p class="admin-drawer__label">Workspace</p>
        <q-list padding class="admin-nav">
          <q-item
            v-for="item in primaryNav"
            :key="item.to"
            clickable
            v-ripple
            :to="item.to"
            exact
            active-class="admin-nav__active"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <template v-if="propertyNav.length">
          <p class="admin-drawer__label">Properties</p>
          <p class="admin-drawer__hint">Location → Hotel → Rooms</p>
          <q-list padding class="admin-nav">
            <q-item
              v-for="item in propertyNav"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              active-class="admin-nav__active"
              :class="`admin-nav__depth-${item.depth ?? 0}`"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
                <q-item-label v-if="item.caption" caption>{{
                  item.caption
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <template v-if="publishingNav.length">
          <p class="admin-drawer__label">Publishing</p>
          <q-list padding class="admin-nav">
            <q-item
              v-for="item in publishingNav"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              active-class="admin-nav__active"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </template>

        <template v-if="opsNav.length">
          <p class="admin-drawer__label">Operations</p>
          <q-list padding class="admin-nav">
            <q-item
              v-for="item in opsNav"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              active-class="admin-nav__active"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
              <q-item-section v-if="item.badge" side>
                <q-badge color="orange" rounded>{{ item.badge }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <template v-if="systemNav.length">
          <p class="admin-drawer__label">System</p>
          <q-list padding class="admin-nav">
            <q-item
              v-for="item in systemNav"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              active-class="admin-nav__active"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </template>

        <template v-if="accessNav.length">
          <p class="admin-drawer__label">Access</p>
          <q-list padding class="admin-nav">
            <q-item
              v-for="item in accessNav"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              active-class="admin-nav__active"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </template>
      </div>
    </q-drawer>

    <q-page-container class="admin-page-container">
      <router-view v-slot="{ Component, route: r }">
        <transition name="gy-page" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { StaffNotification } from "@/services/engine/notifications";
import { roleLabels, useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { useNotificationStore } from "@/stores/notification-store";

const auth = useAuthStore();
const cms = useCmsStore();
const notifications = useNotificationStore();
const router = useRouter();
const leftOpen = ref(true);

onMounted(() => {
  notifications.startPolling();
});

onUnmounted(() => {
  notifications.stopPolling();
});

const pendingBookings = computed(
  () => auth.scopedBookings.filter(b => b.status === "pending").length
);
const newEnquiries = computed(
  () => auth.scopedEnquiries.filter(e => e.status === "new").length
);

const displayName = computed(() => auth.user?.name ?? "Admin");

const initials = computed(() =>
  displayName.value
    .split(" ")
    .filter(Boolean)
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
);

const roleLabel = computed(() => {
  const list = auth.roles;
  if (!list.length) return "Admin";
  return list.map(r => roleLabels[r] ?? r.replaceAll("_", " ")).join(" · ");
});

const packageSummary = computed(() => {
  const pkgs = auth.userPackages;
  if (!pkgs.length) return "";
  if (pkgs.length === 1) return pkgs[0]!.name;
  return `${pkgs[0]!.name} +${pkgs.length - 1}`;
});

const headerAlerts = computed(() => {
  const items: { label: string; count: number; to: string }[] = [];
  if (auth.can("bookings") && pendingBookings.value) {
    items.push({
      label: pendingBookings.value === 1 ? "pending" : "pending",
      count: pendingBookings.value,
      to: "/admin/bookings?status=pending"
    });
  }
  if (auth.can("enquiries") && newEnquiries.value) {
    items.push({
      label: "inbox",
      count: newEnquiries.value,
      to: "/admin/enquiries?status=new"
    });
  }
  return items;
});

type NavItem = {
  label: string;
  to: string;
  icon: string;
  perm: string;
  group: "primary" | "properties" | "publishing" | "ops" | "system" | "access";
  badge?: number;
  depth?: number;
  caption?: string;
  developerOnly?: boolean;
};

const nav = computed<NavItem[]>(() => [
  {
    label: "Dashboard",
    to: "/admin",
    icon: "dashboard",
    perm: "dashboard",
    group: "primary"
  },
  {
    label: "Locations",
    to: "/admin/locations",
    icon: "place",
    perm: "locations",
    group: "properties",
    depth: 0,
    caption: "Destinations"
  },
  {
    label: "Hotels",
    to: "/admin/hotels",
    icon: "apartment",
    perm: "hotels",
    group: "properties",
    depth: 1,
    caption: "Under a location"
  },
  {
    label: "Room types",
    to: "/admin/rooms",
    icon: "bed",
    perm: "rooms",
    group: "properties",
    depth: 1,
    caption: "Under a hotel"
  },
  {
    label: "News",
    to: "/admin/news",
    icon: "newspaper",
    perm: "news",
    group: "publishing"
  },
  {
    label: "Media",
    to: "/admin/media",
    icon: "photo_library",
    perm: "media",
    group: "publishing"
  },
  {
    label: "Hero slides",
    to: "/admin/hero-slides",
    icon: "view_carousel",
    perm: "settings",
    group: "publishing"
  },
  {
    label: "Rates & Availability",
    to: "/admin/rates",
    icon: "event_available",
    perm: "rates",
    group: "ops"
  },
  {
    label: "Bookings",
    to: "/admin/bookings",
    icon: "book_online",
    perm: "bookings",
    group: "ops",
    ...(pendingBookings.value ? { badge: pendingBookings.value } : {})
  },
  {
    label: "Enquiries",
    to: "/admin/enquiries",
    icon: "mail",
    perm: "enquiries",
    group: "ops",
    ...(newEnquiries.value ? { badge: newEnquiries.value } : {})
  },
  {
    label: "SEO / Settings",
    to: "/admin/settings",
    icon: "settings",
    perm: "settings",
    group: "system"
  },
  {
    label: "People",
    to: "/admin/users",
    icon: auth.isDeveloper ? "group" : "badge",
    perm: "users",
    group: "access"
  },
  {
    label: "Seat types",
    to: "/admin/features",
    icon: "inventory_2",
    perm: "features",
    group: "access",
    developerOnly: true
  },
  {
    label: "Access catalog",
    to: "/admin/access-catalog",
    icon: "admin_panel_settings",
    perm: "features",
    group: "access",
    developerOnly: true
  }
]);

const visibleNav = computed(() =>
  nav.value.filter(item => {
    if (!auth.can(item.perm)) return false;
    if (item.developerOnly && !auth.isDeveloper) return false;
    return true;
  })
);
const primaryNav = computed(() =>
  visibleNav.value.filter(i => i.group === "primary")
);
const propertyNav = computed(() =>
  visibleNav.value.filter(i => i.group === "properties")
);
const publishingNav = computed(() =>
  visibleNav.value.filter(i => i.group === "publishing")
);
const opsNav = computed(() => visibleNav.value.filter(i => i.group === "ops"));
const systemNav = computed(() =>
  visibleNav.value.filter(i => i.group === "system")
);
const accessNav = computed(() =>
  visibleNav.value.filter(i => i.group === "access")
);

async function onLogout() {
  notifications.clear();
  await auth.logout();
  void router.push("/admin/login");
}

async function onMarkAllRead() {
  try {
    await notifications.markAllRead();
  } catch {
    /* ignore */
  }
}

async function onOpenNotification(item: StaffNotification) {
  try {
    if (!item.readAt) await notifications.markRead(item.id);
  } catch {
    /* ignore */
  }
  const ref =
    typeof item.data?.reference === "string" ? item.data.reference : null;
  void router.push(
    ref ? `/admin/bookings?q=${encodeURIComponent(ref)}` : "/admin/bookings"
  );
}
</script>

<style scoped>
.admin-layout {
  background: #f6f5f2;
  color: var(--gy-ink);
}

.admin-header {
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--gy-ink);
  backdrop-filter: blur(16px);
  box-shadow: none !important;
  border-bottom: 1px solid rgba(18, 17, 16, 0.06) !important;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 58px;
  padding: 0 1.15rem 0 0.9rem;
}

.admin-topbar__left,
.admin-topbar__right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.admin-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: inherit;
}

.admin-brand__mark {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--gy-forest);
  color: #fff;
  font-family: var(--font-display);
  font-size: 1.05rem;
  line-height: 1;
  border-radius: 8px;
}

.admin-brand__copy {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.admin-brand__name {
  font-size: 1.3rem;
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.admin-brand__tag {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.admin-alerts {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.admin-bell {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid rgba(18, 17, 16, 0.08);
  border-radius: 999px;
  background: #fff;
  color: var(--gy-ink);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.admin-bell:hover {
  background: #f7f2e8;
  border-color: rgba(176, 141, 87, 0.35);
}

.admin-bell__badge {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.25rem;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: var(--gy-forest);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 650;
  line-height: 1;
}

.admin-notify-menu {
  min-width: min(22rem, 92vw);
}

.admin-notify-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem 0.55rem;
}

.admin-notify-menu__title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 650;
}

.admin-notify-menu__action {
  border: 0;
  background: transparent;
  color: var(--gy-forest);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.admin-notify-menu__empty {
  padding: 1.25rem 0.9rem;
  color: var(--gy-muted);
  font-size: 0.85rem;
  text-align: center;
}

.admin-notify-menu__list {
  max-height: 22rem;
  overflow: auto;
}

.admin-notify-menu__list .is-unread {
  background: rgba(176, 141, 87, 0.08);
}

.admin-notify-menu__item-title {
  font-weight: 650;
  font-size: 0.86rem;
}

.admin-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  text-decoration: none;
  color: var(--gy-ink);
  background: #f7f2e8;
  border: 1px solid rgba(176, 141, 87, 0.3);
  border-radius: 999px;
  font-size: 0.74rem;
  line-height: 1;
  white-space: nowrap;
}

.admin-alert:hover {
  background: #efe6d4;
}

.admin-alert__count {
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.2rem;
  background: var(--gy-forest);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 999px;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  text-decoration: none;
  color: var(--gy-muted);
  font-size: 0.82rem;
  line-height: 1;
  border-radius: 8px;
  white-space: nowrap;
}

.admin-link:hover {
  color: var(--gy-forest);
  background: rgba(154, 123, 60, 0.08);
}

.admin-account {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding: 0.25rem 0.45rem 0.25rem 0.25rem;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 999px;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.2s ease;
}

.admin-account:hover,
.admin-account:focus-visible {
  border-color: rgba(154, 123, 60, 0.4);
  box-shadow: 0 6px 18px rgba(26, 24, 20, 0.06);
  outline: none;
}

.admin-account__avatar,
.admin-account-menu__avatar {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--gy-forest);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 999px;
}

.admin-account__meta {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;
  max-width: 9.5rem;
}

.admin-account__name {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-account__role {
  font-size: 0.66rem;
  line-height: 1.1;
  color: var(--gy-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-account__chevron {
  color: var(--gy-muted);
  flex-shrink: 0;
}

.admin-account-menu {
  min-width: 240px;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(28, 36, 33, 0.12);
  overflow: hidden;
}

.admin-account-menu__head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.9rem 1rem 0.75rem;
}

.admin-account-menu__name {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.2;
}

.admin-account-menu__email {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--gy-muted);
  word-break: break-all;
}

.admin-account-menu__badge {
  margin: 0.35rem 0 0;
  display: inline-block;
  padding: 0.15rem 0.45rem;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  background: rgba(176, 141, 87, 0.12);
  border-radius: 999px;
}

.admin-account-menu__pkg {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--gy-muted);
}

.admin-drawer {
  background: #faf9f7 !important;
  border-right: 1px solid rgba(18, 17, 16, 0.06) !important;
}

.admin-drawer__inner {
  padding: 0.65rem 0.4rem 1.5rem;
}

.admin-drawer__label {
  margin: 0.85rem 1rem 0.2rem;
  font-size: 0.64rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.admin-drawer__hint {
  margin: 0 1rem 0.35rem;
  font-size: 0.7rem;
  color: var(--gy-gold-deep);
  line-height: 1.3;
}

.admin-nav :deep(.q-item) {
  border-radius: 10px;
  margin: 0.12rem 0.45rem;
  min-height: 40px;
  color: var(--gy-ink);
  transition:
    background 0.22s ease,
    transform 0.22s ease,
    color 0.22s ease;
}

.admin-nav :deep(.q-item.admin-nav__depth-1) {
  margin-left: 0.85rem;
  min-height: 38px;
  border-left: 2px solid rgba(154, 123, 60, 0.28);
  border-radius: 0 10px 10px 0;
}

.admin-nav :deep(.q-item:hover) {
  transform: translateX(2px);
  background: rgba(154, 123, 60, 0.06);
}

.admin-nav :deep(.q-icon) {
  color: var(--gy-moss);
  transition:
    color 0.22s ease,
    transform 0.22s ease;
}

.admin-nav :deep(.q-item:hover .q-icon) {
  transform: scale(1.06);
  color: var(--gy-gold-deep);
}

.admin-nav__active {
  background: rgba(154, 123, 60, 0.12) !important;
  color: var(--gy-gold-deep) !important;
  font-weight: 500;
}

.admin-nav__active :deep(.q-icon) {
  color: var(--gy-forest);
}

.admin-page-container {
  background: #f6f5f2;
}

.admin-page-container :deep(.admin-scroll),
.admin-page-container :deep(.q-card),
.admin-page-container :deep(.q-banner) {
  border-radius: 14px;
  transition:
    box-shadow 0.35s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease;
}

.admin-page-container :deep(.admin-scroll:hover),
.admin-page-container :deep(.q-card:hover) {
  box-shadow: 0 14px 32px rgba(26, 24, 20, 0.07);
}

.admin-page-container :deep(.q-btn) {
  border-radius: 8px;
}

.admin-page-container :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
}

.admin-alert {
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}

.admin-alert:hover {
  transform: translateY(-2px);
  background: #efe6d4;
}

.admin-brand {
  transition: opacity 0.25s ease;
}

.admin-brand:hover {
  opacity: 0.85;
}

.admin-account {
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.22s ease;
}

.admin-account:hover {
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .admin-nav :deep(.q-item),
  .admin-alert,
  .admin-account,
  .admin-page-container :deep(.admin-scroll),
  .admin-page-container :deep(.q-card) {
    transition: none !important;
  }
}
</style>
