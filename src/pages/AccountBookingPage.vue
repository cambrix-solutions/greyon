<template>
  <q-page class="stay-detail">
    <SeoHead
      :title="stay ? `${stay.reference} | Greyon` : 'Booking details | Greyon'"
      description="Your Greyon reservation details."
    />

    <div class="gy-container stay-detail__wrap">
      <router-link to="/account" class="stay-detail__back"
        >← Back to account</router-link
      >

      <div v-if="loading" class="stay-detail__state">
        <p>Loading reservation…</p>
      </div>

      <div v-else-if="error" class="stay-detail__state">
        <p class="stay-detail__state-title">{{ error }}</p>
        <router-link to="/account" class="gy-btn gy-btn--outline"
          >View all stays</router-link
        >
      </div>

      <template v-else-if="stay">
        <header class="stay-detail__hero">
          <div
            class="stay-detail__media"
            :style="
              stay.hotelHeroImage
                ? { backgroundImage: `url(${stay.hotelHeroImage})` }
                : undefined
            "
            aria-hidden="true"
          />
          <div class="stay-detail__hero-copy">
            <p class="gy-eyebrow">Reservation</p>
            <h1 class="gy-display stay-detail__title">
              {{ stay.hotelName || hotelLabel(stay.hotelId) }}
            </h1>
            <p class="stay-detail__status">{{ stay.status }}</p>
            <p class="stay-detail__ref">
              Ref <strong>{{ stay.reference }}</strong>
            </p>
          </div>
        </header>

        <div class="stay-detail__grid">
          <section class="stay-panel">
            <h2 class="stay-panel__title">Stay</h2>
            <dl class="stay-dl">
              <div>
                <dt>Dates</dt>
                <dd>
                  {{
                    formatStayRange(stay.checkIn, stay.checkOut, {
                      checkInTime: hotel?.checkInTime,
                      checkOutTime: hotel?.checkOutTime
                    })
                  }}
                </dd>
              </div>
              <div>
                <dt>Room</dt>
                <dd>
                  {{ stay.roomTypeName || roomLabel(stay.roomTypeId) }}
                </dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>
                  {{ stay.ratePlanName || rateLabel(stay.ratePlanId) }}
                </dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>
                  {{ stay.rooms }} room(s) · {{ stay.adults }} adult(s)
                  <template v-if="stay.children"
                    >· {{ stay.children }} child(ren)</template
                  >
                </dd>
              </div>
            </dl>
            <router-link
              v-if="stay.hotelSlug"
              :to="`/hotels/${stay.hotelSlug}`"
              class="stay-panel__link"
              >View hotel →</router-link
            >
          </section>

          <section class="stay-panel">
            <h2 class="stay-panel__title">Guest</h2>
            <dl class="stay-dl">
              <div>
                <dt>Name</dt>
                <dd>{{ stay.guest.fullName || "—" }}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{{ stay.guest.email || "—" }}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{{ stay.guest.phone || "—" }}</dd>
              </div>
              <div v-if="stay.guest.specialRequests">
                <dt>Requests</dt>
                <dd>{{ stay.guest.specialRequests }}</dd>
              </div>
            </dl>
          </section>

          <section class="stay-panel stay-panel--price">
            <h2 class="stay-panel__title">Price</h2>
            <div class="stay-price">
              <div class="stay-price__row">
                <span>Subtotal</span>
                <span>${{ stay.subtotal.toFixed(2) }}</span>
              </div>
              <div class="stay-price__row">
                <span>Taxes & fees</span>
                <span>${{ stay.taxesFees.toFixed(2) }}</span>
              </div>
              <div class="stay-price__row stay-price__row--total">
                <span>Total</span>
                <span>${{ stay.total.toFixed(2) }}</span>
              </div>
            </div>
            <p class="stay-price__note">
              Payment is handled offline according to hotel policy. You’ll hear
              from the hotel once this request is confirmed.
            </p>
          </section>
        </div>

        <p v-if="stay.createdAt" class="stay-detail__meta">
          Requested {{ formatDateTime(stay.createdAt) }}
          <template v-if="stay.source"> · via {{ stay.source }}</template>
        </p>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SeoHead from "@/components/SeoHead.vue";
import { fetchMyBooking } from "@/services/engine/frontAuth";
import { useCmsStore } from "@/stores/cms-store";
import type { Booking } from "@/types/greyon";
import { formatDateTime, formatStayRange } from "@/utils/datetime";

const route = useRoute();
const cms = useCmsStore();

const stay = ref<Booking | null>(null);
const loading = ref(true);
const error = ref("");

const hotel = computed(() =>
  stay.value ? cms.getHotelById(stay.value.hotelId) : undefined
);

async function load() {
  const reference = String(route.params.reference || "");
  if (!reference) {
    error.value = "Missing booking reference.";
    stay.value = null;
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    void cms.ensurePublicCatalog();
    stay.value = await fetchMyBooking(reference);
  } catch {
    stay.value = null;
    error.value = "We couldn’t find that reservation on your account.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.reference, load);

function hotelLabel(hotelId: string) {
  return cms.getHotelById(hotelId)?.name ?? "Greyon hotel";
}

function roomLabel(roomTypeId: string) {
  return cms.getRoomTypeById(roomTypeId)?.name ?? "Room";
}

function rateLabel(ratePlanId: string) {
  return cms.getRatePlanById(ratePlanId)?.name ?? "Rate plan";
}
</script>

<style scoped>
.stay-detail {
  background: var(--gy-sand);
  min-height: 70vh;
  padding: 2rem 0 4rem;
}

.stay-detail__wrap {
  display: grid;
  gap: 1.5rem;
}

.stay-detail__back {
  justify-self: start;
  color: var(--gy-muted);
  text-decoration: none;
  font-size: 0.9rem;
}

.stay-detail__back:hover {
  color: var(--gy-ink);
  text-decoration: underline;
}

.stay-detail__state {
  display: grid;
  gap: 1rem;
  padding: 2.5rem 0;
  color: var(--gy-muted);
}

.stay-detail__state-title {
  margin: 0;
  color: var(--gy-ink);
  font-weight: 600;
}

.stay-detail__hero {
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

.stay-detail__media {
  min-height: 180px;
  background:
    linear-gradient(145deg, rgba(196, 163, 90, 0.35), rgba(18, 17, 16, 0.25)),
    var(--gy-stone) center / cover no-repeat;
}

.stay-detail__hero-copy {
  display: grid;
  align-content: center;
  gap: 0.35rem;
}

.stay-detail__title {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  line-height: 1.15;
}

.stay-detail__status {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 700;
}

.stay-detail__ref {
  margin: 0.25rem 0 0;
  color: var(--gy-muted);
  font-size: 0.95rem;
}

.stay-detail__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.stay-panel {
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  padding: 1.15rem 1.2rem 1.25rem;
  display: grid;
  gap: 0.85rem;
  align-content: start;
}

.stay-panel__title {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
  font-weight: 700;
}

.stay-panel__link {
  justify-self: start;
  color: var(--gy-gold-deep);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.stay-panel__link:hover {
  text-decoration: underline;
}

.stay-dl {
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.stay-dl dt {
  margin: 0 0 0.15rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.stay-dl dd {
  margin: 0;
  color: var(--gy-ink);
  line-height: 1.4;
}

.stay-price {
  display: grid;
  gap: 0.45rem;
}

.stay-price__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--gy-muted);
  font-size: 0.95rem;
}

.stay-price__row--total {
  margin-top: 0.35rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(18, 17, 16, 0.08);
  color: var(--gy-ink);
  font-weight: 700;
  font-size: 1.05rem;
}

.stay-price__note {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.85rem;
  line-height: 1.45;
}

.stay-detail__meta {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .stay-detail__hero,
  .stay-detail__grid {
    grid-template-columns: 1fr;
  }

  .stay-detail__media {
    min-height: 160px;
  }
}
</style>
