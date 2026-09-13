import type { NewsArticle } from "@/types/greyon";

export const newsArticles: NewsArticle[] = [
  {
    id: "news-1",
    title: "Greyon Riverside opens its new rooftop pool season",
    slug: "riverside-rooftop-pool-season",
    coverImage:
      "https://images.unsplash.com/photo-1571896349842-33c89424bb9c?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "Cool evenings, skyline views, and seasonal poolside dining return to Phnom Penh.",
    body: `<p>Greyon Riverside welcomes guests back to the rooftop with extended evening hours, light bites, and river breezes over Sisowath Quay.</p>
<p>Book a Deluxe River View or Executive Suite and enjoy complimentary pool access throughout your stay.</p>`,
    publishedAt: "2026-08-12",
    status: "published",
    seoTitle: "Rooftop pool season | Greyon",
    seoDescription: "Seasonal rooftop pool dining at Greyon Riverside Phnom Penh."
  },
  {
    id: "news-2",
    title: "Temple mornings made easy in Siem Reap",
    slug: "temple-mornings-siem-reap",
    coverImage:
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "Early breakfast windows and bicycle hire for guests exploring Angkor.",
    body: `<p>Greyon Angkor now offers pre-dawn breakfast packs and complimentary bicycle hire for guests heading to the temples.</p>
<p>Speak with the tour desk the evening before your visit to arrange timings.</p>`,
    publishedAt: "2026-07-28",
    status: "published"
  },
  {
    id: "news-3",
    title: "Coastal weekends on Otres",
    slug: "coastal-weekends-otres",
    coverImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    excerpt:
      "Weekend packages at Greyon Coast with seafood dinner for two.",
    body: `<p>Escape to Sihanoukville with Greyon Coast’s weekend stay, including breakfast and a seafood dinner for two.</p>`,
    publishedAt: "2026-06-15",
    status: "published"
  }
];

export function getNewsBySlug(slug: string) {
  return newsArticles.find(n => n.slug === slug && n.status === "published");
}

export function getPublishedNews() {
  return [...newsArticles]
    .filter(n => n.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
