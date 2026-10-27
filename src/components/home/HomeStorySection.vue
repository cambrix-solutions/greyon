<template>
  <section
    id="home-story"
    class="story home-motion"
    aria-labelledby="home-story-title"
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
      <div v-reveal class="story__aside">
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
  </section>
</template>

<script setup lang="ts">
import RevealWords from "@/components/home/RevealWords.vue";
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
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
  font-size: var(--gy-text-display);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1;
  color: var(--gy-ink);
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
  font-weight: 400;
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
    font-size: var(--gy-text-display);
  }
}
</style>
