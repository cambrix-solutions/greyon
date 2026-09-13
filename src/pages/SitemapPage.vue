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
        Generated from published hotels, locations, and news in the CMS.
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
import { useCmsStore } from "@/stores/cms-store";
import {
  buildCmsSitemapEntries,
  buildSitemapXml,
  downloadTextFile
} from "@/utils/sitemap";

const cms = useCmsStore();

const baseUrl = computed(
  () => cms.settings.siteUrl || "https://www.greyon.com.kh"
);

const entries = computed(() =>
  buildCmsSitemapEntries({
    hotels: cms.publishedHotels,
    locations: cms.publishedLocations,
    news: cms.publishedNews
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
