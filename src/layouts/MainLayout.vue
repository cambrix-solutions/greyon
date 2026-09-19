<template>
  <q-layout
    view="hHh lpR fFf"
    class="gy-layout"
    :class="{ 'gy-layout--home': isHome }"
  >
    <q-header
      :overlay="isHome"
      :bordered="false"
      class="gy-header"
      :class="{ 'gy-header--solid': solidHeader }"
    >
      <div class="gy-container gy-header__bar">
        <router-link to="/" class="gy-logo gy-display">Greyon</router-link>

        <nav class="gy-nav gt-sm">
          <router-link to="/" class="gy-nav__link">{{ $t("nav.home") }}</router-link>
          <router-link
            v-if="auth.featureEnabled('news_public')"
            to="/news"
            class="gy-nav__link"
            >{{ $t("nav.news") }}</router-link
          >

          <div v-if="auth.featureEnabled('portfolios')" class="gy-nav__dropdown">
            <button class="gy-nav__link gy-nav__dropbtn" type="button">
              {{ $t("nav.portfolios") }}
            </button>
            <div class="gy-nav__menu">
              <router-link to="/hotels">{{ $t("portfolios.hotel") }}</router-link>
              <router-link to="/portfolios/service-apartment">{{
                $t("portfolios.serviceApartment")
              }}</router-link>
              <router-link to="/portfolios/boutique">{{
                $t("portfolios.boutique")
              }}</router-link>
              <router-link to="/portfolios/resort">{{
                $t("portfolios.resort")
              }}</router-link>
            </div>
          </div>
          <router-link
            v-else
            to="/hotels"
            class="gy-nav__link"
            >{{ $t("portfolios.hotel") }}</router-link
          >

          <router-link to="/locations" class="gy-nav__link">{{
            $t("nav.location")
          }}</router-link>
          <router-link
            v-if="auth.featureEnabled('booking_public')"
            to="/booking"
            class="gy-nav__link"
            >{{ $t("nav.booking") }}</router-link
          >
          <router-link
            v-if="auth.featureEnabled('contact_public')"
            to="/contact"
            class="gy-nav__link"
            >{{ $t("nav.contact") }}</router-link
          >
        </nav>

        <div class="gy-header__actions">
          <router-link
            v-if="customer.isAuthenticated"
            to="/account"
            class="gy-account-btn gt-xs"
            :title="customer.displayName"
          >
            <span class="gy-account-btn__avatar" aria-hidden="true">{{
              accountInitials
            }}</span>
            <span class="gy-account-btn__label">Account</span>
          </router-link>
          <router-link
            v-else
            to="/sign-in"
            class="gy-btn gy-btn--outline gy-btn--sm gt-xs gy-signin-btn"
          >
            Sign in
          </router-link>
          <router-link
            v-if="auth.featureEnabled('booking_public')"
            to="/booking"
            class="gy-btn gy-btn--light gy-btn--sm gt-xs"
            >{{ $t("nav.bookNow") }}</router-link
          >
          <q-btn
            flat
            dense
            round
            icon="menu"
            class="lt-md gy-menu-btn"
            aria-label="Open menu"
            @click="drawerOpen = !drawerOpen"
          />
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      side="right"
      overlay
      bordered
      class="gy-drawer"
    >
      <div class="q-pa-lg">
        <p class="gy-display" style="font-size: 2rem; margin: 0 0 1rem">
          Greyon
        </p>
        <q-list>
          <q-item
            v-for="item in drawerItems"
            :key="item.to"
            clickable
            v-ripple
            :to="item.to"
            @click="drawerOpen = false"
          >
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>
        <div class="q-mt-md">
          <router-link
            v-if="customer.isAuthenticated"
            to="/account"
            class="gy-btn"
            style="width: 100%"
            @click="drawerOpen = false"
          >
            My account
          </router-link>
          <router-link
            v-else
            to="/sign-in"
            class="gy-btn gy-btn--outline"
            style="width: 100%"
            @click="drawerOpen = false"
          >
            Sign in
          </router-link>
        </div>
        <router-link
          v-if="auth.featureEnabled('booking_public')"
          to="/booking"
          class="gy-btn q-mt-md"
          style="width: 100%"
          @click="drawerOpen = false"
        >
          {{ $t("nav.bookNow") }}
        </router-link>
      </div>
    </q-drawer>

    <q-page-container class="gy-page-container">
      <router-view v-slot="{ Component, route: r }">
        <transition name="gy-page" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>
      <SiteFooter />
      <CookieNotice />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import CookieNotice from "@/components/CookieNotice.vue";
import SiteFooter from "@/components/SiteFooter.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { useCustomerStore } from "@/stores/customer-store";

const auth = useAuthStore();
const cms = useCmsStore();
const customer = useCustomerStore();
customer.hydrate();
const drawerOpen = ref(false);
const route = useRoute();
const { t } = useI18n();
const homePastHero = ref(false);

const accountInitials = computed(() => {
  const parts = customer.displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
});

let heroScrollBound = false;

const isHome = computed(() => route.path === "/");
const solidHeader = computed(
  () =>
    route.meta.solidHeader === true || !isHome.value || homePastHero.value
);

const drawerItems = computed(() => {
  const items = [{ label: t("nav.home"), to: "/" }];
  if (auth.featureEnabled("news_public")) {
    items.push({ label: t("nav.news"), to: "/news" });
  }
  items.push({ label: t("portfolios.hotel"), to: "/hotels" });
  if (auth.featureEnabled("portfolios")) {
    items.push(
      {
        label: `${t("portfolios.serviceApartment")} (${t("portfolios.comingSoon")})`,
        to: "/portfolios/service-apartment"
      },
      {
        label: `${t("portfolios.boutique")} (${t("portfolios.comingSoon")})`,
        to: "/portfolios/boutique"
      },
      {
        label: `${t("portfolios.resort")} (${t("portfolios.comingSoon")})`,
        to: "/portfolios/resort"
      }
    );
  }
  items.push({ label: t("nav.location"), to: "/locations" });
  if (auth.featureEnabled("booking_public")) {
    items.push({ label: t("nav.booking"), to: "/booking" });
  }
  if (auth.featureEnabled("contact_public")) {
    items.push({ label: t("nav.contact"), to: "/contact" });
  }
  return items;
});

function syncHomeHeader() {
  if (!isHome.value) {
    homePastHero.value = false;
    return;
  }
  // White header once the page has scrolled past one viewport (100vh hero).
  homePastHero.value = window.scrollY >= window.innerHeight - 1;
}

function bindHeroScroll() {
  if (!heroScrollBound) {
    window.addEventListener("scroll", syncHomeHeader, { passive: true });
    window.addEventListener("resize", syncHomeHeader);
    heroScrollBound = true;
  }
  syncHomeHeader();
}

function unbindHeroScroll() {
  if (!heroScrollBound) return;
  window.removeEventListener("scroll", syncHomeHeader);
  window.removeEventListener("resize", syncHomeHeader);
  heroScrollBound = false;
}

watch(isHome, async () => {
  await nextTick();
  syncHomeHeader();
});

watch(
  () => route.path,
  async () => {
    await nextTick();
    // After page transition, re-sync (hero may remount).
    requestAnimationFrame(syncHomeHeader);
  }
);

onMounted(async () => {
  void cms.ensurePublicCatalog();
  await nextTick();
  bindHeroScroll();
});

onUnmounted(() => {
  unbindHeroScroll();
});
</script>

<style scoped>
.gy-layout {
  min-height: 100vh;
  background: var(--gy-white);
}

.gy-layout--home {
  background: transparent;
}

.gy-layout--home :deep(.gy-page-container),
.gy-layout--home :deep(.q-page-container) {
  padding-top: 0 !important;
}

.gy-header {
  background: transparent !important;
  color: var(--gy-white);
  box-shadow: none !important;
  border: 0 !important;
  transition:
    background 0.35s ease,
    color 0.35s ease,
    box-shadow 0.35s ease;
}

.gy-header--solid {
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--gy-ink);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(18, 17, 16, 0.06) !important;
  box-shadow: none !important;
}

.gy-header--solid .gy-logo,
.gy-header--solid .gy-nav__link,
.gy-header--solid .gy-menu-btn {
  color: var(--gy-ink);
}

.gy-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.25rem;
}

.gy-logo {
  font-size: 1.85rem;
  letter-spacing: -0.02em;
  color: inherit;
  transition: opacity 0.25s ease;
}

.gy-logo:hover {
  opacity: 0.8;
}

.gy-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.gy-nav__link,
.gy-nav__dropbtn {
  position: relative;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.9;
  color: inherit;
  background: none;
  border: 0;
  padding: 0.2rem 0;
  cursor: pointer;
  font-family: inherit;
  transition:
    opacity 0.25s ease,
    color 0.25s ease;
}

.gy-nav__link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.15rem;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.28s ease;
  opacity: 0.7;
}

.gy-nav__link:hover::after,
.gy-nav__link.router-link-active::after {
  transform: scaleX(1);
}

.gy-nav__link.router-link-active,
.gy-nav__link:hover,
.gy-nav__dropbtn:hover {
  opacity: 1;
  color: var(--gy-gold);
}

.gy-header--solid .gy-nav__link.router-link-active,
.gy-header--solid .gy-nav__link:hover,
.gy-header--solid .gy-nav__dropbtn:hover {
  color: var(--gy-gold-deep);
}

.gy-nav__dropdown {
  position: relative;
}

.gy-nav__menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: 0.6rem 0;
  background: var(--gy-cream);
  color: var(--gy-ink);
  box-shadow: var(--gy-shadow);
  z-index: 20;
}

.gy-nav__menu a {
  display: block;
  padding: 0.45rem 0.9rem;
  color: var(--gy-ink);
  font-size: 0.9rem;
}

.gy-nav__menu a:hover {
  background: var(--gy-stone);
}

.gy-nav__dropdown:hover .gy-nav__menu,
.gy-nav__dropdown:focus-within .gy-nav__menu {
  display: block;
}

.gy-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gy-account-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.28rem 0.7rem 0.28rem 0.28rem;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
  color: var(--gy-white);
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.gy-account-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: var(--gy-gold);
}

.gy-header--solid .gy-account-btn {
  border-color: rgba(18, 17, 16, 0.14);
  background: #fff;
  color: var(--gy-ink);
  box-shadow: 0 1px 0 rgba(18, 17, 16, 0.04);
}

.gy-header--solid .gy-account-btn:hover {
  border-color: var(--gy-gold-deep);
  background: rgba(196, 163, 90, 0.1);
}

.gy-account-btn__avatar {
  width: 1.7rem;
  height: 1.7rem;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--gy-gold), var(--gy-gold-deep));
  color: var(--gy-ink);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
}

.gy-signin-btn {
  border-color: rgba(255, 255, 255, 0.55);
  color: var(--gy-white);
  background: transparent;
}

.gy-signin-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--gy-white);
  color: var(--gy-white);
}

.gy-header--solid .gy-signin-btn {
  border-color: var(--gy-gold-deep);
  color: var(--gy-gold-deep);
}

.gy-header--solid .gy-signin-btn:hover {
  background: var(--gy-gold-deep);
  color: var(--gy-white);
}

.gy-drawer {
  background: var(--gy-cream);
}
</style>
