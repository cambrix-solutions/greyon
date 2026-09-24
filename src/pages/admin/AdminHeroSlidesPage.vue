<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Publishing"
      title="Hero slides"
      subtitle="Homepage background slider — order top → bottom is the play order."
    >
      <template #actions>
        <q-btn
          v-if="auth.canAction('settings', 'create')"
          outline
          no-caps
          color="primary"
          label="Add slide"
          :disable="slides.length >= 12"
          @click="addSlide"
        />
        <q-btn
          v-if="auth.canAction('settings', 'update')"
          unelevated
          no-caps
          color="primary"
          label="Save slides"
          @click="save"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal="{ delay: '100ms' }">
      <q-card flat bordered class="bg-white">
        <q-card-section>
          <div v-if="!slides.length" class="text-body2 text-grey-8 q-mb-md">
            No slides yet — add at least one image URL for the home hero.
          </div>

          <div class="q-gutter-sm">
            <q-card
              v-for="(slide, index) in slides"
              :key="`slide-${index}`"
              flat
              bordered
              class="slide-row"
            >
              <div class="row items-center q-col-gutter-sm q-pa-sm">
                <div class="col-auto">
                  <q-img
                    :src="slide.src || undefined"
                    style="width: 112px; height: 72px; border-radius: 8px"
                    fit="cover"
                  >
                    <template #error>
                      <div class="slide-row__ph flex flex-center">No image</div>
                    </template>
                  </q-img>
                </div>
                <div class="col">
                  <q-input
                    v-model="slide.src"
                    dense
                    outlined
                    label="Image URL"
                    class="q-mb-sm"
                  />
                  <q-input
                    v-model="slide.alt"
                    dense
                    outlined
                    label="Alt text"
                  />
                </div>
                <div class="col-auto column q-gutter-xs">
                  <q-btn
                    dense
                    flat
                    icon="arrow_upward"
                    :disable="
                      index === 0 || !auth.canAction('settings', 'update')
                    "
                    @click="moveSlide(index, -1)"
                  />
                  <q-btn
                    dense
                    flat
                    icon="arrow_downward"
                    :disable="
                      index === slides.length - 1 ||
                      !auth.canAction('settings', 'update')
                    "
                    @click="moveSlide(index, 1)"
                  />
                  <q-btn
                    v-if="auth.canAction('settings', 'delete')"
                    dense
                    flat
                    color="negative"
                    icon="delete"
                    @click="removeSlide(index)"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { HeroSlide } from "@/services/engine/mappers";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const slides = ref<HeroSlide[]>([]);

onMounted(async () => {
  await cms.ensureSettings();
  slides.value = cms.settings.heroSlides.map(s => ({ ...s }));
});

function addSlide() {
  if (slides.value.length >= 12) return;
  slides.value.push({ src: "", alt: "" });
}

function removeSlide(index: number) {
  slides.value.splice(index, 1);
}

function moveSlide(index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= slides.value.length) return;
  const [row] = slides.value.splice(index, 1);
  if (!row) return;
  slides.value.splice(next, 0, row);
}

async function save() {
  try {
    const heroSlides = slides.value
      .map(s => ({ src: s.src.trim(), alt: s.alt.trim() }))
      .filter(s => s.src);
    await cms.saveSettings({ heroSlides });
    slides.value = cms.settings.heroSlides.map(s => ({ ...s }));
    $q.notify({ type: "positive", message: "Hero slides saved." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Save failed."
    });
  }
}
</script>

<style scoped>
.slide-row__ph {
  width: 100%;
  height: 100%;
  background: #f0eeea;
  color: #8a847a;
  font-size: 0.7rem;
}
</style>
