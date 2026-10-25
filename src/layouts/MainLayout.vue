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

        <div class="gy-header__center">
          <!-- Desktop (≥1100): all eight links stay in their own track. -->
          <nav class="gy-nav">
            <router-link
              to="/"
              class="gy-nav__link"
              active-class="gy-nav__link--ancestor"
              exact-active-class="is-current"
              >{{ $t("nav.home") }}</router-link
            >
            <router-link
              v-if="auth.featureEnabled('news_public')"
              to="/news"
              class="gy-nav__link"
              >{{ $t("nav.news") }}</router-link
            >

            <div
              class="gy-nav__dropdown"
              :class="{ 'is-open': openNavMenu === 'services' }"
              @mouseenter="onMenuEnter('services')"
              @mouseleave="onMenuLeave"
            >
              <button
                type="button"
                class="gy-nav__link gy-nav__dropbtn"
                aria-haspopup="true"
                :aria-expanded="openNavMenu === 'services'"
                @click="toggleMenu('services')"
              >
                Services
              </button>
              <div
                v-show="openNavMenu === 'services'"
                class="gy-nav__mega-wrap"
              >
                <ServicesMegaMenu
                  menu-label="Services"
                  :sections="hotelMenuSections"
                  :loading="catalogLoading"
                  @keep-open="onMenuEnter('services')"
                  @request-close="onMenuLeave"
                  @navigate="closeAllNavMenus"
                />
              </div>
            </div>

            <div
              class="gy-nav__dropdown"
              :class="{ 'is-open': openNavMenu === 'apartments' }"
              @mouseenter="onMenuEnter('apartments')"
              @mouseleave="onMenuLeave"
            >
              <button
                type="button"
                class="gy-nav__link gy-nav__dropbtn"
                aria-haspopup="true"
                :aria-expanded="openNavMenu === 'apartments'"
                @click="toggleMenu('apartments')"
              >
                Apartments
              </button>
              <div
                v-show="openNavMenu === 'apartments'"
                class="gy-nav__mega-wrap"
              >
                <ServicesMegaMenu
                  menu-label="Apartments"
                  :sections="apartmentMenuSections"
                  :loading="catalogLoading"
                  @keep-open="onMenuEnter('apartments')"
                  @request-close="onMenuLeave"
                  @navigate="closeAllNavMenus"
                />
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
        </div>

        <div class="gy-header__actions">
          <!-- Icon + “Search” at every width. Destination and dates from 1440px. -->
          <button
            v-if="showCompactSearch"
            type="button"
            class="gy-header__search-trigger"
            aria-haspopup="dialog"
            :aria-expanded="headerSearchOpen"
            :aria-label="headerSearchAriaLabel"
            @click="headerSearchOpen = true"
          >
            <q-icon
              name="search"
              size="18px"
              class="gy-header__search-trigger-icon"
            />
            <span class="gy-header__search-trigger-label">Search</span>
            <span
              v-if="headerSearchSummary"
              class="gy-header__search-trigger-summary"
              >{{ headerSearchSummary }}</span
            >
          </button>
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
            round
            icon="menu"
            class="gy-menu-btn"
            aria-label="Open menu"
            size="md"
            padding="10px"
            @click="openDrawer"
          />
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      side="right"
      overlay
      elevated
      :width="360"
      behavior="mobile"
      class="gy-drawer"
    >
      <div class="gy-drawer__sheet">
        <header class="gy-drawer__header">
          <router-link
            to="/"
            class="gy-drawer__logo"
            aria-label="Greyon home"
            @click="drawerOpen = false"
          >
            <img
              src="/logo/Logo V1-04-04.png"
              alt="Greyon"
              width="140"
              height="48"
            />
          </router-link>
          <button
            type="button"
            class="gy-drawer__close"
            aria-label="Close menu"
            @click="drawerOpen = false"
          >
            <q-icon name="close" size="22px" />
          </button>
        </header>

        <nav class="gy-drawer__nav" aria-label="Site">
          <router-link
            v-for="item in drawerPrimaryLinks"
            :key="item.to"
            :to="item.to"
            class="gy-drawer__link"
            :active-class="
              item.to === '/'
                ? 'gy-drawer__link--ancestor'
                : 'router-link-active'
            "
            :exact-active-class="
              item.to === '/' ? 'is-current' : 'router-link-exact-active'
            "
            @click="drawerOpen = false"
          >
            <span class="gy-drawer__link-icon" aria-hidden="true">
              <q-icon :name="item.icon" size="22px" />
            </span>
            <span>{{ item.label }}</span>
          </router-link>

          <div class="gy-drawer__divider" />

          <div class="gy-drawer__services">
            <div class="gy-drawer__panel">
              <button
                type="button"
                class="gy-drawer__panel-head"
                :aria-expanded="drawerServicesOpen"
                @click="drawerServicesOpen = !drawerServicesOpen"
              >
                <span class="gy-drawer__panel-thumb" aria-hidden="true">
                  <q-icon name="hotel" size="22px" />
                </span>
                <span class="gy-drawer__panel-copy">
                  <strong>Services</strong>
                  <em>{{ hotelsSubtitle }}</em>
                </span>
                <q-icon
                  :name="drawerServicesOpen ? 'expand_less' : 'expand_more'"
                  size="20px"
                />
              </button>
              <div v-show="drawerServicesOpen" class="gy-drawer__panel-body">
                <div v-if="catalogLoading" class="gy-drawer__skels">
                  <div v-for="n in 3" :key="n" class="gy-drawer__skel-row">
                    <span class="gy-drawer__skel-thumb" />
                    <span class="gy-drawer__skel-text"> <span /><span /> </span>
                  </div>
                </div>
                <template v-else-if="hotelNavItems.length">
                  <router-link
                    v-for="item in hotelNavItems"
                    :key="item.id"
                    :to="`/hotels/${item.slug}`"
                    class="gy-drawer__property"
                    @click="drawerOpen = false"
                  >
                    <img
                      :src="item.thumb"
                      :alt="item.name"
                      class="gy-drawer__property-thumb"
                      loading="lazy"
                    />
                    <span class="gy-drawer__property-meta">
                      <strong>{{ item.name }}</strong>
                      <em>{{ item.city }}</em>
                    </span>
                  </router-link>
                </template>
                <p v-else class="gy-drawer__soon">Coming soon</p>
                <router-link
                  to="/hotels"
                  class="gy-drawer__view-all"
                  @click="drawerOpen = false"
                >
                  View all hotels
                  <q-icon name="arrow_forward" size="16px" />
                </router-link>
              </div>
            </div>

            <div class="gy-drawer__panel">
              <button
                type="button"
                class="gy-drawer__panel-head"
                :aria-expanded="drawerApartmentsOpen"
                @click="drawerApartmentsOpen = !drawerApartmentsOpen"
              >
                <span class="gy-drawer__panel-thumb" aria-hidden="true">
                  <q-icon name="apartment" size="22px" />
                </span>
                <span class="gy-drawer__panel-copy">
                  <strong>Apartments</strong>
                  <em>{{ apartmentsSubtitle }}</em>
                </span>
                <q-icon
                  :name="drawerApartmentsOpen ? 'expand_less' : 'expand_more'"
                  size="20px"
                />
              </button>
              <div v-show="drawerApartmentsOpen" class="gy-drawer__panel-body">
                <div v-if="catalogLoading" class="gy-drawer__skels">
                  <div
                    v-for="n in 2"
                    :key="`apt-${n}`"
                    class="gy-drawer__skel-row"
                  >
                    <span class="gy-drawer__skel-thumb" />
                    <span class="gy-drawer__skel-text"> <span /><span /> </span>
                  </div>
                </div>
                <template v-else-if="apartmentNavItems.length">
                  <router-link
                    v-for="item in apartmentNavItems"
                    :key="item.id"
                    :to="`/hotels/${item.slug}`"
                    class="gy-drawer__property"
                    @click="drawerOpen = false"
                  >
                    <img
                      :src="item.thumb"
                      :alt="item.name"
                      class="gy-drawer__property-thumb"
                      loading="lazy"
                    />
                    <span class="gy-drawer__property-meta">
                      <strong>{{ item.name }}</strong>
                      <em>{{ item.city }}</em>
                    </span>
                  </router-link>
                </template>
                <p v-else class="gy-drawer__soon">Coming soon</p>
                <router-link
                  to="/apartments"
                  class="gy-drawer__view-all"
                  @click="drawerOpen = false"
                >
                  View all apartments
                  <q-icon name="arrow_forward" size="16px" />
                </router-link>
              </div>
            </div>
          </div>

          <div class="gy-drawer__divider" />

          <router-link
            v-for="item in drawerSecondaryLinks"
            :key="item.to"
            :to="item.to"
            class="gy-drawer__link"
            @click="drawerOpen = false"
          >
            <span class="gy-drawer__link-icon" aria-hidden="true">
              <q-icon :name="item.icon" size="22px" />
            </span>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <footer class="gy-drawer__footer">
          <router-link
            v-if="customer.isAuthenticated"
            to="/account"
            class="gy-btn gy-drawer__cta"
            @click="drawerOpen = false"
          >
            My account
          </router-link>
          <router-link
            v-else
            to="/sign-in"
            class="gy-btn gy-btn--outline gy-drawer__cta"
            @click="drawerOpen = false"
          >
            Sign in
          </router-link>
          <router-link
            v-if="auth.featureEnabled('booking_public')"
            to="/booking"
            class="gy-btn gy-drawer__cta"
            @click="drawerOpen = false"
          >
            {{ $t("nav.bookNow") }}
          </router-link>
        </footer>
      </div>
    </q-drawer>

    <q-page-container class="gy-page-container">
      <router-view v-slot="{ Component, route: r }">
        <transition name="gy-page" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>
      <SiteFooter />
      <CookieNotice :hidden="drawerOpen" />
    </q-page-container>

    <q-dialog
      v-model="headerSearchOpen"
      position="top"
      transition-show="slide-down"
      transition-hide="slide-up"
    >
      <div class="gy-header-search-sheet">
        <header class="gy-header-search-sheet__head">
          <h2 class="gy-header-search-sheet__title">Search stays</h2>
          <button
            type="button"
            class="gy-header-search-sheet__close"
            aria-label="Close search"
            @click="headerSearchOpen = false"
          >
            <q-icon name="close" size="22px" />
          </button>
        </header>
        <BookingSearchWidget
          stacked
          :page-anchor="false"
          :show-special-rates="false"
          :navigate="true"
          submit-label="Search availability"
        />
      </div>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import CookieNotice from "@/components/CookieNotice.vue";
import ServicesMegaMenu from "@/components/ServicesMegaMenu.vue";
import SiteFooter from "@/components/SiteFooter.vue";
import { usePageSearchVisibility } from "@/composables/usePageSearchVisibility";
import { useAuthStore } from "@/stores/auth-store";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import { useCustomerStore } from "@/stores/customer-store";
import { parseYmd } from "@/utils/datetime";
import {
  filterApartmentServices,
  filterHotelServices,
  toServiceNavItem
} from "@/utils/serviceNav";

const auth = useAuthStore();
const cms = useCmsStore();
const booking = useBookingStore();
const customer = useCustomerStore();
customer.hydrate();
const { t } = useI18n();
const route = useRoute();
const { pageSearchInView } = usePageSearchVisibility();

type NavMenuId = "services" | "apartments";

const drawerOpen = ref(false);
const drawerServicesOpen = ref(false);
const drawerApartmentsOpen = ref(false);
const homePastHero = ref(false);
const openNavMenu = ref<NavMenuId | null>(null);
const catalogLoading = ref(false);
const headerSearchOpen = ref(false);

const CLOSE_DELAY_MS = 240;
let closeServicesTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseServicesTimer() {
  if (closeServicesTimer) {
    clearTimeout(closeServicesTimer);
    closeServicesTimer = null;
  }
}

async function refreshCatalogIfNeeded(force = false) {
  const empty = cms.publishedHotels.length === 0;
  if (!force && !empty && !cms.catalogSyncing) return;
  catalogLoading.value = true;
  try {
    await cms.ensurePublicCatalog(force || empty);
  } catch {
    // Friendly empty / prior error state — UI shows Coming soon only when truly empty.
  } finally {
    catalogLoading.value = Boolean(cms.catalogSyncing);
    if (!cms.catalogSyncing) catalogLoading.value = false;
  }
}

function onMenuEnter(id: NavMenuId) {
  clearCloseServicesTimer();
  openNavMenu.value = id;
  void refreshCatalogIfNeeded(false);
}

function onMenuLeave() {
  clearCloseServicesTimer();
  closeServicesTimer = setTimeout(() => {
    openNavMenu.value = null;
    closeServicesTimer = null;
  }, CLOSE_DELAY_MS);
}

function toggleMenu(id: NavMenuId) {
  clearCloseServicesTimer();
  openNavMenu.value = openNavMenu.value === id ? null : id;
  if (openNavMenu.value) void refreshCatalogIfNeeded(false);
}

function closeAllNavMenus() {
  clearCloseServicesTimer();
  openNavMenu.value = null;
}

function onDocumentPointerDown(event: Event) {
  if (!openNavMenu.value) return;
  const target = event.target as Node | null;
  const roots = document.querySelectorAll(".gy-nav__dropdown");
  for (const root of roots) {
    if (target && root.contains(target)) return;
  }
  closeAllNavMenus();
}

async function openDrawer() {
  drawerOpen.value = true;
  void refreshCatalogIfNeeded(cms.publishedHotels.length === 0);
}

const accountInitials = computed(() => {
  const parts = customer.displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
});

function cityFor(hotelIdLocation: string) {
  return cms.getLocationById(hotelIdLocation)?.name;
}

const hotelNavItems = computed(() =>
  filterHotelServices(cms.publishedHotels).map(h =>
    toServiceNavItem(h, cityFor(h.locationId))
  )
);

const apartmentNavItems = computed(() =>
  filterApartmentServices(cms.publishedHotels).map(h =>
    toServiceNavItem(h, cityFor(h.locationId))
  )
);

const hotelsSubtitle = computed(() => {
  if (catalogLoading.value) return "Loading…";
  const n = hotelNavItems.value.length;
  if (!n) return "Our hotel collection";
  return n === 1 ? "1 property" : `${n} properties`;
});

const apartmentsSubtitle = computed(() => {
  if (catalogLoading.value) return "Loading…";
  const n = apartmentNavItems.value.length;
  if (!n) return "Serviced stays";
  return n === 1 ? "1 property" : `${n} properties`;
});

const hotelMenuSections = computed(() => [
  {
    id: "hotels",
    label: "Hotels",
    subtitle: hotelsSubtitle.value,
    icon: "hotel",
    items: hotelNavItems.value,
    viewAllTo: "/hotels",
    viewAllLabel: "View all hotels"
  }
]);

const apartmentMenuSections = computed(() => [
  {
    id: "apartments",
    label: "Apartments",
    subtitle: apartmentsSubtitle.value,
    icon: "apartment",
    items: apartmentNavItems.value,
    viewAllTo: "/apartments",
    viewAllLabel: "View all apartments"
  }
]);

const drawerPrimaryLinks = computed(() => {
  const items = [
    { label: t("nav.home"), to: "/", icon: "home" as const },
    ...(auth.featureEnabled("news_public")
      ? [{ label: t("nav.news"), to: "/news", icon: "newspaper" as const }]
      : [])
  ];
  return items;
});

const drawerSecondaryLinks = computed(() => {
  const items = [
    { label: "Destination", to: "/locations", icon: "place" as const },
    { label: "Map", to: "/map", icon: "map" as const }
  ];
  if (auth.featureEnabled("booking_public")) {
    items.push({ label: t("nav.booking"), to: "/booking", icon: "event" });
  }
  if (auth.featureEnabled("contact_public")) {
    items.push({ label: t("nav.contact"), to: "/contact", icon: "mail" });
  }
  return items;
});

let heroScrollBound = false;

const isHome = computed(() => route.path === "/");

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

function dayMonthShort(ymd: string) {
  const d = parseYmd(ymd);
  return d
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
}

/**
 * Optional summary beside the always-visible “Search” label.
 * Shown from 1440px up, when the header has room for destination and dates.
 */
const headerSearchSummary = computed(() => {
  const slug = booking.search.locationSlug;
  const dest = slug
    ? cms.publishedLocations.find(l => l.slug === slug)?.name
    : "";
  const { checkIn, checkOut } = booking.search;
  const dates =
    checkIn && checkOut
      ? `${dayMonthShort(checkIn)}–${dayMonthShort(checkOut)}`
      : "";
  if (dest && dates) return `${dest} · ${dates}`;
  if (dest) return dest;
  if (dates) return dates;
  return "";
});

const headerSearchAriaLabel = computed(() => {
  const summary = headerSearchSummary.value;
  return summary ? `Search — ${summary}` : "Search";
});

const solidHeader = computed(
  () =>
    route.meta.solidHeader === true ||
    !isHome.value ||
    homePastHero.value ||
    showCompactSearch.value
);

function syncHomeHeader() {
  if (!isHome.value) {
    homePastHero.value = false;
    return;
  }
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
  () => route.fullPath,
  async () => {
    closeAllNavMenus();
    headerSearchOpen.value = false;
    await nextTick();
    requestAnimationFrame(syncHomeHeader);
  }
);

watch(showCompactSearch, visible => {
  if (!visible) headerSearchOpen.value = false;
});

watch(drawerOpen, open => {
  if (open) void refreshCatalogIfNeeded(cms.publishedHotels.length === 0);
});

watch(
  () => cms.catalogSyncing,
  syncing => {
    if (!syncing) catalogLoading.value = false;
  }
);

onMounted(async () => {
  void refreshCatalogIfNeeded(true);
  await nextTick();
  bindHeroScroll();
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onUnmounted(() => {
  unbindHeroScroll();
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  clearCloseServicesTimer();
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

.gy-menu-btn {
  min-width: 44px !important;
  min-height: 44px !important;
}

.gy-header__bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  /* Wider than the 1200px page column so logo, nav, and actions each fit. */
  width: min(1680px, calc(100% - 1.5rem));
  max-width: 1680px;
  gap: clamp(0.45rem, 1vw, 1rem);
  min-height: 5.5rem;
  min-width: 0;
}

.gy-logo {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
  color: inherit;
  transition: opacity 0.25s ease;
}

.gy-logo:hover {
  opacity: 0.85;
}

.gy-logo__img {
  display: block;
  height: 2.85rem;
  width: auto;
  max-width: 8.75rem;
  object-fit: contain;
}

.gy-header__center {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gy-header__search {
  width: 100%;
  max-width: min(22rem, 100%);
  margin-inline: 0.35rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.gy-header__search-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: min(100%, 22rem);
  min-height: 2.75rem;
  padding: 0.35rem 0.85rem 0.35rem 0.65rem;
  border: 1px solid rgba(69, 76, 75, 0.14);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-ink);
  box-shadow: 0 8px 22px rgba(28, 36, 33, 0.1);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.gy-header__search-pill:hover {
  box-shadow: 0 10px 26px rgba(28, 36, 33, 0.14);
}

.gy-header__search-pill:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: 2px;
}

.gy-header__pill-icon {
  flex-shrink: 0;
  color: var(--gy-forest);
}

.gy-header__pill-text {
  display: grid;
  gap: 0.05rem;
  min-width: 0;
}

.gy-header__pill-title {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gy-header__pill-sub {
  font-size: 0.68rem;
  color: var(--gy-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Desktop search: always an obvious pill (icon + “Search”), never icon-only. */
.gy-header__search-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex: 0 0 auto;
  max-width: none;
  min-height: 2.5rem;
  padding: 0.35rem 0.85rem 0.35rem 0.65rem;
  border: 1.5px solid var(--gy-forest);
  border-radius: 999px;
  background: var(--gy-forest);
  color: var(--gy-white);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(69, 76, 75, 0.18);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.gy-header__search-trigger:hover {
  background: var(--gy-ink);
  border-color: var(--gy-ink);
  box-shadow: 0 8px 20px rgba(28, 36, 33, 0.22);
}

.gy-header__search-trigger:active {
  transform: scale(0.98);
}

.gy-header__search-trigger:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.gy-header:not(.gy-header--solid) .gy-header__search-trigger {
  border-color: var(--gy-gold);
  background: var(--gy-gold);
  color: var(--gy-ink);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
}

.gy-header:not(.gy-header--solid) .gy-header__search-trigger:hover {
  background: var(--gy-white);
  border-color: var(--gy-white);
  color: var(--gy-ink);
}

.gy-header__search-trigger-icon {
  flex-shrink: 0;
  color: inherit;
}

.gy-header__search-trigger-label {
  flex-shrink: 0;
  line-height: 1;
  white-space: nowrap;
}

.gy-header__search-trigger-summary {
  display: none;
  min-width: 0;
  max-width: 11rem;
  margin-left: 0.15rem;
  padding-left: 0.55rem;
  border-left: 1px solid rgba(255, 255, 255, 0.35);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.92;
}

.gy-header:not(.gy-header--solid) .gy-header__search-trigger-summary {
  border-left-color: rgba(18, 17, 16, 0.22);
}

@media (min-width: 1440px) {
  .gy-header__search-trigger-summary {
    display: inline;
    max-width: 14rem;
  }
}

.gy-header-search-sheet {
  width: min(35rem, calc(100vw - 1.5rem));
  max-width: 560px;
  margin: 0.75rem auto;
  padding: 1rem 1rem 1.15rem;
  border-radius: 18px;
  background: var(--gy-cream, #f7f4ef);
  color: var(--gy-ink);
  box-shadow: 0 18px 48px rgba(28, 36, 33, 0.18);
}

@media (max-width: 599px) {
  .gy-header-search-sheet {
    width: calc(100vw - 1rem);
    max-width: none;
    margin: 0.5rem;
    border-radius: 16px;
  }
}

.gy-header-search-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.gy-header-search-sheet__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
}

.gy-header-search-sheet__close {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: rgba(69, 76, 75, 0.08);
  color: var(--gy-ink);
  cursor: pointer;
}

.gy-header-search-sheet__close:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: 2px;
}

.gy-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 0.28rem 0.42rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.gy-nav__link,
.gy-nav__dropbtn {
  position: relative;
  flex: 0 0 auto;
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  opacity: 0.9;
  color: inherit;
  background: none;
  border: 0;
  padding: 0.2rem 0;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition:
    opacity 0.25s ease,
    color 0.25s ease;
}

/* Full nav from 1100px. Below that, the drawer takes over. */
@media (max-width: 1099px) {
  .gy-nav {
    display: none !important;
  }

  .gy-header__actions {
    margin-left: auto;
    gap: 0.4rem;
  }

  .gy-header__search-trigger {
    padding: 0.32rem 0.7rem 0.32rem 0.5rem;
    font-size: 0.7rem;
  }

  .gy-signin-btn,
  .gy-header__actions .gy-btn--sm {
    padding-inline: 0.6rem;
    font-size: 0.68rem;
  }
}

@media (min-width: 1100px) {
  .gy-menu-btn {
    display: none !important;
  }
}

@media (min-width: 1280px) {
  .gy-nav {
    gap: 0.4rem 0.75rem;
  }

  .gy-nav__link,
  .gy-nav__dropbtn {
    font-size: 0.76rem;
    letter-spacing: 0.035em;
  }

  .gy-logo__img {
    height: 3.35rem;
    max-width: 10.5rem;
  }
}

@media (min-width: 1440px) {
  .gy-nav {
    gap: 0.5rem 0.95rem;
  }

  .gy-nav__link,
  .gy-nav__dropbtn {
    font-size: 0.8rem;
    letter-spacing: 0.04em;
  }

  .gy-logo__img {
    height: 4rem;
    max-width: 13rem;
  }
}

@media (min-width: 1680px) {
  .gy-nav {
    gap: 0.6rem 1.25rem;
  }

  .gy-nav__link,
  .gy-nav__dropbtn {
    font-size: 0.84rem;
    letter-spacing: 0.045em;
  }

  .gy-logo__img {
    height: 4.5rem;
    max-width: 15rem;
  }
}

.gy-nav__link::after,
.gy-nav__dropbtn::after {
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
.gy-nav__link.is-current::after,
.gy-nav__link.router-link-active::after,
.gy-nav__dropdown.is-open .gy-nav__dropbtn::after {
  transform: scaleX(1);
}

.gy-nav__link.is-current,
.gy-nav__link.router-link-active,
.gy-nav__link:hover,
.gy-nav__dropbtn:hover,
.gy-nav__dropdown.is-open .gy-nav__dropbtn {
  opacity: 1;
  color: var(--gy-gold);
}

.gy-header--solid .gy-nav__link.is-current,
.gy-header--solid .gy-nav__link.router-link-active,
.gy-header--solid .gy-nav__link:hover,
.gy-header--solid .gy-nav__dropbtn:hover,
.gy-header--solid .gy-nav__dropdown.is-open .gy-nav__dropbtn {
  color: var(--gy-gold-deep);
}

.gy-nav__dropdown {
  position: relative;
}

.gy-nav__mega-wrap {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  padding-top: 0.15rem;
}

.gy-header__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 0 0 auto;
  min-width: 0;
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

/* ---- Mobile drawer sheet ---- */
.gy-drawer {
  background: var(--gy-cream) !important;
}

/*
 * Quasar puts this component's class on the inner content node, not the
 * positioned aside, so a z-index on .gy-drawer never lifts the panel.
 * The backdrop rule is :deep and does apply, which left the dimmer (5990)
 * above the aside (3000) and swallowed every tap. Raise the aside itself.
 * Backdrop stays just under it, and above the cookie banner (z-index 5000).
 */
.gy-layout :deep(.q-drawer--on-top) {
  z-index: 6000 !important;
}

.gy-layout :deep(.q-drawer__backdrop) {
  z-index: 5990 !important;
}

.gy-drawer :deep(.q-drawer__content) {
  background: var(--gy-cream);
}

.gy-drawer__sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--gy-cream);
  color: var(--gy-ink);
}

.gy-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: calc(0.85rem + env(safe-area-inset-top, 0px)) 1.1rem 0.85rem;
  border-bottom: 1px solid rgba(69, 76, 75, 0.08);
  background: var(--gy-white);
}

.gy-drawer__logo img {
  display: block;
  height: 2.4rem;
  width: auto;
}

.gy-drawer__close {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 999px;
  background: var(--gy-sand);
  color: var(--gy-ink);
  cursor: pointer;
}

.gy-drawer__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.65rem 0.85rem 1rem;
  -webkit-overflow-scrolling: touch;
}

.gy-drawer__link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 3.1rem;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
}

.gy-drawer__link:hover,
.gy-drawer__link.is-current,
.gy-drawer__link.router-link-active {
  background: var(--gy-sand);
}

.gy-drawer__link-icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 10px;
  background: var(--gy-sand);
  color: var(--gy-forest);
  flex-shrink: 0;
}

.gy-drawer__divider {
  height: 1px;
  margin: 0.55rem 0.4rem;
  background: rgba(69, 76, 75, 0.1);
}

.gy-drawer__services {
  display: grid;
  gap: 0.45rem;
}

.gy-drawer__accordion-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-height: 3.1rem;
  padding: 0.55rem 0.7rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--gy-ink);
  font: inherit;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.gy-drawer__accordion-btn:hover {
  background: var(--gy-sand);
}

.gy-drawer__accordion-label {
  flex: 1;
}

.gy-drawer__chevron {
  color: var(--gy-muted);
}

.gy-drawer__panels {
  display: grid;
  gap: 0.65rem;
  padding: 0.15rem 0 0.35rem;
}

.gy-drawer__panel {
  border: 1px solid rgba(69, 76, 75, 0.1);
  border-radius: 14px;
  background: var(--gy-white);
  overflow: hidden;
}

.gy-drawer__panel-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3.5rem;
  padding: 0.7rem 0.8rem;
  border: 0;
  background: transparent;
  color: var(--gy-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.gy-drawer__panel-thumb {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 10px;
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
  flex-shrink: 0;
}

.gy-drawer__panel-copy {
  flex: 1;
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.gy-drawer__panel-copy strong {
  font-family: var(--font-display);
  font-size: 0.98rem;
  font-weight: 700;
}

.gy-drawer__panel-copy em {
  font-style: normal;
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.gy-drawer__panel-body {
  display: grid;
  gap: 0.2rem;
  padding: 0 0.55rem 0.7rem;
  border-top: 1px solid rgba(69, 76, 75, 0.08);
}

.gy-drawer__property {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.45rem 0.35rem;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}

.gy-drawer__property:hover {
  background: var(--gy-sand);
}

.gy-drawer__property-thumb {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: cover;
  border-radius: 8px;
  background: var(--gy-sand);
  flex-shrink: 0;
}

.gy-drawer__property-meta {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.gy-drawer__property-meta strong {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gy-drawer__property-meta em {
  font-style: normal;
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.gy-drawer__soon {
  margin: 0.55rem 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  background: var(--gy-sand);
  color: var(--gy-muted);
  font-size: 0.9rem;
  font-style: italic;
}

.gy-drawer__view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.35rem 0.25rem 0.15rem;
  padding: 0.65rem 0.35rem;
  min-height: 2.75rem;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}

.gy-drawer__skels {
  display: grid;
  gap: 0.35rem;
  padding: 0.45rem 0.2rem;
}

.gy-drawer__skel-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-height: 3.25rem;
}

.gy-drawer__skel-thumb {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 8px;
  background: linear-gradient(90deg, #ebe7e2, #f5f2ee, #ebe7e2);
  background-size: 200% 100%;
  animation: gy-shimmer 1.2s ease infinite;
}

.gy-drawer__skel-text {
  flex: 1;
  display: grid;
  gap: 0.4rem;
}

.gy-drawer__skel-text span {
  display: block;
  height: 0.65rem;
  border-radius: 4px;
  background: linear-gradient(90deg, #ebe7e2, #f5f2ee, #ebe7e2);
  background-size: 200% 100%;
  animation: gy-shimmer 1.2s ease infinite;
}

.gy-drawer__skel-text span:last-child {
  width: 50%;
}

@keyframes gy-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.gy-drawer__footer {
  display: grid;
  gap: 0.65rem;
  /* Extra bottom pad clears the cookie banner if it ever peeks through. */
  padding: 0.9rem 1rem
    calc(
      0.9rem + env(safe-area-inset-bottom, 0px) +
        var(--gy-cookie-clearance, 0px)
    );
  border-top: 1px solid rgba(69, 76, 75, 0.1);
  background: var(--gy-white);
}

.gy-layout:has(.cookie-notice) {
  --gy-cookie-clearance: 7.5rem;
}

.gy-drawer__cta {
  width: 100%;
  min-height: 3.1rem;
}

@media (max-width: 599px) {
  .gy-header__bar {
    min-height: 4.5rem;
    width: calc(100% - 1rem);
  }

  .gy-logo__img {
    height: 2.65rem;
    max-width: 7.25rem;
  }
}
</style>
