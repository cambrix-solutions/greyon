<template>
  <q-page class="gy-section">
    <SeoHead
      title="Sitemap | Greyon"
      description="XML sitemap generated from published Greyon CMS content."
    />
    <div class="gy-container">
      <p class="gy-eyebrow">SEO</p>
      <h1 class="gy-display page-title">Sitemap</h1>
      <p class="gy-muted">
        Live routes only — published CMS content plus public surfaces that are
        enabled on this site (disabled booking, contact, news, and portfolio
        stubs are omitted).
      </p>
      <div class="actions">
        <button class="gy-btn" type="button" @click="download">
          Download sitemap.xml
        </button>
        <router-link to="/" class="gy-btn gy-btn--light">Home</router-link>
      </div>
      <ul class="url-list">
        <li v-for="entry in entries" :key="entry.loc">
          <a :href="absolute(entry.loc)">{{ absolute(entry.loc) }}</a>
        </li>
      </ul>
      <pre class="xml-preview">{{ xml }}</pre>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SeoHead from "@/components/SeoHead.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import {
  buildCmsSitemapEntries,
  buildSitemapXml,
  downloadTextFile
} from "@/utils/sitemap";

const cms = useCmsStore();
const auth = useAuthStore();

const baseUrl = computed(
  () => cms.settings.siteUrl || "https://www.greyon.com.kh"
);

const entries = computed(() =>
  buildCmsSitemapEntries({
    hotels: cms.publishedHotels,
    locations: cms.publishedLocations,
    news: cms.publishedNews,
    roomTypes: cms.roomTypes,
    // Match router public gates — never advertise routes that 404 as "not enabled".
    // Portfolio stubs stay out even when the nav gate is on (coming-soon pages).
    enabled: {
      booking: auth.featureEnabled("booking_public"),
      contact: auth.featureEnabled("contact_public"),
      news: auth.featureEnabled("news_public"),
      portfolios: false
    }
  })
);

const xml = computed(() => buildSitemapXml(baseUrl.value, entries.value));

function absolute(path: string) {
  const origin = baseUrl.value.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${origin}${path}`;
}

function download() {
  downloadTextFile("sitemap.xml", xml.value);
}
</script>

<style scoped>
.page-title {
  margin: 0 0 0.75rem;
  font-size: clamp(2.2rem, 5vw, 3.2rem);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.url-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: grid;
  gap: 0.35rem;
}

.url-list a {
  color: var(--gy-forest);
  text-decoration: underline;
  word-break: break-all;
}

.xml-preview {
  overflow: auto;
  max-height: 360px;
  padding: 1rem;
  background: var(--gy-sand);
  font-size: 0.8rem;
  white-space: pre-wrap;
}
</style>
