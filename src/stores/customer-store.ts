import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { setAuthRedirect } from "@/helpers/authRedirect";
import { ApiError } from "@/services/api";
import {
  frontGoogleExchange,
  frontLogin,
  frontLogout,
  frontMe,
  frontRegister,
  startGoogleSignIn,
  type FrontUser
} from "@/services/engine/frontAuth";

const USER_KEY = "greyon_customer_user";

export const useCustomerStore = defineStore("customer", () => {
  const user = ref<FrontUser | null>(null);
  const hydrated = ref(false);

  const isAuthenticated = computed(() => Boolean(user.value));
  const displayName = computed(() => user.value?.name ?? "");

  function persist(u: FrontUser | null) {
    user.value = u;
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  function hydrate() {
    if (hydrated.value) return;
    hydrated.value = true;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return;
    try {
      user.value = JSON.parse(raw) as FrontUser;
      void refreshSession();
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  async function refreshSession() {
    try {
      const { user: me } = await frontMe();
      persist(me);
    } catch {
      persist(null);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { user: u } = await frontLogin(email, password);
      persist(u);
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof ApiError ? e.message : "Sign in failed."
      };
    }
  }

  async function register(input: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    phone?: string;
  }) {
    try {
      const body: Parameters<typeof frontRegister>[0] = {
        name: input.name,
        email: input.email,
        password: input.password,
        password_confirmation: input.passwordConfirmation
      };
      if (input.phone?.trim()) body.phone = input.phone.trim();
      const { user: u } = await frontRegister(body);
      persist(u);
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof ApiError ? e.message : "Sign up failed."
      };
    }
  }

  async function completeGoogle(ticket: string) {
    try {
      const { user: u } = await frontGoogleExchange(ticket);
      persist(u);
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        message:
          e instanceof ApiError ? e.message : "Google sign-in failed."
      };
    }
  }

  function continueWithGoogle(redirect?: string | null) {
    if (redirect) setAuthRedirect(redirect);
    startGoogleSignIn();
  }

  async function logout() {
    try {
      await frontLogout();
    } catch {
      // clear local anyway
    }
    persist(null);
  }

  return {
    user,
    hydrated,
    isAuthenticated,
    displayName,
    hydrate,
    refreshSession,
    login,
    register,
    completeGoogle,
    continueWithGoogle,
    logout
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCustomerStore, import.meta.hot));
}
