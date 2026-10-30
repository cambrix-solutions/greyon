<template>
  <q-page
    class="dest-luxe home-motion rooms-luxe news-luxe story-luxe contact-luxe"
  >
    <SeoHead
      title="Contact | Greyon"
      description="Contact Greyon apartels and send an enquiry."
      :image="heroImage || undefined"
    />

    <div ref="pageEl">
      <div
        class="read-bar"
        data-sheet="Progress"
        role="progressbar"
        aria-label="Reading progress"
        :aria-valuenow="readPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="barStyle" />
        <span v-if="showSheets" class="sheet-label">Progress</span>
      </div>

      <section
        v-if="heroImage"
        class="stage stage--short"
        data-sheet="Arrive"
        aria-labelledby="contact-title"
      >
        <span v-if="showSheets" class="sheet-label">Arrive</span>
        <div ref="heroFrame" class="stage__media">
          <img
            class="stage__img"
            :src="heroImage"
            alt=""
            fetchpriority="high"
          />
          <div class="stage__veil" />
        </div>
        <div class="dest-wrap stage__content">
          <p v-reveal class="eyebrow eyebrow--light">Get in touch</p>
          <h1 id="contact-title" v-reveal="{ delay: '70ms' }">Contact</h1>
          <p v-reveal="{ delay: '120ms' }" class="stage__lead">{{
            addressLine
          }}</p>
        </div>
        <SectionDivider fill="var(--gy-cream)" />
      </section>

      <section
        v-else
        class="arrive-plain"
        data-sheet="Arrive"
        aria-labelledby="contact-title"
      >
        <span v-if="showSheets" class="sheet-label">Arrive</span>
        <div class="dest-wrap">
          <p v-reveal class="eyebrow">Get in touch</p>
          <h1 id="contact-title">Contact</h1>
          <p>{{ addressLine }}</p>
        </div>
      </section>

      <section
        v-if="reachCards.length"
        id="contact-reach"
        class="reach"
        data-sheet="Reach"
        aria-labelledby="reach-title"
      >
        <span v-if="showSheets" class="sheet-label">Reach</span>
        <div class="dest-wrap reach__head">
          <p id="reach-title" v-reveal class="eyebrow">Stay connected</p>
        </div>
        <div class="dest-wrap reach__grid">
          <article
            v-for="card in reachCards"
            :key="card.id"
            v-tilt="{ max: 7 }"
            class="reach-card rooms-tilt glass-edge"
          >
            <h3>{{ card.title }}</h3>
            <p v-if="card.note" class="reach-card__note">{{ card.note }}</p>
            <p
              v-for="line in card.lines"
              :key="`${card.id}-${line.label}-${line.value}`"
              class="reach-card__line"
            >
              <span>{{ line.label }}</span>
              <a v-if="line.href" :href="line.href">{{ line.value }}</a>
              <template v-else>{{ line.value }}</template>
            </p>
            <a
              v-if="card.mapsUrl"
              class="text-link"
              :href="card.mapsUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Open in Google Maps</span>
            </a>
          </article>
        </div>
      </section>

      <section class="contact-band" aria-label="Enquiry">
        <div class="dest-wrap contact-grid">
          <div class="map-card glass-edge" data-sheet="Map">
            <span v-if="showSheets" class="sheet-label">Map</span>
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

          <q-form
            v-reveal="{ delay: '120ms' }"
            class="enquiry spin-edge"
            data-sheet="Enquiry"
            greedy
            @submit.prevent="onSubmit"
          >
            <span v-if="showSheets" class="sheet-label">Enquiry</span>
            <h2>Enquiry</h2>
            <p class="enquiry__lead">
              Tell us where you’d like to stay and we’ll write back by email.
            </p>

            <div class="enquiry__field">
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
            <div class="enquiry__field">
              <span>Email</span>
              <q-input
                v-model="form.email"
                class="contact-field"
                type="email"
                outlined
                hide-bottom-space
                autocomplete="email"
                :rules="[
                  val =>
                    emailOk(String(val ?? '')) || 'Please enter a valid email.'
                ]"
              />
            </div>
            <div class="enquiry__field">
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
            <div class="enquiry__field">
              <span>Destination</span>
              <GySelect
                v-model="form.locationId"
                class="contact-field"
                outlined
                emit-value
                map-options
                hide-bottom-space
                :options="destinationOptions"
                option-value="id"
                option-label="name"
                :rules="[val => !!val || 'Please select a destination.']"
              >
                <template v-if="!form.locationId" #selected>
                  <span class="select-placeholder">Select a destination</span>
                </template>
              </GySelect>
            </div>
            <div class="enquiry__field">
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
            <p
              v-if="success"
              class="form-alert form-alert--success"
              role="status"
            >
              {{ success }}
            </p>

            <button
              v-magnetic
              class="gy-btn contact-submit"
              type="submit"
              :disabled="sending"
            >
              {{ sending ? "Sending…" : "Send enquiry" }}
            </button>
          </q-form>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ContactBranchMap from "@/components/ContactBranchMap.vue";
import GySelect from "@/components/GySelect.vue";
import { useParallax } from "@/components/home/useParallax";
import { useReadProgress } from "@/components/home/useReadProgress";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
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
import { hostedImage } from "@/utils/hostedImage";

type MapChoice = {
  id: string;
  label: string;
  branch: BranchLocation;
  locationId: string | null;
};

type ReachLine = {
  label: string;
  value: string;
  href?: string;
};

type ReachCard = {
  id: string;
  title: string;
  note: string;
  lines: ReachLine[];
  mapsUrl: string;
};

const cms = useCmsStore();
const route = useRoute();
const destinations = computed(() => cms.publishedLocations);

const pageEl = ref<HTMLElement | null>(null);
const { progress } = useReadProgress(pageEl);
const readPercent = computed(() => Math.round(progress.value * 100));
const barStyle = computed(() => ({
  transform: `scaleX(${progress.value})`
}));
const showSheets = computed(() => String(route.query.sheets ?? "") === "1");

const heroFrame = ref<HTMLElement | null>(null);
const heroOffset = useParallax(heroFrame, 140);
const heroStyle = computed(() => ({
  transform: `translate3d(0, ${heroOffset.value}px, 0)`
}));

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

const heroImage = computed(() => imageForBranch(activeBranch.value));

const reachCards = computed(() => {
  const cards: ReachCard[] = [];
  const site = siteCard();
  if (site) cards.push(site);
  for (const choice of mapChoices.value) cards.push(branchCard(choice));
  return cards.filter(card => card.title.trim() || card.lines.length);
});

function selectChoice(choice: MapChoice) {
  pinnedKey.value = choice.branch.key;
  error.value = "";
  if (choice.locationId) form.locationId = choice.locationId;
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function telHref(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function line(label: string, value: string, href = ""): ReachLine {
  const next: ReachLine = { label, value };
  if (href) next.href = href;
  return next;
}

function siteCard(): ReachCard | null {
  const email = cms.settings.contactEmail.trim();
  const phone = cms.settings.contactPhone.trim();
  const lines: ReachLine[] = [];
  if (email) lines.push(line("Email", email, `mailto:${email}`));
  if (phone) lines.push(line("Phone", phone, telHref(phone)));
  if (!lines.length) return null;
  return {
    id: "site",
    title: cms.settings.siteName.trim() || "Greyon",
    note: "",
    lines,
    mapsUrl: ""
  };
}

function branchCard(choice: MapChoice): ReachCard {
  const loc = choice.locationId
    ? cms.getLocationById(choice.locationId)
    : cms.publishedLocations.find(
        item =>
          matchBranchLocation(item.name, item.slug)?.key === choice.branch.key
      );
  const hotel = loc
    ? cms.publishedHotels.find(item => item.locationId === loc.id)
    : undefined;
  const lines: ReachLine[] = [];
  const address = hotel?.address?.trim() ?? "";
  if (address) lines.push(line("Address", address));
  const email = hotel?.email?.trim() || loc?.email?.trim() || "";
  if (email) lines.push(line("Email", email, `mailto:${email}`));
  const phone = hotel?.phone?.trim() || loc?.phone?.trim() || "";
  if (phone) lines.push(line("Phone", phone, telHref(phone)));
  const locPhone = loc?.phone?.trim() ?? "";
  if (locPhone && locPhone !== phone) {
    lines.push(line("Phone", locPhone, telHref(locPhone)));
  }
  return {
    id: choice.id,
    title: choice.branch.placeName,
    note: `${choice.branch.city}, Cambodia`,
    lines,
    mapsUrl: choice.branch.mapsUrl
  };
}

function imageForBranch(branch: BranchLocation | null) {
  if (!branch) return "";
  const loc = cms.publishedLocations.find(
    item => matchBranchLocation(item.name, item.slug)?.key === branch.key
  );
  const hotel = loc
    ? cms.publishedHotels.find(item => item.locationId === loc.id)
    : undefined;
  return (
    hostedImage(hotel?.heroImage) ||
    hostedImage(loc?.heroImage) ||
    hostedImage(loc?.gallery[0])
  );
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

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>
<style src="./news-luxe.css"></style>
<style src="./story-luxe.css"></style>
