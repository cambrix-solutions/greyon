<template>
  <section
    v-if="locations.length"
    class="gy-section dest-section"
    aria-labelledby="home-destinations-title"
  >
    <div class="gy-container">
      <header v-reveal class="section-head">
        <div>
          <p class="gy-eyebrow section-kicker">{{ $t("home.exploreBy") }}</p>
          <h2 id="home-destinations-title" class="gy-display section-title">
            {{ $t("home.destinationsCount", locations.length) }}
          </h2>
        </div>
        <router-link to="/locations" class="gy-link-arrow">
          {{ $t("home.allDestinations") }}
          <span aria-hidden="true">→</span>
        </router-link>
      </header>

      <div
        ref="tablistEl"
        class="dest-tabs"
        role="tablist"
        :aria-label="$t('home.exploreBy')"
      >
        <button
          v-for="(loc, i) in locations"
          :id="`dest-tab-${loc.id}`"
          :key="loc.id"
          type="button"
          role="tab"
          class="dest-tab"
          :class="{ 'is-active': loc.id === activeId }"
          :aria-selected="loc.id === activeId"
          :aria-controls="`dest-panel-${loc.id}`"
          :tabindex="loc.id === activeId ? 0 : -1"
          @click="select(loc.id)"
          @keydown="onTabKey($event, i)"
        >
          {{ loc.name }}
        </button>
      </div>

      <div
        v-if="active"
        :id="`dest-panel-${active.id}`"
        :key="active.id"
        class="dest-panel"
        role="tabpanel"
        :aria-labelledby="`dest-tab-${active.id}`"
      >
        <router-link
          :to="`/locations/${active.slug}`"
          class="dest-panel__media gy-card-media"
        >
          <img
            v-if="active.heroImage"
            :src="active.heroImage"
            :alt="active.name"
          />
        </router-link>

        <div class="dest-panel__copy">
          <p v-if="hotelsHere.length" class="count-chip">
            {{ $t("home.hotelsCount", hotelsHere.length) }}
          </p>
          <h3 class="gy-display dest-panel__name">
            <router-link :to="`/locations/${active.slug}`">{{
              active.name
            }}</router-link>
          </h3>
          <p v-if="active.description" class="dest-panel__desc">
            {{ active.description }}
          </p>
          <ul v-if="active.highlights.length" class="highlights">
            <li v-for="item in active.highlights" :key="item">{{ item }}</li>
          </ul>

          <ul v-if="hotelsHere.length" class="dest-hotels">
            <li v-for="hotel in hotelsHere" :key="hotel.id">
              <router-link :to="`/hotels/${hotel.slug}`" class="dest-hotel">
                <span class="dest-hotel__media gy-card-media">
                  <img
                    v-if="hotel.heroImage"
                    :src="hotel.heroImage"
                    :alt="hotel.name"
                    loading="lazy"
                  />
                </span>
                <span class="dest-hotel__copy">
                  <span class="dest-hotel__name">{{ hotel.name }}</span>
                  <span v-if="hotel.area" class="dest-hotel__area">{{
                    hotel.area
                  }}</span>
                </span>
                <q-icon name="arrow_forward" size="18px" />
              </router-link>
            </li>
          </ul>

          <div class="dest-panel__actions">
            <router-link
              v-if="hotelsHere.length"
              class="gy-btn gy-btn--light gy-btn--sm"
              :to="{ path: '/hotels', query: { locationSlug: active.slug } }"
            >
              {{ $t("home.viewHotels") }}
            </router-link>
            <router-link
              v-else
              :to="`/locations/${active.slug}`"
              class="gy-link-arrow"
            >
              {{ active.name }}
              <span aria-hidden="true">→</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const activeId = ref("");
const tablistEl = ref<HTMLElement | null>(null);

const locations = computed(() => cms.publishedLocations);

watch(
  locations,
  locs => {
    if (!locs.length) {
      activeId.value = "";
      return;
    }
    if (!locs.some(loc => loc.id === activeId.value)) {
      activeId.value = locs[0]?.id ?? "";
    }
  },
  { immediate: true }
);

const active = computed(
  () => locations.value.find(loc => loc.id === activeId.value) ?? null
);

const hotelsHere = computed(() => {
  if (!active.value) return [];
  return cms.publishedHotels.filter(
    hotel => hotel.locationId === active.value?.id
  );
});

function select(id: string) {
  activeId.value = id;
}

function onTabKey(event: KeyboardEvent, index: number) {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
  const total = locations.value.length;
  if (!total) return;
  event.preventDefault();
  let next = index;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = total - 1;
  else if (event.key === "ArrowRight") next = (index + 1) % total;
  else next = (index - 1 + total) % total;
  const loc = locations.value[next];
  if (!loc) return;
  activeId.value = loc.id;
  tablistEl.value
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [next]?.focus();
}
</script>

<style scoped>
.dest-section {
  background: var(--gy-white);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.35rem;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}

.section-kicker::after {
  content: "";
  width: 2.25rem;
  height: 1px;
  background: var(--gy-gold);
}

.section-title {
  margin: 0;
  font-size: clamp(2.15rem, 4.6vw, 3.35rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.dest-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.15rem;
}

.dest-tab {
  min-height: 44px;
  padding: 0.4rem 1.05rem;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 999px;
  background: var(--gy-cream);
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.dest-tab.is-active {
  background: var(--gy-ink);
  border-color: var(--gy-ink);
  color: var(--gy-white);
}

.dest-tab:hover {
  transform: translateY(-1px);
}

.dest-tab:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.dest-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: stretch;
  animation: dest-in 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.dest-panel__media {
  position: relative;
  min-height: 380px;
  border-radius: 22px;
  background: var(--gy-sand);
}

.dest-panel__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.05s cubic-bezier(0.22, 1, 0.36, 1);
}

.dest-panel__media:hover img {
  transform: scale(1.06);
}

.dest-panel__copy {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.35rem 0.15rem;
}

.count-chip {
  align-self: flex-start;
  margin: 0;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dest-panel__name {
  margin: 0;
  font-size: clamp(1.7rem, 2.5vw, 2.3rem);
  line-height: 1.08;
}

.dest-panel__name a:hover {
  color: var(--gy-gold-deep);
}

.dest-panel__desc {
  margin: 0;
  color: var(--gy-muted);
  font-size: 1.02rem;
  line-height: 1.65;
}

.highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.highlights li {
  padding: 0.38rem 0.75rem;
  border-radius: 999px;
  background: var(--gy-sand);
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.dest-hotels {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dest-hotel {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.45rem;
  border-radius: 14px;
  background: var(--gy-cream);
  transition:
    transform 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;
}

.dest-hotel__media {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: var(--gy-stone);
}

.dest-hotel__copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.dest-hotel__name {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.dest-hotel__area {
  color: var(--gy-muted);
  font-size: 0.78rem;
  line-height: 1.3;
}

.dest-hotel .q-icon {
  color: var(--gy-forest);
  margin-right: 0.35rem;
}

.dest-panel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  margin-top: auto;
}

.dest-panel__actions .gy-btn {
  min-height: 44px;
}

@keyframes dest-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (hover: hover) {
  .dest-hotel:hover {
    transform: translateY(-2px);
    background: var(--gy-white);
    box-shadow: 0 12px 28px rgba(69, 76, 75, 0.1);
  }
}

@media (max-width: 860px) {
  .dest-panel {
    grid-template-columns: 1fr;
  }

  .dest-panel__media {
    min-height: 0;
    aspect-ratio: 16 / 10;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dest-panel,
  .dest-tab,
  .dest-hotel,
  .dest-panel__media img {
    animation: none;
    transition: none;
  }
}
</style>
