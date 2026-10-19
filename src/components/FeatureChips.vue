<template>
  <ul
    class="feature-chips"
    :class="[`feature-chips--${size}`, { 'feature-chips--on-dark': onDark }]"
  >
    <li v-for="item in items" :key="item">
      <q-icon v-if="showIcons" :name="iconFor(item)" size="14px" />
      <span>{{ item }}</span>
    </li>
    <li v-if="moreCount > 0" class="feature-chips__more"
      >+{{ moreCount }} more</li
    >
  </ul>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    items: string[];
    moreCount?: number;
    size?: "sm" | "md";
    showIcons?: boolean;
    onDark?: boolean;
  }>(),
  {
    moreCount: 0,
    size: "md",
    showIcons: true,
    onDark: false
  }
);

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
.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--gy-forest);
  background: rgba(98, 112, 99, 0.1);
  border: 1px solid rgba(98, 112, 99, 0.28);
}

.feature-chips--sm li {
  padding: 0.25rem 0.5rem;
  font-size: 0.72rem;
}

.feature-chips__more {
  background: transparent !important;
  border-style: dashed !important;
  color: var(--gy-muted) !important;
}

.feature-chips--on-dark li {
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.22);
}

.feature-chips--on-dark .feature-chips__more {
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
