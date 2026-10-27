<template>
  <section
    v-if="image"
    id="home-cta"
    class="cta home-motion"
    aria-labelledby="home-cta-title"
  >
    <div class="cta__frame">
      <img class="cta__img" :src="image" alt="" />
    </div>
    <div class="cta__veil" />
    <div class="cta__copy">
      <p v-reveal class="eyebrow">Greyon</p>
      <h2 id="home-cta-title" class="cta__title">{{ $t("home.stayWith") }}</h2>
      <p v-reveal class="cta__lead">{{ $t("home.subhead") }}</p>
      <div v-reveal class="glass-frame cta__glass">
        <div class="glass-frame__in cta__actions">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const auth = useAuthStore();

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
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: min(88vh, 820px);
  margin-top: -1px;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 90px 90px 0 0;
  color: #fff;
  background: #121413;
}

.cta__frame {
  position: absolute;
  inset: 0;
}

.cta__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cta__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      115deg,
      rgba(8, 9, 8, 0.78) 0%,
      rgba(8, 9, 8, 0.35) 55%,
      rgba(8, 9, 8, 0.62) 100%
    ),
    radial-gradient(
      500px 220px at 80% 20%,
      rgba(154, 175, 156, 0.28),
      transparent 70%
    );
}

.cta__copy {
  position: relative;
  z-index: 1;
  width: min(980px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: clamp(6rem, 12vw, 8rem) 0 clamp(3.5rem, 8vw, 5.5rem);
}

.eyebrow {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.cta__title {
  margin: 0;
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
  color: var(--gy-white);
}

.cta__lead {
  max-width: 34rem;
  margin: 1.2rem 0 0;
  font-family: var(--font-body);
  font-size: 1.02rem;
  font-weight: 400;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.88);
}

.cta__glass {
  width: fit-content;
  max-width: 100%;
  margin-top: 1.8rem;
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.7rem;
}

.cta__actions .gy-btn {
  min-height: 44px;
}

@media (max-width: 700px) {
  .cta {
    border-radius: 40px 40px 0 0;
  }

  .cta__title {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cta__img {
    transform: none !important;
  }
}
</style>
