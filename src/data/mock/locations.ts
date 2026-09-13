import type { Location } from "@/types/greyon";

export const locations: Location[] = [
  {
    id: "loc-pp",
    name: "Phnom Penh",
    slug: "phnom-penh",
    description:
      "Cambodia’s capital offers riverside energy, cultural landmarks, and Greyon hospitality in the heart of the city.",
    heroImage:
      "https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Royal Palace", "Riverside promenade", "Local cuisine"],
    status: "published",
    seoTitle: "Hotels in Phnom Penh | Greyon",
    seoDescription: "Discover Greyon hotels in Phnom Penh."
  },
  {
    id: "loc-shv",
    name: "Sihanoukville",
    slug: "sihanoukville",
    description:
      "Coastal escapes with beachfront calm and easy access to Cambodia’s southern islands.",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    highlights: ["Beaches", "Island day trips", "Sunset dining"],
    status: "published"
  },
  {
    id: "loc-kpt",
    name: "Kampot",
    slug: "kampot",
    description:
      "River-town charm, pepper plantations, and a slower pace along the foothills of Bokor.",
    heroImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    highlights: ["Kampot pepper", "River cruises", "Bokor National Park"],
    status: "published"
  },
  {
    id: "loc-kep",
    name: "Kep",
    slug: "kep",
    description:
      "Quiet seaside living known for fresh seafood and hillside views over the Gulf of Thailand.",
    heroImage:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    highlights: ["Crab Market", "Kep National Park", "Coastal walks"],
    status: "published"
  },
  {
    id: "loc-sr",
    name: "Siem Reap",
    slug: "siem-reap",
    description:
      "Gateway to Angkor, where cultural discovery meets comfortable Greyon stays.",
    heroImage:
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    highlights: ["Angkor Wat", "Pub Street", "Tonle Sap"],
    status: "published"
  },
  {
    id: "loc-bb",
    name: "Battambang",
    slug: "battambang",
    description:
      "Colonial streets, countryside landscapes, and authentic Cambodian hospitality.",
    heroImage:
      "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    highlights: ["Bamboo Train", "Art galleries", "Countryside temples"],
    status: "published"
  }
];

export function getLocationBySlug(slug: string) {
  return locations.find(l => l.slug === slug);
}
