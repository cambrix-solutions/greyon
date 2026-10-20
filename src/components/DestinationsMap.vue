<template>
  <div class="dest-map">
    <div class="dest-map__toolbar">
      <p class="dest-map__label">Destination</p>
      <div class="dest-map__chips" role="listbox" aria-label="Destinations">
        <button
          type="button"
          role="option"
          class="dest-map__chip"
          :class="{ 'is-active': !selectedSlug }"
          :aria-selected="!selectedSlug"
          @click="selectDestination('')"
        >
          All
        </button>
        <button
          v-for="loc in locations"
          :key="loc.id"
          type="button"
          role="option"
          class="dest-map__chip"
          :class="{ 'is-active': selectedSlug === loc.slug }"
          :aria-selected="selectedSlug === loc.slug"
          @click="selectDestination(loc.slug)"
        >
          {{ loc.name }}
        </button>
      </div>
      <label class="dest-map__select-wrap">
        <span class="sr-only">Choose destination</span>
        <select
          class="dest-map__select"
          :value="selectedSlug"
          aria-label="Choose destination"
          @change="
            selectDestination(($event.target as HTMLSelectElement).value)
          "
        >
          <option value="">All destinations</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.slug">
            {{ loc.name }}
          </option>
        </select>
      </label>
    </div>

    <div ref="mapEl" class="dest-map__canvas" role="application" />

    <p v-if="mapError" class="dest-map__error" role="alert">{{ mapError }}</p>
    <p v-else-if="!markers.length" class="dest-map__hint gy-muted">
      No mapped properties for this destination yet.
    </p>
    <ul v-else class="dest-map__list">
      <li v-for="hotel in markers" :key="hotel.id">
        <router-link :to="`/hotels/${hotel.slug}`" class="dest-map__card">
          <strong>{{ hotel.name }}</strong>
          <span>{{ locationName(hotel.locationId) }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";

const props = defineProps<{
  /** Pre-select a destination slug from the route. */
  initialSlug?: string;
}>();

const cms = useCmsStore();
const mapEl = ref<HTMLElement | null>(null);
const map = shallowRef<L.Map | null>(null);
const layer = shallowRef<L.LayerGroup | null>(null);
const selectedSlug = ref(props.initialSlug ?? "");
const mapError = ref("");

const locations = computed(() => cms.publishedLocations);

function hasCoords(hotel: Hotel) {
  const { lat, lng } = hotel.coordinates ?? { lat: 0, lng: 0 };
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
  );
}

const markers = computed(() => {
  const loc = locations.value.find(l => l.slug === selectedSlug.value);
  return cms.publishedHotels.filter(h => {
    if (!hasCoords(h)) return false;
    if (loc && h.locationId !== loc.id) return false;
    return true;
  });
});

function locationName(locationId: string) {
  return cms.getLocationById(locationId)?.name ?? "Greyon";
}

function selectDestination(slug: string) {
  selectedSlug.value = slug;
}

function pinIcon() {
  return L.divIcon({
    className: "dest-map-pin",
    html: '<span class="dest-map-pin__dot"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function fitToMarkers(points: Hotel[]) {
  const m = map.value;
  if (!m) return;
  if (!points.length) {
    m.setView([12.5, 104.9], 7);
    return;
  }
  if (points.length === 1) {
    const only = points[0]!;
    m.setView([only.coordinates.lat, only.coordinates.lng], 13, {
      animate: true
    });
    return;
  }
  const bounds = L.latLngBounds(
    points.map(h => [h.coordinates.lat, h.coordinates.lng] as [number, number])
  );
  m.fitBounds(bounds.pad(0.18), { animate: true });
}

function renderMarkers() {
  if (!map.value || !layer.value) return;
  layer.value.clearLayers();
  const icon = pinIcon();
  for (const hotel of markers.value) {
    const marker = L.marker([hotel.coordinates.lat, hotel.coordinates.lng], {
      icon,
      title: hotel.name
    });
    marker.bindPopup(
      `<strong>${hotel.name}</strong><br/><a href="/hotels/${hotel.slug}">View hotel</a>`
    );
    layer.value.addLayer(marker);
  }
  fitToMarkers(markers.value);
}

onMounted(() => {
  if (!mapEl.value) return;
  try {
    const m = L.map(mapEl.value, {
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([12.5, 104.9], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(m);
    const group = L.layerGroup().addTo(m);
    map.value = m;
    layer.value = group;
    renderMarkers();
    // Leaflet needs a size recalc after layout.
    requestAnimationFrame(() => m.invalidateSize());
  } catch {
    mapError.value =
      "We couldn’t load the map just now. Please refresh and try again.";
  }
});

onUnmounted(() => {
  map.value?.remove();
  map.value = null;
  layer.value = null;
});

watch(markers, () => renderMarkers());
watch(
  () => props.initialSlug,
  slug => {
    if (typeof slug === "string") selectedSlug.value = slug;
  }
);
</script>

<style scoped>
.dest-map {
  display: grid;
  gap: 1rem;
}

.dest-map__toolbar {
  display: grid;
  gap: 0.65rem;
}

.dest-map__label {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.dest-map__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.dest-map__chip {
  padding: 0.45rem 0.9rem;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-ink);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.dest-map__chip:hover {
  border-color: var(--gy-forest);
}

.dest-map__chip.is-active {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: var(--gy-white);
}

.dest-map__select-wrap {
  display: none;
}

.dest-map__select {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 10px;
  background: var(--gy-white);
  font: inherit;
}

.dest-map__canvas {
  width: 100%;
  min-height: min(62vh, 520px);
  border: 1px solid rgba(69, 76, 75, 0.1);
  background: var(--gy-sand);
  z-index: 0;
}

.dest-map__error {
  margin: 0;
  color: #9a3412;
  font-size: 0.92rem;
}

.dest-map__hint {
  margin: 0;
}

.dest-map__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dest-map__card {
  display: grid;
  gap: 0.2rem;
  padding: 0.85rem 1rem;
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.1);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

.dest-map__card:hover {
  border-color: var(--gy-forest);
}

.dest-map__card strong {
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.dest-map__card span {
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 700px) {
  .dest-map__chips {
    display: none;
  }

  .dest-map__select-wrap {
    display: block;
  }
}
</style>

<style>
/* Leaflet pin (teleported / not scoped). */
.dest-map-pin {
  background: transparent;
  border: 0;
}

.dest-map-pin__dot {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gy-forest, #627063);
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(28, 36, 33, 0.35);
}
</style>
