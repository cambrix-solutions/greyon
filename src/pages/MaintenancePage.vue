<template>
  <div class="maint">
    <div class="maint__glow" aria-hidden="true" />
    <div class="maint__inner">
      <p class="maint__brand">Greyon</p>
      <p class="maint__eyebrow">Maintenance</p>
      <h1 class="maint__title">{{ maintenance.title }}</h1>
      <p class="maint__copy">{{ maintenance.message }}</p>
      <p v-if="maintenance.eta" class="maint__eta">{{ maintenance.eta }}</p>
      <p class="maint__hint">Admin staff can still sign in at /admin</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMaintenanceStore } from "@/stores/maintenance-store";

const maintenance = useMaintenanceStore();
</script>

<style scoped>
.maint {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1.25rem;
  overflow: hidden;
  background: #f6f5f2;
  color: var(--gy-ink);
}

.maint__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 45% at 50% 0%, rgba(196, 163, 90, 0.22), transparent 55%),
    radial-gradient(ellipse 50% 40% at 80% 100%, rgba(154, 123, 60, 0.08), transparent 50%);
  pointer-events: none;
}

.maint__inner {
  position: relative;
  text-align: center;
  max-width: 28rem;
}

.maint__brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 8vw, 3.4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--gy-gold-deep);
}

.maint__eyebrow {
  margin: 1.1rem 0 0;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.maint__title {
  margin: 0.45rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 1.9rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.maint__copy {
  margin: 0.85rem 0 0;
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--gy-muted);
}

.maint__eta {
  margin: 1rem 0 0;
  display: inline-block;
  padding: 0.4rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.12);
  border-radius: 8px;
}

.maint__hint {
  margin: 1.75rem 0 0;
  font-size: 0.75rem;
  color: var(--gy-muted);
  opacity: 0.75;
}
</style>
