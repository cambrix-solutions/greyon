<template>
  <q-layout view="hHh lpR fFf" class="admin-login-layout">
    <q-page-container>
      <q-page class="flex flex-center admin-login">
        <form v-reveal class="login-card" @submit.prevent="onSubmit">
          <p class="gy-eyebrow">Greyon CMS</p>
          <h1 class="gy-display">Admin login</h1>
          <p class="gy-muted">Any password works for demo accounts.</p>

          <div class="demo-accounts">
            <button
              v-for="acct in demoAccounts"
              :key="acct.email"
              type="button"
              class="demo-accounts__row"
              @click="email = acct.email"
            >
              <span class="demo-accounts__role">{{ acct.role }}</span>
              <span class="demo-accounts__pkg">{{ acct.package }}</span>
              <code>{{ acct.email }}</code>
            </button>
          </div>

          <label>
            Email
            <input
              v-model="email"
              type="email"
              required
              autocomplete="username"
            />
          </label>
          <label>
            Password
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
            />
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <button class="gy-btn" type="submit">Sign in</button>
          <router-link to="/" class="back">← Back to site</router-link>
        </form>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref("dev@greyon.com.kh");
const password = ref("demo");
const error = ref("");

const demoAccounts = [
  { email: "dev@greyon.com.kh", role: "Developer", package: "Platform Developer" },
  { email: "admin@greyon.com.kh", role: "Admin", package: "Admin · Full suite" },
  { email: "pp@greyon.com.kh", role: "Manager · PP", package: "Manager · Booking Pro" },
  { email: "sr@greyon.com.kh", role: "Manager · SR", package: "Manager · Content+" },
  { email: "angkor@greyon.com.kh", role: "Hotel admin", package: "Hotel Admin · Booking Pro" },
  { email: "hotel@greyon.com.kh", role: "Hotel admin", package: "Hotel Admin · Core" }
];

function onSubmit() {
  const result = auth.login(email.value, password.value);
  if (!result.ok) {
    error.value = result.message;
    return;
  }
  error.value = "";
  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/admin";
  void router.push(redirect);
}
</script>

<style scoped>
.admin-login-layout,
.admin-login {
  min-height: 100vh;
}

.admin-login {
  background:
    radial-gradient(ellipse 70% 50% at 20% 0%, rgba(196, 163, 90, 0.16), transparent 55%),
    #f6f5f2;
  padding: 1.5rem;
}

.login-card {
  width: min(440px, 100%);
  padding: 1.75rem 1.5rem 1.5rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(18, 17, 16, 0.08);
}

.login-card h1 {
  margin: 0.25rem 0 0.35rem;
  font-size: 1.75rem;
}

.demo-accounts {
  display: grid;
  gap: 0.35rem;
  margin: 1rem 0 1.15rem;
  max-height: 220px;
  overflow: auto;
  padding: 0.35rem;
  background: #faf9f7;
  border-radius: 12px;
  border: 1px solid rgba(28, 36, 33, 0.06);
}

.demo-accounts__row {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr auto;
  gap: 0.35rem;
  align-items: center;
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.demo-accounts__row:hover {
  background: rgba(154, 123, 60, 0.1);
}

.demo-accounts__role {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gy-ink);
}

.demo-accounts__pkg {
  font-size: 0.72rem;
  color: var(--gy-gold-deep);
}

.demo-accounts__row code {
  font-size: 0.68rem;
  color: var(--gy-muted);
}

.login-card label {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.login-card input {
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(28, 36, 33, 0.14);
  border-radius: 10px;
  font: inherit;
  color: var(--gy-ink);
  background: #fff;
}

.login-card .gy-btn {
  width: 100%;
  margin-top: 0.35rem;
}

.error {
  color: #b42318;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.back {
  display: inline-block;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--gy-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--gy-gold-deep);
}

@media (max-width: 520px) {
  .demo-accounts__row {
    grid-template-columns: 1fr;
    gap: 0.1rem;
  }
}
</style>
