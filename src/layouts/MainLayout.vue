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
        <router-link to="/" class="gy-logo" aria-label="Greyon home">
          <img
            class="gy-logo__img"
            :src="
              solidHeader
                ? '/logo/Logo V1-04-04.png'
                : '/logo/Logo white V1-05.png'
            "
            alt="Greyon"
            width="240"
            height="84"
          />
        </router-link>

        <div class="gy-header__center gt-md">
          <transition name="gy-navswap" mode="out-in">
            <div
              v-if="showCompactSearch"
              key="search"
              class="gy-header__search"
            >
              <BookingSearchWidget
                compact
                :page-anchor="false"
                :navigate="true"
                submit-label="Search"
              />
            </div>
            <nav v-else key="nav" class="gy-nav">
              <router-link to="/" class="gy-nav__link">{{
                $t("nav.home")
              }}</router-link>
              <router-link
                v-if="auth.featureEnabled('news_public')"
                to="/news"
                class="gy-nav__link"
                >{{ $t("nav.news") }}</router-link
              >

              <div class="gy-nav__dropdown">
                <router-link to="/hotels" class="gy-nav__link gy-nav__dropbtn">
                  {{ $t("portfolios.hotel") }}
                </router-link>
                <div class="gy-nav__menu">
                  <router-link to="/hotels" class="gy-nav__menu-all"
                    >All hotels</router-link
                  >
                  <router-link
                    v-for="hotel in hotelProperties"
                    :key="hotel.id"
                    :to="`/hotels/${hotel.slug}`"
                  >
                    {{ hotel.name }}
                  </router-link>
                  <p v-if="!hotelProperties.length" class="gy-nav__empty">
                    Hotels will appear here when published.
                  </p>
                </div>
              </div>

              <div class="gy-nav__dropdown">
                <router-link
                  to="/portfolios/service-apartment"
                  class="gy-nav__link gy-nav__dropbtn"
                >
                  Apartment
                </router-link>
                <div class="gy-nav__menu">
                  <router-link
                    v-for="hotel in apartmentProperties"
                    :key="hotel.id"
                    :to="`/hotels/${hotel.slug}`"
                  >
                    {{ hotel.name }}
                  </router-link>
                  <p v-if="!apartmentProperties.length" class="gy-nav__empty">
                    Apartment stays are coming soon.
                  </p>
                </div>
              </div>

              <router-link to="/locations" class="gy-nav__link">{{
                $t("nav.location")
              }}</router-link>
              <router-link to="/map" class="gy-nav__link">Map</router-link>
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
          </transition>
        </div>

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
      <div class="q-pa-lg gy-drawer__inner">
        <p class="gy-display gy-drawer__brand">Greyon</p>
        <q-list class="gy-drawer__list">
          <q-item clickable v-ripple to="/" @click="drawerOpen = false">
            <q-item-section>{{ $t("nav.home") }}</q-item-section>
          </q-item>
          <q-item
            v-if="auth.featureEnabled('news_public')"
            clickable
            v-ripple
            to="/news"
            @click="drawerOpen = false"
          >
            <q-item-section>{{ $t("nav.news") }}</q-item-section>
          </q-item>

          <q-expansion-item
            dense
            expand-separator
            label="Hotel"
            header-class="gy-drawer__expand"
          >
            <q-item clickable v-ripple to="/hotels" @click="drawerOpen = false">
              <q-item-section>All hotels</q-item-section>
            </q-item>
            <q-item
              v-for="hotel in hotelProperties"
              :key="`d-h-${hotel.id}`"
              clickable
              v-ripple
              :to="`/hotels/${hotel.slug}`"
              @click="drawerOpen = false"
            >
              <q-item-section>{{ hotel.name }}</q-item-section>
            </q-item>
            <q-item v-if="!hotelProperties.length">
              <q-item-section class="gy-muted"
                >Hotels will appear here when published.</q-item-section
              >
            </q-item>
          </q-expansion-item>

          <q-expansion-item
            dense
            expand-separator
            label="Apartment"
            header-class="gy-drawer__expand"
          >
            <q-item
              v-for="hotel in apartmentProperties"
              :key="`d-a-${hotel.id}`"
              clickable
              v-ripple
              :to="`/hotels/${hotel.slug}`"
              @click="drawerOpen = false"
            >
              <q-item-section>{{ hotel.name }}</q-item-section>
            </q-item>
            <q-item v-if="!apartmentProperties.length">
              <q-item-section class="gy-muted"
                >Apartment stays are coming soon.</q-item-section
              >
            </q-item>
          </q-expansion-item>

          <q-item
            clickable
            v-ripple
            to="/locations"
            @click="drawerOpen = false"
          >
            <q-item-section>{{ $t("nav.location") }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/map" @click="drawerOpen = false">
            <q-item-section>Map</q-item-section>
          </q-item>
          <q-item
            v-if="auth.featureEnabled('booking_public')"
            clickable
            v-ripple
            to="/booking"
            @click="drawerOpen = false"
          >
            <q-item-section>{{ $t("nav.booking") }}</q-item-section>
          </q-item>
          <q-item
            v-if="auth.featureEnabled('contact_public')"
            clickable
            v-ripple
            to="/contact"
            @click="drawerOpen = false"
          >
            <q-item-section>{{ $t("nav.contact") }}</q-item-section>
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
import { useRoute } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import CookieNotice from "@/components/CookieNotice.vue";
import SiteFooter from "@/components/SiteFooter.vue";
import { usePageSearchVisibility } from "@/composables/usePageSearchVisibility";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import { useCustomerStore } from "@/stores/customer-store";
import { isApartmentProperty, isHotelProperty } from "@/utils/propertyKind";

const auth = useAuthStore();
const cms = useCmsStore();
const customer = useCustomerStore();
customer.hydrate();
const drawerOpen = ref(false);
const route = useRoute();
const homePastHero = ref(false);
const { pageSearchInView } = usePageSearchVisibility();

const accountInitials = computed(() => {
  const parts = customer.displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
});

const hotelProperties = computed(() =>
  cms.publishedHotels
    .filter(isHotelProperty)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
);

const apartmentProperties = computed(() =>
  cms.publishedHotels
    .filter(isApartmentProperty)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
);

let heroScrollBound = false;

const isHome = computed(() => route.path === "/");

/**
 * Routes that may show the compact navbar search. Hidden while any in-page
 * BookingSearchWidget (`pageAnchor`) is in the viewport so the two bars
 * never appear together; both bind to the same booking-store search state.
 */
const compactSearchEligible = computed(
  () =>
    auth.featureEnabled("booking_public") &&
    (route.name === "hotel-detail" ||
      route.name === "booking" ||
      route.name === "hotels" ||
      route.name === "map" ||
      isHome.value)
);

const showCompactSearch = computed(
  () => compactSearchEligible.value && !pageSearchInView.value
);

const solidHeader = computed(
  () =>
    route.meta.solidHeader === true ||
    !isHome.value ||
    homePastHero.value ||
    // Keep solid chrome once the home hero search has left the viewport
    // and the compact navbar search takes over.
    showCompactSearch.value
);

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

.gy-header--solid .gy-nav__link,
.gy-header--solid .gy-menu-btn {
  color: var(--gy-ink);
}

.gy-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 5.5rem;
}

.gy-logo {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: inherit;
  transition: opacity 0.25s ease;
}

.gy-logo:hover {
  opacity: 0.85;
}

.gy-logo__img {
  display: block;
  height: clamp(3.1rem, 5.2vw, 4.6rem);
  width: auto;
  max-width: min(42vw, 15rem);
  object-fit: contain;
}

.gy-header__center {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.gy-header__search {
  width: 100%;
  max-width: 58rem;
  margin-inline: 0.5rem;
}

.gy-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.15rem 1.5rem;
}

.gy-navswap-enter-active,
.gy-navswap-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
}

.gy-navswap-enter-from {
  opacity: 0;
  transform: translateY(-0.45rem);
}

.gy-navswap-leave-to {
  opacity: 0;
  transform: translateY(0.35rem);
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
  top: calc(100% + 0.35rem);
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  max-height: min(70vh, 22rem);
  overflow-y: auto;
  padding: 0.55rem 0;
  background: var(--gy-cream);
  color: var(--gy-ink);
  box-shadow: var(--gy-shadow);
  border: 1px solid rgba(69, 76, 75, 0.08);
  z-index: 20;
}

.gy-nav__menu a {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--gy-ink);
  font-size: 0.9rem;
  text-transform: none;
  letter-spacing: 0;
}

.gy-nav__menu a:hover {
  background: var(--gy-sand);
}

.gy-nav__menu-all {
  font-weight: 600;
  border-bottom: 1px solid rgba(69, 76, 75, 0.1);
  margin-bottom: 0.2rem;
}

.gy-nav__empty {
  margin: 0;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.gy-nav__dropdown:hover .gy-nav__menu,
.gy-nav__dropdown:focus-within .gy-nav__menu {
  display: block;
}

.gy-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
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
  background: rgba(111, 128, 103, 0.1);
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

.gy-drawer__brand {
  font-size: 2rem;
  margin: 0 0 1rem;
}

.gy-drawer__list :deep(.gy-drawer__expand) {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

@media (max-width: 599px) {
  .gy-header__bar {
    min-height: 4.5rem;
  }

  .gy-logo__img {
    height: 3.25rem;
    max-width: 48vw;
  }
}
</style>
