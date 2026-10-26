<template>
  <q-page
    v-if="article"
    class="dest-luxe home-motion rooms-luxe news-luxe news-article"
  >
    <SeoHead
      :title="`${article.title} | Greyon`"
      :description="article.excerpt || article.title"
      :image="article.coverImage || undefined"
      :json-ld="jsonLd"
    />
    <div
      class="read-bar"
      data-sheet="Progress"
      role="progressbar"
      aria-label="Reading progress"
      :aria-valuenow="readPercent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span :style="barStyle" />
    </div>

    <article ref="articleEl">
      <section class="stage" data-sheet="Cover" aria-labelledby="article-title">
        <div ref="stageFrame" class="stage__media">
          <img
            v-if="article.coverImage"
            class="stage__img"
            :src="article.coverImage"
            alt=""
            :style="stageStyle"
            fetchpriority="high"
          />
          <div class="stage__veil" />
        </div>
        <div class="dest-wrap stage__content">
          <nav class="crumb" aria-label="Breadcrumb">
            <router-link to="/news">News</router-link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ article.title }}</span>
          </nav>
          <p v-if="publishedLabel" v-reveal class="eyebrow eyebrow--light">{{
            publishedLabel
          }}</p>
          <RevealWords id="article-title" tag="h1" :text="article.title" />
          <p v-if="article.excerpt" class="stage__lead">{{
            article.excerpt
          }}</p>
        </div>
        <SectionDivider fill="var(--gy-cream)" />
      </section>

      <section
        id="article-reading"
        class="dossier"
        data-sheet="Reading"
        aria-labelledby="article-title"
      >
        <div class="dest-wrap dossier__grid">
          <div>
            <div v-if="stacked" class="stack">
              <article
                v-for="(passage, index) in passages"
                :key="`${index}-${passage.slice(0, 24)}`"
                class="stack-card passage-card"
                :style="stackStyle(index)"
              >
                <header class="stack-card__bar">
                  <span>{{ pad(index + 1) }}</span>
                  <strong>{{ article.title }}</strong>
                </header>
                <p :class="passageClass(passage)">{{ passage }}</p>
              </article>
            </div>
            <div
              v-else-if="htmlBody"
              class="story article-html"
              v-html="htmlBody"
            />
            <article v-else-if="passages.length" class="story spin-edge">
              <p :class="passageClass(passages[0] ?? '')">{{ passages[0] }}</p>
            </article>
          </div>

          <aside class="price-card glass-edge" data-sheet="Meta">
            <p class="eyebrow">This story</p>
            <h2 v-if="place">
              <router-link v-if="placeHref" :to="placeHref">{{
                place
              }}</router-link>
              <template v-else>{{ place }}</template>
            </h2>
            <h2 v-else>{{ publishedLabel || article.title }}</h2>
            <dl v-if="publishedLabel && place">
              <div>
                <dt>Published</dt>
                <dd>{{ publishedLabel }}</dd>
              </div>
            </dl>
            <a
              v-magnetic
              class="gy-btn gy-btn--light price-card__cta"
              :href="shareHref"
              target="_blank"
              rel="noopener"
              >Share</a
            >
            <router-link
              class="gy-btn gy-btn--outline price-card__cta"
              to="/news"
              >All news</router-link
            >
          </aside>
        </div>
      </section>
    </article>

    <div class="book-bar" data-sheet="Meta">
      <div class="book-bar__price">
        <strong>{{ place || "News" }}</strong>
        <span>{{ publishedLabel }}</span>
      </div>
      <a
        class="gy-btn gy-btn--light"
        :href="shareHref"
        target="_blank"
        rel="noopener"
        >Share</a
      >
    </div>
  </q-page>

  <q-page
    v-else-if="pending"
    class="dest-luxe rooms-luxe news-luxe"
    aria-busy="true"
  >
    <section class="room-state">
      <div class="dest-wrap">
        <p class="eyebrow">News</p>
        <h1>News</h1>
        <p>Loading stories…</p>
      </div>
    </section>
  </q-page>

  <q-page v-else class="dest-luxe rooms-luxe news-luxe">
    <SeoHead title="Article not found | Greyon" />
    <section class="room-state">
      <div class="dest-wrap">
        <p class="eyebrow">News</p>
        <h1>Article not found</h1>
        <p>This story is not published.</p>
        <div class="room-state__actions">
          <router-link class="gy-btn" to="/news">All news</router-link>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import RevealWords from "@/components/home/RevealWords.vue";
import { useParallax } from "@/components/home/useParallax";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";

const route = useRoute();
const cms = useCmsStore();

const article = computed(() => cms.getNewsBySlug(String(route.params.slug)));
const pending = computed(() => cms.catalogSyncing && !cms.publishedNews.length);

const stageFrame = ref<HTMLElement | null>(null);
const stageOffset = useParallax(stageFrame, 160);
const stageStyle = computed(() => ({
  transform: `translate3d(0, ${stageOffset.value}px, 0)`
}));

const articleEl = ref<HTMLElement | null>(null);
const progress = ref(0);
let ticking = false;

const readPercent = computed(() => Math.round(progress.value * 100));
const barStyle = computed(() => ({
  transform: `scaleX(${progress.value})`
}));

function measure() {
  const node = articleEl.value;
  if (!node) {
    progress.value = 0;
    return;
  }
  const start = node.getBoundingClientRect().top + window.scrollY;
  const distance = node.offsetHeight - window.innerHeight;
  if (distance <= 0) {
    progress.value = 1;
    return;
  }
  const next = (window.scrollY - start) / distance;
  progress.value = Math.min(1, Math.max(0, next));
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    measure();
    ticking = false;
  });
}

onMounted(() => {
  void cms.ensurePublicCatalog();
  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
});

watch(
  () => route.fullPath,
  () => {
    requestAnimationFrame(measure);
  }
);

const place = computed(() => {
  const item = article.value;
  if (!item) return "";
  if (item.locationId) {
    const named = cms.getLocationById(item.locationId)?.name;
    if (named) return named;
  }
  return item.locationName?.trim() ?? "";
});

const placeHref = computed(() => {
  const item = article.value;
  if (!item) return "";
  if (item.locationId) {
    const loc = cms.getLocationById(item.locationId);
    if (loc?.slug) return `/locations/${loc.slug}`;
  }
  const name = item.locationName?.trim();
  if (!name) return "";
  const loc = cms.publishedLocations.find(entry => entry.name === name);
  return loc ? `/locations/${loc.slug}` : "";
});

const publishedLabel = computed(() => {
  const iso = article.value?.publishedAt.trim().slice(0, 10) ?? "";
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return article.value?.publishedAt ?? "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
});

const htmlBody = computed(() => {
  const body = article.value?.body.trim() ?? "";
  return /<\/?[a-z][\s\S]*>/i.test(body) ? body : "";
});

const passages = computed(() => {
  if (htmlBody.value) return [];
  const body = article.value?.body.trim() ?? "";
  if (!body) return [];
  const parts = body
    .split(/\n\s*\n/)
    .map(part => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return parts.length ? parts : [body];
});

const stacked = computed(() => passages.value.length > 1);

const shareHref = computed(() => {
  const url = typeof window !== "undefined" ? window.location.href : "";
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
});

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

function passageClass(text: string) {
  return text.length <= 280 ? "passage passage--display" : "passage";
}

function stackStyle(index: number) {
  const capped = Math.min(index, 4);
  return {
    top: `calc(var(--header-offset) + ${capped} * var(--stack-step))`,
    zIndex: index + 1
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>
<style src="./news-luxe.css"></style>
