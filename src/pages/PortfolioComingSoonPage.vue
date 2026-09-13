<template>
  <q-page class="gy-section">
    <SeoHead
      :title="`${title} | Greyon`"
      :description="description"
    />
    <div class="gy-container coming-soon">
      <p class="gy-eyebrow">{{ $t("nav.portfolios") }}</p>
      <h1 class="gy-display">{{ title }}</h1>
      <p class="gy-muted">{{ description }}</p>
      <p class="note">
        {{ $t("portfolios.comingSoonBody") }}
      </p>
      <div class="actions">
        <router-link to="/hotels" class="gy-btn">{{
          $t("portfolios.browseHotels")
        }}</router-link>
        <router-link to="/contact" class="gy-btn gy-btn--light">{{
          $t("nav.contact")
        }}</router-link>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import SeoHead from "@/components/SeoHead.vue";

const route = useRoute();
const { t } = useI18n();

const kind = computed(() => String(route.meta.portfolioKind || "future"));

const title = computed(() => {
  if (kind.value === "service-apartment") return t("portfolios.serviceApartment");
  if (kind.value === "boutique") return t("portfolios.boutique");
  if (kind.value === "resort") return t("portfolios.resort");
  return t("portfolios.comingSoon");
});

const description = computed(() => t("portfolios.comingSoonLead"));
</script>

<style scoped>
.coming-soon {
  max-width: 40rem;
}

.coming-soon h1 {
  margin: 0 0 1rem;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
}

.note {
  margin: 1.5rem 0;
  padding: 1rem 1.25rem;
  background: var(--gy-sand);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
