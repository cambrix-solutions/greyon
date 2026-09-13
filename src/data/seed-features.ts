import type { ProductFeature } from "@/types/greyon";

/**
 * Feature catalog with parent / sub-feature hierarchy.
 * Example: Locations unlocks the module; sub-features control managers, hotels, etc.
 */
export const seedFeatures: ProductFeature[] = [
  {
    id: "feat-dashboard",
    key: "dashboard",
    label: "Dashboard",
    description: "Admin home / ops overview",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations",
    key: "locations",
    label: "Locations",
    description: "Destination CMS — parent module for location sub-features",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations-list",
    key: "locations_list",
    label: "Location list & pages",
    description: "View and edit destination content",
    category: "admin",
    parentKey: "locations",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations-managers",
    key: "locations_managers",
    label: "Location managers",
    description: "Assign a manager per destination (scoped locationIds)",
    category: "admin",
    parentKey: "locations",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations-hotels",
    key: "locations_hotels",
    label: "Hotels under locations",
    description: "Link hotels to destinations; hotel admins sit under a location",
    category: "admin",
    parentKey: "locations",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations-publish",
    key: "locations_publish",
    label: "Publish destinations",
    description: "Publish / archive location pages",
    category: "admin",
    parentKey: "locations",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-locations-seo",
    key: "locations_seo",
    label: "Location SEO",
    description: "Per-destination SEO fields",
    category: "admin",
    parentKey: "locations",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-hotels",
    key: "hotels",
    label: "Hotels",
    description: "Hotel CMS (linked to locations via locationId)",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-rooms",
    key: "rooms",
    label: "Room types",
    description: "Rooms per hotel",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-news",
    key: "news",
    label: "News",
    description: "News / blog CMS",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-media",
    key: "media",
    label: "Media library",
    description: "Optional asset library add-on",
    category: "admin",
    enabled: false,
    paidAddOn: true
  },
  {
    id: "feat-rates",
    key: "rates",
    label: "Rates & availability",
    description: "Inventory and nightly pricing",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-bookings",
    key: "bookings",
    label: "Bookings",
    description: "Reservation inbox / management",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-enquiries",
    key: "enquiries",
    label: "Enquiries",
    description: "Contact form inbox",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-settings",
    key: "settings",
    label: "SEO / Settings",
    description: "Site defaults and SEO",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-users",
    key: "users",
    label: "Users",
    description: "View access / developer manages accounts",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-features",
    key: "features",
    label: "User packages",
    description: "Developer-only: build packages and assign to users",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-booking-public",
    key: "booking_public",
    label: "Public booking engine",
    description: "Guest-facing /booking flow",
    category: "public",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-news-public",
    key: "news_public",
    label: "Public news",
    description: "Guest-facing news pages",
    category: "public",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-contact-public",
    key: "contact_public",
    label: "Public contact form",
    description: "Guest-facing /contact",
    category: "public",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-portfolios",
    key: "portfolios",
    label: "Portfolio stubs",
    description: "Coming-soon portfolio pages",
    category: "public",
    enabled: true,
    paidAddOn: true
  }
];
