<template>
  <section
    v-if="articles.length"
    id="home-news"
    class="news"
    aria-labelledby="home-news-title"
  >
    <header v-reveal class="news__head">
      <div>
        <p class="eyebrow">{{ $t("home.latestNews") }}</p>
        <h2 id="home-news-title" class="news__title">
          {{ $t("home.fromGreyon") }}
        </h2>
      </div>
      <router-link to="/news" class="text-link">
        {{ $t("home.allNews") }}
        <span aria-hidden="true">→</span>
      </router-link>
    </header>

    <router-link v-if="lead" :to="`/news/${lead.slug}`" class="news__lead">
      <img v-if="lead.coverImage" :src="lead.coverImage" :alt="lead.title" />
      <span class="news__shade">
        <span class="news__meta">
          <time v-if="lead.publishedAt" :datetime="lead.publishedAt">{{
            dateLabel(lead.publishedAt)
          }}</time>
          <span v-if="lead.locationName">{{ lead.locationName }}</span>
        </span>
        <span class="news__lead-title">{{ lead.title }}</span>
      </span>
    </router-link>
    <p v-if="lead?.excerpt" class="news__excerpt">{{ lead.excerpt }}</p>

    <div v-if="rest.length" ref="restTrack" class="news__rest">
      <router-link
        v-for="item in rest"
        :key="item.id"
        :to="`/news/${item.slug}`"
        class="news__card"
      >
        <span class="news__card-media">
          <img
            v-if="item.coverImage"
            :src="item.coverImage"
            :alt="item.title"
            loading="lazy"
          />
        </span>
        <span class="news__card-title">{{ item.title }}</span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useCmsStore } from "@/stores/cms-store";
import { formatDate } from "@/utils/datetime";

const cms = useCmsStore();
const { locale } = useI18n();
const restTrack = ref<HTMLElement | null>(null);
useDragScroll(restTrack);

const articles = computed(() => cms.publishedNews.slice(0, 3));
const lead = computed(() => articles.value[0] ?? null);
const rest = computed(() => articles.value.slice(1));

function dateLabel(value: string) {
  const loc = locale.value.startsWith("km") ? "km-KH" : "en-GB";
  return formatDate(value, loc);
}
</script>

<style scoped>
.news {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  padding: clamp(4.5rem, 9vw, 7rem) 0 clamp(3rem, 6vw, 4.5rem);
  background: var(--gy-cream);
  color: var(--gy-ink);
}

.news__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  width: min(1400px, calc(100% - 2.5rem));
  margin: 0 auto 1.25rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.news__title {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(2.8rem, 6vw, 4.8rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.92;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gy-forest);
}

.text-link span {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.text-link:hover span {
  transform: translateX(6px);
}

.news__lead {
  position: relative;
  display: block;
  height: min(72vh, 760px);
  min-height: 420px;
  overflow: hidden;
  background: #2c312e;
  color: #fff;
}

.news__lead img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.news__shade {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.7rem;
  padding: clamp(1.4rem, 4vw, 3.5rem);
  background: linear-gradient(
    to top,
    rgba(12, 11, 10, 0.75) 0%,
    rgba(12, 11, 10, 0.05) 52%
  );
}

.news__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  font-family: var(--sans);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.news__lead-title {
  max-width: 16ch;
  font-family: var(--serif);
  font-size: clamp(2.6rem, 6vw, 5rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.news__excerpt {
  width: min(720px, calc(100% - 2.5rem));
  margin: clamp(1.5rem, 3vw, 2.25rem) auto 0;
  font-family: var(--serif);
  font-size: clamp(1.35rem, 2vw, 1.75rem);
  font-style: italic;
  font-weight: 500;
  line-height: 1.4;
}

.news__rest {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  margin-top: 1.75rem;
  padding: 0 clamp(1rem, 4vw, 3rem);
  scroll-snap-type: x proximity;
  cursor: grab;
  scrollbar-width: none;
}

.news__rest::-webkit-scrollbar {
  display: none;
}

.news__card {
  flex: 0 0 min(70vw, 28rem);
  scroll-snap-align: start;
  color: inherit;
}

.news__card-media {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #2c312e;
}

.news__card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.news__card-title {
  display: block;
  margin-top: 0.75rem;
  font-family: var(--serif);
  font-size: 1.7rem;
  font-weight: 500;
  line-height: 1.1;
}

.news__lead:focus-visible,
.news__card:focus-visible,
.text-link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

@media (hover: hover) {
  .news__lead:hover img,
  .news__card:hover img {
    transform: scale(1.06);
  }
}

@media (max-width: 700px) {
  .news__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .news__lead {
    height: 78vh;
    min-height: 460px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .news__lead img,
  .news__card-media img,
  .text-link span {
    transition: none;
  }
}
</style>
