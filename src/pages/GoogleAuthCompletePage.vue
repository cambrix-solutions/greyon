<template>
  <q-page class="auth-complete">
    <p class="gy-eyebrow">Greyon</p>
    <h1 class="gy-display">{{ title }}</h1>
    <p class="auth-complete__msg">{{ message }}</p>
    <router-link v-if="failed" to="/sign-in" class="gy-btn">Back to sign in</router-link>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { consumeAuthRedirect } from "@/helpers/authRedirect";
import { useCustomerStore } from "@/stores/customer-store";

const customer = useCustomerStore();
const route = useRoute();
const router = useRouter();

const title = ref("Signing you in…");
const message = ref("Finishing Google sign-in.");
const failed = ref(false);

onMounted(async () => {
  const ticket =
    typeof route.query.ticket === "string" ? route.query.ticket : "";
  if (!ticket) {
    title.value = "Sign-in incomplete";
    message.value = "Missing Google ticket. Please try again.";
    failed.value = true;
    return;
  }
  const result = await customer.completeGoogle(ticket);
  if (!result.ok) {
    title.value = "Sign-in failed";
    message.value = result.message;
    failed.value = true;
    return;
  }
  void router.replace(consumeAuthRedirect("/account"));
});
</script>

<style scoped>
.auth-complete {
  min-height: 60vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.65rem;
  padding: 4rem 1.25rem;
  text-align: center;
  background: var(--gy-sand);
}

.auth-complete h1 {
  margin: 0;
  font-size: 1.75rem;
}

.auth-complete__msg {
  margin: 0 0 0.75rem;
  color: var(--gy-muted);
  max-width: 28rem;
}
</style>
