<template>
  <q-page v-if="article" class="gy-section">
    <SeoHead
      :title="`${article.title} | Greyon`"
      :description="article.excerpt"
      :image="article.coverImage"
      :json-ld="jsonLd"
    />
    <article class="gy-container article">
      <p v-reveal class="gy-eyebrow">{{ article.publishedAt }}</p>
      <h1 v-reveal="{ delay: '70ms' }" class="gy-display">{{
        article.title
      }}</h1>
      <div v-reveal="{ delay: '120ms' }" class="gy-card-media article__cover">
        <img :src="article.coverImage" :alt="article.title" />
      </div>
      <div
        v-reveal="{ delay: '160ms' }"
        class="article__body"
        v-html="article.body"
      />
      <div v-reveal class="share">
        <a
          :href="`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`"
          target="_blank"
          rel="noopener"
          class="gy-btn gy-btn--light"
          >Share</a
        >
        <router-link to="/news" class="gy-btn">All news</router-link>
      </div>
    </article>
  </q-page>
  <q-page v-else class="gy-section gy-container">
    <h1 class="gy-display">Article not found</h1>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";

const route = useRoute();
const cms = useCmsStore();
const article = computed(() => cms.getNewsBySlug(String(route.params.slug)));
const shareUrl = computed(() =>
  encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")
);
const jsonLd = computed(() =>
  article.value
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.value.title,
        datePublished: article.value.publishedAt,
        image: article.value.coverImage,
        description: article.value.excerpt
      }
    : null
);
</script>

<style scoped>
.article h1 {
  margin: 0 0 1.25rem;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  max-width: 18ch;
}

.article__cover {
  aspect-ratio: 21 / 9;
  margin-bottom: 1.5rem;
}

.article__body {
  max-width: 42rem;
  line-height: 1.8;
  font-size: 1.05rem;
}

.share {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>
