import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";
import { useCustomerStore } from "@/stores/customer-store";

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
        meta: { title: "Destinations | Greyon", solidHeader: true }
      },
      {
        path: "locations/:slug",
        name: "location-detail",
        component: () => import("@/pages/LocationDetailPage.vue"),
        meta: { title: "Destination | Greyon", solidHeader: true }
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
        path: "sign-in",
        name: "sign-in",
        component: () => import("@/pages/SignInPage.vue"),
        meta: { title: "Sign in | Greyon", solidHeader: true }
      },
      {
        path: "sign-up",
        name: "sign-up",
        component: () => import("@/pages/SignUpPage.vue"),
        meta: { title: "Sign up | Greyon", solidHeader: true }
      },
      {
        path: "auth/google/complete",
        name: "google-auth-complete",
        component: () => import("@/pages/GoogleAuthCompletePage.vue"),
        meta: { title: "Signing in | Greyon", solidHeader: true }
      },
      {
        path: "account",
        name: "account",
        component: () => import("@/pages/AccountPage.vue"),
        meta: {
          title: "My account | Greyon",
          solidHeader: true,
          requiresCustomer: true
        }
      },
      {
        path: "account/bookings/:reference",
        name: "account-booking",
        component: () => import("@/pages/AccountBookingPage.vue"),
        meta: {
          title: "Booking details | Greyon",
          solidHeader: true,
          requiresCustomer: true
        }
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
    path: "/developer/login",
    name: "developer-login",
    component: () => import("@/pages/admin/DeveloperLoginPage.vue"),
    meta: { title: "Developer Login | Greyon", publicAdmin: true }
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
        meta: { title: "Prices & rooms | Greyon Admin", perm: "rates" }
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
        meta: { title: "Destinations | Greyon Admin", perm: "locations" }
      },
      {
        path: "locations/:id",
        name: "admin-location-detail",
        component: () => import("@/pages/admin/AdminLocationDetailPage.vue"),
        meta: {
          title: "Destination | Greyon Admin",
          perm: "locations",
          destinationDetail: true
        }
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
        path: "hero-slides",
        name: "admin-hero-slides",
        component: () => import("@/pages/admin/AdminHeroSlidesPage.vue"),
        meta: { title: "Hero slides | Greyon Admin", perm: "settings" }
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
        meta: { title: "Packages | Greyon Admin", perm: "features" }
      },
      {
        path: "access-catalog",
        name: "admin-access-catalog",
        component: () => import("@/pages/admin/AdminAccessCatalogPage.vue"),
        meta: {
          title: "Access catalog | Greyon Admin",
          perm: "features",
          developerOnly: true
        }
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

    // Public admin / developer login / access denied — never block
    if (
      to.name === "admin-login" ||
      to.name === "developer-login" ||
      to.name === "access-denied" ||
      to.meta.publicAdmin
    ) {
      return true;
    }

    const auth = useAuthStore();
    const customer = useCustomerStore();
    customer.hydrate();

    if (to.meta.requiresCustomer && !customer.isAuthenticated) {
      return {
        name: "sign-in",
        query: { redirect: to.fullPath }
      };
    }

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
        const preferDeveloper =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("greyon_login_guard") === "developer";
        return {
          name: preferDeveloper ? "developer-login" : "admin-login",
          query: { redirect: to.fullPath }
        };
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
      if (to.meta.destinationDetail && !auth.canDestinationDetail()) {
        return {
          name: "access-denied",
          query: {
            message:
              "Your seat does not include Destination detail (locations_detail)."
          }
        };
      }
      if (to.meta.developerOnly && !auth.isDeveloper) {
        return {
          name: "access-denied",
          query: {
            message:
              "Only the platform developer can manage the access catalog."
          }
        };
      }
    }
    return true;
  });
}

export default routes;
