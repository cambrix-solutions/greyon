<template>
  <q-page class="gy-section">
    <SeoHead
      :title="cmsPage?.seoTitle || title"
      :description="cmsPage?.seoDescription || title"
    />
    <div class="gy-container legal">
      <p class="gy-eyebrow">{{ type === "faq" ? "Help" : "Legal" }}</p>
      <h1 class="gy-display">{{ title }}</h1>
      <p v-if="cmsPage?.subtitle" class="legal__sub">{{ cmsPage.subtitle }}</p>
      <div class="content">
        <!-- Published Pages CMS content wins; built-in text until then. -->
        <CmsBlocks v-if="cmsPage" :blocks="cmsPage.blocks" />
        <template v-else-if="loaded || type !== 'faq'">
          <p v-for="(para, idx) in paragraphs" :key="idx">{{ para }}</p>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CmsBlocks from "@/components/CmsBlocks.vue";
import SeoHead from "@/components/SeoHead.vue";
import {
  fetchPublicCmsPage,
  type CmsPage
} from "@/services/engine/adminAccess";

const route = useRoute();
const type = computed(() => String(route.meta.legalType || "privacy"));

/** legalType → Pages CMS slug (admin → Publishing → Pages). */
const cmsSlugs: Record<string, string> = {
  privacy: "privacy",
  terms: "terms",
  booking: "booking-terms",
  faq: "faq"
};
const cmsPage = ref<CmsPage | null>(null);
const loaded = ref(false);

watch(
  type,
  async value => {
    cmsPage.value = null;
    loaded.value = false;
    try {
      cmsPage.value = await fetchPublicCmsPage(cmsSlugs[value] ?? value);
    } catch {
      cmsPage.value = null;
    } finally {
      loaded.value = true;
    }
  },
  { immediate: true }
);

const title = computed(() => {
  if (cmsPage.value) return cmsPage.value.title;
  if (type.value === "faq") return "Frequently Asked Questions";
  if (type.value === "terms") return "Terms & Conditions";
  if (type.value === "booking") return "Reservation Terms";
  return "Privacy Policy";
});

const paragraphs = computed(() => {
  if (type.value === "faq") {
    return ["Answers to common questions will appear here soon."];
  }
  if (type.value === "terms") {
    return [
      "These terms govern use of the Greyon website. Content is provided for hotel discovery and reservation requests.",
      "Greyon may update hotel information, rates, and availability without notice. Binding commercial terms are confirmed in your booking confirmation.",
      "Placeholder copy pending legal review before production launch."
    ];
  }
  if (type.value === "booking") {
    return [
      "Greyon MVP bookings are reservation requests. A unique reference is issued on submission. Final confirmation is completed by the hotel/booking team.",
      "Cancellation and modification rules shown during checkout apply to the selected rate plan.",
      "Online payment is out of scope for this MVP and may be added once a payment provider is approved."
    ];
  }
  return [
    "Greyon collects only the personal data needed to process enquiries and booking requests (name, email, phone, stay details).",
    "Data is used for reservation handling, customer communication, and service improvement. We do not sell personal data.",
    "Cookie and analytics notices will be activated with the approved analytics configuration. Placeholder pending legal approval."
  ];
});
</script>

<style scoped>
.legal__sub {
  margin: -0.5rem 0 1.25rem;
  color: var(--gy-muted);
}

.legal h1 {
  margin: 0 0 1.25rem;
  font-size: var(--gy-text-display);
}

.content {
  max-width: 42rem;
  line-height: 1.8;
  color: var(--gy-forest);
}
</style>
