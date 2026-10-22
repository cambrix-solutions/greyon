<template>
  <section id="home-story" class="story" aria-labelledby="home-story-title">
    <div class="story__grid">
      <div v-reveal>
        <p class="eyebrow">{{ $t("home.storyEyebrow") }}</p>
        <h2 id="home-story-title" class="story__title">
          {{ $t("home.storyTitle") }}
        </h2>
      </div>
      <div v-reveal="{ delay: '140ms' }" class="story__aside">
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
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
</script>

<style scoped>
.story {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  display: flex;
  align-items: center;
  min-height: 78vh;
  padding: clamp(6rem, 13vw, 10rem) clamp(1.25rem, 6vw, 6.5rem);
  background: var(--gy-white);
  color: var(--gy-ink);
}

.story__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: end;
  width: min(1240px, 100%);
  margin-inline: auto;
}

.eyebrow {
  margin: 0 0 1.25rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.eyebrow::after {
  content: "";
  display: block;
  width: 2.5rem;
  height: 1px;
  margin-top: 0.85rem;
  background: var(--gy-gold);
}

.story__title {
  margin: 0;
  max-width: 11ch;
  font-family: var(--serif);
  font-size: clamp(3.1rem, 7.4vw, 6.75rem);
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.03em;
  line-height: 0.9;
}

.story__body {
  margin: 0;
  font-family: var(--sans);
  font-size: clamp(0.95rem, 1.2vw, 1.05rem);
  font-weight: 500;
  line-height: 1.75;
  color: var(--gy-ink);
}

.story__note {
  margin: 1.25rem 0 0;
  font-family: var(--sans);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.6;
  color: var(--gy-muted);
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 44px;
  margin-top: 1.75rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-forest);
}

.text-link span {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.text-link:hover span {
  transform: translateX(6px);
}

.text-link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

@media (max-width: 860px) {
  .story {
    display: block;
    min-height: 0;
    padding: clamp(4.5rem, 14vw, 6rem) 1.25rem;
  }

  .story__grid {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .story__title {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .text-link span {
    transition: none;
  }
}
</style>
