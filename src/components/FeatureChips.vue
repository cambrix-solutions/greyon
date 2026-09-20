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
  if (key.includes("wifi") || key.includes("wi-fi")) return "wifi";
  if (key.includes("pool")) return "pool";
  if (
    key.includes("restaurant") ||
    key.includes("dining") ||
    key.includes("breakfast")
  )
    return "restaurant";
  if (key.includes("spa")) return "spa";
  if (key.includes("park")) return "local_parking";
  if (key.includes("gym") || key.includes("fitness")) return "fitness_center";
  if (
    key.includes("view") ||
    key.includes("ocean") ||
    key.includes("river") ||
    key.includes("garden")
  )
    return "visibility";
  if (key.includes("terrace") || key.includes("balcony")) return "deck";
  if (key.includes("bath") || key.includes("shower")) return "bathtub";
  if (key.includes("safe")) return "lock";
  if (key.includes("bar") || key.includes("mini")) return "local_bar";
  if (key.includes("bike") || key.includes("bicycle")) return "pedal_bike";
  if (key.includes("tour") || key.includes("desk")) return "map";
  if (key.includes("ac") || key.includes("fan") || key.includes("air"))
    return "ac_unit";
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
  background: rgba(196, 163, 90, 0.1);
  border: 1px solid rgba(154, 123, 60, 0.22);
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
