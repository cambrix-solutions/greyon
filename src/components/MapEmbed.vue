<template>
  <div class="map-embed">
    <iframe
      v-if="frameSrc"
      class="map-embed__frame"
      title="Map"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
      :src="frameSrc"
    />
    <p v-else class="map-embed__empty gy-muted">
      Map coordinates are not available yet.
    </p>
    <a
      v-if="externalHref"
      class="map-embed__link"
      :href="externalHref"
      target="_blank"
      rel="noopener"
    >
      {{ linkLabel }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    lat: number;
    lng: number;
    zoomDelta?: number;
    /**
     * Google Maps embed iframe URL and/or share link from the client.
     * Prefer this over auto-generated OpenStreetMap when present.
     */
    embedUrl?: string | null;
  }>(),
  { zoomDelta: 0.02 }
);

function hasValidCoords(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

const rawMapUrl = computed(() => props.embedUrl?.trim() ?? "");

const googleEmbed = computed(() => {
  const url = rawMapUrl.value;
  return /^https:\/\/www\.google\.com\/maps\/embed/i.test(url) ? url : null;
});

const googleShareOrMaps = computed(() => {
  const url = rawMapUrl.value;
  if (!url) return null;
  if (googleEmbed.value) return null;
  // Share links, place URLs, goo.gl short links, etc.
  if (
    /^https:\/\/(www\.)?google\.com\/maps/i.test(url) ||
    /^https:\/\/maps\.app\.goo\.gl\//i.test(url) ||
    /^https:\/\/goo\.gl\/maps\//i.test(url)
  ) {
    return url;
  }
  return null;
});

const coordsOk = computed(() => hasValidCoords(props.lat, props.lng));

const frameSrc = computed(() => {
  if (googleEmbed.value) return googleEmbed.value;

  if (!coordsOk.value) return null;

  const d = props.zoomDelta;
  const minLng = props.lng - d;
  const minLat = props.lat - d;
  const maxLng = props.lng + d;
  const maxLat = props.lat + d;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${props.lat}%2C${props.lng}`;
});

const externalHref = computed(() => {
  // Prefer the client's Google Maps link when provided
  if (googleShareOrMaps.value) return googleShareOrMaps.value;
  if (googleEmbed.value && coordsOk.value) {
    return `https://www.google.com/maps?q=${props.lat},${props.lng}`;
  }
  if (googleEmbed.value) {
    // Embed without coords — open Google Maps home of the embed isn't useful;
    // fall through only if we somehow have a raw URL.
    return rawMapUrl.value || null;
  }
  if (coordsOk.value) {
    return `https://www.openstreetmap.org/?mlat=${props.lat}&mlon=${props.lng}#map=15/${props.lat}/${props.lng}`;
  }
  return rawMapUrl.value || null;
});

const linkLabel = computed(() => {
  if (googleShareOrMaps.value || googleEmbed.value) return "Open in Google Maps";
  if (coordsOk.value) return "Open in OpenStreetMap";
  return "Open map";
});
</script>

<style scoped>
.map-embed {
  display: grid;
  gap: 0.75rem;
}

.map-embed__frame {
  width: 100%;
  min-height: 280px;
  border: 0;
  background: var(--gy-stone);
}

.map-embed__empty {
  margin: 0;
  padding: 1.25rem 1rem;
  background: var(--gy-sand);
  font-size: 0.92rem;
}

.map-embed__link {
  font-size: 0.9rem;
  color: var(--gy-forest);
  text-decoration: underline;
}
</style>
