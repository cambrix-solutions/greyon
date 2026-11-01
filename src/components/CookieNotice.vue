<template>
  <div
    v-if="visible && !hidden"
    class="cookie-notice"
    role="dialog"
    aria-label="Cookie notice"
  >
    <p class="cookie-notice__copy">
      Greyon uses essential cookies for site operation. Analytics cookies are
      enabled only when configured.
      <router-link to="/privacy">Privacy policy</router-link>
    </p>
    <button class="cookie-notice__accept" type="button" @click="accept">
      Accept
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    /** Hide while the mobile drawer is open so footer CTAs stay reachable. */
    hidden?: boolean;
  }>(),
  { hidden: false }
);

const key = "greyon_cookie_ok";
const visible = ref(
  typeof localStorage !== "undefined" ? !localStorage.getItem(key) : false
);

function accept() {
  localStorage.setItem(key, "1");
  visible.value = false;
}
</script>

<style scoped>
.cookie-notice {
  position: fixed;
  z-index: 80;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: var(--gy-cookie-offset);
  padding: 0 0.85rem env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
  background: var(--gy-cream);
  color: var(--gy-forest);
  border-top: 1px solid rgba(107, 84, 36, 0.28);
  box-shadow: 0 -10px 28px rgba(69, 76, 75, 0.12);
}

.cookie-notice__copy {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cookie-notice a {
  color: var(--gy-gold-ink);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.14em;
}

.cookie-notice__accept {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.9rem;
  border: 0;
  border-radius: 8px;
  background: var(--gy-forest);
  color: var(--gy-white);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.cookie-notice__accept:focus-visible {
  outline: 2px solid var(--gy-gold-deep);
  outline-offset: 2px;
}
</style>
