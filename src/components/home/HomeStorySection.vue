<template>
  <section
    id="home-story"
    class="story home-motion"
    aria-labelledby="home-story-title"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div class="story__grid">
      <div>
        <p v-reveal class="eyebrow">{{ $t("home.storyEyebrow") }}</p>
        <RevealWords
          id="home-story-title"
          class="story__title"
          :text="$t('home.storyTitle')"
        />
      </div>
      <div v-reveal="{ delay: '160ms' }" class="story__aside">
        <p class="story__body">{{ $t("home.storyBody") }}</p>
        <p class="story__note">{{ $t("home.laterPhase") }}</p>
        <router-link
          v-if="auth.featureEnabled('contact_public')"
          to="/contact"
          class="text-link"
        >
          {{ $t("home.enquire") }}
          <span aria-hidden="true">→</span>
        </router-link>
      </div>
    </div>
    <div
      v-if="image"
      class="lens"
      :class="{ 'is-on': lensOn }"
      :style="lensStyle"
      aria-hidden="true"
    >
      <img :src="image" alt="" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const auth = useAuthStore();
const cms = useCmsStore();
const lensOn = ref(false);
const lensX = ref(0);
const lensY = ref(0);
const allowLens = ref(false);

const image = computed(() => {
  const loc = cms.publishedLocations.find(item => item.heroImage?.trim());
  return (
    loc?.heroImage ||
    cms.publishedHotels.find(hotel => hotel.heroImage?.trim())?.heroImage ||
    ""
  );
});

const lensStyle = computed(() => ({
  left: `${lensX.value}px`,
  top: `${lensY.value}px`
}));

onMounted(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  allowLens.value = hover && !reduce;
});

function onMove(event: PointerEvent) {
  if (!allowLens.value || event.pointerType !== "mouse") return;
  const root = event.currentTarget;
  if (!(root instanceof HTMLElement)) return;
  const rect = root.getBoundingClientRect();
  lensX.value = event.clientX - rect.left;
  lensY.value = event.clientY - rect.top;
  lensOn.value = true;
}

function onLeave() {
  lensOn.value = false;
}
</script>

<style scoped>
.story {
  position: relative;
  overflow: hidden;
  min-height: 88vh;
  padding: clamp(5.5rem, 12vw, 9rem) clamp(1.25rem, 6vw, 6rem)
    clamp(7rem, 12vw, 9rem);
  background:
    radial-gradient(
      900px 420px at 12% -10%,
      rgba(196, 163, 90, 0.28),
      transparent 60%
    ),
    radial-gradient(
      700px 380px at 100% 0%,
      rgba(98, 112, 99, 0.22),
      transparent 55%
    ),
    #f7f3ec;
  color: #1c1f1e;
}

.story::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  z-index: 2;
  height: 84px;
  background: #121413;
  clip-path: ellipse(72% 100% at 50% 100%);
  pointer-events: none;
}

.story__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.7fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: end;
  width: min(1280px, 100%);
  margin-inline: auto;
}

.eyebrow {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.story__title {
  margin: 0;
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: clamp(2.86rem, 6.12vw, 5.71rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
  background: linear-gradient(
    115deg,
    #1c1f1e 10%,
    var(--gy-gold-deep) 55%,
    var(--gy-forest) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.story__aside {
  position: relative;
  z-index: 1;
  margin-bottom: 1rem;
  padding: 1.4rem 1.4rem 1.2rem;
  border: 1px solid rgba(28, 31, 30, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 18px 50px rgba(28, 31, 30, 0.06);
  backdrop-filter: blur(10px);
}

.story__body,
.story__note {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.7;
}

.story__note {
  margin-top: 0.9rem;
  color: #6d675f;
  font-size: 0.88rem;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #3e4a40;
}

.lens {
  position: absolute;
  z-index: 4;
  width: min(42vw, 320px);
  height: min(42vw, 320px);
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(196, 163, 90, 0.9);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.82);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.lens.is-on {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.lens img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 860px) {
  .story {
    min-height: 0;
    padding: 4.2rem 1.15rem 5.5rem;
  }

  .story__grid {
    grid-template-columns: 1fr;
  }

  .story__title {
    max-width: none;
    font-size: clamp(2.77rem, 9.28vw, 3.86rem);
  }

  .lens {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lens {
    display: none;
  }
}
</style>
