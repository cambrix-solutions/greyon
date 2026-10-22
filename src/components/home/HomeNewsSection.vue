<template>
  <section
    v-if="articles.length"
    class="gy-section news-section"
    aria-labelledby="home-news-title"
  >
    <div class="gy-container">
      <header v-reveal class="section-head">
        <div>
          <p class="gy-eyebrow section-kicker">{{ $t("home.latestNews") }}</p>
          <h2 id="home-news-title" class="gy-display section-title">
            {{ $t("home.fromGreyon") }}
          </h2>
        </div>
        <router-link to="/news" class="gy-link-arrow">
          {{ $t("home.allNews") }}
          <span aria-hidden="true">→</span>
        </router-link>
      </header>

      <div
        class="news-board"
        :class="{
          'news-board--single': articles.length === 1,
          'news-board--multi': articles.length > 1
        }"
      >
        <div
          v-for="(item, i) in articles"
          :key="item.id"
          v-reveal="{ delay: `${i * 80}ms` }"
          class="news-slot"
          :class="{ 'is-lead': i === 0 && articles.length > 2 }"
        >
          <router-link :to="`/news/${item.slug}`" class="news-card">
            <span class="news-card__media gy-card-media">
              <img
                v-if="item.coverImage"
                :src="item.coverImage"
                :alt="item.title"
                loading="lazy"
              />
            </span>
            <span class="news-card__body">
              <span class="news-card__meta">
                <time v-if="item.publishedAt" :datetime="item.publishedAt">{{
                  dateLabel(item.publishedAt)
                }}</time>
                <span v-if="item.locationName" class="news-card__place">{{
                  item.locationName
                }}</span>
              </span>
              <span class="gy-display news-card__title">{{ item.title }}</span>
              <span v-if="item.excerpt" class="news-card__excerpt">{{
                item.excerpt
              }}</span>
              <span class="news-card__more" aria-hidden="true">
                <q-icon name="arrow_forward" size="18px" />
              </span>
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useCmsStore } from "@/stores/cms-store";
import { formatDate } from "@/utils/datetime";

const cms = useCmsStore();
const { locale } = useI18n();

const articles = computed(() => cms.publishedNews.slice(0, 3));

function dateLabel(value: string) {
  const loc = locale.value.startsWith("km") ? "km-KH" : "en-GB";
  return formatDate(value, loc);
}
</script>

<style scoped>
.news-section {
  background: var(--gy-white);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}

.section-kicker::after {
  content: "";
  width: 2.25rem;
  height: 1px;
  background: var(--gy-gold);
}

.section-title {
  margin: 0;
  font-size: clamp(2.15rem, 4.6vw, 3.35rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.news-board {
  display: grid;
  gap: 1.15rem;
}

.news-card {
  display: grid;
  min-width: 0;
  background: var(--gy-cream);
  border: 1px solid rgba(69, 76, 75, 0.08);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(69, 76, 75, 0.05);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s ease;
}

.news-card:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.news-card__media {
  display: block;
  aspect-ratio: 16 / 10;
  min-height: 180px;
  background: var(--gy-sand);
}

.news-card__media img {
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.news-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  padding: 1.15rem 1.2rem 1.25rem;
}

.news-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.news-card__meta time,
.news-card__place {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.15rem 0.65rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.news-card__meta time {
  background: rgba(98, 112, 99, 0.14);
  color: var(--gy-forest);
}

.news-card__place {
  background: rgba(196, 163, 90, 0.2);
  color: var(--gy-gold-deep);
}

.news-card__title {
  font-size: clamp(1.35rem, 2vw, 1.85rem);
  line-height: 1.15;
}

.news-card__excerpt {
  color: var(--gy-muted);
  font-size: 0.98rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__more {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-forest);
  transition:
    transform 0.3s ease,
    background 0.3s ease,
    color 0.3s ease;
}

.news-board--single .news-card {
  background: var(--gy-cream);
}

.news-slot {
  min-width: 0;
  height: 100%;
}

.news-slot .news-card {
  height: 100%;
}

.news-board--multi {
  grid-template-columns: 1fr;
}

@media (hover: hover) {
  .news-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 22px 46px rgba(69, 76, 75, 0.12);
  }

  .news-card:hover .news-card__media img {
    transform: scale(1.06);
  }

  .news-card:hover .news-card__more {
    transform: translateX(3px);
    background: var(--gy-forest);
    color: var(--gy-white);
  }
}

@media (min-width: 800px) {
  .news-board--single .news-card,
  .news-slot.is-lead .news-card {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    align-items: stretch;
  }

  .news-board--single .news-card__media,
  .news-slot.is-lead .news-card__media {
    aspect-ratio: auto;
    min-height: 100%;
    height: 100%;
  }

  .news-board--single .news-card__body,
  .news-slot.is-lead .news-card__body {
    justify-content: center;
    padding: 1.5rem 1.6rem;
  }

  .news-board--multi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .news-slot.is-lead {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .news-card,
  .news-card__media img,
  .news-card__more {
    transition: none;
  }
}
</style>
