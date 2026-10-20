<template>
  <form
    class="gy-search"
    :class="{
      'gy-search--compact': compact,
      'gy-search--active': Boolean(openPanel)
    }"
    novalidate
    role="search"
    aria-label="Search hotel availability"
    @submit.prevent="onSubmit"
  >
    <div class="gy-search__bar">
      <!-- Destination -->
      <div
        class="gy-seg gy-seg--dest"
        :class="{ 'is-open': openPanel === 'dest' }"
      >
        <button
          type="button"
          class="gy-seg__btn"
          aria-haspopup="dialog"
          :aria-expanded="openPanel === 'dest'"
          @click="toggle('dest')"
        >
          <q-icon name="place" class="gy-seg__icon" size="20px" />
          <span class="gy-seg__text">
            <span class="gy-seg__label">Destination</span>
            <span class="gy-seg__value">{{ destinationLabel }}</span>
          </span>
        </button>
        <SearchPopover
          :model-value="openPanel === 'dest'"
          :sheet="sheet"
          title="Where to?"
          content-class="gy-pop--dest"
          @update:model-value="setOpen('dest', $event)"
        >
          <ul class="gy-dest" role="listbox" aria-label="Destination">
            <li v-for="opt in destinationOptions" :key="opt.slug || 'all'">
              <button
                type="button"
                role="option"
                class="gy-dest__opt"
                :class="{ 'is-selected': local.locationSlug === opt.slug }"
                :aria-selected="local.locationSlug === opt.slug"
                @click="chooseDestination(opt.slug)"
              >
                <q-icon
                  :name="opt.slug ? 'place' : 'travel_explore'"
                  size="20px"
                  class="gy-dest__icon"
                />
                <span>{{ opt.name }}</span>
                <q-icon
                  v-if="local.locationSlug === opt.slug"
                  name="check"
                  size="18px"
                  class="gy-dest__check"
                />
              </button>
            </li>
          </ul>
        </SearchPopover>
      </div>

      <!-- Dates -->
      <div
        class="gy-seg gy-seg--dates"
        :class="{
          'is-open': openPanel === 'dates',
          'is-invalid': fieldError.checkIn || fieldError.checkOut
        }"
      >
        <button
          type="button"
          class="gy-seg__btn"
          aria-haspopup="dialog"
          :aria-expanded="openPanel === 'dates'"
          :aria-invalid="fieldError.checkIn || fieldError.checkOut || undefined"
          :aria-describedby="showError ? errorId : undefined"
          @click="toggle('dates')"
        >
          <q-icon name="calendar_month" class="gy-seg__icon" size="20px" />
          <span class="gy-seg__text">
            <span class="gy-seg__label">Dates</span>
            <span class="gy-seg__value">
              {{ datesShort }}
              <span v-if="nightCount > 0" class="gy-seg__nights">{{
                nightsLabel
              }}</span>
            </span>
          </span>
        </button>
        <SearchPopover
          :model-value="openPanel === 'dates'"
          :sheet="sheet"
          title="Select dates"
          content-class="gy-pop--dates"
          @update:model-value="setOpen('dates', $event)"
          @show="calendar?.focusActive()"
          @hide="onDatesClosed"
        >
          <DateRangeCalendar
            ref="calendar"
            :start="local.checkIn"
            :end="local.checkOut"
            :min="today"
            :months="sheet ? 1 : twoMonths ? 2 : 1"
            :scroll="sheet"
            :horizon="sheet ? 12 : 18"
            @update:start="local.checkIn = $event"
            @update:end="local.checkOut = $event"
          />
          <template #footer>
            <p class="gy-pop-summary" aria-live="polite">
              <strong>{{ pickerStatus.title }}</strong>
              <span>{{ pickerStatus.sub }}</span>
            </p>
            <div class="gy-pop-actions">
              <button
                type="button"
                class="gy-pop-link"
                :disabled="!local.checkIn && !local.checkOut"
                @click="clearDates"
              >
                Clear
              </button>
              <button
                type="button"
                class="gy-btn gy-btn--light gy-btn--sm gy-pop-apply"
                :disabled="!local.checkIn"
                @click="openPanel = null"
              >
                Apply
              </button>
            </div>
          </template>
        </SearchPopover>
      </div>

      <!-- Guests & rooms -->
      <div
        class="gy-seg gy-seg--guests"
        :class="{ 'is-open': openPanel === 'guests' }"
      >
        <button
          type="button"
          class="gy-seg__btn"
          aria-haspopup="dialog"
          :aria-expanded="openPanel === 'guests'"
          @click="toggle('guests')"
        >
          <q-icon name="group" class="gy-seg__icon" size="20px" />
          <span class="gy-seg__text">
            <span class="gy-seg__label">Rooms &amp; Guests</span>
            <span class="gy-seg__value">{{ guestsShort }}</span>
          </span>
        </button>
        <SearchPopover
          :model-value="openPanel === 'guests'"
          :sheet="sheet"
          title="Rooms & guests"
          content-class="gy-pop--guests"
          @update:model-value="setOpen('guests', $event)"
        >
          <GuestCounter
            v-model="local.rooms"
            label="Rooms"
            :min="LIMITS.rooms[0]"
            :max="LIMITS.rooms[1]"
          />
          <GuestCounter
            v-model="local.adults"
            label="Adults"
            :min="LIMITS.adults[0]"
            :max="LIMITS.adults[1]"
          />
          <GuestCounter
            v-model="local.children"
            label="Children"
            :min="LIMITS.children[0]"
            :max="LIMITS.children[1]"
          />
          <template #footer>
            <p class="gy-pop-summary">
              <strong>{{ guestsLabel }}</strong>
            </p>
            <button
              type="button"
              class="gy-btn gy-btn--light gy-btn--sm gy-pop-apply"
              @click="openPanel = null"
            >
              Done
            </button>
          </template>
        </SearchPopover>
      </div>

      <!-- Special rates (Courtyard-style) -->
      <div
        class="gy-seg gy-seg--rates"
        :class="{ 'is-open': openPanel === 'rates' }"
      >
        <button
          type="button"
          class="gy-seg__btn"
          aria-haspopup="dialog"
          :aria-expanded="openPanel === 'rates'"
          @click="toggle('rates')"
        >
          <q-icon name="loyalty" class="gy-seg__icon" size="20px" />
          <span class="gy-seg__text">
            <span class="gy-seg__label">Special Rates</span>
            <span class="gy-seg__value">{{ ratesShort }}</span>
          </span>
        </button>
        <SearchPopover
          :model-value="openPanel === 'rates'"
          :sheet="sheet"
          title="Special rates"
          content-class="gy-pop--rates"
          @update:model-value="setOpen('rates', $event)"
        >
          <ul class="gy-rates" role="listbox" aria-label="Special rates">
            <li v-for="opt in specialRateOptions" :key="opt.code">
              <button
                type="button"
                role="option"
                class="gy-rates__opt"
                :class="{ 'is-selected': local.specialRate === opt.code }"
                :aria-selected="local.specialRate === opt.code"
                @click="chooseSpecialRate(opt.code)"
              >
                <span>{{ opt.label }}</span>
                <q-icon
                  v-if="local.specialRate === opt.code"
                  name="check"
                  size="18px"
                  class="gy-rates__check"
                />
              </button>
            </li>
          </ul>
          <div v-if="needsPromoCode" class="gy-rates__code">
            <label for="gy-promo-code">Corporate / promo code</label>
            <input
              id="gy-promo-code"
              v-model="local.promoCode"
              type="text"
              autocomplete="off"
              placeholder="Enter code"
              maxlength="64"
            />
          </div>
          <template #footer>
            <button
              type="button"
              class="gy-btn gy-btn--light gy-btn--sm gy-pop-apply"
              @click="openPanel = null"
            >
              Done
            </button>
          </template>
        </SearchPopover>
      </div>

      <div class="gy-search__action">
        <button
          class="gy-search__submit"
          type="submit"
          :aria-label="submitLabel"
        >
          <q-icon name="search" size="20px" />
          <span class="gy-search__submit-text">{{ submitLabel }}</span>
        </button>
      </div>
    </div>

    <p v-if="showError" :id="errorId" class="gy-search__error" role="alert">
      <q-icon name="info" size="16px" />
      {{ localError }}
    </p>
    <p v-else-if="!compact" class="gy-search__hint">
      Stay dates only — hotel check-in / out times apply (typically 14:00 /
      12:00).
    </p>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import DateRangeCalendar from "@/components/booking/DateRangeCalendar.vue";
import GuestCounter from "@/components/booking/GuestCounter.vue";
import SearchPopover from "@/components/booking/SearchPopover.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import {
  SPECIAL_RATE_OPTIONS,
  specialRateLabel,
  type SpecialRateCode
} from "@/data/specialRates";
import type { BookingSearchParams } from "@/types/greyon";
import { searchParamsToQuery } from "@/utils/bookingSearchQuery";
import {
  addLocalDays,
  nightsBetweenLocal,
  parseYmd,
  toLocalYmd
} from "@/utils/datetime";

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

/** Same bounds the old number inputs used (min / max attributes). */
const LIMITS = {
  rooms: [1, 5],
  adults: [1, 8],
  children: [0, 6]
} as const;

type Panel = "dest" | "dates" | "guests" | "rates";

const specialRateOptions = SPECIAL_RATE_OPTIONS;

const $q = useQuasar();
const booking = useBookingStore();
const cms = useCmsStore();
const router = useRouter();
const locations = computed(() => cms.publishedLocations);
const attempted = ref(false);
const today = toLocalYmd(new Date());
const openPanel = ref<Panel | null>(null);
const calendar = ref<InstanceType<typeof DateRangeCalendar> | null>(null);
const errorId = `gy-search-error-${Math.random().toString(36).slice(2, 8)}`;

/** Phones get bottom sheets; tablets/desktop get anchored popovers. */
const sheet = computed(() => $q.screen.lt.sm);
const twoMonths = computed(() => $q.screen.gt.sm);

const local = reactive<BookingSearchParams>({
  ...booking.search,
  specialRate: booking.search.specialRate || "none",
  promoCode: booking.search.promoCode || ""
});

watch(
  () => booking.search,
  value =>
    Object.assign(local, {
      ...value,
      specialRate: value.specialRate || "none",
      promoCode: value.promoCode || ""
    }),
  { deep: true }
);

const nightCount = computed(() =>
  nightsBetweenLocal(local.checkIn, local.checkOut)
);

const nightsLabel = computed(
  () => `${nightCount.value} night${nightCount.value === 1 ? "" : "s"}`
);

const dateRangeInvalid = computed(
  () =>
    Boolean(local.checkIn) &&
    Boolean(local.checkOut) &&
    local.checkOut <= local.checkIn
);

const localError = computed(() => {
  if (!local.checkIn || !local.checkOut) {
    return "Choose check-in and check-out dates.";
  }
  if (local.checkIn < today) return "Check-in cannot be in the past.";
  if (dateRangeInvalid.value) {
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

/** Date issues surface immediately; other rules wait until submit. One message. */
const showError = computed(
  () =>
    openPanel.value !== "dates" &&
    Boolean(localError.value) &&
    (attempted.value ||
      dateRangeInvalid.value ||
      Boolean(local.checkIn && local.checkIn < today))
);

const fieldError = computed(() => {
  const highlightDates = attempted.value || showError.value;
  return {
    checkIn: highlightDates && (!local.checkIn || local.checkIn < today),
    checkOut:
      highlightDates && (!local.checkOut || local.checkOut <= local.checkIn)
  };
});

const destinationOptions = computed(() => [
  { slug: "", name: "All destinations" },
  ...locations.value.map(l => ({ slug: l.slug, name: l.name }))
]);

const destinationLabel = computed(
  () =>
    destinationOptions.value.find(o => o.slug === local.locationSlug)?.name ??
    "All destinations"
);

function shortDate(ymd: string) {
  const d = parseYmd(ymd);
  return d
    ? d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short"
      })
    : "";
}

const datesLabel = computed(() => {
  if (!local.checkIn) return "Add dates";
  if (!local.checkOut) return `${shortDate(local.checkIn)} → Add check-out`;
  return `${shortDate(local.checkIn)} → ${shortDate(local.checkOut)}`;
});

function dayMonth(ymd: string) {
  const d = parseYmd(ymd);
  return d
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
}

/** Bar value: "16–19 Nov", "30 Nov – 2 Dec" (full dates live in the popover). */
const datesShort = computed(() => {
  if (!local.checkIn) return "Add dates";
  if (!local.checkOut) return `${dayMonth(local.checkIn)} – add check-out`;
  const a = parseYmd(local.checkIn);
  const b = parseYmd(local.checkOut);
  if (
    a &&
    b &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  ) {
    return `${a.getDate()}–${dayMonth(local.checkOut)}`;
  }
  return `${dayMonth(local.checkIn)} – ${dayMonth(local.checkOut)}`;
});

const pickerStatus = computed(() => {
  if (!local.checkIn) {
    return { title: "Select check-in date", sub: "Then pick your check-out" };
  }
  if (!local.checkOut) {
    return {
      title: "Select check-out date",
      sub: `Check-in ${shortDate(local.checkIn)}`
    };
  }
  return { title: nightsLabel.value, sub: datesLabel.value };
});

const guestsLabel = computed(() => {
  const parts = [`${local.rooms} room${local.rooms === 1 ? "" : "s"}`];
  parts.push(`${local.adults} adult${local.adults === 1 ? "" : "s"}`);
  if (local.children > 0) {
    parts.push(`${local.children} child${local.children === 1 ? "" : "ren"}`);
  }
  return parts.join(" · ");
});

/** Bar value: "1 room · 3 guests" (the popover shows the full breakdown). */
const guestsShort = computed(() => {
  const guests = local.adults + local.children;
  return `${local.rooms} room${local.rooms === 1 ? "" : "s"} · ${guests} guest${
    guests === 1 ? "" : "s"
  }`;
});

const needsPromoCode = computed(
  () =>
    SPECIAL_RATE_OPTIONS.find(o => o.code === local.specialRate)?.needsCode ===
    true
);

const ratesShort = computed(() => {
  if (local.specialRate === "corporate" && local.promoCode.trim()) {
    return local.promoCode.trim();
  }
  return specialRateLabel(local.specialRate);
});

function toggle(panel: Panel) {
  openPanel.value = openPanel.value === panel ? null : panel;
}

function setOpen(panel: Panel, open: boolean) {
  if (open) openPanel.value = panel;
  else if (openPanel.value === panel) openPanel.value = null;
}

function chooseDestination(slug: string) {
  local.locationSlug = slug;
  openPanel.value = null;
}

function chooseSpecialRate(code: SpecialRateCode) {
  local.specialRate = code;
  if (code !== "corporate") local.promoCode = "";
}

function clearDates() {
  local.checkIn = "";
  local.checkOut = "";
}

/** Closing with only check-in picked keeps a valid 1-night stay. */
function onDatesClosed() {
  if (local.checkIn && (!local.checkOut || local.checkOut <= local.checkIn)) {
    local.checkOut = addLocalDays(local.checkIn, 1);
  }
}

async function onSubmit() {
  attempted.value = true;
  openPanel.value = null;
  if (localError.value) return;
  const next: BookingSearchParams = {
    ...local,
    hotelSlug: booking.search.hotelSlug,
    specialRate: local.specialRate || "none",
    promoCode: needsPromoCode.value ? local.promoCode.trim() : ""
  };
  booking.setSearch(next);
  const ok = await booking.runSearch();
  if (ok && props.navigate) {
    void router.push({
      name: "booking",
      query: searchParamsToQuery(next)
    });
  }
}
</script>

<style scoped>
.gy-search {
  /* Layout follows the space the widget gets (hero, header, booking panel),
     not just the viewport. */
  container: gy-search / inline-size;
  display: grid;
  gap: 0.6rem;
  color: var(--gy-ink);
  font-family: var(--font-display);
}

/* ---- Bar (desktop pill) ---- */
.gy-search__bar {
  display: grid;
  grid-template-columns:
    minmax(0, 1.1fr) minmax(0, 1.35fr) minmax(0, 1.1fr) minmax(0, 1.05fr)
    auto;
  align-items: center;
  padding: 0.4rem;
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.12);
  border-radius: 999px;
  box-shadow: 0 18px 44px rgba(28, 36, 33, 0.14);
  transition: background 0.2s ease;
}

.gy-search--active .gy-search__bar {
  background: var(--gy-cream);
}

.gy-seg {
  position: relative;
  min-width: 0;
}

/* Hairline dividers between segments, hidden next to a hovered/open one. */
.gy-seg + .gy-seg::before {
  content: "";
  position: absolute;
  left: 0;
  top: 22%;
  bottom: 22%;
  width: 1px;
  background: rgba(69, 76, 75, 0.14);
  transition: opacity 0.2s ease;
}

.gy-seg:hover::before,
.gy-seg:hover + .gy-seg::before,
.gy-seg.is-open::before,
.gy-seg.is-open + .gy-seg::before {
  opacity: 0;
}

.gy-seg__btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3.6rem;
  padding: 0.55rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.gy-seg__btn:hover {
  background: var(--gy-sand);
}

.gy-seg.is-open .gy-seg__btn {
  background: var(--gy-white);
  box-shadow: 0 6px 22px rgba(28, 36, 33, 0.12);
}

.gy-seg__btn:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: -2px;
}

.gy-seg__icon {
  flex-shrink: 0;
  color: var(--gy-forest);
}

.gy-seg__text {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.gy-seg__label {
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gy-seg__nights {
  margin-left: 0.35rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
  font-size: 0.72em;
  font-weight: 600;
  vertical-align: 0.1em;
}

.gy-seg__value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gy-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gy-seg.is-invalid .gy-seg__btn {
  box-shadow: inset 0 0 0 1.5px #b4533a;
}

.gy-seg.is-invalid .gy-seg__icon {
  color: #b4533a;
}

.gy-search__action {
  padding-left: 0.35rem;
}

.gy-search__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.35rem;
  padding: 0 1.6rem;
  border: 0;
  border-radius: 999px;
  background: var(--gy-forest);
  color: var(--gy-white);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.gy-search__submit:hover {
  background: var(--gy-ink);
  box-shadow: 0 10px 24px rgba(69, 76, 75, 0.28);
}

.gy-search__submit:active {
  transform: scale(0.98);
}

.gy-search__submit:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: 3px;
}

.gy-search__error,
.gy-search__hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0 1.25rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  line-height: 1.45;
}

.gy-search__error {
  color: #9a3412;
}

.gy-search__hint {
  color: var(--gy-muted);
}

/* ---- Compact (header bar + home hero) ---- */
.gy-search--compact .gy-search__bar {
  padding: 0.25rem;
  box-shadow: 0 10px 30px rgba(28, 36, 33, 0.12);
}

.gy-search--compact .gy-seg__btn {
  min-height: 2.75rem;
  padding: 0.3rem 1rem;
  gap: 0.6rem;
}

.gy-search--compact .gy-seg__label {
  font-size: 0.58rem;
}

.gy-search--compact .gy-seg__value {
  font-size: 0.84rem;
}

.gy-search--compact .gy-search__submit {
  min-height: 2.6rem;
  padding: 0 1.15rem;
}

.gy-search--compact .gy-search__error {
  padding: 0.4rem 0.9rem;
  border-radius: 10px;
  background: var(--gy-white);
  box-shadow: 0 6px 18px rgba(28, 36, 33, 0.1);
  justify-self: start;
}

/* Medium bars (header, booking panel): round icon button so the segments
   keep room for their values. */
@container gy-search (min-width: 721px) and (max-width: 900px) {
  .gy-search__submit,
  .gy-search--compact .gy-search__submit {
    width: 3.1rem;
    min-height: 3.1rem;
    padding: 0;
  }

  .gy-search--compact .gy-search__submit {
    width: 2.6rem;
    min-height: 2.6rem;
  }

  .gy-search__submit-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

/* ---- Stacked card (narrow containers: phones, tablet portrait) ---- */
@container gy-search (max-width: 720px) {
  .gy-search__bar,
  .gy-search--compact .gy-search__bar {
    grid-template-columns: minmax(0, 1fr);
    padding: 0.5rem;
    border-radius: 18px;
    gap: 0.15rem;
  }

  .gy-seg + .gy-seg::before {
    left: 1rem;
    right: 1rem;
    top: 0;
    bottom: auto;
    width: auto;
    height: 1px;
  }

  .gy-seg__btn,
  .gy-search--compact .gy-seg__btn {
    min-height: 3.5rem;
    padding: 0.55rem 0.9rem;
    border-radius: 12px;
  }

  .gy-search--compact .gy-seg__label {
    font-size: 0.62rem;
  }

  .gy-search--compact .gy-seg__value {
    font-size: 0.95rem;
  }

  .gy-search__action {
    padding: 0.4rem 0 0;
  }

  .gy-search__submit,
  .gy-search--compact .gy-search__submit {
    width: 100%;
    min-height: 3.1rem;
    border-radius: 12px;
  }

  .gy-search__error,
  .gy-search__hint {
    padding: 0 0.5rem;
  }
}
</style>

<style>
/* Popover contents (teleported to <body>, so not scoped). */
.gy-pop--dates .gy-pop__body {
  padding: 1.35rem 1.6rem 0.85rem;
}

.gy-pop--dates.gy-pop {
  width: min(44rem, calc(100vw - 2rem));
}

.gy-pop--guests.gy-pop {
  width: min(22rem, calc(100vw - 2rem));
}

.gy-pop--guests .gy-pop__body {
  padding: 0.5rem 1.5rem 0.5rem;
}

.gy-pop--dest.gy-pop {
  min-width: 17rem;
}

.gy-pop--dest .gy-pop__body {
  padding: 0.5rem;
}

.gy-pop--rates.gy-pop {
  min-width: 18rem;
  width: min(22rem, calc(100vw - 2rem));
}

.gy-pop--rates .gy-pop__body {
  padding: 0.5rem;
}

.gy-rates {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gy-rates__opt {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.gy-rates__opt:hover,
.gy-rates__opt:focus-visible {
  background: var(--gy-sand);
  outline: none;
}

.gy-rates__opt.is-selected {
  background: rgba(98, 112, 99, 0.1);
  font-weight: 600;
}

.gy-rates__check {
  margin-left: auto;
  color: var(--gy-forest);
}

.gy-rates__code {
  display: grid;
  gap: 0.35rem;
  margin: 0.35rem 0.5rem 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  background: var(--gy-sand);
}

.gy-rates__code label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.gy-rates__code input {
  min-height: 2.5rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(69, 76, 75, 0.18);
  border-radius: 8px;
  background: var(--gy-white);
  color: var(--gy-ink);
  font: inherit;
  font-size: 0.95rem;
}

.gy-rates__code input:focus {
  outline: 2px solid var(--gy-forest);
  outline-offset: 1px;
}

.gy-dest {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gy-dest__opt {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.gy-dest__opt:hover,
.gy-dest__opt:focus-visible {
  background: var(--gy-sand);
  outline: none;
}

.gy-dest__opt.is-selected {
  background: rgba(98, 112, 99, 0.1);
  font-weight: 600;
}

.gy-dest__icon {
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: var(--gy-sand);
  color: var(--gy-forest);
}

.gy-dest__check {
  margin-left: auto;
  color: var(--gy-forest);
}

.gy-pop-summary {
  display: grid;
  gap: 0.1rem;
  margin: 0;
  font-family: var(--font-display);
  line-height: 1.3;
}

.gy-pop-summary strong {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--gy-ink);
}

.gy-pop-summary span {
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.gy-pop-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gy-pop-link {
  padding: 0.5rem 0.75rem;
  border: 0;
  background: transparent;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.gy-pop-link:disabled {
  opacity: 0.35;
  cursor: default;
}

.gy-pop-apply {
  min-width: 6.5rem;
  border-radius: 999px !important;
}

.gy-pop-apply:disabled {
  opacity: 0.5;
  cursor: default;
}

.gy-sheet.gy-pop--dates .gy-sheet__body {
  padding-top: 0.5rem;
}

.gy-sheet .gy-pop-apply {
  min-width: 8rem;
  min-height: 3rem;
}
</style>
