import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { ApiError } from "@/services/api";
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

const ALL_ADMIN = [
  "dashboard",
  "hotels",
  "rooms",
  "rates",
  "bookings",
  "locations",
  "locations_list",
  "locations_managers",
  "locations_hotels",
  "locations_publish",
  "locations_seo",
  "news",
  "enquiries",
  "media",
  "settings",
  "users",
  "features"
] as const;

/** Role → permissions (features still required via packages) */
const rolePermissions: Record<AdminRole, readonly string[]> = {
  developer: ALL_ADMIN,
  admin: ALL_ADMIN.filter(p => p !== "features"),
  org_admin: ALL_ADMIN.filter(p => p !== "features"),
  super_admin: ALL_ADMIN.filter(p => p !== "features"),
  content_admin: ALL_ADMIN.filter(p => p !== "features"),
  manager: [
    "dashboard",
    "hotels",
    "rooms",
    "rates",
    "bookings",
    "locations",
    "locations_list",
    "locations_managers",
    "locations_hotels",
    "locations_publish",
    "locations_seo",
    "news",
    "enquiries",
    "users"
  ],
  location_admin: [
    "dashboard",
    "hotels",
    "rooms",
    "rates",
    "bookings",
    "locations",
    "locations_list",
    "locations_managers",
    "locations_hotels",
    "locations_publish",
    "locations_seo",
    "news",
    "enquiries",
    "users"
  ],
  hotel_admin: [
    "dashboard",
    "hotels",
    "rooms",
    "rates",
    "bookings",
    "enquiries",
    "users"
  ],
  booking_admin: [
    "dashboard",
    "rooms",
    "rates",
    "bookings",
    "enquiries",
    "users"
  ],
  customer: []
};

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
    engineGuard.value ? engineRoles.value : useCmsStore().getUserRoles(user.value)
  );
  const role = computed<AdminRole | null>(() => roles.value[0] ?? null);
  const featureKeys = computed(() =>
    engineGuard.value
      ? engineFeatureKeys.value
      : useCmsStore().getUserFeatureKeys(user.value)
  );

  const isDeveloper = computed(
    () =>
      engineGuard.value === "developer" || roles.value.includes("developer")
  );

  function persistLocalSession(
    nextUser: AdminUser,
    nextToken: string,
    guard: EngineGuard | null,
    nextRoles: AdminRole[],
    nextFeatures: string[]
  ) {
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
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("greyon_admin_user")
        : null;
    if (!raw || !token.value) return;

    user.value = JSON.parse(raw) as AdminUser;
    try {
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
    try {
      if (engineGuard.value === "developer") {
        const { developer } = await developerMe();
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
      const mapped = mapEngineAdminToUser(admin);
      persistLocalSession(
        mapped.user,
        token.value || `engine.admin.${mapped.user.id}`,
        "admin",
        mapped.roles,
        mapped.featureKeys
      );
      void useCmsStore().syncCatalogFromEngine("admin");
    } catch {
      clearLocalSession();
    }
  }

  async function login(email: string, password: string) {
    try {
      const { admin } = await adminLogin(email, password);
      const mapped = mapEngineAdminToUser(admin);
      if (!mapped.roles.length) {
        return {
          ok: false as const,
          message: "This admin has no packages assigned."
        };
      }
      persistLocalSession(
        mapped.user,
        `engine.admin.${mapped.user.id}`,
        "admin",
        mapped.roles,
        mapped.featureKeys
      );
      void useCmsStore().syncCatalogFromEngine("admin");
      return { ok: true as const };
    } catch (adminErr) {
      try {
        const { developer } = await developerLogin(email, password);
        const mapped = mapEngineDeveloperToUser(developer);
        persistLocalSession(
          mapped.user,
          `engine.developer.${mapped.user.id}`,
          "developer",
          mapped.roles,
          mapped.featureKeys
        );
        void useCmsStore().syncCatalogFromEngine("developer");
        return { ok: true as const };
      } catch (devErr) {
        const err = adminErr instanceof ApiError ? adminErr : devErr;
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : "Invalid credentials."
        };
      }
    }
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

  function featureEnabled(key: string) {
    if (isDeveloper.value) return true;
    const cms = useCmsStore();

    if (user.value) {
      const keys = featureKeys.value;
      if (keys.includes(key)) return true;
      const children = cms.features.filter(f => f.parentKey === key);
      if (children.some(c => keys.includes(c.key))) return true;
      const feat = cms.features.find(f => f.key === key);
      if (feat?.parentKey && keys.includes(feat.parentKey)) return true;
      return false;
    }

    const feat = cms.features.find(f => f.key === key);
    if (!feat) return true;
    return feat.enabled;
  }

  function can(permission: string) {
    if (!user.value) return false;
    // Platform developer: every module + action.
    if (isDeveloper.value) return true;
    if (!featureEnabled(permission)) return false;
    return roles.value.some(r => rolePermissions[r]?.includes(permission));
  }

  function canAccessLocation(locationId: string) {
    const u = user.value;
    if (!u) return false;
    if (isDeveloper.value) return true;
    if (roles.value.some(r => globalRoles.includes(r))) return true;
    let ok = false;
    if (roles.value.includes("manager") || roles.value.includes("location_admin")) {
      ok = (u.locationIds ?? []).includes(locationId);
    }
    if (!ok && roles.value.includes("hotel_admin")) {
      const cms = useCmsStore();
      ok = cms.hotels.some(
        h =>
          h.locationId === locationId && (u.hotelIds ?? []).includes(h.id)
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
    if (roles.value.includes("hotel_admin") || roles.value.includes("booking_admin")) {
      ok = (u.hotelIds ?? []).includes(hotelId);
    }
    if (
      !ok &&
      (roles.value.includes("manager") || roles.value.includes("location_admin"))
    ) {
      const cms = useCmsStore();
      const hotel = cms.getHotelById(hotelId);
      ok = Boolean(
        hotel && (u.locationIds ?? []).includes(hotel.locationId)
      );
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
    logout,
    can,
    featureEnabled,
    canAccessLocation,
    canAccessHotel,
    hydrate
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
