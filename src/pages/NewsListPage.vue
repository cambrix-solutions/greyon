<template>
  <q-page class="dest-luxe home-motion rooms-luxe news-luxe">
    <SeoHead
      title="News | Greyon"
      :description="seoDescription"
      :image="seoImage"
    />

    <section
      v-if="showLoading"
      class="room-state"
      data-sheet="Featured"
      aria-busy="true"
    >
      <div class="dest-wrap">
        <p class="eyebrow">News</p>
        <h1>News</h1>
        <p>Loading stories…</p>
      </div>
    </section>

    <section
      v-else-if="showError"
      class="room-state"
      data-sheet="Featured"
      role="alert"
    >
      <div class="dest-wrap">
        <p class="eyebrow">News</p>
        <h1>News</h1>
        <p>{{ cms.catalogError }}</p>
      </div>
    </section>

    <section v-else-if="!featured" class="room-state" data-sheet="Featured">
      <div class="dest-wrap">
        <p class="eyebrow">News</p>
        <h1>News</h1>
        <p>No stories are published right now.</p>
      </div>
    </section>

    <template v-else>
      <section
        class="mast"
        data-sheet="Featured"
        aria-labelledby="news-feature-title"
      >
        <div class="mast__media">
          <img
            v-if="featured.coverImage"
            class="mast__img"
            :src="featured.coverImage"
            alt=""
            fetchpriority="high"
          />
          <div class="mast__veil" />
        </div>
        <div class="dest-wrap mast__content">
          <p v-if="featuredPlace" class="mast__chip">
            <router-link v-if="featuredPlacePath" :to="featuredPlacePath">{{
              featuredPlace
            }}</router-link>
            <template v-else>{{ featuredPlace }}</template>
          </p>
          <p v-reveal class="eyebrow eyebrow--light">{{
            featuredDate || "News"
          }}</p>
          <div class="mast__break">
            <router-link :to="featuredPath" class="mast__title-link">
              <RevealWords
                id="news-feature-title"
                tag="h1"
                :text="featured.title"
              />
            </router-link>
          </div>
        </div>
        <article class="feature-deck glass-edge">
          <p v-reveal class="eyebrow">The story</p>
          <p v-if="featured.excerpt" class="feature-deck__excerpt">{{
            featured.excerpt
          }}</p>
          <router-link class="gy-btn" :to="featuredPath">
            Read the story
          </router-link>
        </article>
        <SectionDivider fill="var(--gy-cream)" />
      </section>

      <SectionDivider fill="#1a211e" />
      <HotelAmenityBand
        id="news-marquee"
        :items="marqueeLines"
        :show-copy="false"
        title="Stories"
        sheet="Marquee"
      />

      <section
        id="news-latest"
        ref="pinRoot"
        class="rail"
        :class="canPin ? 'is-pin' : 'is-flow'"
        data-sheet="Latest"
        aria-labelledby="news-latest-title"
        @keydown="onRailKey"
      >
        <div class="rail__sticky">
          <header class="rail__head">
            <div>
              <p v-reveal class="eyebrow eyebrow--light">Latest</p>
              <h2 id="news-latest-title" v-reveal> Just published </h2>
              <p class="rail__count" aria-live="polite">
                {{ pad(activeIndex + 1) }} / {{ pad(posts.length) }}
              </p>
            </div>
            <div class="rail__nav" role="group" aria-label="Latest stories">
              <button
                v-for="(item, index) in posts"
                :key="item.id"
                type="button"
                :class="{ 'is-active': activeIndex === index }"
                :aria-current="activeIndex === index ? 'true' : undefined"
                @click="goToPanel(index)"
              >
                {{ pad(index + 1) }} {{ item.title }}
              </button>
            </div>
          </header>
          <div class="rail__progress" aria-hidden="true">
            <span ref="barEl" />
          </div>
          <div
            ref="railEl"
            class="rail__viewport"
            :tabindex="canPin ? -1 : 0"
            :aria-label="canPin ? undefined : 'Latest stories'"
          >
            <div ref="trackEl" class="rail__track">
              <div
                v-for="(item, index) in posts"
                :key="item.id"
                class="room-panel rooms-tilt glass-edge"
                :class="{ 'is-active': activeIndex === index }"
              >
                <router-link
                  class="room-panel__hit"
                  :to="`/news/${item.slug}`"
                  :aria-label="`Read ${item.title}`"
                >
                  <div class="room-panel__media">
                    <img
                      v-if="item.coverImage"
                      :src="item.coverImage"
                      alt=""
                      :loading="index < 2 ? 'eager' : 'lazy'"
                    />
                  </div>
                  <div class="room-panel__copy">
                    <span class="room-panel__index">{{ pad(index + 1) }}</span>
                    <p v-if="placeOf(item)" class="room-panel__where">
                      {{ placeOf(item) }}
                    </p>
                    <h3>{{ item.title }}</h3>
                    <p v-if="item.excerpt" class="room-panel__excerpt">
                      {{ item.excerpt }}
                    </p>
                    <p
                      v-if="formatDate(item.publishedAt)"
                      class="room-panel__where"
                    >
                      {{ formatDate(item.publishedAt) }}
                    </p>
                    <span class="text-link"><span>Read story</span></span>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <div
          class="rail__spacer"
          :style="spacer ? { height: `${spacer}px` } : undefined"
          aria-hidden="true"
        />
        <SectionDivider kind="angle" fill="var(--gy-cream)" />
      </section>

      <section
        id="news-index"
        class="archive"
        data-sheet="Index"
        aria-labelledby="news-index-title"
      >
        <div class="dest-wrap">
          <p v-reveal class="eyebrow">Index</p>
          <h2 id="news-index-title" v-reveal> In this issue </h2>
        </div>
        <div class="dest-wrap archive__grid">
          <router-link
            v-for="(item, index) in posts"
            :key="item.id"
            class="archive-card rooms-tilt spin-edge"
            :to="`/news/${item.slug}`"
          >
            <span v-if="item.coverImage" class="photo-reveal">
              <img :src="item.coverImage" alt="" loading="lazy" />
            </span>
            <span class="archive-card__body">
              <span
                v-if="formatDate(item.publishedAt)"
                class="archive-card__date"
              >
                {{ pad(index + 1) }} · {{ formatDate(item.publishedAt) }}
              </span>
              <h3>{{ item.title }}</h3>
              <span v-if="item.excerpt" class="archive-card__excerpt">{{
                item.excerpt
              }}</span>
              <span class="text-link"><span>Read story</span></span>
            </span>
          </router-link>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import HotelAmenityBand from "@/components/hotel/HotelAmenityBand.vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { usePinnedRail } from "@/components/home/usePinnedRail";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";
import type { NewsArticle } from "@/types/greyon";

const cms = useCmsStore();

onMounted(() => {
  void cms.ensurePublicCatalog();
});

const posts = computed(() => cms.publishedNews);
const featured = computed(() => posts.value[0]);

const {
  canPin,
  spacer,
  activeIndex,
  pinRoot,
  railEl,
  trackEl,
  barEl,
  goToPanel
} = usePinnedRail(computed(() => posts.value.length));

const showLoading = computed(
  () => cms.catalogSyncing && !cms.publishedNews.length
);
const showError = computed(
  () =>
    Boolean(cms.catalogError) &&
    !cms.catalogSyncing &&
    !cms.publishedNews.length
);

const featuredPlace = computed(() =>
  featured.value ? placeOf(featured.value) : ""
);
const featuredPlacePath = computed(() =>
  featured.value ? placePath(featured.value) : ""
);
const featuredDate = computed(() =>
  featured.value ? formatDate(featured.value.publishedAt) : ""
);
const featuredPath = computed(() =>
  featured.value ? `/news/${featured.value.slug}` : "/news"
);

const marqueeLines = computed(() => {
  const lines: string[] = [];
  for (const item of posts.value) {
    const title = item.title.trim();
    if (title) lines.push(title);
    const place = placeOf(item);
    if (place) lines.push(place);
    const date = formatDate(item.publishedAt);
    if (date) lines.push(date);
  }
  return lines;
});

const seoDescription = computed(() => {
  const lead = featured.value?.excerpt.trim() || featured.value?.title.trim();
  return lead || "Latest Greyon hospitality news.";
});
const seoImage = computed(() => featured.value?.coverImage || undefined);

function placeOf(item: NewsArticle) {
  if (item.locationId) {
    const named = cms.getLocationById(item.locationId)?.name;
    if (named) return named;
  }
  return item.locationName?.trim() ?? "";
}

function placePath(item: NewsArticle) {
  if (item.locationId) {
    const loc = cms.getLocationById(item.locationId);
    if (loc?.slug) return `/locations/${loc.slug}`;
  }
  const name = item.locationName?.trim();
  if (!name) return "";
  const loc = cms.publishedLocations.find(entry => entry.name === name);
  return loc ? `/locations/${loc.slug}` : "";
}

function formatDate(value: string) {
  const iso = value.trim().slice(0, 10);
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value.trim();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function onRailKey(event: KeyboardEvent) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return;
  }
  event.preventDefault();
  goToPanel(activeIndex.value + (event.key === "ArrowRight" ? 1 : -1));
}
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>
<style src="./news-luxe.css"></style>
