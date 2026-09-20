<template>
  <AuthShell
    image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1800&q=80"
    lede="Save your details for faster booking across Greyon hotels — cities, coast, and countryside."
  >
    <form class="auth-card" @submit.prevent="onSubmit">
      <p class="gy-eyebrow auth-card__eyebrow">Join Greyon</p>
      <h1 class="gy-display auth-card__title">Create account</h1>
      <p class="auth-card__sub">
        Book once, and your stays stay with you — email or Google.
      </p>

      <button
        type="button"
        class="auth-google"
        :disabled="submitting"
        @click="onGoogle"
      >
        <span class="auth-google__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </span>
        Continue with Google
      </button>

      <div class="auth-divider"><span>or email</span></div>

      <label class="auth-field">
        Full name
        <input
          v-model="name"
          type="text"
          required
          autocomplete="name"
          placeholder="Your name"
        />
      </label>
      <label class="auth-field">
        Email
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@email.com"
        />
      </label>
      <label class="auth-field">
        Phone <span class="auth-field__opt">(optional)</span>
        <input
          v-model="phone"
          type="tel"
          autocomplete="tel"
          placeholder="+855 …"
        />
      </label>
      <div class="auth-card__row">
        <label class="auth-field">
          Password
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="At least 8 characters"
          />
        </label>
        <label class="auth-field">
          Confirm
          <input
            v-model="passwordConfirmation"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="Repeat password"
          />
        </label>
      </div>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <button
        class="gy-btn auth-card__submit"
        type="submit"
        :disabled="submitting"
      >
        {{ submitting ? "Creating…" : "Create account" }}
      </button>

      <p class="auth-card__foot">
        Already have an account?
        <router-link :to="{ name: 'sign-in', query: route.query }"
          >Sign in</router-link
        >
      </p>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthShell from "@/components/AuthShell.vue";
import { consumeAuthRedirect, setAuthRedirect } from "@/helpers/authRedirect";
import { useCustomerStore } from "@/stores/customer-store";

const customer = useCustomerStore();
const router = useRouter();
const route = useRoute();

const name = ref("");
const email = ref("");
const phone = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const error = ref("");
const submitting = ref(false);

onMounted(() => {
  customer.hydrate();
  const redirect =
    typeof route.query.redirect === "string" ? route.query.redirect : null;
  if (redirect) setAuthRedirect(redirect);
  if (customer.isAuthenticated) {
    void router.replace(redirect ?? "/account");
  }
});

async function onSubmit() {
  if (password.value !== passwordConfirmation.value) {
    error.value = "Passwords do not match.";
    return;
  }
  submitting.value = true;
  error.value = "";
  try {
    const result = await customer.register({
      name: name.value,
      email: email.value,
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
      phone: phone.value
    });
    if (!result.ok) {
      error.value = result.message;
      return;
    }
    const redirect =
      typeof route.query.redirect === "string"
        ? route.query.redirect
        : consumeAuthRedirect("/account");
    void router.push(redirect);
  } finally {
    submitting.value = false;
  }
}

function onGoogle() {
  const redirect =
    typeof route.query.redirect === "string"
      ? route.query.redirect
      : "/account";
  customer.continueWithGoogle(redirect);
}
</script>

<style scoped>
.auth-card__eyebrow {
  margin: 0 0 0.35rem;
}

.auth-card__title {
  margin: 0 0 0.45rem;
  font-size: clamp(1.85rem, 4vw, 2.35rem);
  line-height: 1.05;
  color: var(--gy-ink);
}

.auth-card__sub {
  margin: 0 0 1.35rem;
  color: var(--gy-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.auth-google {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 0.9rem 1.05rem;
  border: 1px solid rgba(18, 17, 16, 0.12);
  border-radius: 10px;
  background: #fff;
  color: var(--gy-ink);
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.auth-google:hover:not(:disabled) {
  border-color: rgba(196, 163, 90, 0.65);
  background: var(--gy-sand);
  transform: translateY(-1px);
}

.auth-google:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-google__icon {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
}

.auth-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  margin: 1.2rem 0 1.05rem;
  color: var(--gy-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(18, 17, 16, 0.14),
    transparent
  );
}

.auth-card__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.auth-field {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.auth-field__opt {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.8;
}

.auth-field input {
  width: 100%;
  padding: 0.88rem 1rem;
  border: 1px solid rgba(18, 17, 16, 0.12);
  border-radius: 10px;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--gy-ink);
  background: var(--gy-sand);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.auth-field input:focus {
  outline: none;
  border-color: var(--gy-gold);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(196, 163, 90, 0.18);
}

.auth-error {
  margin: 0 0 0.9rem;
  padding: 0.65rem 0.75rem;
  background: rgba(155, 44, 44, 0.06);
  border-left: 2px solid #9b2c2c;
  color: #9b2c2c;
  font-size: 0.9rem;
}

.auth-card__submit {
  width: 100%;
  margin-top: 0.45rem;
  border-radius: 10px;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
  transition: transform 0.2s ease;
}

.auth-card__submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.auth-card__foot {
  margin: 1.25rem 0 0;
  text-align: center;
  color: var(--gy-muted);
  font-size: 0.92rem;
}

.auth-card__foot a {
  color: var(--gy-gold-deep);
  font-weight: 650;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}

.auth-card__foot a:hover {
  border-bottom-color: var(--gy-gold-deep);
}

@media (max-width: 520px) {
  .auth-card__row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
