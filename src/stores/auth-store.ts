import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
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

/** Role → permissions (features still required via user_package) */
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

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AdminUser | null>(null);
  const token = ref<string | null>(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("greyon_admin_token")
      : null
  );

  const isAuthenticated = computed(() => Boolean(user.value && token.value));
  const demoUsers = computed(() => useCmsStore().users);

  const userPackages = computed(() => {
    if (!user.value) return [];
    return useCmsStore().getPackagesForUser(user.value.id);
  });

  const roles = computed(() => useCmsStore().getUserRoles(user.value));
  const role = computed<AdminRole | null>(() =>
    useCmsStore().getUserRole(user.value)
  );
  const featureKeys = computed(() =>
    useCmsStore().getUserFeatureKeys(user.value)
  );

  const isDeveloper = computed(() => roles.value.includes("developer"));

  function hydrate() {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("greyon_admin_user")
        : null;
    if (!raw || !token.value) return;

    const stored = JSON.parse(raw) as AdminUser;
    const cms = useCmsStore();
    const fresh = cms.users.find(
      u => u.id === stored.id || u.email === stored.email
    );
    user.value = fresh ?? stored;
    if (fresh) {
      localStorage.setItem("greyon_admin_user", JSON.stringify(fresh));
    }
  }

  function login(email: string, _password: string) {
    const cms = useCmsStore();
    const found = cms.users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!found) {
      return { ok: false as const, message: "Invalid credentials." };
    }
    const userRoles = cms.getUserRoles(found);
    if (!userRoles.length || (userRoles.length === 1 && userRoles[0] === "customer")) {
      return {
        ok: false as const,
        message: "Customer accounts cannot access admin. Use the public site."
      };
    }
    user.value = found;
    token.value = `demo.${found.id}`;
    localStorage.setItem("greyon_admin_token", token.value);
    localStorage.setItem("greyon_admin_user", JSON.stringify(found));
    return { ok: true as const };
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("greyon_admin_token");
    localStorage.removeItem("greyon_admin_user");
  }

  /**
   * Feature gate via user_package → package.featureKeys.
   * Parent feature unlocks page; sub-feature keys can be checked separately.
   */
  function featureEnabled(key: string) {
    if (isDeveloper.value) return true;
    const cms = useCmsStore();

    if (user.value) {
      const keys = featureKeys.value;
      if (keys.includes(key)) return true;
      // Parent unlock: if checking a parent and any child is present, treat parent ok
      const children = cms.features.filter(f => f.parentKey === key);
      if (children.some(c => keys.includes(c.key))) return true;
      // Child unlock: if parent is present, allow child checks for page modules
      const feat = cms.features.find(f => f.key === key);
      if (feat?.parentKey && keys.includes(feat.parentKey)) return true;
      return false;
    }

    const feat = cms.features.find(f => f.key === key);
    if (!feat) return true;
    return feat.enabled;
  }

  /**
   * Page access: must pass through user_package features AND at least one role permission.
   */
  function can(permission: string) {
    if (!user.value) return false;
    if (isDeveloper.value) {
      return rolePermissions.developer.includes(permission);
    }
    if (!featureEnabled(permission)) return false;
    return roles.value.some(r => rolePermissions[r]?.includes(permission));
  }

  function canAccessLocation(locationId: string) {
    const u = user.value;
    if (!u) return false;
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

  /** Org-wide seats see everything; managers / hotel admins are property-scoped. */
  const isGlobalScope = computed(() =>
    roles.value.some(r => globalRoles.includes(r))
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

  /**
   * Contact enquiries are site-wide (no hotel yet).
   * Only global seats see them; location/hotel seats stay on property work.
   */
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
