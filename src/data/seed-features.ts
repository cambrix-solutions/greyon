import type { ProductFeature } from "@/types/greyon";

/** Default product catalog — developer toggles `enabled` per client package */
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
    id: "feat-locations",
    key: "locations",
    label: "Locations",
    description: "Destination pages; hotels belong to a location",
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
    description:
      "Optional asset dump. Hotels/rooms already store their own images — turn off if they did not pay for a library.",
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
    label: "Users & roles",
    description: "Org user management (not developer Features)",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-features",
    key: "features",
    label: "Feature packages",
    description: "Developer-only: build and activate user packages",
    category: "admin",
    enabled: true,
    paidAddOn: false
  },
  {
    id: "feat-booking-public",
    key: "booking_public",
    label: "Public booking engine",
    description: "Guest-facing /booking flow and Book CTAs",
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
    description: "Service apartment / boutique / resort coming-soon pages",
    category: "public",
    enabled: true,
    paidAddOn: true
  }
];
