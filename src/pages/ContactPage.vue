<template>
  <q-page class="gy-section contact-page">
    <SeoHead
      title="Contact | Greyon"
      description="Contact Greyon hotels and send an enquiry."
    />
    <div class="gy-container contact-grid">
      <div v-reveal class="contact-intro">
        <p class="gy-eyebrow">Get in touch</p>
        <h1 class="gy-display page-title">Contact</h1>
        <p class="gy-muted contact-address">
          {{ addressLine }}<br />
          hello@greyon.com.kh · +855 23 000 000<br />
          Business hours: Mon–Sat 08:30–17:30
        </p>
        <p class="gy-muted contact-social">
          Social:
          <a href="https://www.facebook.com" target="_blank" rel="noopener"
            >Facebook</a
          >
          ·
          <a href="https://www.instagram.com" target="_blank" rel="noopener"
            >Instagram</a
          >
        </p>

        <div class="map-card">
          <div class="map-chips" role="tablist" aria-label="Branch locations">
            <button
              v-for="choice in mapChoices"
              :key="choice.id"
              type="button"
              role="tab"
              class="map-chip"
              :class="{ 'is-active': choice.id === activeChipId }"
              :aria-selected="choice.id === activeChipId"
              @click="selectChoice(choice)"
            >
              {{ choice.label }}
            </button>
          </div>

          <div class="map-frame">
            <ContactBranchMap
              v-if="activeBranch"
              :lat="activeBranch.lat"
              :lng="activeBranch.lng"
              :label="activeBranch.placeName"
            />
            <p v-else class="map-empty">
              We don’t have a map pin for this destination yet.
            </p>
          </div>

          <a
            v-if="activeBranch"
            class="map-link"
            :href="activeBranch.mapsUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
            <q-icon name="open_in_new" size="16px" />
          </a>
        </div>
      </div>

      <q-form
        v-reveal="{ delay: '120ms' }"
        class="contact-form"
        greedy
        @submit.prevent="onSubmit"
      >
        <h2 class="gy-display">Enquiry</h2>
        <p class="form-lead">
          Tell us where you’d like to stay and we’ll write back by email.
        </p>

        <div class="field">
          <span>Full name</span>
          <q-input
            v-model="form.name"
            class="contact-field"
            outlined
            hide-bottom-space
            autocomplete="name"
            :rules="[
              val =>
                !!String(val ?? '').trim() || 'Please enter your full name.'
            ]"
          />
        </div>
        <div class="field">
          <span>Email</span>
          <q-input
            v-model="form.email"
            class="contact-field"
            type="email"
            outlined
            hide-bottom-space
            autocomplete="email"
            :rules="[
              val => emailOk(String(val ?? '')) || 'Please enter a valid email.'
            ]"
          />
        </div>
        <div class="field">
          <span>Phone</span>
          <q-input
            v-model="form.phone"
            class="contact-field"
            type="tel"
            outlined
            hide-bottom-space
            autocomplete="tel"
            :rules="[
              val =>
                !!String(val ?? '').trim() || 'Please enter a phone number.'
            ]"
          />
        </div>
        <div class="field">
          <span>Destination</span>
          <q-select
            v-model="form.locationId"
            class="contact-field contact-select"
            outlined
            emit-value
            map-options
            behavior="menu"
            hide-bottom-space
            dropdown-icon="expand_more"
            popup-content-class="contact-select-menu"
            :options="destinationOptions"
            option-value="id"
            option-label="name"
            :rules="[val => !!val || 'Please select a destination.']"
          >
            <template v-if="!form.locationId" #selected>
              <span class="select-placeholder">Select a destination</span>
            </template>
          </q-select>
        </div>
        <div class="field">
          <span>Message</span>
          <q-input
            v-model="form.message"
            class="contact-field contact-field--area"
            type="textarea"
            outlined
            hide-bottom-space
            autogrow
            :rules="[
              val => !!String(val ?? '').trim() || 'Please enter a message.'
            ]"
          />
        </div>

        <q-checkbox
          v-model="form.consent"
          class="consent"
          label="I consent to Greyon contacting me about this enquiry."
        />

        <p v-if="error" class="form-alert form-alert--error" role="alert">
          {{ error }}
        </p>
        <p v-if="success" class="form-alert form-alert--success" role="status">
          {{ success }}
        </p>

        <button class="gy-btn contact-submit" type="submit" :disabled="sending">
          {{ sending ? "Sending…" : "Send enquiry" }}
        </button>
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import ContactBranchMap from "@/components/ContactBranchMap.vue";
import SeoHead from "@/components/SeoHead.vue";
import {
  BRANCH_LOCATIONS,
  defaultBranchLocation,
  matchBranchLocation,
  type BranchLocation
} from "@/data/branchLocations";
import { createEnquiry } from "@/services/bookingService";
import { useCmsStore } from "@/stores/cms-store";
import type { Location } from "@/types/greyon";

type MapChoice = {
  id: string;
  label: string;
  branch: BranchLocation;
  locationId: string | null;
};

const cms = useCmsStore();
const destinations = computed(() => cms.publishedLocations);

const form = reactive({
  name: "",
  email: "",
  phone: "",
  locationId: "",
  message: "",
  consent: false
});
const sending = ref(false);
const error = ref("");
const success = ref("");
/** Used only when the catalog has not loaded a matching destination yet. */
const pinnedKey = ref<BranchLocation["key"] | null>(null);

const destinationOptions = computed(() =>
  destinations.value.map(loc => ({
    id: loc.id,
    name: loc.name,
    slug: loc.slug
  }))
);

const mapChoices = computed<MapChoice[]>(() => {
  const fromCatalog = destinations.value.flatMap(loc => {
    const branch = matchBranchLocation(loc.name, loc.slug);
    if (!branch) return [];
    return [
      {
        id: loc.id,
        label: loc.name,
        branch,
        locationId: loc.id
      }
    ];
  });
  if (fromCatalog.length) return fromCatalog;
  return BRANCH_LOCATIONS.map(branch => ({
    id: `branch:${branch.key}`,
    label: branch.city,
    branch,
    locationId: null
  }));
});

function phnomPenhLocation(): Location | undefined {
  return destinations.value.find(
    loc => matchBranchLocation(loc.name, loc.slug)?.key === "phnom-penh"
  );
}

const activeBranch = computed<BranchLocation | null>(() => {
  const selected = destinations.value.find(loc => loc.id === form.locationId);
  if (selected) return matchBranchLocation(selected.name, selected.slug);
  if (pinnedKey.value) {
    return (
      BRANCH_LOCATIONS.find(branch => branch.key === pinnedKey.value) ??
      defaultBranchLocation()
    );
  }
  return defaultBranchLocation();
});

const activeChipId = computed(() => {
  if (form.locationId) {
    const match = mapChoices.value.find(
      choice => choice.locationId === form.locationId
    );
    return activeBranch.value && match ? match.id : "";
  }
  const key = activeBranch.value?.key;
  return mapChoices.value.find(choice => choice.branch.key === key)?.id ?? "";
});

const addressLine = computed(() => {
  const branch = activeBranch.value;
  if (branch) return `${branch.placeName} · ${branch.city}, Cambodia`;
  const selected = destinations.value.find(loc => loc.id === form.locationId);
  if (selected) return `${selected.name}, Cambodia`;
  const fallback = defaultBranchLocation();
  return `${fallback.placeName} · ${fallback.city}, Cambodia`;
});

function selectChoice(choice: MapChoice) {
  pinnedKey.value = choice.branch.key;
  error.value = "";
  if (choice.locationId) form.locationId = choice.locationId;
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

watch(
  destinations,
  () => {
    if (form.locationId) return;
    if (pinnedKey.value) {
      const pinned = destinations.value.find(
        loc => matchBranchLocation(loc.name, loc.slug)?.key === pinnedKey.value
      );
      if (pinned) {
        form.locationId = pinned.id;
        return;
      }
    }
    const phnomPenh = phnomPenhLocation();
    if (phnomPenh) form.locationId = phnomPenh.id;
  },
  { immediate: true }
);

async function onSubmit() {
  error.value = "";
  success.value = "";
  if (!form.consent) {
    error.value = "Consent is required.";
    return;
  }
  if (!form.locationId) {
    error.value = "Please select a destination.";
    return;
  }
  const destination = destinations.value.find(l => l.id === form.locationId);
  if (!destination) {
    error.value = "Please select a valid destination.";
    return;
  }
  sending.value = true;
  try {
    await createEnquiry({
      name: form.name,
      email: form.email,
      phone: form.phone,
      locationId: form.locationId,
      subject: destination.name,
      message: form.message,
      consent: form.consent
    });
    success.value =
      "Thank you. Your enquiry was received. Our team will respond by email.";
    form.name = "";
    form.email = "";
    form.phone = "";
    form.message = "";
    form.consent = false;
    pinnedKey.value = null;
    form.locationId = phnomPenhLocation()?.id ?? "";
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Could not send enquiry. Try again.";
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  padding-top: clamp(1.5rem, 3vw, 2.75rem);
  padding-bottom: clamp(2.5rem, 6vw, 4.5rem);
}

.page-title {
  margin: 0 0 0.85rem;
  font-size: clamp(2.4rem, 5vw, 3.4rem);
}

.contact-address,
.contact-social {
  margin: 0;
  line-height: 1.65;
  font-size: 1.02rem;
}

.contact-social {
  margin-top: 0.85rem;
}

.contact-social a {
  color: var(--gy-forest);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(1.5rem, 3vw, 2.75rem);
  align-items: start;
}

.map-card {
  margin-top: 1.35rem;
  padding: 0.85rem;
  border-radius: 22px;
  background: #fff;
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.04),
    0 18px 44px rgba(69, 76, 75, 0.1);
}

.map-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
}

.map-chip {
  min-height: 2.25rem;
  padding: 0.35rem 0.85rem;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 999px;
  background: var(--gy-cream);
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.map-chip:hover {
  border-color: var(--gy-forest);
}

.map-chip.is-active {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: #fff;
  box-shadow: 0 6px 14px rgba(98, 112, 99, 0.28);
}

.map-chip:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.map-frame {
  overflow: hidden;
  border-radius: 16px;
  min-height: 18.5rem;
  background: var(--gy-sand);
}

.map-frame :deep(.branch-map),
.map-frame :deep(.branch-map__canvas) {
  min-height: 18.5rem;
  height: 20.5rem;
}

.map-empty {
  display: grid;
  place-items: center;
  min-height: 18.5rem;
  margin: 0;
  padding: 1.25rem;
  text-align: center;
  color: var(--gy-muted);
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.75rem;
  margin-top: 0.35rem;
  padding: 0.35rem 0.15rem;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.16em;
}

.map-link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
  border-radius: 6px;
}

.contact-form {
  display: grid;
  gap: 0.95rem;
  padding: clamp(1.25rem, 2vw, 1.85rem);
  border-radius: 24px;
  background: #fff;
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.04),
    0 18px 48px rgba(69, 76, 75, 0.1);
}

.contact-form h2 {
  margin: 0;
  font-size: 1.85rem;
}

.form-lead {
  margin: -0.35rem 0 0.15rem;
  color: var(--gy-muted);
  font-size: 0.98rem;
  line-height: 1.5;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field > span {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.contact-field :deep(.q-field__control) {
  min-height: 3.25rem;
  border-radius: 12px;
  background: #fff;
}

.contact-field :deep(.q-field__control:before) {
  border-color: rgba(69, 76, 75, 0.22);
  border-radius: 12px;
}

.contact-field :deep(.q-field__native),
.contact-field :deep(.q-field__input) {
  font-family: var(--font-body);
  font-size: 1.02rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--gy-ink);
  min-height: 3.25rem;
}

.contact-field :deep(.q-field__marginal) {
  height: 3.25rem;
  color: var(--gy-forest);
}

.contact-field.q-field--focused :deep(.q-field__control) {
  box-shadow: 0 0 0 3px rgba(98, 112, 99, 0.2);
}

.contact-field.q-field--focused :deep(.q-field__control:before),
.contact-field.q-field--focused :deep(.q-field__control:after) {
  border-color: var(--gy-forest) !important;
  border-width: 2px;
}

.contact-field--area :deep(.q-field__control),
.contact-field--area :deep(.q-field__native) {
  min-height: 7.5rem;
}

.contact-field--area :deep(textarea) {
  padding-top: 0.75rem;
  line-height: 1.5;
}

.select-placeholder {
  color: var(--gy-muted);
}

.consent {
  display: flex;
  align-items: flex-start;
  gap: 0.15rem;
  margin-top: 0.15rem;
  color: var(--gy-ink);
  font-size: 0.95rem;
  line-height: 1.45;
  cursor: pointer;
}

.consent :deep(.q-checkbox__label) {
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--gy-ink);
  padding-left: 0.15rem;
}

.consent :deep(.q-checkbox__inner) {
  font-size: 2.35rem;
  color: var(--gy-forest);
}

.consent :deep(.q-checkbox__bg) {
  border-radius: 6px;
  border-width: 2px;
  border-color: rgba(69, 76, 75, 0.35);
}

.consent :deep(.q-checkbox__inner--truthy),
.consent :deep(.q-checkbox__inner--indet) {
  color: var(--gy-forest);
}

.consent :deep(.q-checkbox__inner--truthy .q-checkbox__bg),
.consent :deep(.q-checkbox__inner--indet .q-checkbox__bg) {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
}

.consent :deep(.q-checkbox:focus-visible .q-checkbox__bg),
.consent :deep(.q-checkbox__inner:focus-visible) {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.form-alert {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  font-size: 0.92rem;
  line-height: 1.45;
}

.form-alert--error {
  background: rgba(139, 46, 46, 0.08);
  color: #8b2e2e;
}

.form-alert--success {
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
}

.contact-submit {
  width: 100%;
  min-height: 3.25rem;
  border-radius: 12px;
  background: var(--gy-forest);
  letter-spacing: 0.14em;
}

.contact-submit:disabled {
  opacity: 0.7;
  cursor: progress;
  transform: none;
  box-shadow: none;
}

@media (max-width: 1023px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .map-frame,
  .map-frame :deep(.branch-map),
  .map-frame :deep(.branch-map__canvas),
  .map-empty {
    min-height: 16rem;
    height: 16.5rem;
  }
}

@media (max-width: 599px) {
  .contact-page {
    padding-top: 1.15rem;
  }

  .page-title {
    font-size: 2.15rem;
  }

  .contact-form,
  .map-card {
    border-radius: 18px;
    padding: 0.95rem;
  }

  .contact-form {
    padding: 1.1rem 1rem 1.15rem;
  }

  .map-chip {
    min-height: 2.5rem;
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .contact-grid {
    gap: 1.35rem;
  }

  .map-frame,
  .map-frame :deep(.branch-map),
  .map-frame :deep(.branch-map__canvas) {
    height: 18rem;
    min-height: 18rem;
  }
}
</style>

<style>
.contact-select-menu {
  border-radius: 14px !important;
  padding: 0.35rem;
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow: 0 16px 40px rgba(69, 76, 75, 0.16);
}

.contact-select-menu .q-item {
  min-height: 2.75rem;
  border-radius: 10px;
  font-family: var(--font-body);
  color: var(--gy-ink);
}

.contact-select-menu .q-item--active,
.contact-select-menu .q-manual-focusable--focused {
  background: #627063 !important;
  color: #fff !important;
}
</style>
