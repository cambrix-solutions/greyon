<template>
  <div
    class="svc-mega"
    role="menu"
    aria-label="Services"
    @mouseenter="emit('keep-open')"
    @mouseleave="emit('request-close')"
  >
    <div v-for="section in sections" :key="section.id" class="svc-mega__col">
      <header class="svc-mega__col-head">
        <span class="svc-mega__col-icon" aria-hidden="true">
          <q-icon :name="section.icon" size="20px" />
        </span>
        <div>
          <p class="svc-mega__col-title">{{ section.label }}</p>
          <p class="svc-mega__col-sub">{{ section.subtitle }}</p>
        </div>
      </header>

      <div v-if="loading" class="svc-mega__list" aria-busy="true">
        <div v-for="n in 3" :key="n" class="svc-mega__skel">
          <span class="svc-mega__skel-thumb" />
          <span class="svc-mega__skel-lines">
            <span />
            <span />
          </span>
        </div>
      </div>

      <ul v-else-if="section.items.length" class="svc-mega__list">
        <li v-for="item in section.items" :key="item.id">
          <router-link
            :to="`/hotels/${item.slug}`"
            class="svc-mega__row"
            role="menuitem"
            @click="emit('navigate')"
          >
            <img
              class="svc-mega__thumb"
              :src="item.thumb"
              :alt="item.name"
              loading="lazy"
            />
            <span class="svc-mega__meta">
              <strong>{{ item.name }}</strong>
              <span>{{ item.city }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <p v-else class="svc-mega__soon">Coming soon</p>

      <router-link
        v-if="section.viewAllTo"
        :to="section.viewAllTo"
        class="svc-mega__all"
        @click="emit('navigate')"
      >
        {{ section.viewAllLabel }}
        <q-icon name="arrow_forward" size="16px" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
export type ServiceMenuItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  thumb: string;
};

export type ServiceMenuSection = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  items: ServiceMenuItem[];
  viewAllTo?: string | null;
  viewAllLabel?: string;
};

defineProps<{
  sections: ServiceMenuSection[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "keep-open"): void;
  (e: "request-close"): void;
  (e: "navigate"): void;
}>();
</script>

<style scoped>
.svc-mega {
  display: grid;
  grid-template-columns: repeat(2, minmax(16rem, 1fr));
  gap: 0;
  min-width: min(40rem, calc(100vw - 2rem));
  padding: 1.1rem;
  background: var(--gy-cream);
  color: var(--gy-ink);
  border: 1px solid rgba(69, 76, 75, 0.1);
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgba(69, 76, 75, 0.14),
    0 2px 8px rgba(69, 76, 75, 0.06);
}

.svc-mega__col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem 0.75rem;
  border-radius: 12px;
}

.svc-mega__col + .svc-mega__col {
  border-left: 1px solid rgba(69, 76, 75, 0.08);
}

.svc-mega__col-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.svc-mega__col-icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 10px;
  background: var(--gy-sand);
  color: var(--gy-forest);
}

.svc-mega__col-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.svc-mega__col-sub {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.svc-mega__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.25rem;
}

.svc-mega__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.4rem;
  padding: 0.4rem 0.45rem;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
  transition: background 0.18s ease;
}

.svc-mega__row:hover {
  background: var(--gy-sand);
}

.svc-mega__thumb {
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 8px;
  background: var(--gy-sand);
  flex-shrink: 0;
}

.svc-mega__meta {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.svc-mega__meta strong {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.svc-mega__meta span {
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.svc-mega__soon {
  margin: 0.35rem 0;
  padding: 0.85rem 0.75rem;
  border-radius: 10px;
  background: var(--gy-sand);
  color: var(--gy-muted);
  font-size: 0.9rem;
  font-style: italic;
}

.svc-mega__all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding: 0.55rem 0.2rem;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.svc-mega__all:hover {
  color: var(--gy-gold-deep);
}

.svc-mega__skel {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-height: 3.4rem;
  padding: 0.4rem 0.45rem;
}

.svc-mega__skel-thumb {
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background: linear-gradient(90deg, #ebe7e2, #f5f2ee, #ebe7e2);
  background-size: 200% 100%;
  animation: svc-shimmer 1.2s ease infinite;
}

.svc-mega__skel-lines {
  flex: 1;
  display: grid;
  gap: 0.4rem;
}

.svc-mega__skel-lines span {
  display: block;
  height: 0.65rem;
  border-radius: 4px;
  background: linear-gradient(90deg, #ebe7e2, #f5f2ee, #ebe7e2);
  background-size: 200% 100%;
  animation: svc-shimmer 1.2s ease infinite;
}

.svc-mega__skel-lines span:last-child {
  width: 55%;
}

@keyframes svc-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (max-width: 720px) {
  .svc-mega {
    grid-template-columns: 1fr;
    min-width: min(20rem, calc(100vw - 2rem));
  }

  .svc-mega__col + .svc-mega__col {
    border-left: 0;
    border-top: 1px solid rgba(69, 76, 75, 0.08);
  }
}
</style>
