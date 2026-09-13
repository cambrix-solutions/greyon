import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("@/pages/HomePage.vue"),
        meta: { title: "Greyon | Hotels in Cambodia" }
      },
      {
        path: "news",
        name: "news",
        component: () => import("@/pages/NewsListPage.vue"),
        meta: { title: "News | Greyon", solidHeader: true }
      },
      {
        path: "news/:slug",
        name: "news-detail",
        component: () => import("@/pages/NewsDetailPage.vue"),
        meta: { title: "News | Greyon", solidHeader: true }
      },
      {
        path: "hotels",
        name: "hotels",
        component: () => import("@/pages/HotelsListPage.vue"),
        meta: { title: "Hotels | Greyon", solidHeader: true }
      },
      {
        path: "hotels/:slug",
        name: "hotel-detail",
        component: () => import("@/pages/HotelDetailPage.vue"),
        meta: { title: "Hotel | Greyon", solidHeader: true }
      },
      {
        path: "portfolios/service-apartment",
        name: "portfolio-service-apartment",
        component: () => import("@/pages/PortfolioComingSoonPage.vue"),
        meta: {
          title: "Service Apartment | Greyon",
          solidHeader: true,
          portfolioKind: "service-apartment"
        }
      },
      {
        path: "portfolios/boutique",
        name: "portfolio-boutique",
        component: () => import("@/pages/PortfolioComingSoonPage.vue"),
        meta: {
          title: "Boutique | Greyon",
          solidHeader: true,
          portfolioKind: "boutique"
        }
      },
      {
        path: "portfolios/resort",
        name: "portfolio-resort",
        component: () => import("@/pages/PortfolioComingSoonPage.vue"),
        meta: {
          title: "Resort | Greyon",
          solidHeader: true,
          portfolioKind: "resort"
        }
      },
      {
        path: "locations",
        name: "locations",
        component: () => import("@/pages/LocationsListPage.vue"),
        meta: { title: "Locations | Greyon", solidHeader: true }
      },
      {
        path: "locations/:slug",
        name: "location-detail",
        component: () => import("@/pages/LocationDetailPage.vue"),
        meta: { title: "Location | Greyon", solidHeader: true }
      },
      {
        path: "booking",
        name: "booking",
        component: () => import("@/pages/BookingPage.vue"),
        meta: { title: "Booking | Greyon", solidHeader: true }
      },
      {
        path: "contact",
        name: "contact",
        component: () => import("@/pages/ContactPage.vue"),
        meta: { title: "Contact | Greyon", solidHeader: true }
      },
      {
        path: "sitemap",
        name: "sitemap",
        component: () => import("@/pages/SitemapPage.vue"),
        meta: { title: "Sitemap | Greyon", solidHeader: true }
      },
      {
        path: "privacy",
        name: "privacy",
        component: () => import("@/pages/LegalPage.vue"),
        meta: {
          title: "Privacy Policy | Greyon",
          solidHeader: true,
          legalType: "privacy"
        }
      },
      {
        path: "terms",
        name: "terms",
        component: () => import("@/pages/LegalPage.vue"),
        meta: {
          title: "Terms | Greyon",
          solidHeader: true,
          legalType: "terms"
        }
      },
      {
        path: "booking-terms",
        name: "booking-terms",
        component: () => import("@/pages/LegalPage.vue"),
        meta: {
          title: "Booking Terms | Greyon",
          solidHeader: true,
          legalType: "booking"
        }
      }
    ]
  },
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("@/pages/admin/AdminLoginPage.vue"),
    meta: { title: "Admin Login | Greyon", publicAdmin: true }
  },
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: () => import("@/pages/admin/AdminDashboardPage.vue"),
        meta: { title: "Dashboard | Greyon Admin", perm: "dashboard" }
      },
      {
        path: "hotels",
        name: "admin-hotels",
        component: () => import("@/pages/admin/AdminHotelsPage.vue"),
        meta: { title: "Hotels | Greyon Admin", perm: "hotels" }
      },
      {
        path: "rooms",
        name: "admin-rooms",
        component: () => import("@/pages/admin/AdminRoomsPage.vue"),
        meta: { title: "Rooms | Greyon Admin", perm: "rooms" }
      },
      {
        path: "rates",
        name: "admin-rates",
        component: () => import("@/pages/admin/AdminRatesPage.vue"),
        meta: { title: "Rates | Greyon Admin", perm: "rates" }
      },
      {
        path: "bookings",
        name: "admin-bookings",
        component: () => import("@/pages/admin/AdminBookingsPage.vue"),
        meta: { title: "Bookings | Greyon Admin", perm: "bookings" }
      },
      {
        path: "locations",
        name: "admin-locations",
        component: () => import("@/pages/admin/AdminLocationsPage.vue"),
        meta: { title: "Locations | Greyon Admin", perm: "locations" }
      },
      {
        path: "news",
        name: "admin-news",
        component: () => import("@/pages/admin/AdminNewsPage.vue"),
        meta: { title: "News | Greyon Admin", perm: "news" }
      },
      {
        path: "enquiries",
        name: "admin-enquiries",
        component: () => import("@/pages/admin/AdminEnquiriesPage.vue"),
        meta: { title: "Enquiries | Greyon Admin", perm: "enquiries" }
      },
      {
        path: "media",
        name: "admin-media",
        component: () => import("@/pages/admin/AdminMediaPage.vue"),
        meta: { title: "Media | Greyon Admin", perm: "media" }
      },
      {
        path: "settings",
        name: "admin-settings",
        component: () => import("@/pages/admin/AdminSettingsPage.vue"),
        meta: { title: "Settings | Greyon Admin", perm: "settings" }
      },
      {
        path: "users",
        name: "admin-users",
        component: () => import("@/pages/admin/AdminUsersPage.vue"),
        meta: { title: "Users | Greyon Admin", perm: "users" }
      },
      {
        path: "features",
        name: "admin-features",
        component: () => import("@/pages/admin/AdminFeaturesPage.vue"),
        meta: { title: "Features | Greyon Admin", perm: "features" }
      }
    ]
  },
  {
    path: "/404",
    name: "access-denied",
    component: () => import("@/pages/ErrorAccessDenied.vue"),
    meta: { title: "404 | Greyon", publicAdmin: true }
  },
  {
    path: "/:catchAll(.*)*",
    name: "not-found",
    component: () => import("@/pages/ErrorAccessDenied.vue"),
    meta: { title: "404 | Greyon" }
  }
];

export function setupRouterGuards(
  router: ReturnType<typeof import("vue-router").createRouter>
) {
  router.beforeEach(to => {
    if (to.meta.title) {
      document.title = String(to.meta.title);
    }

    // Public admin login / access denied — never block
    if (to.name === "admin-login" || to.name === "access-denied" || to.meta.publicAdmin) {
      return true;
    }

    const auth = useAuthStore();

    // Public product gates → 404-style denied
    if (to.name === "booking" && !auth.featureEnabled("booking_public")) {
      return {
        name: "access-denied",
        query: { message: "Booking is not enabled on this site." }
      };
    }
    if (
      (to.name === "news" || to.name === "news-detail") &&
      !auth.featureEnabled("news_public")
    ) {
      return {
        name: "access-denied",
        query: { message: "News is not enabled on this site." }
      };
    }
    if (to.name === "contact" && !auth.featureEnabled("contact_public")) {
      return {
        name: "access-denied",
        query: { message: "Contact is not enabled on this site." }
      };
    }
    if (
      typeof to.name === "string" &&
      to.name.startsWith("portfolio-") &&
      !auth.featureEnabled("portfolios")
    ) {
      return {
        name: "access-denied",
        query: { message: "This portfolio page is not enabled." }
      };
    }

    if (to.meta.requiresAuth || to.path.startsWith("/admin")) {
      auth.hydrate();
      if (!auth.isAuthenticated) {
        return { name: "admin-login", query: { redirect: to.fullPath } };
      }
      // Every admin page: user_package features + roles first
      const perm = to.meta.perm as string | undefined;
      if (perm && !auth.can(perm)) {
        return {
          name: "access-denied",
          query: {
            message: `Your user package does not include “${perm}”.`
          }
        };
      }
    }
    return true;
  });
}

export default routes;
