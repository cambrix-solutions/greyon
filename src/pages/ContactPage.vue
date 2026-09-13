<template>
  <q-page class="gy-section">
    <SeoHead
      title="Contact | Greyon"
      description="Contact Greyon hotels and send an enquiry."
    />
    <div class="gy-container contact-grid">
      <div v-reveal>
        <p class="gy-eyebrow">Get in touch</p>
        <h1 class="gy-display page-title">Contact</h1>
        <p class="gy-muted">
          Greyon head office · Phnom Penh, Cambodia<br />
          hello@greyon.com.kh · +855 23 000 000<br />
          Business hours: Mon–Sat 08:30–17:30
        </p>
        <p class="gy-muted q-mt-md">
          Social:
          <a href="https://www.facebook.com" target="_blank" rel="noopener"
            >Facebook</a
          >
          ·
          <a href="https://www.instagram.com" target="_blank" rel="noopener"
            >Instagram</a
          >
        </p>
        <div class="contact-map q-mt-lg">
          <MapEmbed :lat="office.lat" :lng="office.lng" />
        </div>
      </div>

      <form v-reveal="{ delay: '120ms' }" class="contact-form" @submit.prevent="onSubmit">
        <h2 class="gy-display">Enquiry</h2>
        <label>
          Full name
          <input v-model="form.name" required />
        </label>
        <label>
          Email
          <input v-model="form.email" type="email" required />
        </label>
        <label>
          Phone
          <input v-model="form.phone" required />
        </label>
        <label>
          Subject
          <select v-model="form.subject" required>
            <option value="General">General</option>
            <option value="Booking">Booking</option>
            <option value="Partnership">Partnership</option>
            <option value="Press">Press</option>
          </select>
        </label>
        <label>
          Message
          <textarea v-model="form.message" rows="5" required />
        </label>
        <label class="consent">
          <input v-model="form.consent" type="checkbox" required />
          I consent to Greyon contacting me about this enquiry.
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
        <button class="gy-btn" type="submit" :disabled="sending">
          {{ sending ? "Sending…" : "Send enquiry" }}
        </button>
      </form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import MapEmbed from "@/components/MapEmbed.vue";
import SeoHead from "@/components/SeoHead.vue";
import { createEnquiry } from "@/services/bookingService";

/** Greyon head office — Phnom Penh */
const office = { lat: 11.5564, lng: 104.9282 };

const form = reactive({
  name: "",
  email: "",
  phone: "",
  subject: "General",
  message: "",
  consent: false
});
const sending = ref(false);
const error = ref("");
const success = ref("");

async function onSubmit() {
  error.value = "";
  success.value = "";
  if (!form.consent) {
    error.value = "Consent is required.";
    return;
  }
  sending.value = true;
  try {
    await createEnquiry({ ...form });
    success.value =
      "Thank you. Your enquiry was received. Our team will respond by email.";
    form.name = "";
    form.email = "";
    form.phone = "";
    form.message = "";
    form.consent = false;
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Could not send enquiry. Try again.";
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.page-title {
  margin: 0 0 1rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.contact-map {
  max-width: 28rem;
}

.contact-form {
  display: grid;
  gap: 0.85rem;
  padding: 1.5rem;
  background: var(--gy-sand);
}

.contact-form h2 {
  margin: 0;
  font-size: 1.8rem;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

input,
select,
textarea {
  border: 1px solid var(--gy-stone);
  background: white;
  padding: 0.55rem 0.65rem;
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
  color: var(--gy-ink);
}

.consent {
  grid-template-columns: auto 1fr;
  align-items: start;
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.9rem;
  color: var(--gy-ink);
}

.error {
  color: #8b2e2e;
}

.success {
  color: var(--gy-forest);
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
