<template>
  <q-page class="gy-section">
    <SeoHead :title="title" :description="title" />
    <div class="gy-container legal">
      <p class="gy-eyebrow">Legal</p>
      <h1 class="gy-display">{{ title }}</h1>
      <div class="content">
        <p v-for="(para, idx) in paragraphs" :key="idx">{{ para }}</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SeoHead from "@/components/SeoHead.vue";

const route = useRoute();
const type = computed(() => String(route.meta.legalType || "privacy"));

const title = computed(() => {
  if (type.value === "terms") return "Terms & Conditions";
  if (type.value === "booking") return "Booking Terms";
  return "Privacy Policy";
});

const paragraphs = computed(() => {
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
.legal h1 {
  margin: 0 0 1.25rem;
  font-size: clamp(2.2rem, 5vw, 3.2rem);
}

.content {
  max-width: 42rem;
  line-height: 1.8;
  color: var(--gy-muted);
}
</style>
