<template>
  <q-page class="gy-section">
    <SeoHead
      title="About | Greyon"
      description="Greyon is a Cambodia hospitality brand offering hotels and serviced stays."
    />
    <div class="gy-container about">
      <div v-reveal>
        <p class="gy-eyebrow">Greyon</p>
        <h1 class="gy-display about__title">About us</h1>
        <p class="about__lead">
          Greyon is a Cambodia hospitality brand focused on calm, modern stays —
          from city hotels to serviced apartments — with booking that stays
          simple for guests and teams.
        </p>
      </div>

      <div v-reveal="{ delay: '80ms' }" class="about__body">
        <p>
          We design each property around the destination: clear rooms,
          thoughtful amenities, and stay policies guests can understand before
          they book. This page is a short overview you can expand with brand
          story, team, or press details later.
        </p>
        <p>
          Looking for a stay? Browse
          <router-link to="/hotels">hotels</router-link>
          and
          <router-link to="/apartments">apartments</router-link>, or
          <router-link to="/contact">contact us</router-link>
          with a question.
        </p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import SeoHead from "@/components/SeoHead.vue";
</script>

<style scoped>
.about {
  max-width: 42rem;
}

.about__title {
  margin: 0 0 0.85rem;
  font-size: clamp(2.2rem, 4.5vw, 3.1rem);
}

.about__lead {
  margin: 0 0 1.5rem;
  font-size: 1.15rem;
  line-height: 1.55;
  color: var(--gy-ink);
}

.about__body {
  display: grid;
  gap: 1rem;
  color: var(--gy-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.about__body p {
  margin: 0;
}

.about__body a {
  color: var(--gy-forest);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
</style>
