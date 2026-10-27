<template>
  <section
    v-if="articles.length"
    id="home-news"
    class="news home-motion"
    aria-labelledby="home-news-title"
  >
    <header class="news__head">
      <div>
        <p v-reveal class="eyebrow">{{ $t("home.latestNews") }}</p>
        <RevealWords
          id="home-news-title"
          class="news__title"
          :text="$t('home.fromGreyon')"
        />
      </div>
      <router-link v-reveal to="/news" class="text-link">
        {{ $t("home.allNews") }}
        <span aria-hidden="true">→</span>
      </router-link>
    </header>

    <div v-if="lead" class="stage">
      <router-link :to="`/news/${lead.slug}`" class="stage__photo">
        <img v-if="lead.coverImage" :src="lead.coverImage" :alt="lead.title" />
      </router-link>
      <div class="stage__copy">
        <p class="stage__meta">
          <time v-if="lead.publishedAt" :datetime="lead.publishedAt">{{
            dateLabel(lead.publishedAt)
          }}</time>
          <span v-if="lead.locationName">{{ lead.locationName }}</span>
        </p>
        <router-link :to="`/news/${lead.slug}`" class="stage__headline">
          {{ lead.title }}
        </router-link>
      </div>
      <div v-if="lead.excerpt" class="glass-frame stage__card">
        <div class="glass-frame__in stage__card-in">
          <p>{{ lead.excerpt }}</p>
        </div>
      </div>
    </div>

    <div v-if="rest.length" class="news__rest">
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import RevealWords from "@/components/home/RevealWords.vue";
import { useCmsStore } from "@/stores/cms-store";
import { formatDate } from "@/utils/datetime";

const cms = useCmsStore();
const { locale } = useI18n();
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
  position: relative;
  padding: clamp(4.5rem, 8vw, 6.5rem) 0 clamp(4rem, 8vw, 6rem);
  background:
    radial-gradient(
      640px 280px at 0% 20%,
      rgba(196, 163, 90, 0.16),
      transparent 60%
    ),
    #f7f3ec;
  color: var(--gy-forest);
  overflow-x: clip;
}

.news__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  width: min(1200px, calc(100% - 2.5rem));
  margin: 0 auto 1.5rem;
}

.eyebrow,
.stage__meta {
  margin: 0 0 0.45rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.news__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.stage {
  position: relative;
  width: min(1200px, calc(100% - 2rem));
  margin: 1.5rem auto 0;
  min-height: 640px;
}

.stage__photo {
  display: block;
  width: min(62%, 740px);
  margin-left: auto;
  margin-right: -2vw;
  aspect-ratio: 4 / 5;
  max-height: 760px;
  overflow: hidden;
  border-radius: 36px 36px 140px 36px;
  background: #2a2e2c;
}

.stage__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stage__copy {
  position: absolute;
  z-index: 2;
  top: 8%;
  left: 0;
  width: min(62%, 680px);
}

.stage__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
}

.stage__headline {
  display: block;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
  color: var(--gy-forest);
}

.stage__card {
  position: absolute;
  z-index: 3;
  left: 30%;
  bottom: 9%;
  width: min(440px, 46%);
  transform: rotate(-3deg);
}

.stage__card-in {
  padding: 1.25rem 1.35rem;
  color: #f6f1e7;
}

.stage__card-in p {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--gy-text-xl);
  font-weight: 400;
  letter-spacing: normal;
  line-height: 1.35;
}

.news__rest {
  display: flex;
  gap: 0.85rem;
  margin-top: 2.5rem;
  padding: 0 clamp(1rem, 4vw, 3rem);
  overflow-x: auto;
}

.news__card {
  flex: 0 0 min(70vw, 24rem);
  color: inherit;
}

.news__card-media {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 18px;
  background: #2a2e2c;
}

.news__card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news__card-title {
  display: block;
  margin-top: 0.75rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1.3;
  color: var(--gy-forest);
}

.stage__photo:focus-visible,
.stage__headline:focus-visible,
.news__card:focus-visible,
.text-link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

@media (max-width: 860px) {
  .news__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .stage__photo {
    width: 100%;
    margin: 0;
    aspect-ratio: 4 / 5;
    max-height: none;
    order: 2;
  }

  .stage__copy {
    position: static;
    width: auto;
    order: 1;
  }

  .stage__headline {
    font-size: var(--gy-text-4xl);
  }

  .stage__card {
    position: static;
    width: 100%;
    order: 3;
    transform: none;
    margin-top: -4.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage__photo,
  .stage__card {
    transition: none;
    transform: none;
  }
}
</style>
