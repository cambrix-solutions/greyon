<template>
  <q-page class="gy-section">
    <SeoHead title="News | Greyon" description="Latest Greyon hospitality news." />
    <div class="gy-container">
      <div v-reveal>
        <p class="gy-eyebrow">Updates</p>
        <h1 class="gy-display page-title">News</h1>
      </div>
      <div class="gy-grid-3">
        <article
          v-for="(item, i) in cms.publishedNews"
          :key="item.id"
          v-reveal="{ delay: `${i * 80}ms` }"
          class="news-item gy-interactive"
        >
          <router-link
            :to="`/news/${item.slug}`"
            class="gy-card-media news-item__media"
          >
            <img :src="item.coverImage" :alt="item.title" loading="lazy" />
          </router-link>
          <p class="gy-eyebrow">{{ item.publishedAt }}</p>
          <h2 class="gy-display">
            <router-link :to="`/news/${item.slug}`">{{ item.title }}</router-link>
          </h2>
          <p class="gy-muted">{{ item.excerpt }}</p>
        </article>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
</script>

<style scoped>
.page-title {
  margin: 0 0 1.75rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
}

.news-item__media {
  aspect-ratio: 16 / 10;
  margin-bottom: 0.85rem;
}

.news-item h2 {
  margin: 0 0 0.5rem;
  font-size: 1.6rem;
}
</style>
