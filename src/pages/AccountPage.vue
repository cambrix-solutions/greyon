<template>
  <q-page class="account">
    <SeoHead
      title="My account | Greyon"
      description="Your Greyon guest profile and upcoming stays."
    />

    <section class="account-hero" aria-label="Account welcome">
      <div class="account-hero__media" aria-hidden="true" />
      <div class="account-hero__veil" aria-hidden="true" />
      <div class="gy-container account-hero__content">
        <p v-reveal class="account-hero__brand gy-display">Greyon</p>
        <p
          v-reveal="{ delay: '50ms' }"
          class="gy-eyebrow account-hero__eyebrow"
        >
          {{ greeting }}
        </p>
        <h1 v-reveal="{ delay: '90ms' }" class="gy-display account-hero__title">
          {{ firstName }}
        </h1>
        <p v-reveal="{ delay: '130ms' }" class="account-hero__lede">
          Your stays across Cambodia’s cities, coast, and countryside — in one
          quiet place.
        </p>
      </div>
    </section>

    <div class="gy-container account-body">
      <div class="account-layout">
        <aside v-reveal="{ delay: '80ms' }" class="account-profile">
          <div class="account-profile__avatar" aria-hidden="true">
            {{ initials }}
          </div>
          <div class="account-profile__meta">
            <p class="account-profile__name">{{ customer.displayName }}</p>
            <p class="account-profile__email">{{ customer.user?.email }}</p>
            <p class="account-profile__badge">
              <span
                class="account-dot"
                :class="
                  customer.user?.google_id
                    ? 'account-dot--google'
                    : 'account-dot--email'
                "
              />
              {{
                customer.user?.google_id
                  ? "Signed in with Google"
                  : "Signed in with email"
              }}
            </p>
            <p v-if="customer.user?.phone" class="account-profile__phone">
              {{ customer.user.phone }}
            </p>
          </div>
          <button type="button" class="account-signout" @click="onLogout">
            Sign out
          </button>
        </aside>

        <div class="account-main">
          <section v-reveal="{ delay: '120ms' }" class="account-block">
            <header class="account-block__head">
              <div>
                <p class="gy-eyebrow">Stays</p>
                <h2 class="gy-display account-block__title">Upcoming & past</h2>
              </div>
              <router-link
                to="/booking"
                class="gy-btn gy-btn--outline account-block__cta"
                >Book a stay</router-link
              >
            </header>
            <div v-if="loadingBookings" class="account-empty">
              <p class="account-empty__copy">Loading your stays…</p>
            </div>
            <div v-else-if="!myBookings.length" class="account-empty">
              <p class="account-empty__title">No reservations yet</p>
              <p class="account-empty__copy">
                When you book with this email — signed in or as a guest — those
                stays show up here. Same Gmail as a past booking? Sign in and
                we’ll pull it in.
              </p>
              <router-link to="/hotels" class="account-empty__link"
                >Browse hotels →</router-link
              >
            </div>
            <ul v-else class="account-stays">
              <li
                v-for="stay in myBookings"
                :key="stay.id"
                class="account-stay"
              >
                <router-link
                  :to="{
                    name: 'account-booking',
                    params: { reference: stay.reference }
                  }"
                  class="account-stay__link"
                >
                  <div
                    class="account-stay__media"
                    :style="
                      stay.hotelHeroImage
                        ? { backgroundImage: `url(${stay.hotelHeroImage})` }
                        : undefined
                    "
                  />
                  <div class="account-stay__body">
                    <div class="account-stay__top">
                      <p class="account-stay__hotel">
                        {{ stay.hotelName || hotelLabel(stay.hotelId) }}
                      </p>
                      <span class="account-stay__status">{{
                        stay.status
                      }}</span>
                    </div>
                    <p class="account-stay__meta">
                      {{ stay.roomTypeName || roomLabel(stay.roomTypeId) }}
                      · {{ formatStayRange(stay.checkIn, stay.checkOut) }}
                    </p>
                    <p class="account-stay__ref">
                      Ref <strong>{{ stay.reference }}</strong> · ${{
                        stay.total.toFixed(2)
                      }}
                      <span class="account-stay__open">View details →</span>
                    </p>
                  </div>
                </router-link>
              </li>
            </ul>
          </section>

          <section v-reveal="{ delay: '180ms' }" class="account-block">
            <header class="account-block__head">
              <div>
                <p class="gy-eyebrow">Explore</p>
                <h2 class="gy-display account-block__title"
                  >Continue your trip</h2
                >
              </div>
            </header>
            <div class="account-explore">
              <router-link
                v-for="item in exploreLinks"
                :key="item.to"
                :to="item.to"
                class="account-explore__item"
              >
                <span class="account-explore__label">{{ item.label }}</span>
                <span class="account-explore__hint">{{ item.hint }}</span>
              </router-link>
            </div>
          </section>

          <section
            v-if="featuredHotels.length"
            v-reveal="{ delay: '220ms' }"
            class="account-block account-block--flush"
          >
            <header class="account-block__head account-block__head--pad">
              <div>
                <p class="gy-eyebrow">Greyon hotels</p>
                <h2 class="gy-display account-block__title"
                  >Stay inspiration</h2
                >
              </div>
              <router-link to="/hotels" class="account-empty__link"
                >View all →</router-link
              >
            </header>
            <div class="account-hotels">
              <router-link
                v-for="hotel in featuredHotels"
                :key="hotel.id"
                :to="`/hotels/${hotel.slug}`"
                class="account-hotel"
              >
                <div
                  class="account-hotel__img"
                  :style="{ backgroundImage: `url(${hotel.heroImage})` }"
                />
                <div class="account-hotel__copy">
                  <p class="account-hotel__name">{{ hotel.name }}</p>
                  <p class="account-hotel__loc">
                    {{ locationName(hotel.locationId) }}
                  </p>
                </div>
              </router-link>
            </div>
          </section>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import SeoHead from "@/components/SeoHead.vue";
import { fetchMyBookings } from "@/services/engine/frontAuth";
import { useCmsStore } from "@/stores/cms-store";
import { useCustomerStore } from "@/stores/customer-store";
import type { Booking } from "@/types/greyon";
import { formatStayRange } from "@/utils/datetime";

const customer = useCustomerStore();
const cms = useCmsStore();
const router = useRouter();
const myBookings = ref<Booking[]>([]);
const loadingBookings = ref(true);

onMounted(async () => {
  void cms.ensurePublicCatalog();
  loadingBookings.value = true;
  try {
    myBookings.value = await fetchMyBookings();
  } catch {
    myBookings.value = [];
  } finally {
    loadingBookings.value = false;
  }
});

const firstName = computed(() => {
  const name = customer.displayName.trim();
  if (!name) return "Guest";
  return name.split(/\s+/)[0] ?? name;
});

const initials = computed(() => {
  const parts = customer.displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
});

const exploreLinks = [
  { to: "/booking", label: "Book a stay", hint: "Search dates & rooms" },
  { to: "/locations", label: "Destinations", hint: "Cities & coastlines" },
  { to: "/contact", label: "Concierge", hint: "Ask the Greyon team" }
];

const featuredHotels = computed(() => cms.publishedHotels.slice(0, 3));

function locationName(locationId: string) {
  return cms.getLocationById(locationId)?.name ?? "Cambodia";
}

function hotelLabel(hotelId: string) {
  return cms.getHotelById(hotelId)?.name ?? "Greyon hotel";
}

function roomLabel(roomTypeId: string) {
  return cms.getRoomTypeById(roomTypeId)?.name ?? "Room";
}

async function onLogout() {
  await customer.logout();
  void router.push({ name: "sign-in" });
}
</script>

<style scoped>
.account {
  background: var(--gy-sand);
  min-height: 70vh;
  padding-bottom: 4rem;
}

.account-hero {
  position: relative;
  min-height: min(42vh, 380px);
  display: grid;
  align-items: end;
  overflow: hidden;
  margin-bottom: 2.25rem;
}

.account-hero__media {
  position: absolute;
  inset: 0;
  background: url("https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=80")
    center / cover;
  transform: scale(1.04);
  animation: account-hero-drift 28s ease-in-out infinite alternate;
}

.account-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(18, 17, 16, 0.25) 0%,
    rgba(18, 17, 16, 0.55) 45%,
    rgba(18, 17, 16, 0.82) 100%
  );
}

.account-hero__content {
  position: relative;
  z-index: 1;
  padding: 5.5rem 0 2.4rem;
  color: var(--gy-white);
}

.account-hero__brand {
  margin: 0 0 0.85rem;
  font-size: clamp(2.4rem, 7vw, 3.6rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: var(--gy-white);
  opacity: 0.95;
}

.account-hero__eyebrow {
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 0.35rem;
}

.account-hero__title {
  margin: 0 0 0.55rem;
  font-size: clamp(1.85rem, 4.5vw, 2.6rem);
  color: var(--gy-gold);
}

.account-hero__lede {
  margin: 0;
  max-width: 28rem;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.5;
  font-size: 1.02rem;
}

.account-layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 1.75rem 2rem;
  align-items: start;
}

.account-profile {
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  padding: 1.5rem 1.35rem 1.25rem;
  display: grid;
  gap: 1.1rem;
  justify-items: start;
}

.account-profile__avatar {
  width: 4.25rem;
  height: 4.25rem;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--gy-gold), var(--gy-gold-deep));
  color: var(--gy-ink);
  font-family: var(--font-display, inherit);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.account-profile__name {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--gy-ink);
  line-height: 1.25;
}

.account-profile__email,
.account-profile__phone {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.92rem;
  word-break: break-word;
}

.account-profile__badge {
  margin: 0.65rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.account-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--gy-gold);
}

.account-dot--google {
  background: #4285f4;
}

.account-signout {
  margin-top: 0.35rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--gy-gold-deep);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.account-signout:hover {
  color: var(--gy-ink);
}

.account-main {
  display: grid;
  gap: 1.15rem;
  min-width: 0;
}

.account-block {
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  padding: 1.4rem 1.45rem 1.5rem;
}

.account-block--flush {
  padding: 0;
  overflow: hidden;
}

.account-block__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.85rem 1rem;
  margin-bottom: 1.15rem;
}

.account-block__head--pad {
  padding: 1.4rem 1.45rem 0;
  margin-bottom: 1rem;
}

.account-block__title {
  margin: 0.2rem 0 0;
  font-size: clamp(1.35rem, 2.5vw, 1.7rem);
}

.account-block__cta {
  flex-shrink: 0;
}

.account-empty {
  padding: 1.75rem 0.25rem 0.5rem;
  border-top: 1px solid rgba(18, 17, 16, 0.06);
}

.account-empty__title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--gy-ink);
}

.account-empty__copy {
  margin: 0 0 0.85rem;
  color: var(--gy-muted);
  max-width: 32rem;
  line-height: 1.5;
  font-size: 0.95rem;
}

.account-empty__link {
  color: var(--gy-gold-deep);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.92rem;
}

.account-empty__link:hover {
  text-decoration: underline;
}

.account-stays {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid rgba(18, 17, 16, 0.06);
  padding-top: 1rem;
}

.account-stay {
  display: block;
}

.account-stay__link {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 0.9rem;
  align-items: stretch;
  text-decoration: none;
  color: inherit;
  padding: 0.35rem;
  margin: -0.35rem;
  transition: background-color 0.15s ease;
}

.account-stay__link:hover {
  background: rgba(196, 163, 90, 0.08);
}

.account-stay__link:hover .account-stay__open {
  text-decoration: underline;
}

.account-stay__media {
  background:
    linear-gradient(145deg, rgba(196, 163, 90, 0.35), rgba(18, 17, 16, 0.2)),
    var(--gy-stone) center / cover no-repeat;
  min-height: 88px;
}

.account-stay__body {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
  align-content: center;
}

.account-stay__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
}

.account-stay__hotel {
  margin: 0;
  font-weight: 600;
  color: var(--gy-ink);
}

.account-stay__status {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 700;
}

.account-stay__meta,
.account-stay__ref {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.account-stay__open {
  margin-left: 0.45rem;
  color: var(--gy-gold-deep);
  font-weight: 600;
  white-space: nowrap;
}

.account-explore {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.account-explore__item {
  display: grid;
  gap: 0.25rem;
  padding: 1rem 0.95rem;
  border: 1px solid rgba(18, 17, 16, 0.1);
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.account-explore__item:hover {
  border-color: var(--gy-gold);
  background: rgba(196, 163, 90, 0.06);
}

.account-explore__label {
  font-weight: 600;
  color: var(--gy-ink);
}

.account-explore__hint {
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.account-hotels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid rgba(18, 17, 16, 0.06);
}

.account-hotel {
  display: grid;
  grid-template-rows: 140px auto;
  text-decoration: none;
  color: inherit;
  border-right: 1px solid rgba(18, 17, 16, 0.06);
  transition: background 0.2s ease;
}

.account-hotel:last-child {
  border-right: 0;
}

.account-hotel:hover {
  background: rgba(196, 163, 90, 0.05);
}

.account-hotel__img {
  background: var(--gy-stone) center / cover no-repeat;
  transition: transform 0.55s ease;
}

.account-hotel:hover .account-hotel__img {
  transform: scale(1.03);
}

.account-hotel__copy {
  padding: 0.85rem 1rem 1.05rem;
}

.account-hotel__name {
  margin: 0 0 0.2rem;
  font-weight: 600;
  font-size: 0.98rem;
}

.account-hotel__loc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

@keyframes account-hero-drift {
  from {
    transform: scale(1.04) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.1) translate3d(-1.5%, -1%, 0);
  }
}

@media (max-width: 900px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .account-explore,
  .account-hotels {
    grid-template-columns: 1fr;
  }

  .account-hotel {
    grid-template-columns: 120px 1fr;
    grid-template-rows: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(18, 17, 16, 0.06);
  }

  .account-hotel:last-child {
    border-bottom: 0;
  }

  .account-hotel__img {
    min-height: 100px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-hero__media {
    animation: none;
  }

  .account-hotel:hover .account-hotel__img {
    transform: none;
  }
}
</style>
