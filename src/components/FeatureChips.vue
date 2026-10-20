<template>
  <div class="feature-chips-wrap">
    <ul
      class="feature-chips"
      :class="[
        `feature-chips--${size}`,
        {
          'feature-chips--on-dark': onDark,
          'feature-chips--expandable': expandable
        }
      ]"
    >
      <li v-for="item in visibleItems" :key="item">
        <q-icon v-if="showIcons" :name="iconFor(item)" size="14px" />
        <span>{{ item }}</span>
      </li>
      <li v-if="hiddenCount > 0 && !expanded">
        <button
          type="button"
          class="feature-chips__more-btn"
          :aria-expanded="sheetOpen || expanded"
          @click="onMoreClick"
        >
          +{{ hiddenCount }} more
        </button>
      </li>
      <li v-else-if="expanded && expandable && items.length > limit">
        <button
          type="button"
          class="feature-chips__more-btn"
          aria-expanded="true"
          @click="expanded = false"
        >
          Show less
        </button>
      </li>
    </ul>

    <q-dialog
      v-model="sheetOpen"
      position="bottom"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <div class="gy-sheet feature-sheet" role="dialog" aria-label="Amenities">
        <header class="gy-sheet__head">
          <span class="gy-sheet__grip" aria-hidden="true" />
          <h2 class="gy-sheet__title">{{ sheetTitle }}</h2>
          <button
            type="button"
            class="gy-sheet__close"
            aria-label="Close"
            @click="sheetOpen = false"
          >
            <q-icon name="close" size="22px" />
          </button>
        </header>
        <div class="gy-sheet__body">
          <ul class="feature-chips feature-chips--sheet">
            <li v-for="item in items" :key="`sheet-${item}`">
              <q-icon v-if="showIcons" :name="iconFor(item)" size="16px" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";

const props = withDefaults(
  defineProps<{
    items: string[];
    /** @deprecated Prefer `limit` + expandable; kept for callers that pass a count. */
    moreCount?: number;
    size?: "sm" | "md";
    showIcons?: boolean;
    onDark?: boolean;
    /** Max chips before +N more. */
    limit?: number;
    expandable?: boolean;
    /** On phones, +N opens a bottom sheet instead of inline expand. */
    sheetOnMobile?: boolean;
    sheetTitle?: string;
  }>(),
  {
    moreCount: 0,
    size: "md",
    showIcons: true,
    onDark: false,
    limit: 6,
    expandable: true,
    sheetOnMobile: true,
    sheetTitle: "Amenities"
  }
);

const $q = useQuasar();
const expanded = ref(false);
const sheetOpen = ref(false);

watch(
  () => props.items,
  () => {
    expanded.value = false;
    sheetOpen.value = false;
  }
);

const limit = computed(() => Math.max(1, props.limit));

const visibleItems = computed(() => {
  if (!props.expandable || expanded.value) return props.items;
  return props.items.slice(0, limit.value);
});

const hiddenCount = computed(() => {
  if (props.moreCount > 0 && !props.expandable) return props.moreCount;
  if (!props.expandable) return 0;
  return Math.max(0, props.items.length - limit.value);
});

function onMoreClick() {
  if (props.sheetOnMobile && $q.screen.lt.sm) {
    sheetOpen.value = true;
    return;
  }
  expanded.value = true;
}

function iconFor(label: string) {
  const key = label.toLowerCase();
  // Whole-word checks: "Parking Space" must not match "spa", "Balcony" not "ac".
  const word = (re: RegExp) => re.test(key);
  if (key.includes("wifi") || key.includes("wi-fi") || key.includes("wi‑fi"))
    return "wifi";
  if (key.includes("pool")) return "pool";
  if (
    key.includes("restaurant") ||
    key.includes("dining") ||
    key.includes("breakfast")
  )
    return "restaurant";
  if (word(/\bspa\b/)) return "spa";
  if (key.includes("park")) return "local_parking";
  if (key.includes("gym") || key.includes("fitness")) return "fitness_center";
  if (key.includes("playground") || word(/\bkids?\b|\bkid's\b|children/))
    return "toys";
  if (key.includes("tennis")) return "sports_tennis";
  if (key.includes("billiard") || key.includes("game")) return "sports";
  if (key.includes("bbq") || key.includes("barbecue") || key.includes("grill"))
    return "outdoor_grill";
  if (key.includes("kitchen")) return "kitchen";
  if (key.includes("security") || key.includes("24/7")) return "security";
  if (key.includes("laundry")) return "local_laundry_service";
  if (key.includes("rooftop") || key.includes("roof")) return "roofing";
  if (
    key.includes("view") ||
    key.includes("ocean") ||
    key.includes("river") ||
    key.includes("garden")
  )
    return "visibility";
  if (key.includes("terrace") || key.includes("balcony")) return "deck";
  if (key.includes("bath") || key.includes("shower")) return "bathtub";
  if (key.includes("water heater") || key.includes("hot water"))
    return "hot_tub";
  if (key.includes("safe")) return "lock";
  if (word(/\bbar\b/) || key.includes("mini")) return "local_bar";
  if (key.includes("bike") || key.includes("bicycle")) return "pedal_bike";
  if (key.includes("tour") || key.includes("desk")) return "map";
  if (word(/\bac\b|\ba\/c\b/) || key.includes("fan") || key.includes("air"))
    return "ac_unit";
  if (word(/\btv\b|television/)) return "tv";
  if (key.includes("linen") || key.includes("towel") || key.includes("bed"))
    return "bed";
  if (key.includes("toiletr")) return "soap";
  if (key.includes("living") || key.includes("lounge") || key.includes("suite"))
    return "weekend";
  return "check";
}
</script>

<style scoped>
.feature-chips-wrap {
  min-width: 0;
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.25;
  letter-spacing: 0.01em;
  color: var(--gy-ink);
  background: var(--gy-sand);
  border: 0;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.feature-chips li .q-icon {
  flex-shrink: 0;
  color: var(--gy-forest);
}

.feature-chips li span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-chips--sm li {
  padding: 0.3rem 0.68rem;
  font-size: 0.72rem;
}

.feature-chips__more-btn {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--gy-forest);
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.feature-chips li:has(.feature-chips__more-btn) {
  background: rgba(98, 112, 99, 0.12);
}

.feature-chips li:has(.feature-chips__more-btn):hover {
  background: rgba(98, 112, 99, 0.18);
}

.feature-chips--on-dark li {
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.12);
}

.feature-chips--on-dark li .q-icon {
  color: rgba(255, 255, 255, 0.9);
}

.feature-chips--on-dark .feature-chips__more-btn {
  color: rgba(255, 255, 255, 0.92);
}

.feature-chips--on-dark li:has(.feature-chips__more-btn) {
  background: rgba(255, 255, 255, 0.18);
}

.feature-chips--sheet {
  gap: 0.5rem;
}

.feature-chips--sheet li {
  width: 100%;
  padding: 0.7rem 0.9rem;
  font-size: 0.9rem;
  background: var(--gy-cream);
}

.feature-chips--expandable {
  transition: max-height 0.35s ease;
}
</style>

<style>
/* Sheet chrome lives on body (teleported dialog). */
.feature-sheet.gy-sheet {
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 100vw !important;
  max-height: 88dvh;
  background: var(--gy-white);
  border-radius: 20px 20px 0 0;
  color: var(--gy-ink);
  overflow: hidden;
}

.feature-sheet .gy-sheet__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.15rem 3rem 0.85rem;
  border-bottom: 1px solid rgba(69, 76, 75, 0.1);
}

.feature-sheet .gy-sheet__grip {
  position: absolute;
  top: 0.45rem;
  left: 50%;
  width: 2.5rem;
  height: 4px;
  margin-left: -1.25rem;
  border-radius: 999px;
  background: rgba(69, 76, 75, 0.18);
}

.feature-sheet .gy-sheet__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.feature-sheet .gy-sheet__close {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-40%);
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gy-ink);
  cursor: pointer;
}

.feature-sheet .gy-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1rem 1.15rem calc(1rem + env(safe-area-inset-bottom));
}
</style>
