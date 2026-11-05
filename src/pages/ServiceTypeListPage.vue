<template>
  <q-page class="listing-luxe home-motion">
    <SeoHead :title="`${label} | Greyon`" :description="seoDescription" />

    <section class="mast" data-sheet="Masthead">
      <div ref="mastFrame" class="mast__media">
        <img
          v-if="mastImage"
          class="mast__img"
          :src="mastImage"
          alt=""
          :style="mastStyle"
        />
        <div class="mast__veil" />
      </div>

      <div class="listing-wrap mast__content">
        <p v-reveal class="eyebrow eyebrow--light">Our Services</p>
        <RevealWords tag="h1" :text="label" />
        <p v-reveal="{ delay: '140ms' }" class="mast__lead">{{ lead }}</p>
        <div v-reveal="{ delay: '200ms' }" class="mast__actions">
          <button
            v-magnetic
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollToResults"
          >
            Explore stays
          </button>
        </div>
      </div>
      <SectionDivider />
    </section>

    <section id="listing-results" class="results-band">
      <div class="listing-wrap">
        <header class="results-head">
          <p v-reveal class="eyebrow">Portfolio</p>
          <h2 v-reveal="{ delay: '60ms' }">{{ label }} properties</h2>
          <p v-reveal="{ delay: '100ms' }" class="section-lead">
            {{ resultLabel }}
          </p>
        </header>

        <p v-if="showLoading" class="empty">Loading properties…</p>
        <p v-else-if="showError" class="empty" role="alert">{{
          cms.catalogError
        }}</p>
        <TransitionGroup
          v-else-if="filtered.length"
          name="result"
          tag="div"
          class="results"
        >
          <div v-for="hotel in filtered" :key="hotel.id" class="result-slot">
            <div v-tilt="{ max: 5 }" class="result-tilt">
              <HotelCard live :hotel="hotel" />
            </div>
          </div>
        </TransitionGroup>
        <p v-else class="empty">
          No {{ label.toLowerCase() }} properties are published yet.
          <template v-if="missingTypeNote"> {{ missingTypeNote }}</template>
        </p>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import RevealWords from "@/components/home/RevealWords.vue";
import { useParallax } from "@/components/home/useParallax";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import HotelCard from "@/components/HotelCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";
import {
  filterByServiceType,
  isServiceTypeSlug,
  serviceTypeLabel,
  type ServiceTypeSlug
} from "@/utils/propertyKind";

const cms = useCmsStore();
const route = useRoute();

const mastFrame = ref<HTMLElement | null>(null);
const mastOffset = useParallax(mastFrame, 140);
const mastStyle = computed(() => ({
  transform: `translate3d(0, ${mastOffset.value}px, 0)`
}));

const slug = computed<ServiceTypeSlug>(() => {
  const raw = String(route.params.kind || route.meta.serviceKind || "");
  return isServiceTypeSlug(raw) ? raw : "apartel";
});

const label = computed(() => serviceTypeLabel(slug.value));

const lead = computed(() => {
  switch (slug.value) {
    case "serviced-apartment":
      return "Serviced apartments and residences from the Greyon portfolio.";
    case "apartel":
      return "Apartel stays across Greyon destinations in Cambodia.";
    case "boutique":
      return "Boutique properties from the Greyon portfolio.";
    case "resort":
      return "Resort stays from the Greyon portfolio.";
    default:
      return "Greyon properties for this service type.";
  }
});

const seoDescription = computed(
  () => `Browse Greyon ${label.value.toLowerCase()} properties across Cambodia.`
);

const filtered = computed(() =>
  filterByServiceType(cms.publishedHotels, slug.value)
);

const resultLabel = computed(() => {
  const count = filtered.value.length;
  const noun = count === 1 ? "property" : "properties";
  return `${count} ${noun}`;
});

/**
 * When Boutique / Resort / Serviced Apartment lists are empty, explain that
 * matching depends on CMS `propertyType` — we do not invent classifications.
 */
const missingTypeNote = computed(() => {
  if (filtered.value.length) return "";
  if (slug.value === "apartel") return "";
  return "Matching uses each property’s type field from the catalog.";
});

const mastImage = computed(() => {
  const withHero = filtered.value.find(hotel => hotel.heroImage?.trim());
  if (withHero?.heroImage?.trim()) return withHero.heroImage.trim();
  const any = cms.publishedHotels.find(hotel => hotel.heroImage?.trim());
  if (any?.heroImage?.trim()) return any.heroImage.trim();
  return (
    cms.publishedLocations
      .find(loc => loc.heroImage?.trim())
      ?.heroImage.trim() ?? ""
  );
});

const showLoading = computed(
  () => cms.catalogSyncing && !cms.publishedHotels.length
);
const showError = computed(
  () =>
    Boolean(cms.catalogError) &&
    !cms.catalogSyncing &&
    !cms.publishedHotels.length
);

function scrollToResults() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#listing-results")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth"
  });
}

onMounted(() => {
  void cms.ensurePublicCatalog(false);
});
</script>

<style src="@/components/home/home-motion.css"></style>

<style scoped>
.listing-luxe {
  overflow-x: clip;
  max-width: 100%;
  background:
    radial-gradient(
      ellipse at 100% 0%,
      rgba(196, 163, 90, 0.1),
      transparent 28%
    ),
    var(--gy-cream);
  color: var(--gy-forest);
}

.listing-luxe h1,
.listing-luxe h2,
.listing-luxe :deep(h1) {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: normal;
}

/* Override Quasar’s 6rem h1 so “Serviced Apartment” fits on phones. */
.listing-luxe :deep(h1) {
  max-width: 100%;
  min-width: 0;
  margin: 0;
  font-size: clamp(1.65rem, 1.05rem + 2.6vw, 3.1rem);
  line-height: 1.12;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.listing-luxe :deep(.reveal-words__w) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.listing-wrap {
  width: min(1120px, calc(100% - 2.5rem));
  margin-inline: auto;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.mast {
  position: relative;
  min-height: min(52vh, 28rem);
  display: grid;
  align-items: end;
  color: var(--gy-white);
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
}

.mast__media {
  position: absolute;
  inset: 0;
}

.mast__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.mast__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(18, 17, 16, 0.25) 0%,
      rgba(18, 17, 16, 0.72) 100%
    ),
    linear-gradient(90deg, rgba(98, 112, 99, 0.35), transparent 55%);
}

.mast__content {
  position: relative;
  z-index: 1;
  padding: 5.5rem 0 3.25rem;
  min-width: 0;
  max-width: 100%;
}

.mast__lead {
  max-width: min(34rem, 100%);
  margin: 0.85rem 0 0;
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 0.9rem + 0.35vw, 1.05rem);
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.88);
  overflow-wrap: anywhere;
}

.mast__actions {
  margin-top: 1.35rem;
}

.results-band {
  padding: 3.5rem 0 4.5rem;
  background: var(--gy-white);
}

.results-head {
  margin-bottom: 1.75rem;
}

.results-head h2 {
  margin: 0.35rem 0 0;
  max-width: 100%;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.35rem, 1.05rem + 1.6vw, 2.2rem);
  color: var(--gy-forest);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.section-lead {
  margin: 0.55rem 0 0;
  font-family: var(--font-body);
  color: var(--gy-muted);
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(16.5rem, 100%), 1fr));
  gap: 1.35rem;
  min-width: 0;
  max-width: 100%;
}

.result-slot {
  min-width: 0;
}

.result-tilt {
  height: 100%;
}

.empty {
  margin: 1.5rem 0 0;
  padding: 1.25rem 1.35rem;
  border-radius: 14px;
  background: var(--gy-sand);
  font-family: var(--font-body);
  color: var(--gy-forest);
}

.result-enter-active,
.result-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(0.4rem);
}

@media (max-width: 600px) {
  .mast__content {
    padding: 4.5rem 0 2.5rem;
  }

  .results {
    grid-template-columns: 1fr;
  }
}
</style>
