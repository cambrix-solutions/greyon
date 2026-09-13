<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="System"
      title="SEO / Settings"
      subtitle="Site defaults, contact, payment MVP flag, and sitemap export."
    >
      <template #actions>
        <q-btn outline no-caps color="primary" label="Download sitemap" @click="downloadSitemap" />
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
              hint="Used for sitemap absolute URLs"
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

        <q-card flat bordered class="bg-white">
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Sitemap</div>
            <p class="text-body2 text-grey-8 q-mb-md">
              Generate from published hotels, locations, and news. Preview at
              <router-link to="/sitemap">/sitemap</router-link>.
            </p>
            <q-btn outline color="primary" no-caps label="Download sitemap.xml" @click="downloadSitemap" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useCmsStore } from "@/stores/cms-store";
import { buildCmsSitemapEntries, buildSitemapXml, downloadTextFile } from "@/utils/sitemap";

const cms = useCmsStore();
const $q = useQuasar();
const form = reactive({ ...cms.settings });

function save() {
  cms.saveSettings({ ...form });
  $q.notify({ type: "positive", message: "Settings saved." });
}

function downloadSitemap() {
  const base = (form.siteUrl || cms.settings.siteUrl || "https://www.greyon.com.kh").replace(
    /\/$/,
    ""
  );
  const entries = buildCmsSitemapEntries({
    hotels: cms.publishedHotels,
    locations: cms.publishedLocations,
    news: cms.publishedNews
  });
  downloadTextFile("sitemap.xml", buildSitemapXml(base, entries));
  $q.notify({ type: "positive", message: "sitemap.xml downloaded." });
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
