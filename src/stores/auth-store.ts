import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import {
  adminLogin,
  adminLogout,
  adminMe,
  developerLogin,
  developerLogout,
  developerMe,
  mapEngineAdminToUser,
  mapEngineDeveloperToUser
} from "@/services/engine";
import { useCmsStore } from "@/stores/cms-store";
import type { AdminRole, AdminUser } from "@/types/greyon";

export const roleLabels: Record<AdminRole, string> = {
  developer: "Developer",
  admin: "Admin",
  manager: "Manager",
  hotel_admin: "Hotel admin",
  customer: "Customer",
  org_admin: "Admin (legacy)",
  location_admin: "Manager (legacy)",
  super_admin: "Admin (legacy)",
  content_admin: "Admin (legacy)",
  booking_admin: "Hotel admin (legacy)"
};

const globalRoles: AdminRole[] = [
  "developer",
  "admin",
  "org_admin",
  "super_admin",
  "content_admin"
];

type EngineGuard = "admin" | "developer";

const ENGINE_GUARD_KEY = "greyon_engine_guard";
const ENGINE_ROLES_KEY = "greyon_engine_roles";
const ENGINE_FEATURES_KEY = "greyon_engine_features";

/** Ignore stale 401s for a few seconds after a successful login. */
let loginGraceUntil = 0;
/** Bumps on every persist/clear so in-flight /me calls can't wipe a new session. */
let sessionEpoch = 0;

function markLoginGrace(ms = 5000) {
  loginGraceUntil = Date.now() + ms;
}

function inLoginGrace() {
  return Date.now() < loginGraceUntil;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AdminUser | null>(null);
  const token = ref<string | null>(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("greyon_admin_token")
      : null
  );
  const engineGuard = ref<EngineGuard | null>(
    typeof localStorage !== "undefined"
      ? (localStorage.getItem(ENGINE_GUARD_KEY) as EngineGuard | null)
      : null
  );
  const engineRoles = ref<AdminRole[]>([]);
  const engineFeatureKeys = ref<string[]>([]);

  const isAuthenticated = computed(() => Boolean(user.value && token.value));
  const demoUsers = computed(() => useCmsStore().users);

  const userPackages = computed(() => {
    if (!user.value) return [];
    return useCmsStore().getPackagesForUser(user.value.id);
  });

  const roles = computed(() =>
    engineGuard.value
      ? engineRoles.value
      : useCmsStore().getUserRoles(user.value)
  );
  const role = computed<AdminRole | null>(() => roles.value[0] ?? null);
  const featureKeys = computed(() =>
    engineGuard.value
      ? engineFeatureKeys.value
      : useCmsStore().getUserFeatureKeys(user.value)
  );

  const isDeveloper = computed(
    () => engineGuard.value === "developer" || roles.value.includes("developer")
  );

  function persistLocalSession(
    nextUser: AdminUser,
    nextToken: string,
    guard: EngineGuard | null,
    nextRoles: AdminRole[],
    nextFeatures: string[]
  ) {
    sessionEpoch += 1;
    user.value = nextUser;
    token.value = nextToken;
    engineGuard.value = guard;
    engineRoles.value = nextRoles;
    engineFeatureKeys.value = nextFeatures;
    localStorage.setItem("greyon_admin_token", nextToken);
    localStorage.setItem("greyon_admin_user", JSON.stringify(nextUser));
    if (guard) localStorage.setItem(ENGINE_GUARD_KEY, guard);
    else localStorage.removeItem(ENGINE_GUARD_KEY);
    localStorage.setItem(ENGINE_ROLES_KEY, JSON.stringify(nextRoles));
    localStorage.setItem(ENGINE_FEATURES_KEY, JSON.stringify(nextFeatures));
  }

  function clearLocalSession() {
    sessionEpoch += 1;
    user.value = null;
    token.value = null;
    engineGuard.value = null;
    engineRoles.value = [];
    engineFeatureKeys.value = [];
    localStorage.removeItem("greyon_admin_token");
    localStorage.removeItem("greyon_admin_user");
    localStorage.removeItem(ENGINE_GUARD_KEY);
    localStorage.removeItem(ENGINE_ROLES_KEY);
    localStorage.removeItem(ENGINE_FEATURES_KEY);
  }

  function hydrate() {
    // Already live in this tab — don't re-hit /me on every admin navigation.
    if (user.value && token.value) return;

    // Never refresh while sitting on a login screen (stale /me 401s were
    // racing with a fresh login and clearing the new session).
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (
        path === "/admin/login" ||
        path.startsWith("/admin/login/") ||
        path === "/developer/login" ||
        path.startsWith("/developer/login/")
      ) {
        return;
      }
    }

    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("greyon_admin_user")
        : null;
    if (!raw || !token.value) return;

    user.value = JSON.parse(raw) as AdminUser;
    try {
      const guard = localStorage.getItem(ENGINE_GUARD_KEY) as EngineGuard | null;
      if (guard === "admin" || guard === "developer") {
        engineGuard.value = guard;
      }
      engineRoles.value = JSON.parse(
        localStorage.getItem(ENGINE_ROLES_KEY) || "[]"
      ) as AdminRole[];
      engineFeatureKeys.value = JSON.parse(
        localStorage.getItem(ENGINE_FEATURES_KEY) || "[]"
      ) as string[];
    } catch {
      engineRoles.value = [];
      engineFeatureKeys.value = [];
    }
    void refreshEngineSession();
  }

  async function refreshEngineSession() {
    if (!engineGuard.value) return;
    if (inLoginGrace()) return;
    const epoch = sessionEpoch;
    try {
      if (engineGuard.value === "developer") {
        const { developer } = await developerMe();
        if (epoch !== sessionEpoch) return;
        const mapped = mapEngineDeveloperToUser(developer);
        persistLocalSession(
          mapped.user,
          token.value || `engine.developer.${mapped.user.id}`,
          "developer",
          mapped.roles,
          mapped.featureKeys
        );
        void useCmsStore().syncCatalogFromEngine("developer");
        return;
      }
      const { admin } = await adminMe();
      if (epoch !== sessionEpoch) return;
      const mapped = mapEngineAdminToUser(admin);
      persistLocalSession(
        mapped.user,
        token.value || `engine.admin.${mapped.user.id}`,
        "admin",
        mapped.roles,
        mapped.featureKeys
      );
      void useCmsStore().syncCatalogFromEngine("admin");
    } catch (e) {
      if (epoch !== sessionEpoch || inLoginGrace()) return;
      const status =
        e && typeof e === "object" && "status" in e
          ? Number((e as { status: number }).status)
          : 0;
      if (status === 401 || status === 419) {
        clearLocalSession();
      }
    }
  }

  async function loginAdmin(email: string, password: string) {
    try {
      const { admin } = await adminLogin(email, password);
      const mapped = mapEngineAdminToUser(admin);
      if (!mapped.roles.length) {
        return {
          ok: false as const,
          message: "This admin has no packages assigned."
        };
      }
      markLoginGrace();
      persistLocalSession(
        mapped.user,
        `engine.admin.${mapped.user.id}`,
        "admin",
        mapped.roles,
        mapped.featureKeys
      );
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("greyon_login_guard", "admin");
      }
      void useCmsStore().syncCatalogFromEngine("admin");
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "Invalid credentials."
      };
    }
  }

  async function loginDeveloper(email: string, password: string) {
    try {
      const { developer } = await developerLogin(email, password);
      const mapped = mapEngineDeveloperToUser(developer);
      markLoginGrace();
      persistLocalSession(
        mapped.user,
        `engine.developer.${mapped.user.id}`,
        "developer",
        mapped.roles,
        mapped.featureKeys
      );
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("greyon_login_guard", "developer");
      }
      void useCmsStore().syncCatalogFromEngine("developer");
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "Invalid credentials."
      };
    }
  }

  /** @deprecated Prefer loginAdmin / loginDeveloper — kept for callers expecting login(). */
  async function login(email: string, password: string) {
    return loginAdmin(email, password);
  }

  async function logout() {
    try {
      if (engineGuard.value === "developer") await developerLogout();
      else await adminLogout();
    } catch {
      // Session may already be gone — still clear local state.
    }
    clearLocalSession();
  }

  /**
   * Expired engine session (401). Clears local auth and sends the user
   * back to the matching login route (admin vs developer).
   */
  function handleUnauthorized() {
    if (inLoginGrace()) return;
    const wasDeveloper = engineGuard.value === "developer";
    clearLocalSession();
    if (typeof window === "undefined") return;
    const { pathname, search } = window.location;
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/developer")) {
      return;
    }
    if (
      pathname === "/admin/login" ||
      pathname.startsWith("/admin/login/") ||
      pathname === "/developer/login" ||
      pathname.startsWith("/developer/login/")
    ) {
      return;
    }
    const redirect = pathname + search;
    const loginPath = wasDeveloper ? "/developer/login" : "/admin/login";
    window.location.assign(
      `${loginPath}?redirect=${encodeURIComponent(redirect)}`
    );
  }

  function featureEnabled(key: string) {
    if (isDeveloper.value) return true;
    const cms = useCmsStore();

    if (user.value) {
      // Exact key only — unchecking a package permission must take effect
      // for every assignee (matches AccessService::hasPermission / can).
      return featureKeys.value.includes(key);
    }

    const feat = cms.features.find(f => f.key === key);
    if (!feat) return true;
    return feat.enabled;
  }

  /**
   * Module or fine-grained permission check.
   * Aligns with engine AccessService: package featureKeys + permissionKeys
   * are the gate (SPA merges both into session featureKeys at login).
   */
  function can(permission: string) {
    if (!user.value) return false;
    if (isDeveloper.value) return true;
    return featureEnabled(permission);
  }

  /** Create / update / delete — uses `{module}_create` style keys from the seat. */
  function canAction(
    module: string,
    action: "list" | "create" | "update" | "delete"
  ) {
    if (!user.value) return false;
    if (isDeveloper.value) return true;
    const crudKey = `${module}_${action}`;
    const keys = featureKeys.value;
    // If this seat has any fine-grained `{module}_*` permissions (e.g.
    // locations_create), require the specific action key — do NOT fall back
    // to the parent module. Admin sessions often lack the developer feature
    // catalog, so we key off the session keys themselves.
    const usesFineGrained = keys.some(k => k.startsWith(`${module}_`));
    if (usesFineGrained) return keys.includes(crudKey);
    const catalogHasCrud = useCmsStore().features.some(
      f => f.key === crudKey && f.parentKey === module
    );
    if (catalogHasCrud) return keys.includes(crudKey);
    return featureEnabled(module);
  }

  /**
   * Destination detail hub (`/admin/locations/:id`) — hotels & rooms under one city.
   * Prefers `locations_detail`; falls back to list/view or the parent module.
   */
  function canDestinationDetail() {
    if (!user.value) return false;
    if (isDeveloper.value) return true;
    const keys = featureKeys.value;
    if (keys.includes("locations_detail")) return true;
    const fine = keys.some(k => k.startsWith("locations_"));
    if (fine) {
      return keys.includes("locations_list") || keys.includes("locations");
    }
    return featureEnabled("locations");
  }

  function canAccessLocation(locationId: string) {
    const u = user.value;
    if (!u) return false;
    if (isDeveloper.value) return true;
    if (roles.value.some(r => globalRoles.includes(r))) return true;
    let ok = false;
    if (
      roles.value.includes("manager") ||
      roles.value.includes("location_admin")
    ) {
      ok = (u.locationIds ?? []).includes(locationId);
    }
    if (!ok && roles.value.includes("hotel_admin")) {
      const cms = useCmsStore();
      ok = cms.hotels.some(
        h => h.locationId === locationId && (u.hotelIds ?? []).includes(h.id)
      );
    }
    return ok;
  }

  function canAccessHotel(hotelId: string) {
    const u = user.value;
    if (!u) return false;
    if (isDeveloper.value) return true;
    if (roles.value.some(r => globalRoles.includes(r))) return true;
    let ok = false;
    if (
      roles.value.includes("hotel_admin") ||
      roles.value.includes("booking_admin")
    ) {
      ok = (u.hotelIds ?? []).includes(hotelId);
    }
    if (
      !ok &&
      (roles.value.includes("manager") ||
        roles.value.includes("location_admin"))
    ) {
      const cms = useCmsStore();
      const hotel = cms.getHotelById(hotelId);
      ok = Boolean(hotel && (u.locationIds ?? []).includes(hotel.locationId));
    }
    return ok;
  }

  const isGlobalScope = computed(
    () => isDeveloper.value || roles.value.some(r => globalRoles.includes(r))
  );

  const scopedHotels = computed(() =>
    useCmsStore().hotels.filter(h => canAccessHotel(h.id))
  );

  const scopedBookings = computed(() =>
    useCmsStore().bookings.filter(b => canAccessHotel(b.hotelId))
  );

  const scopedRoomTypes = computed(() =>
    useCmsStore().roomTypes.filter(r => canAccessHotel(r.hotelId))
  );

  const scopedRatePlans = computed(() => {
    const cms = useCmsStore();
    const roomIds = new Set(scopedRoomTypes.value.map(r => r.id));
    return cms.ratePlans.filter(p => roomIds.has(p.roomTypeId));
  });

  const scopedEnquiries = computed(() =>
    isGlobalScope.value ? useCmsStore().enquiries : []
  );

  hydrate();

  return {
    user,
    token,
    isAuthenticated,
    isDeveloper,
    isGlobalScope,
    demoUsers,
    userPackages,
    roles,
    role,
    featureKeys,
    scopedHotels,
    scopedBookings,
    scopedRoomTypes,
    scopedRatePlans,
    scopedEnquiries,
    login,
    loginAdmin,
    loginDeveloper,
    logout,
    handleUnauthorized,
    refreshEngineSession,
    can,
    canAction,
    canDestinationDetail,
    featureEnabled,
    canAccessLocation,
    canAccessHotel,
    hydrate
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
