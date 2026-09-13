import type { Hotel, RatePlan, RoomType } from "@/types/greyon";

export const hotels: Hotel[] = [
  {
    id: "htl-riverside",
    name: "Greyon Riverside Phnom Penh",
    slug: "greyon-riverside-phnom-penh",
    locationId: "loc-pp",
    shortDescription:
      "Riverside calm with contemporary suites overlooking the Tonle Sap.",
    description:
      "Greyon Riverside Phnom Penh pairs spacious rooms with attentive service steps from the capital’s waterfront. Guests enjoy a rooftop pool, all-day dining, and easy access to the city’s cultural landmarks.",
    address: "Sisowath Quay, Phnom Penh, Cambodia",
    coordinates: { lat: 11.5683, lng: 104.9308 },
    phone: "+855 23 000 111",
    email: "riverside@greyon.com.kh",
    heroImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Pool", "Restaurant", "Wi-Fi", "Spa", "Parking", "Gym"],
    policies: [
      "Check-in from 14:00",
      "Check-out by 12:00",
      "Free cancellation up to 48 hours before arrival",
      "Children welcome"
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    featured: true,
    status: "published",
    seoTitle: "Greyon Riverside Phnom Penh",
    seoDescription: "Book Greyon Riverside hotel in Phnom Penh."
  },
  {
    id: "htl-angkor",
    name: "Greyon Angkor Siem Reap",
    slug: "greyon-angkor-siem-reap",
    locationId: "loc-sr",
    shortDescription:
      "Quiet gardens and refined rooms near the temples of Angkor.",
    description:
      "Wake to birdsong in tropical gardens, then set out for Angkor with Greyon’s temple-ready amenities, breakfast terrace, and evening poolside lounge.",
    address: "Wat Bo Road, Siem Reap, Cambodia",
    coordinates: { lat: 13.3618, lng: 103.8606 },
    phone: "+855 63 000 222",
    email: "angkor@greyon.com.kh",
    heroImage:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Pool", "Restaurant", "Wi-Fi", "Bicycle rental", "Tour desk"],
    policies: [
      "Check-in from 14:00",
      "Check-out by 12:00",
      "Free cancellation up to 72 hours before arrival"
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    featured: true,
    status: "published"
  },
  {
    id: "htl-coast",
    name: "Greyon Coast Sihanoukville",
    slug: "greyon-coast-sihanoukville",
    locationId: "loc-shv",
    shortDescription: "Ocean-facing rooms with a soft coastal rhythm.",
    description:
      "Greyon Coast sits above the shoreline with breezy terraces, seafood dining, and day-trip support to nearby islands.",
    address: "Otres Beach Road, Sihanoukville, Cambodia",
    coordinates: { lat: 10.5806, lng: 103.5376 },
    phone: "+855 34 000 333",
    email: "coast@greyon.com.kh",
    heroImage:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1571896349842-33c89424bb9c?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Beach access", "Pool", "Restaurant", "Wi-Fi", "Bar"],
    policies: [
      "Check-in from 15:00",
      "Check-out by 11:00",
      "Free cancellation up to 48 hours before arrival"
    ],
    checkInTime: "15:00",
    checkOutTime: "11:00",
    featured: true,
    status: "published"
  },
  {
    id: "htl-kampot",
    name: "Greyon River Kampot",
    slug: "greyon-river-kampot",
    locationId: "loc-kpt",
    shortDescription: "A riverside stay framed by pepper hills and quiet evenings.",
    description:
      "Greyon River Kampot offers relaxed rooms, local dining, and easy access to countryside excursions.",
    address: "River Road, Kampot, Cambodia",
    coordinates: { lat: 10.6104, lng: 104.1814 },
    phone: "+855 33 000 444",
    email: "kampot@greyon.com.kh",
    heroImage:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    amenities: ["Restaurant", "Wi-Fi", "Garden", "Kayak rental"],
    policies: [
      "Check-in from 14:00",
      "Check-out by 12:00",
      "Free cancellation up to 24 hours before arrival"
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    status: "published"
  }
];

export const roomTypes: RoomType[] = [
  {
    id: "rm-riverside-deluxe",
    hotelId: "htl-riverside",
    name: "Deluxe River View",
    slug: "deluxe-river-view",
    description: "King bed, river-facing window, work desk, and rainfall shower.",
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80"
    ],
    bedType: "1 King",
    roomSize: "32 m²",
    maxAdults: 2,
    maxChildren: 1,
    maxGuests: 3,
    amenities: ["River view", "Mini bar", "Safe", "Wi-Fi"],
    baseInventory: 8,
    status: "published"
  },
  {
    id: "rm-riverside-suite",
    hotelId: "htl-riverside",
    name: "Executive Suite",
    slug: "executive-suite",
    description: "Separate living area with panoramic river views.",
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    bedType: "1 King",
    roomSize: "48 m²",
    maxAdults: 2,
    maxChildren: 2,
    maxGuests: 4,
    amenities: ["Living area", "Bathtub", "Lounge access"],
    baseInventory: 4,
    status: "published"
  },
  {
    id: "rm-angkor-garden",
    hotelId: "htl-angkor",
    name: "Garden Room",
    slug: "garden-room",
    description: "Ground-level room opening onto tropical gardens.",
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80"
    ],
    bedType: "1 King or 2 Twins",
    roomSize: "28 m²",
    maxAdults: 2,
    maxChildren: 1,
    maxGuests: 3,
    amenities: ["Garden view", "Wi-Fi", "Safe"],
    baseInventory: 10,
    status: "published"
  },
  {
    id: "rm-coast-ocean",
    hotelId: "htl-coast",
    name: "Ocean Terrace",
    slug: "ocean-terrace",
    description: "Private terrace with sea breeze and sunset outlook.",
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424bb9c?auto=format&fit=crop&w=1200&q=80"
    ],
    bedType: "1 King",
    roomSize: "30 m²",
    maxAdults: 2,
    maxChildren: 1,
    maxGuests: 3,
    amenities: ["Ocean view", "Terrace", "Wi-Fi"],
    baseInventory: 6,
    status: "published"
  },
  {
    id: "rm-kampot-standard",
    hotelId: "htl-kampot",
    name: "River Standard",
    slug: "river-standard",
    description: "Comfortable riverside room with local timber accents.",
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    bedType: "1 Queen",
    roomSize: "24 m²",
    maxAdults: 2,
    maxChildren: 1,
    maxGuests: 2,
    amenities: ["River view", "Wi-Fi", "Fan + AC"],
    baseInventory: 8,
    status: "published"
  }
];

export const ratePlans: RatePlan[] = [
  {
    id: "rp-riverside-deluxe",
    roomTypeId: "rm-riverside-deluxe",
    name: "Flexible Rate",
    description: "Includes breakfast for two.",
    mealBenefit: "Breakfast included",
    cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
    basePrice: 95,
    taxPercent: 10,
    serviceFeePercent: 5,
    status: "published"
  },
  {
    id: "rp-riverside-suite",
    roomTypeId: "rm-riverside-suite",
    name: "Suite Flexible",
    description: "Breakfast and lounge access.",
    mealBenefit: "Breakfast + lounge",
    cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
    basePrice: 160,
    taxPercent: 10,
    serviceFeePercent: 5,
    status: "published"
  },
  {
    id: "rp-angkor-garden",
    roomTypeId: "rm-angkor-garden",
    name: "Temple Explorer",
    description: "Breakfast and late check-out subject to availability.",
    mealBenefit: "Breakfast included",
    cancellationPolicy: "Free cancellation up to 72 hours before arrival.",
    basePrice: 85,
    taxPercent: 10,
    serviceFeePercent: 5,
    status: "published"
  },
  {
    id: "rp-coast-ocean",
    roomTypeId: "rm-coast-ocean",
    name: "Coastal Flexible",
    description: "Breakfast for two.",
    mealBenefit: "Breakfast included",
    cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
    basePrice: 110,
    taxPercent: 10,
    serviceFeePercent: 5,
    status: "published"
  },
  {
    id: "rp-kampot-standard",
    roomTypeId: "rm-kampot-standard",
    name: "Kampot Flexible",
    description: "Room only with flexible cancellation.",
    mealBenefit: "Room only",
    cancellationPolicy: "Free cancellation up to 24 hours before arrival.",
    basePrice: 65,
    taxPercent: 10,
    serviceFeePercent: 5,
    status: "published"
  }
];

export function getHotelBySlug(slug: string) {
  return hotels.find(h => h.slug === slug && h.status === "published");
}

export function getHotelsByLocationId(locationId: string) {
  return hotels.filter(
    h => h.locationId === locationId && h.status === "published"
  );
}

export function getRoomTypesByHotelId(hotelId: string) {
  return roomTypes.filter(
    r => r.hotelId === hotelId && r.status === "published"
  );
}

export function getRatePlanByRoomTypeId(roomTypeId: string) {
  return ratePlans.find(
    r => r.roomTypeId === roomTypeId && r.status === "published"
  );
}
