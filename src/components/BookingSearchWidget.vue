<template>
  <form
    class="gy-search"
    :class="{ 'gy-search--compact': compact }"
    @submit.prevent="onSubmit"
  >
    <div class="gy-search__fields">
      <label>
        <span>Location</span>
        <select v-model="local.locationSlug">
          <option value="">All locations</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.slug">
            {{ loc.name }}
          </option>
        </select>
      </label>
      <label :class="{ 'is-invalid': Boolean(fieldError.checkIn) }">
        <span>Check-in</span>
        <input
          v-model="local.checkIn"
          type="date"
          required
          :min="today"
          @change="onCheckInChange"
        />
      </label>
      <label :class="{ 'is-invalid': Boolean(fieldError.checkOut) }">
        <span>Check-out</span>
        <input
          v-model="local.checkOut"
          type="date"
          required
          :min="minCheckOut"
        />
      </label>
      <label>
        <span>Rooms</span>
        <input v-model.number="local.rooms" type="number" min="1" max="5" />
      </label>
      <label>
        <span>Adults</span>
        <input v-model.number="local.adults" type="number" min="1" max="8" />
      </label>
      <label>
        <span>Children</span>
        <input v-model.number="local.children" type="number" min="0" max="6" />
      </label>
    </div>

    <p v-if="attempted && localError" class="gy-search__error" role="alert">
      {{ localError }}
    </p>
    <p v-else-if="nightCount > 0 && !compact" class="gy-search__nights">
      {{ nightCount }} night{{ nightCount === 1 ? "" : "s" }} selected
    </p>

    <div class="gy-search__footer">
      <p v-if="!compact" class="gy-search__hint">
        Stay dates only — hotel check-in / out times apply (typically 14:00 /
        12:00).
      </p>
      <p v-else-if="nightCount > 0" class="gy-search__nights">
        {{ nightCount }} night{{ nightCount === 1 ? "" : "s" }}
      </p>
      <button class="gy-btn gy-btn--light gy-search__submit" type="submit">
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { BookingSearchParams } from "@/types/greyon";
import { addLocalDays, nightsBetweenLocal, toLocalYmd } from "@/utils/datetime";

const props = withDefaults(
  defineProps<{
    submitLabel?: string;
    navigate?: boolean;
    compact?: boolean;
  }>(),
  {
    submitLabel: "Search availability",
    navigate: true,
    compact: false
  }
);

const booking = useBookingStore();
const cms = useCmsStore();
const router = useRouter();
const locations = cms.publishedLocations;
const attempted = ref(false);
const today = toLocalYmd(new Date());

const local = reactive<BookingSearchParams>({ ...booking.search });

watch(
  () => booking.search,
  value => Object.assign(local, value),
  { deep: true }
);

const minCheckOut = computed(() => addLocalDays(local.checkIn || today, 1));

const nightCount = computed(() =>
  nightsBetweenLocal(local.checkIn, local.checkOut)
);

const localError = computed(() => {
  if (!local.checkIn || !local.checkOut) {
    return "Choose check-in and check-out dates.";
  }
  if (local.checkIn < today) return "Check-in cannot be in the past.";
  if (local.checkOut <= local.checkIn) {
    return "Check-out must be after check-in.";
  }
  if (nightCount.value < 1) return "Stay must include at least one night.";
  if (!Number.isFinite(local.rooms) || local.rooms < 1) {
    return "At least 1 room is required.";
  }
  if (!Number.isFinite(local.adults) || local.adults < 1) {
    return "At least 1 adult is required.";
  }
  if (!Number.isFinite(local.children) || local.children < 0) {
    return "Children cannot be negative.";
  }
  return "";
});

const fieldError = computed(() => ({
  checkIn: attempted.value && (!local.checkIn || local.checkIn < today),
  checkOut:
    attempted.value && (!local.checkOut || local.checkOut <= local.checkIn)
}));

function onCheckInChange() {
  if (local.checkOut <= local.checkIn) {
    local.checkOut = addLocalDays(local.checkIn, 1);
  }
}

async function onSubmit() {
  attempted.value = true;
  if (localError.value) return;
  booking.setSearch({ ...local, hotelSlug: booking.search.hotelSlug });
  const ok = await booking.runSearch();
  if (ok && props.navigate) {
    void router.push({ name: "booking" });
  }
}
</script>

<style scoped>
.gy-search {
  display: grid;
  gap: 0.85rem;
  padding: 1.15rem 1.25rem 1.2rem;
  background: rgba(255, 255, 255, 0.94);
  color: var(--gy-ink);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  box-shadow: 0 22px 48px rgba(12, 18, 16, 0.28);
  backdrop-filter: blur(10px);
}

.gy-search--compact {
  gap: 0.55rem;
  padding: 0.85rem 1rem 0.9rem;
}

.gy-search--compact .gy-search__fields {
  gap: 0.55rem;
}

.gy-search--compact label {
  gap: 0.25rem;
  font-size: 0.65rem;
}

.gy-search--compact input,
.gy-search--compact select {
  min-height: 2.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: 6px;
}

.gy-search--compact .gy-search__footer {
  padding-top: 0;
  border-top: 0;
  gap: 0.65rem;
}

.gy-search--compact .gy-search__submit {
  min-height: 2.45rem;
  min-width: 10rem;
  padding: 0.55rem 1.1rem;
}

.gy-search__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.15rem;
  border-top: 1px solid var(--gy-stone);
}

.gy-search__hint {
  margin: 0;
  flex: 1;
  min-width: 12rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--gy-muted);
  text-transform: none;
  letter-spacing: normal;
}

.gy-search__error {
  margin: 0;
  padding: 0.55rem 0.7rem;
  background: #fff4e8;
  border: 1px solid rgba(176, 141, 87, 0.45);
  color: #6b4a1e;
  font-size: 0.86rem;
}

.gy-search__nights {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-forest);
  font-weight: 600;
}

.gy-search__submit {
  flex-shrink: 0;
  min-width: 11.5rem;
}

.gy-search__fields {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.85rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

label.is-invalid input {
  border-color: #b45309;
  background: #fffaf3;
}

input,
select {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid var(--gy-stone);
  border-radius: 6px;
  background: var(--gy-cream);
  padding: 0.5rem 0.7rem;
  font: inherit;
  color: var(--gy-ink);
  text-transform: none;
  letter-spacing: normal;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

input:hover,
select:hover {
  border-color: rgba(154, 123, 60, 0.35);
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--gy-gold);
  background: var(--gy-white);
}

@media (max-width: 1000px) {
  .gy-search__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gy-search__submit {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .gy-search {
    padding: 1rem;
  }

  .gy-search__fields {
    grid-template-columns: 1fr;
  }
}
</style>
