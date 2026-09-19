<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="System"
      title="SEO / Settings"
      subtitle="Site defaults, contact, and payment MVP flag."
    >
      <template #actions>
        <q-btn unelevated no-caps color="primary" label="Save settings" @click="save" />
      </template>
    </AdminPageHeader>

    <div v-reveal="{ delay: '120ms' }" class="settings-grid">
      <q-card flat bordered class="bg-white">
        <q-card-section>
          <div class="text-subtitle1 q-mb-md">Site & SEO</div>
          <q-form class="q-gutter-md" @submit.prevent="save">
            <q-input v-model="form.siteName" label="Site name" outlined dense />
            <q-input
              v-model="form.siteUrl"
              label="Public site URL"
              outlined
              dense
            />
            <q-input v-model="form.defaultTitle" label="Default meta title" outlined dense />
            <q-input
              v-model="form.defaultDescription"
              label="Default meta description"
              type="textarea"
              outlined
              autogrow
            />
            <q-input v-model="form.ogImage" label="Default Open Graph image URL" outlined dense />
            <q-input
              v-model="form.analyticsId"
              label="Analytics / GTM ID"
              outlined
              dense
            />
          </q-form>
        </q-card-section>
      </q-card>

      <div class="column q-gutter-md">
        <q-card flat bordered class="bg-white">
          <q-card-section>
            <div class="text-subtitle1 q-mb-md">Contact</div>
            <div class="q-gutter-md">
              <q-input v-model="form.contactEmail" label="Public contact email" outlined dense />
              <q-input v-model="form.contactPhone" label="Public contact phone" outlined dense />
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="bg-white">
          <q-card-section>
            <div class="text-subtitle1 q-mb-md">Payment (MVP)</div>
            <q-toggle
              v-model="form.paymentEnabled"
              label="Online payment enabled"
              color="primary"
              class="q-mb-md"
            />
            <q-input
              v-model="form.paymentNote"
              label="Payment deferred notice"
              type="textarea"
              outlined
              autogrow
              :disable="form.paymentEnabled"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useCmsStore, type SiteSettings } from "@/stores/cms-store";

const cms = useCmsStore();
const $q = useQuasar();

function cloneSettings(s: SiteSettings): SiteSettings {
  return {
    ...s,
    heroSlides: s.heroSlides.map(slide => ({ ...slide }))
  };
}

const form = reactive(cloneSettings(cms.settings));

onMounted(async () => {
  await cms.ensureSettings();
  Object.assign(form, cloneSettings(cms.settings));
});

async function save() {
  try {
    await cms.saveSettings({
      siteName: form.siteName,
      siteUrl: form.siteUrl,
      defaultTitle: form.defaultTitle,
      defaultDescription: form.defaultDescription,
      ogImage: form.ogImage,
      analyticsId: form.analyticsId,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      paymentEnabled: form.paymentEnabled,
      paymentNote: form.paymentNote
    });
    Object.assign(form, cloneSettings(cms.settings));
    $q.notify({ type: "positive", message: "Settings saved." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Save failed."
    });
  }
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
