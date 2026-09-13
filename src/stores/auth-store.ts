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
  "news",
  "enquiries",
  "media",
  "settings",
  "users",
  "features"
] as const;

const rolePermissions: Record<AdminRole, readonly string[]> = {
  developer: ALL_ADMIN,
  org_admin: ALL_ADMIN.filter(p => p !== "features"),
  super_admin: ALL_ADMIN.filter(p => p !== "features"),
  location_admin: [
    "dashboard",
    "hotels",
    "rooms",
    "rates",
    "bookings",
    "locations",
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
  content_admin: [
    "dashboard",
    "hotels",
    "locations",
    "news",
    "enquiries",
    "media",
    "settings",
    "users"
  ],
  booking_admin: ["dashboard", "rooms", "rates", "bookings", "enquiries", "users"],
  customer: []
};

export const roleLabels: Record<AdminRole, string> = {
  developer: "Developer",
  org_admin: "Org admin (all hotels)",
  location_admin: "Location admin",
  hotel_admin: "Hotel admin",
  customer: "Customer",
  super_admin: "Super admin (legacy)",
  content_admin: "Content admin",
  booking_admin: "Booking admin"
};

const globalRoles: AdminRole[] = [
  "developer",
  "org_admin",
  "super_admin",
  "content_admin",
  "booking_admin"
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

  const userPackage = computed(() => {
    if (!user.value?.packageId) return null;
    return useCmsStore().getPackageById(user.value.packageId);
  });

  /** Role always comes from user_package */
  const role = computed<AdminRole | null>(() => userPackage.value?.role ?? null);

  const isDeveloper = computed(() => role.value === "developer");

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
    const pkgRole = cms.getUserRole(found);
    if (pkgRole === "customer") {
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

  function featureEnabled(key: string) {
    if (role.value === "developer") return true;
    const cms = useCmsStore();

    if (userPackage.value) {
      return userPackage.value.featureKeys.includes(key);
    }

    const feat = cms.features.find(f => f.key === key);
    if (!feat) return true;
    return feat.enabled;
  }

  function can(permission: string) {
    if (!user.value || !role.value) return false;
    if (role.value === "developer") {
      return rolePermissions.developer.includes(permission);
    }
    if (!rolePermissions[role.value]?.includes(permission)) return false;
    if (!featureEnabled(permission)) return false;
    return true;
  }

  function canAccessLocation(locationId: string) {
    const u = user.value;
    const r = role.value;
    if (!u || !r) return false;
    if (globalRoles.includes(r)) return true;
    if (r === "location_admin") {
      return (u.locationIds ?? []).includes(locationId);
    }
    if (r === "hotel_admin") {
      const cms = useCmsStore();
      return cms.hotels.some(
        h =>
          h.locationId === locationId && (u.hotelIds ?? []).includes(h.id)
      );
    }
    return false;
  }

  function canAccessHotel(hotelId: string) {
    const u = user.value;
    const r = role.value;
    if (!u || !r) return false;
    if (globalRoles.includes(r)) return true;
    if (r === "hotel_admin") {
      return (u.hotelIds ?? []).includes(hotelId);
    }
    if (r === "location_admin") {
      const cms = useCmsStore();
      const hotel = cms.getHotelById(hotelId);
      return Boolean(
        hotel && (u.locationIds ?? []).includes(hotel.locationId)
      );
    }
    return false;
  }

  hydrate();

  return {
    user,
    token,
    isAuthenticated,
    isDeveloper,
    demoUsers,
    userPackage,
    role,
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
