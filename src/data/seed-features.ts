import type { ProductFeature } from "@/types/greyon";

/**
 * Features the SPA knows about before the engine catalog includes them.
 * Merged into the Seat types list when the live catalog omits the key.
 */
export const seedFeatures: ProductFeature[] = [
  {
    id: "feat-hero-slides",
    key: "hero_slides",
    label: "Hero slides",
    description: "Homepage hero carousel — images, copy, and schedule",
    category: "admin",
    parentKey: null,
    enabled: true,
    paidAddOn: false
  }
];
