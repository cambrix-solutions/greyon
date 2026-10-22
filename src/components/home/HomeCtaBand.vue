<template>
  <section
    v-if="image"
    id="home-cta"
    class="cta"
    aria-labelledby="home-cta-title"
  >
    <div ref="frame" class="cta__frame">
      <img class="cta__img" :src="image" alt="" :style="imageStyle" />
    </div>
    <div class="cta__veil" />
    <div v-reveal class="cta__copy">
      <p class="eyebrow">Greyon</p>
      <h2 id="home-cta-title">{{ $t("home.stayWith") }}</h2>
      <p class="cta__lead">{{ $t("home.subhead") }}</p>
      <div class="cta__actions">
        <router-link to="/hotels" class="gy-btn gy-btn--light">
          {{ $t("home.viewHotels") }}
        </router-link>
        <router-link
          v-if="auth.featureEnabled('contact_public')"
          to="/contact"
          class="gy-btn gy-btn--ghost"
        >
          {{ $t("home.enquire") }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useParallax } from "@/components/home/useParallax";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const auth = useAuthStore();
const frame = ref<HTMLElement | null>(null);
const offset = useParallax(frame);

const imageStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0) scale(1.12)`
}));

const image = computed(() => {
  const featured = cms.publishedHotels.find(hotel => hotel.featured);
  const locs = cms.publishedLocations.filter(loc => loc.heroImage?.trim());
  const other = [...locs]
    .reverse()
    .find(loc => loc.id !== featured?.locationId);
  return (
    other?.heroImage ||
    locs[0]?.heroImage ||
    featured?.gallery.find(src => src.trim()) ||
    featured?.heroImage ||
    ""
  );
});
</script>

<style scoped>
.cta {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: min(78vh, 760px);
  overflow: hidden;
  color: #fff;
  background: #2c312e;
}

.cta__frame {
  position: absolute;
  inset: -14% 0;
}

.cta__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.cta__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    rgba(12, 11, 10, 0.72) 0%,
    rgba(12, 11, 10, 0.28) 60%,
    rgba(12, 11, 10, 0.45) 100%
  );
}

.cta__copy {
  position: relative;
  z-index: 1;
  width: min(820px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: clamp(4rem, 10vw, 7rem) 0 clamp(3.5rem, 8vw, 5.5rem);
}

.eyebrow {
  margin: 0 0 0.85rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.cta h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(3.2rem, 8vw, 6.4rem);
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.03em;
  line-height: 0.9;
}

.cta__lead {
  max-width: 34rem;
  margin: 1.15rem 0 0;
  font-family: var(--sans);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.86);
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.cta__actions .gy-btn {
  min-height: 44px;
}

@media (prefers-reduced-motion: reduce) {
  .cta__img {
    transform: none !important;
  }
}
</style>
