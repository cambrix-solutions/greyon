<template>
  <div
    class="gy-cal"
    :class="{ 'gy-cal--scroll': scroll }"
    @mouseleave="hoverYmd = ''"
  >
    <div v-if="!scroll" class="gy-cal__nav">
      <button
        type="button"
        class="gy-cal__nav-btn"
        :disabled="!canGoPrev"
        aria-label="Previous month"
        @click="shiftView(-1)"
      >
        <q-icon name="chevron_left" size="20px" />
      </button>
      <button
        type="button"
        class="gy-cal__nav-btn"
        :disabled="!canGoNext"
        aria-label="Next month"
        @click="shiftView(1)"
      >
        <q-icon name="chevron_right" size="20px" />
      </button>
    </div>

    <div class="gy-cal__months">
      <section
        v-for="month in visibleMonths"
        :key="month.key"
        class="gy-cal__month"
      >
        <h3 :id="`${uid}-${month.key}`" class="gy-cal__title">
          {{ month.title }}
        </h3>
        <div
          class="gy-cal__grid"
          role="grid"
          :aria-labelledby="`${uid}-${month.key}`"
          @keydown="onKeydown"
        >
          <div class="gy-cal__row gy-cal__row--head" role="row">
            <span
              v-for="d in WEEKDAYS"
              :key="d.short"
              class="gy-cal__dow"
              role="columnheader"
              :aria-label="d.long"
              >{{ d.short }}</span
            >
          </div>
          <div
            v-for="(week, wi) in month.weeks"
            :key="wi"
            class="gy-cal__row"
            role="row"
          >
            <template v-for="(cell, ci) in week" :key="ci">
              <span v-if="!cell" class="gy-cal__cell" role="gridcell" />
              <span
                v-else
                class="gy-cal__cell"
                role="gridcell"
                :class="cellClass(cell)"
                :aria-selected="isStart(cell) || isEnd(cell) || undefined"
              >
                <button
                  type="button"
                  class="gy-cal__day"
                  :data-ymd="cell"
                  :tabindex="cell === focusYmd ? 0 : -1"
                  :disabled="isDisabled(cell)"
                  :aria-label="dayLabel(cell)"
                  :aria-current="cell === today ? 'date' : undefined"
                  @click="pick(cell)"
                  @mouseenter="hoverYmd = cell"
                  @focus="focusYmd = cell"
                >
                  {{ Number(cell.slice(8)) }}
                </button>
              </span>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { addLocalDays, parseYmd, toLocalYmd } from "@/utils/datetime";

/**
 * Lightweight range calendar (no dependency). Two months side by side with
 * prev/next on desktop; `scroll` renders a vertical list of months for the
 * mobile bottom sheet. Emits `update:start` / `update:end` (YYYY-MM-DD).
 */
const props = withDefaults(
  defineProps<{
    start: string;
    end: string;
    min: string;
    months?: number;
    scroll?: boolean;
    /** How many months ahead are selectable (from `min`). */
    horizon?: number;
  }>(),
  { months: 2, scroll: false, horizon: 18 }
);

const emit = defineEmits<{
  (e: "update:start", value: string): void;
  (e: "update:end", value: string): void;
}>();

const WEEKDAYS = [
  { short: "Mo", long: "Monday" },
  { short: "Tu", long: "Tuesday" },
  { short: "We", long: "Wednesday" },
  { short: "Th", long: "Thursday" },
  { short: "Fr", long: "Friday" },
  { short: "Sa", long: "Saturday" },
  { short: "Su", long: "Sunday" }
];

const uid = `gy-cal-${Math.random().toString(36).slice(2, 8)}`;
const today = toLocalYmd(new Date());
const hoverYmd = ref("");
const focusYmd = ref(props.start || props.min);

function monthIndex(ymd: string) {
  const [y, m] = ymd.split("-").map(Number);
  return y! * 12 + (m! - 1);
}

const minMonth = computed(() => monthIndex(props.min));
const maxMonth = computed(() => minMonth.value + props.horizon - 1);
const maxYmd = computed(() => {
  const y = Math.floor(maxMonth.value / 12);
  const m = maxMonth.value % 12;
  return toLocalYmd(new Date(y, m + 1, 0));
});

const viewMonth = ref(
  Math.max(minMonth.value, monthIndex(props.start || props.min))
);

watch(
  () => props.start,
  value => {
    if (!value || props.scroll) return;
    const idx = monthIndex(value);
    if (idx < viewMonth.value || idx > viewMonth.value + props.months - 1) {
      viewMonth.value = Math.max(minMonth.value, idx);
    }
  }
);

const canGoPrev = computed(() => viewMonth.value > minMonth.value);
const canGoNext = computed(
  () => viewMonth.value + props.months - 1 < maxMonth.value
);

function shiftView(delta: number) {
  viewMonth.value = Math.min(
    Math.max(minMonth.value, viewMonth.value + delta),
    maxMonth.value - props.months + 1
  );
}

function buildMonth(index: number) {
  const y = Math.floor(index / 12);
  const m = index % 12;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(toLocalYmd(new Date(y, m, d)));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return {
    key: `${y}-${m}`,
    title: first.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric"
    }),
    weeks
  };
}

const visibleMonths = computed(() => {
  const count = props.scroll ? props.horizon : props.months;
  const startIdx = props.scroll ? minMonth.value : viewMonth.value;
  return Array.from({ length: count }, (_, i) => buildMonth(startIdx + i));
});

/** While picking the end date, preview the range under the pointer. */
const rangeEnd = computed(() => {
  if (props.end) return props.end;
  if (props.start && hoverYmd.value > props.start) return hoverYmd.value;
  return "";
});

const isStart = (ymd: string) => ymd === props.start;
const isEnd = (ymd: string) => Boolean(props.end) && ymd === props.end;
const isDisabled = (ymd: string) => ymd < props.min || ymd > maxYmd.value;

function cellClass(ymd: string) {
  const end = rangeEnd.value;
  const inRange = Boolean(props.start && end && ymd > props.start && ymd < end);
  return {
    "is-start": isStart(ymd),
    "is-end": isEnd(ymd) || (!props.end && ymd === end),
    "is-range": inRange,
    "has-range": Boolean(props.start && end),
    "is-preview": !props.end && Boolean(end),
    "is-today": ymd === today,
    "is-disabled": isDisabled(ymd)
  };
}

function dayLabel(ymd: string) {
  const d = parseYmd(ymd);
  const base = d
    ? d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : ymd;
  const tags = [
    ymd === today ? "today" : "",
    isStart(ymd) ? "check-in" : "",
    isEnd(ymd) ? "check-out" : "",
    isDisabled(ymd) ? "unavailable" : ""
  ].filter(Boolean);
  return tags.length ? `${base}, ${tags.join(", ")}` : base;
}

function pick(ymd: string) {
  if (isDisabled(ymd)) return;
  focusYmd.value = ymd;
  // First click (or a click on/before check-in) starts a new range.
  if (!props.start || props.end || ymd <= props.start) {
    emit("update:start", ymd);
    emit("update:end", "");
    return;
  }
  emit("update:end", ymd);
}

function onKeydown(event: KeyboardEvent) {
  const steps: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7
  };
  let next = "";
  if (event.key in steps)
    next = addLocalDays(focusYmd.value, steps[event.key]!);
  else if (event.key === "PageUp" || event.key === "PageDown") {
    const d = parseYmd(focusYmd.value) ?? new Date();
    d.setMonth(d.getMonth() + (event.key === "PageUp" ? -1 : 1));
    next = toLocalYmd(d);
  } else return;
  event.preventDefault();
  if (next < props.min) next = props.min;
  if (next > maxYmd.value) next = maxYmd.value;
  focusYmd.value = next;
  if (!props.scroll) {
    const idx = monthIndex(next);
    if (idx < viewMonth.value) shiftView(idx - viewMonth.value);
    if (idx > viewMonth.value + props.months - 1) {
      shiftView(idx - (viewMonth.value + props.months - 1));
    }
  }
  void nextTick(() => {
    document
      .querySelector<HTMLButtonElement>(`.gy-cal [data-ymd="${next}"]`)
      ?.focus();
  });
}

/** Focus the active day when the popover opens (keyboard users). */
function focusActive() {
  void nextTick(() => {
    const target =
      props.start && props.start >= props.min ? props.start : props.min;
    focusYmd.value = target;
    const el = document.querySelector<HTMLButtonElement>(
      `.gy-cal [data-ymd="${target}"]`
    );
    el?.focus({ preventScroll: !props.scroll });
    if (props.scroll) el?.scrollIntoView({ block: "center" });
  });
}

defineExpose({ focusActive });
</script>

<style scoped>
.gy-cal {
  position: relative;
  color: var(--gy-ink);
  font-family: var(--font-display);
}

.gy-cal__nav {
  position: absolute;
  inset: 0.1rem 0 auto 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.gy-cal__nav-btn {
  pointer-events: auto;
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(69, 76, 75, 0.14);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-ink);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.gy-cal__nav-btn:hover:not(:disabled) {
  background: var(--gy-sand);
  border-color: rgba(69, 76, 75, 0.3);
}

.gy-cal__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.gy-cal__months {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2.25rem;
}

.gy-cal--scroll .gy-cal__months {
  grid-auto-flow: row;
  gap: 1.5rem;
}

.gy-cal__title {
  margin: 0 0 0.85rem;
  min-height: 2.25rem;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: normal;
}

.gy-cal--scroll .gy-cal__title {
  place-items: center start;
  min-height: 0;
  padding-left: 0.25rem;
}

.gy-cal__row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.gy-cal__row--head {
  margin-bottom: 0.25rem;
}

.gy-cal__dow {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-muted);
  padding-bottom: 0.35rem;
}

.gy-cal__cell {
  position: relative;
  display: grid;
  place-items: center;
  height: 2.75rem;
}

/* In-between tint runs edge to edge; start/end get half-tints toward the range. */
.gy-cal__cell.is-range {
  background: rgba(98, 112, 99, 0.12);
}

.gy-cal__cell.is-start.has-range {
  background: linear-gradient(
    90deg,
    transparent 50%,
    rgba(98, 112, 99, 0.12) 50%
  );
}

.gy-cal__cell.is-end.has-range {
  background: linear-gradient(
    90deg,
    rgba(98, 112, 99, 0.12) 50%,
    transparent 50%
  );
}

.gy-cal__cell.is-start.is-end {
  background: none;
}

.gy-cal__day {
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.gy-cal__day:hover:not(:disabled) {
  border-color: var(--gy-forest);
}

.gy-cal__day:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: 2px;
}

.gy-cal__cell.is-today .gy-cal__day::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0.35rem;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 999px;
  background: var(--gy-forest);
}

.gy-cal__cell.is-start .gy-cal__day,
.gy-cal__cell.is-end .gy-cal__day {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: var(--gy-white);
  font-weight: 700;
}

.gy-cal__cell.is-end.is-preview .gy-cal__day {
  background: var(--gy-white);
  color: var(--gy-forest);
}

.gy-cal__cell.is-today.is-start .gy-cal__day::after,
.gy-cal__cell.is-today.is-end .gy-cal__day::after {
  background: var(--gy-white);
}

.gy-cal__day:disabled {
  color: rgba(69, 76, 75, 0.3);
  text-decoration: line-through;
  text-decoration-color: rgba(69, 76, 75, 0.2);
  cursor: default;
}

@media (max-width: 599px) {
  .gy-cal__day {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
