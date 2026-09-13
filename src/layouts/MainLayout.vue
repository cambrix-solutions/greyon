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
          <div class="lang-switch">
            <button
              type="button"
              :class="{ active: locale === 'en-US' }"
              @click="setLocale('en-US')"
            >
              {{ $t("lang.en") }}
            </button>
            <button
              type="button"
              :class="{ active: locale === 'km-KH' }"
              @click="setLocale('km-KH')"
            >
              {{ $t("lang.km") }}
            </button>
          </div>
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
        <div class="row q-gutter-sm q-mt-md">
          <q-btn
            outline
            :label="$t('lang.en')"
            @click="setLocale('en-US')"
          />
          <q-btn
            outline
            :label="$t('lang.km')"
            @click="setLocale('km-KH')"
          />
        </div>
        <router-link
          v-if="auth.featureEnabled('booking_public')"
          to="/booking"
          class="gy-btn q-mt-lg"
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

const auth = useAuthStore();
const drawerOpen = ref(false);
const route = useRoute();
const { t, locale } = useI18n();
const homePastHero = ref(false);

let heroObserver: IntersectionObserver | null = null;

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

function setLocale(next: "en-US" | "km-KH") {
  locale.value = next;
  localStorage.setItem("greyon_locale", next);
  document.documentElement.lang = next === "km-KH" ? "km" : "en";
}

function disconnectHeroObserver() {
  heroObserver?.disconnect();
  heroObserver = null;
}

function bindHeroObserver() {
  disconnectHeroObserver();
  homePastHero.value = false;
  if (!isHome.value) return;

  const hero = document.getElementById("home-hero");
  if (!hero) return;

  heroObserver = new IntersectionObserver(
    ([entry]) => {
      // Solid white header once the 100vh hero is no longer intersecting the viewport
      homePastHero.value = !(entry?.isIntersecting ?? true);
    },
    { threshold: 0, rootMargin: "0px" }
  );
  heroObserver.observe(hero);
}

watch(isHome, async () => {
  await nextTick();
  bindHeroObserver();
});

onMounted(async () => {
  await nextTick();
  bindHeroObserver();
});

onUnmounted(() => {
  disconnectHeroObserver();
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

.lang-switch {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.gy-header--solid .lang-switch {
  border-color: rgba(28, 36, 33, 0.18);
}

.lang-switch button {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.7;
}

.lang-switch button.active {
  opacity: 1;
  background: rgba(176, 141, 87, 0.35);
}

.gy-drawer {
  background: var(--gy-cream);
}
</style>
