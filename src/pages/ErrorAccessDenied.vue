<template>
  <div class="err-404">
    <div class="err-404__inner">
      <p class="err-404__code">404</p>
      <h1 class="err-404__title">Page not available</h1>
      <p class="err-404__copy">
        {{
          message ||
          "You don’t have access to this page. Your user package may not include this feature or role."
        }}
      </p>
      <div class="err-404__actions">
        <q-btn
          v-if="isAdmin"
          unelevated
          no-caps
          color="primary"
          label="Back to dashboard"
          to="/admin"
        />
        <q-btn outline no-caps color="primary" label="Go home" to="/" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";

const route = useRoute();
const auth = useAuthStore();

const message = computed(() =>
  typeof route.query.message === "string" ? route.query.message : ""
);
const isAdmin = computed(() => auth.isAuthenticated);
</script>

<style scoped>
.err-404 {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1.25rem;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(196, 163, 90, 0.18), transparent 55%),
    #f6f5f2;
  color: var(--gy-ink);
}

.err-404__inner {
  text-align: center;
  max-width: 28rem;
}

.err-404__code {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(5rem, 18vw, 8rem);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: var(--gy-gold-deep);
  opacity: 0.85;
}

.err-404__title {
  margin: 0.75rem 0 0;
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.err-404__copy {
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gy-muted);
}

.err-404__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: center;
  margin-top: 1.5rem;
}
</style>
