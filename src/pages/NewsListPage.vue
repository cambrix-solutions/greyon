<template>
  <q-page class="gy-section">
    <SeoHead
      title="News | Greyon"
      description="Latest Greyon hospitality news."
    />
    <div class="gy-container">
      <div v-reveal>
        <p class="gy-eyebrow">Updates</p>
        <h1 class="gy-display page-title">News</h1>
      </div>
      <div class="news-grid">
        <article
          v-for="(item, i) in cms.publishedNews"
          :key="item.id"
          v-reveal="{ delay: `${i * 80}ms` }"
          class="news-item gy-card gy-interactive"
        >
          <router-link
            :to="`/news/${item.slug}`"
            class="gy-card-media news-item__media"
          >
            <img :src="item.coverImage" :alt="item.title" loading="lazy" />
          </router-link>
          <div class="news-item__body">
            <p class="news-item__date">{{ item.publishedAt }}</p>
            <h2 class="news-item__title">
              <router-link :to="`/news/${item.slug}`">{{
                item.title
              }}</router-link>
            </h2>
            <p class="news-item__excerpt">{{ item.excerpt }}</p>
          </div>
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

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 1.75rem;
  align-items: stretch;
}

.news-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.news-item__media {
  aspect-ratio: 16 / 10;
  margin-bottom: 0.75rem;
}

.news-item__body {
  padding: 0.1rem 0.2rem 0.15rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.news-item__date {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-accent, #9a7b3c);
}

.news-item__title {
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 1.8vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-wrap: balance;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.news-item__title a {
  display: inline;
}

.news-item__excerpt {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.95rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
</style>
