<template>
  <section
    id="home-story"
    class="story home-motion"
    aria-labelledby="home-story-title"
  >
    <div class="story__grid" :class="{ 'story__grid--solo': !photo }">
      <div class="story__copy">
        <p v-reveal class="eyebrow">{{ $t("home.storyEyebrow") }}</p>
        <RevealWords
          id="home-story-title"
          class="story__title"
          :text="$t('home.storyTitle')"
        />
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
      <figure v-if="photo" v-reveal="{ delay: '120ms' }" class="story__media">
        <img
          :src="photo.src"
          :alt="photo.name"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { hostedImage } from "@/utils/hostedImage";

const auth = useAuthStore();
const cms = useCmsStore();

/** First hotel's third gallery photo, else the first real hotel photo (stock hosts are dropped). */
const photo = computed(() => {
  const first = cms.publishedHotels[0];
  const third = hostedImage(first?.gallery[2]);
  if (first && third) return { src: third, name: first.name };
  for (const hotel of cms.publishedHotels) {
    const src = hostedImage(hotel.heroImage) || hostedImage(hotel.gallery[0]);
    if (src) return { src, name: hotel.name };
  }
  return null;
});
</script>
<style scoped>
.story {
  position: relative;
  overflow: hidden;
  padding: clamp(2.5rem, 5vw, 3.75rem) clamp(1.25rem, 6vw, 6rem)
    clamp(1.75rem, 3.5vw, 2.5rem);
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
  color: var(--gy-forest);
}

.story__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: center;
  width: min(1180px, 100%);
  margin-inline: auto;
}

.story__grid--solo {
  grid-template-columns: minmax(0, 40rem);
}

.story__media {
  position: relative;
  margin: 0;
  aspect-ratio: 4 / 5;
  max-height: 620px;
  overflow: hidden;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(28, 31, 30, 0.14);
}

.story__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.story__media:hover img {
  transform: scale(1.05);
}

.eyebrow {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.story__title {
  margin: 0;
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 700;
  letter-spacing: normal;
  line-height: 1;
  color: var(--gy-forest);
}

.story__aside {
  position: relative;
  z-index: 1;
  max-width: 34rem;
  margin-top: 1.6rem;
  padding: 1.2rem 1.3rem 0.9rem;
  border: 1px solid rgba(28, 31, 30, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
}

.story__body,
.story__note {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 400;
  line-height: 1.7;
}

.story__note {
  margin-top: 0.9rem;
  color: var(--gy-forest);
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
  color: var(--gy-gold);
}

@media (prefers-reduced-motion: reduce) {
  .story__media img {
    transition: none;
  }

  .story__media:hover img {
    transform: none;
  }
}

@media (max-width: 860px) {
  .story {
    padding: 2.25rem 1.15rem 1.5rem;
  }

  .story__grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .story__media {
    aspect-ratio: 3 / 2;
  }

  .story__title {
    max-width: none;
    font-size: var(--gy-text-3xl);
  }
}
</style>
