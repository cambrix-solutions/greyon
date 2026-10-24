<template>
  <div class="branch-map">
    <div
      ref="mapEl"
      class="branch-map__canvas"
      role="application"
      :aria-label="label"
    />
  </div>
</template>

<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";

const props = defineProps<{
  lat: number;
  lng: number;
  label: string;
}>();

const mapEl = ref<HTMLElement | null>(null);
const map = shallowRef<L.Map | null>(null);
const marker = shallowRef<L.Marker | null>(null);
let resizeObserver: ResizeObserver | null = null;

function pinIcon() {
  return L.divIcon({
    className: "contact-pin",
    html: '<span class="contact-pin__glyph"></span>',
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -36]
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function placeMarker(animate: boolean) {
  const current = map.value;
  if (!current) return;
  const at: L.LatLngExpression = [props.lat, props.lng];
  if (!marker.value) {
    marker.value = L.marker(at, {
      icon: pinIcon(),
      title: props.label,
      keyboard: true,
      alt: props.label
    }).addTo(current);
  } else {
    marker.value.setLatLng(at);
    marker.value.setIcon(pinIcon());
  }
  marker.value.bindPopup(`<strong>${escapeHtml(props.label)}</strong>`, {
    closeButton: false
  });
  if (animate) {
    current.flyTo(at, 16, { duration: 0.9, easeLinearity: 0.2 });
  } else {
    current.setView(at, 16, { animate: false });
  }
}

onMounted(() => {
  if (!mapEl.value) return;
  const current = L.map(mapEl.value, {
    scrollWheelZoom: false,
    zoomControl: false
  });
  L.control.zoom({ position: "topright" }).addTo(current);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(current);
  map.value = current;
  placeMarker(false);
  requestAnimationFrame(() => current.invalidateSize());
  resizeObserver = new ResizeObserver(() => current.invalidateSize());
  resizeObserver.observe(mapEl.value);
});

watch(
  () => [props.lat, props.lng, props.label] as const,
  (next, prev) => {
    const moved = !prev || next[0] !== prev[0] || next[1] !== prev[1];
    placeMarker(moved);
  }
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  map.value?.remove();
  map.value = null;
  marker.value = null;
});
</script>

<style scoped>
.branch-map,
.branch-map__canvas {
  width: 100%;
  height: 100%;
  min-height: 16.5rem;
  background: var(--gy-sand);
}

.branch-map__canvas {
  z-index: 0;
}

.branch-map :deep(.leaflet-control-attribution) {
  font-size: 0.68rem;
  background: rgba(255, 255, 255, 0.86);
}

.branch-map :deep(.leaflet-control-zoom a) {
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  color: var(--gy-ink);
  border-color: rgba(69, 76, 75, 0.12);
}
</style>

<style>
.contact-pin {
  background: transparent;
  border: 0;
}

.contact-pin__glyph {
  position: relative;
  display: block;
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border-radius: 50% 50% 50% 0;
  background: var(--gy-forest);
  border: 2px solid #fff;
  box-shadow: 0 8px 18px rgba(69, 76, 75, 0.35);
  transform: rotate(-45deg);
}

.contact-pin__glyph::after {
  content: "";
  position: absolute;
  top: 8px;
  left: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
}
</style>
