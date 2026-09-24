<template>
  <div class="map-pin-picker">
    <div class="map-pin-picker__paste">
      <div class="map-pin-picker__paste-icon" aria-hidden="true">
        <q-icon name="map" size="22px" />
      </div>
      <div class="map-pin-picker__paste-body">
        <label class="map-pin-picker__label" for="map-pin-paste">
          Google Maps pin
        </label>
        <p class="map-pin-picker__steps">
          Best: Maps → Share → <strong>Embed a map</strong> → copy iframe
          <span class="map-pin-picker__or">or</span>
          Share → Copy link
        </p>
        <q-input
          id="map-pin-paste"
          v-model="link"
          outlined
          dense
          clearable
          placeholder="Paste share link or iframe here…"
          class="map-pin-picker__input"
          :error="Boolean(parseError)"
          :error-message="parseError"
          hide-bottom-space
          @keyup.enter="applyLink"
          @blur="applyLink"
          @paste="onPaste"
          @clear="onClear"
        >
          <template #append>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Apply"
              class="map-pin-picker__apply"
              @click="applyLink"
            />
          </template>
        </q-input>
      </div>
    </div>

    <div class="map-pin-picker__stage">
      <iframe
        v-if="hasPin && embedUrl"
        class="map-pin-picker__frame"
        title="Google Maps preview"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
        :src="embedUrl"
      />
      <MapEmbed
        v-else-if="hasPin"
        class="map-pin-picker__preview"
        :lat="Number(lat)"
        :lng="Number(lng)"
      />
      <div v-else class="map-pin-picker__empty">
        <q-icon name="add_location_alt" size="36px" />
        <p>Map preview will appear here</p>
      </div>

      <div v-if="hasPin" class="map-pin-picker__badge">
        <q-icon name="check_circle" size="16px" />
        <span>
          Pin set · {{ Number(lat).toFixed(5) }}, {{ Number(lng).toFixed(5) }}
          <template v-if="embedUrl"> · Google embed</template>
        </span>
        <button type="button" class="map-pin-picker__clear" @click="clearPin">
          Clear
        </button>
      </div>
    </div>

    <details class="map-pin-picker__manual">
      <summary>Enter coordinates manually</summary>
      <div class="map-pin-picker__coords">
        <q-input
          :model-value="latDisplay"
          type="number"
          step="any"
          label="Latitude"
          outlined
          dense
          @update:model-value="onLat"
        />
        <q-input
          :model-value="lngDisplay"
          type="number"
          step="any"
          label="Longitude"
          outlined
          dense
          @update:model-value="onLng"
        />
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import MapEmbed from "@/components/MapEmbed.vue";
import { extractGoogleEmbedSrc, parseMapLink } from "@/utils/parseMapLink";

const props = defineProps<{
  lat: number | null;
  lng: number | null;
  embedUrl?: string | null;
}>();

const emit = defineEmits<{
  "update:lat": [value: number | null];
  "update:lng": [value: number | null];
  "update:embedUrl": [value: string | null];
}>();

const link = ref("");
const parseError = ref("");

const latDisplay = computed(() =>
  props.lat != null && Number.isFinite(props.lat) ? props.lat : ""
);
const lngDisplay = computed(() =>
  props.lng != null && Number.isFinite(props.lng) ? props.lng : ""
);

const hasPin = computed(() => {
  const lat = Number(props.lat);
  const lng = Number(props.lng);
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
  );
});

function applyParsed(text: string) {
  parseError.value = "";
  const embed = extractGoogleEmbedSrc(text);
  const coords = parseMapLink(text);

  if (!coords && !embed) {
    if (text.trim()) {
      parseError.value =
        "Couldn’t read that paste. Use Share → Embed a map, or Copy link.";
    }
    return;
  }

  if (coords) {
    emit("update:lat", Number(coords.lat.toFixed(7)));
    emit("update:lng", Number(coords.lng.toFixed(7)));
  }
  emit("update:embedUrl", embed);

  if (/<iframe/i.test(text) || text.length > 120) {
    link.value = embed
      ? "Google Maps embed applied"
      : "Google Maps pin applied";
  }
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text") ?? "";
  if (!text.trim()) return;
  e.preventDefault();
  requestAnimationFrame(() => {
    link.value = text.trim();
    applyParsed(text);
  });
}

function applyLink() {
  if (
    !link.value.trim() ||
    link.value === "Google Maps pin applied" ||
    link.value === "Google Maps embed applied"
  ) {
    parseError.value = "";
    return;
  }
  applyParsed(link.value);
}

function onClear() {
  link.value = "";
  parseError.value = "";
}

function clearPin() {
  emit("update:lat", null);
  emit("update:lng", null);
  emit("update:embedUrl", null);
  link.value = "";
  parseError.value = "";
}

function onLat(val: string | number | null) {
  const n = val === "" || val == null ? null : Number(val);
  emit("update:lat", n != null && Number.isFinite(n) ? n : null);
  // Manual coords without an official embed → clear embed so OSM preview is used
  if (!props.embedUrl) emit("update:embedUrl", null);
}

function onLng(val: string | number | null) {
  const n = val === "" || val == null ? null : Number(val);
  emit("update:lng", n != null && Number.isFinite(n) ? n : null);
  if (!props.embedUrl) emit("update:embedUrl", null);
}
</script>

<style scoped>
.map-pin-picker {
  display: grid;
  gap: 0.85rem;
}

.map-pin-picker__paste {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: start;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: linear-gradient(180deg, #faf8f4 0%, #f6f3ed 100%);
  border: 1px solid rgba(154, 123, 60, 0.18);
}

.map-pin-picker__paste-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.map-pin-picker__paste-body {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.map-pin-picker__label {
  font-size: 0.88rem;
  font-weight: 650;
  color: var(--gy-ink);
}

.map-pin-picker__steps {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--gy-muted);
}

.map-pin-picker__or {
  display: inline-block;
  margin: 0 0.25rem;
  opacity: 0.65;
}

.map-pin-picker__input :deep(.q-field__control) {
  background: #fff;
}

.map-pin-picker__apply {
  margin-right: 0.15rem;
  font-weight: 600;
}

.map-pin-picker__stage {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(28, 36, 33, 0.1);
  background: #ebe8e2;
}

.map-pin-picker__frame {
  display: block;
  width: 100%;
  height: 260px;
  border: 0;
  background: #ebe8e2;
}

.map-pin-picker__preview :deep(.map-embed) {
  gap: 0;
}

.map-pin-picker__preview :deep(.map-embed__frame) {
  min-height: 260px;
  display: block;
}

.map-pin-picker__preview :deep(.map-embed__link) {
  display: none;
}

.map-pin-picker__empty {
  display: grid;
  place-items: center;
  gap: 0.35rem;
  min-height: 200px;
  padding: 1.5rem;
  color: var(--gy-muted);
  text-align: center;
}

.map-pin-picker__empty p {
  margin: 0;
  font-size: 0.88rem;
}

.map-pin-picker__badge {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(28, 36, 33, 0.08);
  box-shadow: 0 6px 18px rgba(28, 36, 33, 0.1);
  font-size: 0.78rem;
  color: var(--gy-ink);
  backdrop-filter: blur(6px);
}

.map-pin-picker__badge .q-icon {
  color: #2f6b4f;
  flex-shrink: 0;
}

.map-pin-picker__badge span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-pin-picker__clear {
  border: 0;
  background: transparent;
  color: var(--gy-muted);
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
}

.map-pin-picker__clear:hover {
  color: var(--gy-ink);
  background: rgba(28, 36, 33, 0.06);
}

.map-pin-picker__manual {
  border-radius: 10px;
  border: 1px solid rgba(28, 36, 33, 0.08);
  background: #fff;
  padding: 0.15rem 0.85rem 0.15rem;
}

.map-pin-picker__manual summary {
  cursor: pointer;
  list-style: none;
  padding: 0.65rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gy-muted);
  user-select: none;
}

.map-pin-picker__manual summary::-webkit-details-marker {
  display: none;
}

.map-pin-picker__manual summary::after {
  content: "▾";
  float: right;
  opacity: 0.55;
}

.map-pin-picker__manual[open] summary {
  color: var(--gy-ink);
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
  margin-bottom: 0.65rem;
}

.map-pin-picker__coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
}

@media (max-width: 560px) {
  .map-pin-picker__paste {
    grid-template-columns: 1fr;
  }

  .map-pin-picker__coords {
    grid-template-columns: 1fr;
  }
}
</style>
