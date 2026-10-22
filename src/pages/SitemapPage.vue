<template>
  <q-page class="gy-section sitemap-page">
    <SeoHead
      title="Sitemap | Greyon"
      description="Browse every public Greyon page — hotels, apartments, destinations, booking, and policies."
      url="https://greyon.site/sitemap"
    />
    <div class="gy-container">
      <header class="sitemap-hero">
        <p class="gy-eyebrow">Find your way</p>
        <h1 class="gy-display page-title">Sitemap</h1>
        <p class="lead">
          Every public page on Greyon, grouped the way you’d look for a stay.
          Hotels, apartments, destinations, and news come from the published
          catalog. Pages that are turned off are left out.
        </p>
        <p class="canonical-row">
          <span>Canonical</span>
          <a href="https://greyon.site/sitemap">https://greyon.site/sitemap</a>
        </p>
        <div class="hero-actions">
          <button class="gy-btn" type="button" @click="download">
            Download sitemap.xml
          </button>
        </div>
      </header>

      <div class="sitemap-grid">
        <section
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          :aria-labelledby="`sitemap-${group.id}`"
        >
          <header class="group-card__head">
            <span class="group-card__icon" aria-hidden="true">
              <q-icon :name="group.icon" size="22px" />
            </span>
            <h2 :id="`sitemap-${group.id}`" class="gy-display">
              {{ group.title }}
            </h2>
          </header>
          <ul>
            <li v-for="link in group.links" :key="`${group.id}:${link.path}`">
              <router-link :to="link.path">
                <span class="link-label">{{ link.label }}</span>
                <span v-if="link.hint" class="link-hint">{{ link.hint }}</span>
                <span class="link-url" aria-hidden="true">{{
                  absolute(link.path)
                }}</span>
              </router-link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SeoHead from "@/components/SeoHead.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";
import {
  SITEMAP_ORIGIN,
  buildCmsSitemapEntries,
  buildSitemapXml,
  downloadTextFile,
  type SitemapEntry
} from "@/utils/sitemap";
import {
  filterApartmentServices,
  filterHotelServices
} from "@/utils/serviceNav";

const cms = useCmsStore();
const auth = useAuthStore();

type SitemapLink = {
  label: string;
  path: string;
  hint?: string;
};

type SitemapGroup = {
  id: string;
  title: string;
  icon: string;
  links: SitemapLink[];
};

function propertyLinks(hotels: Hotel[]): SitemapLink[] {
  return hotels.map(hotel => {
    const city = cms.getLocationById(hotel.locationId)?.name?.trim();
    return {
      label: hotel.name,
      path: `/hotels/${hotel.slug}`,
      ...(city ? { hint: city } : {})
    };
  });
}

const groups = computed<SitemapGroup[]>(() => {
  const newsOn = auth.featureEnabled("news_public");
  const bookingOn = auth.featureEnabled("booking_public");
  const contactOn = auth.featureEnabled("contact_public");

  const main: SitemapLink[] = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Map", path: "/map" },
    { label: "Sitemap", path: "/sitemap" }
  ];
  if (newsOn) {
    main.push({ label: "News", path: "/news" });
    for (const article of cms.publishedNews) {
      main.push({
        label: article.title,
        path: `/news/${article.slug}`
      });
    }
  }

  const hotels: SitemapLink[] = [
    { label: "Hotels", path: "/hotels" },
    ...propertyLinks(filterHotelServices(cms.publishedHotels))
  ];
  const apartments: SitemapLink[] = [
    { label: "Apartments", path: "/apartments" },
    ...propertyLinks(filterApartmentServices(cms.publishedHotels))
  ];
  const destinations: SitemapLink[] = [
    { label: "All destinations", path: "/locations" },
    ...cms.publishedLocations
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(location => ({
        label: location.name,
        path: `/locations/${location.slug}`
      }))
  ];

  const booking: SitemapLink[] = [];
  if (bookingOn) {
    booking.push({ label: "Booking", path: "/booking" });
  }
  booking.push(
    { label: "Sign in", path: "/sign-in" },
    { label: "Sign up", path: "/sign-up" },
    { label: "My account", path: "/account" }
  );

  const help: SitemapLink[] = [];
  if (contactOn) {
    help.push({ label: "Contact", path: "/contact" });
  }

  const legal: SitemapLink[] = [
    { label: "Privacy policy", path: "/privacy" },
    { label: "Terms", path: "/terms" }
  ];
  if (bookingOn) {
    legal.push({ label: "Booking terms", path: "/booking-terms" });
  }

  return [
    { id: "main", title: "Main pages", icon: "home", links: main },
    {
      id: "hotels",
      title: "Services / Hotels",
      icon: "hotel",
      links: hotels
    },
    {
      id: "apartments",
      title: "Apartments",
      icon: "apartment",
      links: apartments
    },
    {
      id: "destinations",
      title: "Destinations",
      icon: "place",
      links: destinations
    },
    {
      id: "booking",
      title: "Booking & account",
      icon: "event_available",
      links: booking
    },
    { id: "help", title: "Help / Contact", icon: "mail", links: help },
    { id: "legal", title: "Legal", icon: "gavel", links: legal }
  ].filter(group => group.links.length > 0);
});

const entries = computed(() => {
  const generated = buildCmsSitemapEntries({
    hotels: cms.publishedHotels,
    locations: cms.publishedLocations,
    news: cms.publishedNews,
    roomTypes: cms.roomTypes,
    enabled: {
      booking: auth.featureEnabled("booking_public"),
      contact: auth.featureEnabled("contact_public"),
      news: auth.featureEnabled("news_public"),
      portfolios: false
    }
  });
  const seen = new Set(generated.map(entry => entry.loc));
  const extras: SitemapEntry[] = [];
  for (const group of groups.value) {
    for (const link of group.links) {
      if (seen.has(link.path)) continue;
      seen.add(link.path);
      extras.push({
        loc: link.path,
        changefreq: "monthly",
        priority: "0.4"
      });
    }
  }
  return [...generated, ...extras];
});

const xml = computed(() => buildSitemapXml(SITEMAP_ORIGIN, entries.value));

function absolute(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITEMAP_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function download() {
  downloadTextFile("sitemap.xml", xml.value);
}
</script>

<style scoped>
.sitemap-page {
  padding-top: 1.6rem;
  padding-bottom: 3.5rem;
  background:
    radial-gradient(
      ellipse 70% 42% at 8% -8%,
      rgba(196, 163, 90, 0.18),
      transparent 58%
    ),
    var(--gy-cream);
}

.page-title {
  margin: 0 0 0.75rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
}

.lead {
  max-width: 40rem;
  margin: 0;
  color: var(--gy-muted);
  font-size: 1.05rem;
  line-height: 1.65;
}

.canonical-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem 0.7rem;
  margin: 1.1rem 0 0;
}

.canonical-row span {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.canonical-row a {
  color: var(--gy-forest);
  font-size: 0.95rem;
  text-decoration: underline;
  text-underline-offset: 0.16em;
  word-break: break-all;
}

.canonical-row a:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
  border-radius: 4px;
}

.hero-actions {
  margin-top: 1.25rem;
}

.sitemap-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 2rem;
}

.group-card {
  height: 100%;
  padding: 1.15rem 1rem 0.85rem;
  border-radius: 22px;
  background: #fff;
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.04),
    0 14px 36px rgba(69, 76, 75, 0.08);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.group-card:hover {
  transform: translateY(-4px);
  border-color: rgba(98, 112, 99, 0.32);
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.04),
    0 22px 48px rgba(69, 76, 75, 0.14);
}

.group-card__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-card__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2.55rem;
  height: 2.55rem;
  border-radius: 12px;
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
}

.group-card h2 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.25;
}

.group-card ul {
  list-style: none;
  margin: 0.9rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.group-card a {
  display: grid;
  gap: 0.08rem;
  padding: 0.55rem 0.65rem;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.group-card a:hover {
  background: var(--gy-cream);
}

.group-card a:hover .link-label {
  color: var(--gy-forest);
}

.group-card a:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.link-label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gy-ink);
}

.link-hint {
  color: var(--gy-muted);
  font-size: 0.82rem;
}

.link-url {
  color: var(--gy-forest);
  font-size: 0.75rem;
  line-height: 1.35;
  word-break: break-all;
}

@media (max-width: 599px) {
  .sitemap-page {
    padding-top: 1.15rem;
  }

  .page-title {
    font-size: 2.15rem;
  }

  .group-card {
    border-radius: 18px;
    padding: 1rem 0.85rem 0.75rem;
  }
}

@media (min-width: 1024px) {
  .sitemap-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.15rem;
  }
}
</style>
