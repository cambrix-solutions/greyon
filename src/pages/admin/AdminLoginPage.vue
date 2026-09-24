<template>
  <q-layout view="hHh lpR fFf" class="admin-login-layout">
    <q-page-container>
      <q-page class="flex flex-center admin-login">
        <div class="admin-login__bg" aria-hidden="true" />
        <div class="admin-login__veil" aria-hidden="true" />
        <div class="admin-login__glow" aria-hidden="true" />

        <form v-reveal class="login-card" @submit.prevent="onSubmit">
          <p class="gy-eyebrow">Greyon CMS</p>
          <h1 class="gy-display">Admin login</h1>
          <p class="gy-muted">Sign in with your Greyon admin account.</p>

          <label>
            Email
            <input
              v-model="email"
              type="email"
              required
              autocomplete="username"
              placeholder="you@greyon.com.kh"
            />
          </label>
          <label>
            Password
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <button class="gy-btn" type="submit" :disabled="submitting">
            {{ submitting ? "Signing in…" : "Sign in" }}
          </button>
          <router-link to="/" class="back">← Back to site</router-link>
        </form>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

function leaveIfAuthed() {
  auth.hydrate();
  if (!auth.isAuthenticated) return false;
  const redirect =
    typeof route.query.redirect === "string" &&
    route.query.redirect.startsWith("/") &&
    !route.query.redirect.startsWith("//")
      ? route.query.redirect
      : "/admin";
  void router.replace(redirect);
  return true;
}

onMounted(() => {
  leaveIfAuthed();
});

async function onSubmit() {
  submitting.value = true;
  error.value = "";
  try {
    const result = await auth.loginAdmin(email.value, password.value);
    if (!result.ok) {
      error.value = result.message;
      return;
    }
    if (!auth.isAuthenticated) {
      error.value = "Sign-in succeeded but the session was cleared. Try again.";
      return;
    }
    const redirect =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/admin";
    await router.replace(redirect);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-login-layout,
.admin-login {
  min-height: 100vh;
}

.admin-login {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  background: #121110;
}

.admin-login__bg {
  position: absolute;
  inset: -2%;
  background: url("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80")
    center / cover;
  transform: scale(1.06);
  animation: admin-login-drift 32s ease-in-out infinite alternate;
  z-index: 0;
}

.admin-login__veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(
      160deg,
      rgba(18, 17, 16, 0.72) 0%,
      rgba(18, 17, 16, 0.55) 45%,
      rgba(18, 17, 16, 0.7) 100%
    ),
    linear-gradient(180deg, rgba(18, 17, 16, 0.25), rgba(18, 17, 16, 0.5));
}

.admin-login__glow {
  position: absolute;
  inset: auto auto -18% -8%;
  width: min(50vw, 480px);
  height: min(50vw, 480px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(196, 163, 90, 0.26) 0%,
    transparent 70%
  );
  filter: blur(8px);
  z-index: 0;
  pointer-events: none;
  animation: admin-login-glow 10s ease-in-out infinite alternate;
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
  padding: 1.85rem 1.6rem 1.55rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 18px;
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(196, 163, 90, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 1.4rem;
  right: 1.4rem;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gy-gold) 20%,
    var(--gy-gold-deep) 50%,
    var(--gy-gold) 80%,
    transparent
  );
}

.login-card h1 {
  margin: 0.25rem 0 0.35rem;
  font-size: 1.75rem;
}

.login-card .gy-muted {
  margin: 0 0 1.15rem;
}

.login-card label {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.login-card input {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(28, 36, 33, 0.14);
  border-radius: 10px;
  font: inherit;
  color: var(--gy-ink);
  background: var(--gy-sand);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.login-card input:focus {
  outline: none;
  border-color: var(--gy-gold);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(196, 163, 90, 0.18);
}

.login-card .gy-btn {
  width: 100%;
  margin-top: 0.35rem;
  border-radius: 10px;
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

.dev-hint {
  margin: 0.75rem 0 0;
  font-size: 0.78rem;
  text-align: center;
}

.dev-hint a {
  color: var(--gy-muted);
  text-decoration: none;
}

.dev-hint a:hover {
  color: var(--gy-gold-deep);
}

@keyframes admin-login-drift {
  from {
    transform: scale(1.06) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(-1.5%, -1%, 0);
  }
}

@keyframes admin-login-glow {
  from {
    opacity: 0.55;
  }
  to {
    opacity: 0.9;
  }
}
</style>
