<template>
  <nav class="gy-social" aria-label="Social media">
    <a
      v-for="link in links"
      :key="link.id"
      class="gy-social__link"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="link.label"
    >
      <span class="gy-social__icon" aria-hidden="true">
        <svg
          v-if="link.id === 'facebook'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path
            d="M14 8.2h2.4V4.8H14c-2.1 0-3.6 1.6-3.6 3.7v1.7H8.2v3.4h2.2V19.2h3.4v-5.6h2.5l.5-3.4h-3V8.9c0-.4.3-.7.7-.7z"
          />
        </svg>
        <svg
          v-else-if="link.id === 'youtube'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path
            d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z"
          />
        </svg>
        <svg
          v-else-if="link.id === 'tiktok'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path
            d="M16.6 4c.5 1.7 1.7 3.1 3.4 3.6v2.4a6.4 6.4 0 0 1-3.4-1v6.3a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V4h2.6z"
          />
        </svg>
      </span>
    </a>
  </nav>
</template>

<script setup lang="ts">
import { SOCIAL_LINKS } from "@/constants/socialLinks";

const links = SOCIAL_LINKS;
</script>

<style scoped>
.gy-social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.gy-social__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid color-mix(in srgb, var(--gy-forest) 28%, transparent);
  border-radius: 999px;
  color: var(--gy-forest);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.gy-social__link:hover,
.gy-social__link:focus-visible {
  color: var(--gy-gold);
  border-color: color-mix(in srgb, var(--gy-gold) 70%, transparent);
  background: color-mix(in srgb, var(--gy-gold) 10%, transparent);
  outline: none;
}

.gy-social__icon {
  display: inline-flex;
  line-height: 0;
}
</style>
