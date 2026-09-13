<template>
  <div v-if="visible" class="cookie-notice">
    <p>
      Greyon uses essential cookies for site operation. Analytics cookies are
      enabled only when configured.
      <router-link to="/privacy">Privacy policy</router-link>
    </p>
    <button class="gy-btn" type="button" @click="accept">Accept</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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
  z-index: 5000;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--gy-ink);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: var(--gy-shadow);
}

.cookie-notice a {
  color: var(--gy-gold);
  text-decoration: underline;
}

@media (max-width: 700px) {
  .cookie-notice {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
