<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center invite-page">
        <div class="invite-card">
          <img
            class="invite-card__logo"
            src="/logo/Logo V1-04-04.png"
            alt="Greyon"
            width="140"
            height="48"
          />
          <p class="invite-card__eyebrow">Greyon admin</p>

          <template v-if="mode === 'invite'">
            <h1 class="invite-card__title">You're invited</h1>
            <p v-if="loading" class="invite-card__muted"
              >Checking your invite…</p
            >
            <template v-else-if="preview?.valid">
              <p>
                <template v-if="preview.invitedBy"
                  >{{ preview.invitedBy }} invited you</template
                >
                <template v-else>You were invited</template>
                to the Greyon admin panel<template v-if="preview.roles?.length">
                  as {{ preview.roles.join(", ") }}</template
                >.
              </p>
              <p class="invite-card__muted">
                Sign in with the Google account for
                <strong>{{ preview.email }}</strong
                >. Other Google accounts are refused.
              </p>
              <a class="invite-card__btn" :href="googleUrl"
                >Continue with Google</a
              >
            </template>
            <p v-else class="invite-card__error">
              {{ preview?.message || "This invite is invalid or has expired." }}
              Ask the person who invited you to send a new one.
            </p>
          </template>

          <template v-else>
            <h1 class="invite-card__title">Signing you in</h1>
            <p v-if="!error" class="invite-card__muted">One moment…</p>
            <p v-else class="invite-card__error">{{ error }}</p>
            <router-link
              v-if="error"
              to="/admin/login"
              class="invite-card__link"
              >Back to admin login</router-link
            >
          </template>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  adminGoogleRedirectUrl,
  exchangeAdminGoogleTicket,
  previewInvite,
  type InvitePreview
} from "@/services/engine/adminAccess";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Two steps of "Invite by Google":
 *  - /admin/accept-invite?token=…   shows the invite, then hands off to Google;
 *  - /admin/auth/google/complete?ticket=…   swaps the one-time ticket the
 *    engine issued after Google for an admin session.
 */
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const mode = computed(() =>
  route.name === "admin-google-complete" ? "complete" : "invite"
);
const token = computed(() => String(route.query.token ?? ""));
const preview = ref<InvitePreview | null>(null);
const loading = ref(true);
const error = ref("");
const googleUrl = computed(() => adminGoogleRedirectUrl(token.value));

onMounted(async () => {
  if (mode.value === "invite") {
    try {
      preview.value = token.value
        ? await previewInvite(token.value)
        : { valid: false };
    } catch {
      preview.value = { valid: false };
    } finally {
      loading.value = false;
    }
    return;
  }

  const ticket = String(route.query.ticket ?? "");
  if (!ticket) {
    error.value = "Google sign-in did not finish. Please try again.";
    return;
  }
  try {
    const { admin } = await exchangeAdminGoogleTicket(ticket);
    if (!auth.adoptAdminSession(admin)) {
      error.value = "This account has no role yet. Ask your admin to add one.";
      return;
    }
    await router.replace("/admin");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Google sign-in failed.";
  }
});
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: var(--gy-cream);
}

.invite-card {
  width: min(100%, 440px);
  padding: 2rem;
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.1);
}

.invite-card__logo {
  display: block;
  height: auto;
  margin-bottom: 1rem;
}

.invite-card__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.invite-card__title {
  margin: 0 0 0.9rem;
  font-size: 1.6rem;
  font-weight: 700;
}

.invite-card__muted {
  color: var(--gy-muted);
}

.invite-card__error {
  color: #8a3b33;
}

.invite-card__btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.7rem 1.2rem;
  background: #4b5a4d;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.invite-card__link {
  color: var(--gy-ink);
}
</style>
