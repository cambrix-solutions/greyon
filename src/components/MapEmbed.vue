<template>
  <div class="map-embed">
    <iframe
      class="map-embed__frame"
      title="Map"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      :src="embedSrc"
    />
    <a
      class="map-embed__link"
      :href="externalHref"
      target="_blank"
      rel="noopener"
    >
      Open in OpenStreetMap
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
  }>(),
  { zoomDelta: 0.02 }
);

const embedSrc = computed(() => {
  const d = props.zoomDelta;
  const minLng = props.lng - d;
  const minLat = props.lat - d;
  const maxLng = props.lng + d;
  const maxLat = props.lat + d;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${props.lat}%2C${props.lng}`;
});

const externalHref = computed(
  () =>
    `https://www.openstreetmap.org/?mlat=${props.lat}&mlon=${props.lng}#map=15/${props.lat}/${props.lng}`
);
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

.map-embed__link {
  font-size: 0.9rem;
  color: var(--gy-forest);
  text-decoration: underline;
}
</style>
