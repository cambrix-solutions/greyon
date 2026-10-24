<template>
  <q-page padding class="hero-admin">
    <AdminPageHeader
      eyebrow="Homepage"
      title="Hero slides"
      :subtitle="countLabel"
    >
      <template #actions>
        <q-btn
          v-if="canManage"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add slide"
          class="hero-add"
          :disable="loading"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <p v-if="loadError" class="hero-alert" role="alert">{{ loadError }}</p>

    <div v-if="loading" class="slide-grid" aria-hidden="true">
      <div v-for="n in 3" :key="`skel-${n}`" class="slide-skel">
        <q-skeleton type="rect" class="slide-skel__media" />
      </div>
    </div>

    <div v-else-if="!slides.length" class="hero-empty">
      <div class="hero-empty__art" aria-hidden="true">
        <svg viewBox="0 0 120 88" width="120" height="88">
          <rect
            x="8"
            y="10"
            width="104"
            height="68"
            rx="14"
            fill="#f4efe8"
            stroke="#d9d0c3"
          />
          <circle cx="36" cy="34" r="8" fill="var(--gy-gold)" />
          <path
            d="M18 66l22-18 14 12 16-20 32 26"
            fill="none"
            stroke="var(--gy-forest)"
            stroke-width="3"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <h2 class="gy-display">No hero slides yet</h2>
      <p>
        Add a wide photo, a short line of copy, and a button. The first active
        slide is what guests see behind the homepage.
      </p>
      <q-btn
        v-if="canManage"
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Add slide"
        class="hero-add"
        @click="openCreate"
      />
    </div>

    <div v-else class="slide-grid">
      <article
        v-for="slide in slides"
        :key="slide.id"
        class="slide-card"
        :class="{ 'is-dragging': draggingId === slide.id }"
        :data-slide-id="slide.id"
      >
        <img
          v-if="previewSrc(slide)"
          class="slide-card__img"
          :src="previewSrc(slide)"
          :alt="slide.title"
          draggable="false"
        />
        <div v-else class="slide-card__img slide-card__img--empty"
          >No image</div
        >
        <div class="slide-card__shade">
          <div class="slide-card__bar">
            <button
              v-if="canManage"
              type="button"
              class="slide-card__handle"
              aria-label="Drag to reorder"
              @pointerdown="onDragStart($event, slide.id)"
              @pointermove="onDragMove"
              @pointerup="onDragEnd"
              @pointercancel="onDragEnd"
            >
              <q-icon name="drag_indicator" size="20px" />
            </button>
            <span class="slide-chip" :data-status="statusOf(slide)">{{
              statusLabel(statusOf(slide))
            }}</span>
            <span class="slide-card__spacer" />
            <button
              v-if="canManage"
              type="button"
              class="slide-switch"
              :class="{ 'is-on': slide.isActive }"
              role="switch"
              :aria-checked="slide.isActive"
              :aria-label="
                slide.isActive ? 'Deactivate slide' : 'Activate slide'
              "
              :disabled="Boolean(busyId)"
              @click="toggleActive(slide)"
            >
              <span />
            </button>
            <button
              v-if="canManage"
              type="button"
              class="slide-icon"
              aria-label="Edit slide"
              @click="openEdit(slide)"
            >
              <q-icon name="edit" size="18px" />
            </button>
            <button
              v-if="canManage"
              type="button"
              class="slide-icon slide-icon--danger"
              aria-label="Delete slide"
              @click="askDelete(slide)"
            >
              <q-icon name="delete" size="18px" />
            </button>
          </div>
          <div class="slide-card__copy">
            <h2>{{ slide.title }}</h2>
            <p v-if="slide.subtitle">{{ slide.subtitle }}</p>
            <span v-if="slide.ctaLabel" class="slide-card__cta">{{
              slide.ctaLabel
            }}</span>
          </div>
        </div>
      </article>
    </div>

    <q-dialog v-model="editorOpen" :maximized="narrow" persistent>
      <q-card class="editor-card">
        <header class="editor-card__head">
          <div>
            <p class="admin-kicker">{{
              form.id ? "Edit slide" : "New slide"
            }}</p>
            <h2 class="gy-display">
              {{ form.id ? "Update hero slide" : "Add a hero slide" }}
            </h2>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Close"
            @click="editorOpen = false"
          />
        </header>

        <div class="editor-grid">
          <div class="editor-form">
            <ImageDropField
              :model-value="form.preview"
              folder="hero-slides"
              title="Drop a hero image"
              :alt-hint="form.title || 'Hero slide'"
              @update:model-value="onPreview"
              @resolved="onUploaded"
            />
            <p v-if="errors.image" class="field-error" role="alert">
              {{ errors.image }}
            </p>

            <q-input
              v-model="form.title"
              outlined
              label="Title"
              maxlength="120"
              counter
              :error="Boolean(errors.title)"
              :error-message="errors.title"
              @update:model-value="clearError('title')"
            />
            <q-input
              v-model="form.subtitle"
              outlined
              type="textarea"
              autogrow
              label="Subtitle"
              maxlength="240"
              counter
              :error="Boolean(errors.subtitle)"
              :error-message="errors.subtitle"
              @update:model-value="clearError('subtitle')"
            />
            <div class="editor-split">
              <q-input
                v-model="form.ctaLabel"
                outlined
                label="Button label"
                maxlength="60"
                counter
                :error="Boolean(errors.ctaLabel)"
                :error-message="errors.ctaLabel"
                @update:model-value="clearError('ctaLabel')"
              />
              <q-input
                v-model="form.ctaUrl"
                outlined
                label="Button link"
                hint="A path like /booking, or https://…"
                :error="Boolean(errors.ctaUrl)"
                :error-message="errors.ctaUrl"
                @update:model-value="clearError('ctaUrl')"
              />
            </div>
            <div class="editor-split">
              <q-input
                v-model="form.startsAt"
                outlined
                type="datetime-local"
                label="Starts"
                stack-label
                :error="Boolean(errors.startsAt)"
                :error-message="errors.startsAt"
                @update:model-value="clearError('startsAt')"
              />
              <q-input
                v-model="form.endsAt"
                outlined
                type="datetime-local"
                label="Ends"
                stack-label
                :error="Boolean(errors.endsAt)"
                :error-message="errors.endsAt"
                @update:model-value="clearError('endsAt')"
              />
            </div>
            <q-toggle
              v-model="form.isActive"
              color="primary"
              label="Active on the homepage"
            />
          </div>

          <aside class="editor-preview" aria-label="Homepage preview">
            <p class="admin-kicker">Live preview</p>
            <div class="mini-hero">
              <img
                v-if="form.preview || form.image"
                :src="form.preview || form.image"
                alt=""
              />
              <div class="mini-hero__shade">
                <p class="mini-hero__brand">Greyon</p>
                <h3>{{ form.title.trim() || "Slide title" }}</h3>
                <p>{{
                  form.subtitle.trim() || "A short line under the title."
                }}</p>
                <span v-if="form.ctaLabel.trim()" class="mini-hero__cta">{{
                  form.ctaLabel.trim()
                }}</span>
              </div>
            </div>
          </aside>
        </div>

        <footer class="editor-card__foot">
          <q-btn flat no-caps label="Cancel" @click="editorOpen = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="hero-add"
            :label="form.id ? 'Save changes' : 'Add slide'"
            :loading="saving"
            @click="saveSlide"
          />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteOpen" persistent>
      <q-card class="confirm-card">
        <h2 class="gy-display">Delete this slide?</h2>
        <p>
          “{{ deleteTarget?.title || "This slide" }}” will be removed from the
          homepage. This can’t be undone.
        </p>
        <div class="confirm-card__actions">
          <q-btn flat no-caps label="Cancel" @click="deleteOpen = false" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Delete slide"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";
import type { UploadResult } from "@/services/engine/uploads";
import {
  createAdminHeroSlide,
  destroyAdminHeroSlide,
  fetchAdminHeroSlides,
  fieldErrorsFromApi,
  friendlyHeroSlidesError,
  heroSlidePreviewSrc,
  heroSlideStatus,
  reorderAdminHeroSlides,
  updateAdminHeroSlide,
  type AdminHeroSlide,
  type HeroSlideInput,
  type HeroSlideStatus
} from "@/services/engine/heroSlides";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

const slides = ref<AdminHeroSlide[]>([]);
const loading = ref(true);
const loadError = ref("");
const saving = ref(false);
const deleting = ref(false);
const busyId = ref("");
const draggingId = ref("");
const editorOpen = ref(false);
const deleteOpen = ref(false);
const deleteTarget = ref<AdminHeroSlide | null>(null);
const errors = reactive<Record<string, string>>({});

const form = reactive({
  id: "",
  title: "",
  subtitle: "",
  image: "",
  preview: "",
  ctaLabel: "",
  ctaUrl: "",
  isActive: true,
  startsAt: "",
  endsAt: ""
});

let dragSnapshot: AdminHeroSlide[] = [];

const canManage = computed(() => auth.can("hero_slides"));
const narrow = computed(() => $q.screen.width < 720);
const countLabel = computed(() => {
  if (loading.value) return "Loading slides…";
  if (slides.value.length === 1) return "1 slide";
  return `${slides.value.length} slides`;
});

onMounted(() => {
  void load();
});

function previewSrc(slide: AdminHeroSlide) {
  return heroSlidePreviewSrc(slide);
}

function statusOf(slide: AdminHeroSlide): HeroSlideStatus {
  return heroSlideStatus(slide);
}

function statusLabel(status: HeroSlideStatus) {
  if (status === "scheduled") return "Scheduled";
  if (status === "hidden") return "Hidden";
  return "Active";
}

function notify(message: string, type: "positive" | "negative" = "negative") {
  $q.notify({ type, message, position: "top" });
}

function mirrorSettings(list: AdminHeroSlide[]) {
  const visible = list.filter(slide => heroSlideStatus(slide) === "active");
  if (!visible.length) return;
  cms.settings.heroSlides = visible.map(slide => ({
    src: heroSlidePreviewSrc(slide),
    alt: slide.title || "Greyon hotel stay"
  }));
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    slides.value = await fetchAdminHeroSlides();
    mirrorSettings(slides.value);
  } catch (error) {
    loadError.value = friendlyHeroSlidesError(
      error,
      "We couldn’t load hero slides. Please try again."
    );
    notify(loadError.value);
  } finally {
    loading.value = false;
  }
}

function clearError(key: string) {
  errors[key] = "";
}

function resetErrors() {
  for (const key of Object.keys(errors)) delete errors[key];
}

function blankForm() {
  form.id = "";
  form.title = "";
  form.subtitle = "";
  form.image = "";
  form.preview = "";
  form.ctaLabel = "";
  form.ctaUrl = "";
  form.isActive = true;
  form.startsAt = "";
  form.endsAt = "";
  resetErrors();
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function openCreate() {
  blankForm();
  editorOpen.value = true;
}

function openEdit(slide: AdminHeroSlide) {
  resetErrors();
  form.id = slide.id;
  form.title = slide.title;
  form.subtitle = slide.subtitle;
  form.image = slide.image;
  form.preview = previewSrc(slide);
  form.ctaLabel = slide.ctaLabel;
  form.ctaUrl = slide.ctaUrl;
  form.isActive = slide.isActive;
  form.startsAt = toLocalInput(slide.startsAt);
  form.endsAt = toLocalInput(slide.endsAt);
  editorOpen.value = true;
}

function onPreview(value: string) {
  form.preview = value;
  clearError("image");
  if (!value) {
    form.image = "";
    return;
  }
  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith("/")) {
    form.image = value;
  }
}

function onUploaded(result: UploadResult) {
  form.image = result.path?.trim() || result.url;
  form.preview = result.url || form.image;
  clearError("image");
}

function applyFieldErrors(next: Record<string, string>) {
  resetErrors();
  Object.assign(errors, next);
}

function validate(): Record<string, string> {
  const next: Record<string, string> = {};
  const title = form.title.trim();
  const subtitle = form.subtitle.trim();
  const ctaLabel = form.ctaLabel.trim();
  const ctaUrl = form.ctaUrl.trim();
  if (!title) next.title = "Title is required.";
  else if (title.length > 120)
    next.title = "Title must be 120 characters or fewer.";
  if (subtitle.length > 240) {
    next.subtitle = "Subtitle must be 240 characters or fewer.";
  }
  if (!form.image.trim()) next.image = "Add an image before saving.";
  if (ctaLabel.length > 60) {
    next.ctaLabel = "Button label must be 60 characters or fewer.";
  }
  if (ctaUrl && !ctaLabel) {
    next.ctaLabel = "Add a button label for this link.";
  }
  if (ctaUrl && !/^(\/|https?:\/\/)/i.test(ctaUrl)) {
    next.ctaUrl = "Use a site path (/booking) or an http(s) link.";
  }
  const start = fromLocalInput(form.startsAt);
  const end = fromLocalInput(form.endsAt);
  if (form.startsAt.trim() && !start) next.startsAt = "Enter a valid start.";
  if (form.endsAt.trim() && !end) next.endsAt = "Enter a valid end.";
  if (start && end && end < start) {
    next.endsAt = "End must be after the start.";
  }
  return next;
}

function payload(): HeroSlideInput {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    image: form.image.trim(),
    ctaLabel: form.ctaLabel.trim(),
    ctaUrl: form.ctaUrl.trim(),
    isActive: form.isActive,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    sortOrder: form.id
      ? (slides.value.find(slide => slide.id === form.id)?.sortOrder ?? 0)
      : slides.value.length
  };
}

function upsertLocal(saved: AdminHeroSlide) {
  const index = slides.value.findIndex(slide => slide.id === saved.id);
  if (index >= 0) slides.value.splice(index, 1, saved);
  else slides.value.push(saved);
  slides.value = slides.value
    .slice()
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
    );
  mirrorSettings(slides.value);
}

async function saveSlide() {
  const next = validate();
  applyFieldErrors(next);
  if (Object.keys(next).length) return;
  saving.value = true;
  try {
    const saved = form.id
      ? await updateAdminHeroSlide(form.id, payload())
      : await createAdminHeroSlide(payload());
    upsertLocal(saved);
    editorOpen.value = false;
    notify(form.id ? "Slide updated." : "Slide added.", "positive");
  } catch (error) {
    const fields = fieldErrorsFromApi(error);
    if (Object.keys(fields).length) applyFieldErrors(fields);
    notify(friendlyHeroSlidesError(error, "We couldn’t save that slide."));
  } finally {
    saving.value = false;
  }
}

async function toggleActive(slide: AdminHeroSlide) {
  if (busyId.value) return;
  const previous = slide.isActive;
  slide.isActive = !previous;
  busyId.value = slide.id;
  try {
    const saved = await updateAdminHeroSlide(slide.id, {
      isActive: slide.isActive
    });
    upsertLocal(saved);
  } catch (error) {
    slide.isActive = previous;
    notify(friendlyHeroSlidesError(error, "We couldn’t update that slide."));
  } finally {
    busyId.value = "";
  }
}

function askDelete(slide: AdminHeroSlide) {
  deleteTarget.value = slide;
  deleteOpen.value = true;
}

async function confirmDelete() {
  const slide = deleteTarget.value;
  if (!slide) return;
  deleting.value = true;
  try {
    await destroyAdminHeroSlide(slide.id);
    slides.value = slides.value.filter(item => item.id !== slide.id);
    mirrorSettings(slides.value);
    deleteOpen.value = false;
    notify("Slide deleted.", "positive");
  } catch (error) {
    notify(friendlyHeroSlidesError(error, "We couldn’t delete that slide."));
  } finally {
    deleting.value = false;
  }
}

function onDragStart(event: PointerEvent, id: string) {
  if (!canManage.value || event.button !== 0) return;
  dragSnapshot = slides.value.map(slide => ({ ...slide }));
  draggingId.value = id;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onDragMove(event: PointerEvent) {
  if (!draggingId.value) return;
  const node = document.elementFromPoint(event.clientX, event.clientY);
  const card = node?.closest<HTMLElement>("[data-slide-id]");
  const overId = card?.dataset.slideId;
  if (!overId || overId === draggingId.value) return;
  const next = slides.value.slice();
  const from = next.findIndex(slide => slide.id === draggingId.value);
  const to = next.findIndex(slide => slide.id === overId);
  if (from < 0 || to < 0) return;
  const [row] = next.splice(from, 1);
  if (!row) return;
  next.splice(to, 0, row);
  slides.value = next.map((slide, index) => ({ ...slide, sortOrder: index }));
}

async function onDragEnd() {
  if (!draggingId.value) return;
  const previous = dragSnapshot;
  draggingId.value = "";
  const changed = slides.value.some(
    (slide, index) => slide.id !== previous[index]?.id
  );
  if (!changed) return;
  try {
    await reorderAdminHeroSlides(slides.value.map(slide => slide.id));
    mirrorSettings(slides.value);
  } catch (error) {
    slides.value = previous;
    notify(friendlyHeroSlidesError(error, "We couldn’t save the new order."));
  }
}
</script>

<style scoped>
.hero-admin {
  max-width: 1180px;
}

.hero-add {
  border-radius: 10px;
  min-height: 2.6rem;
  padding-inline: 0.9rem;
}

.hero-alert {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(139, 46, 46, 0.08);
  color: var(--q-negative);
}

.slide-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.slide-skel,
.slide-card {
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
}

.slide-skel__media {
  width: 100%;
  height: 100%;
}

.slide-card {
  position: relative;
  background: #e7e2da;
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 14px 32px rgba(69, 76, 75, 0.08);
}

.slide-card.is-dragging {
  opacity: 0.55;
}

.slide-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.slide-card__img--empty {
  display: grid;
  place-items: center;
  color: var(--gy-muted);
}

.slide-card__shade {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.7rem;
  background: linear-gradient(
    180deg,
    rgba(20, 18, 16, 0.28) 0%,
    rgba(20, 18, 16, 0.05) 38%,
    rgba(12, 11, 10, 0.78) 100%
  );
  color: #fff;
}

.slide-card__bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.slide-card__spacer {
  flex: 1;
}

.slide-card__handle,
.slide-icon,
.slide-switch {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.slide-card__handle {
  cursor: grab;
  touch-action: none;
}

.slide-card__handle:active {
  cursor: grabbing;
}

.slide-icon--danger:hover {
  background: rgba(139, 46, 46, 0.85);
}

.slide-switch {
  width: 2.35rem;
  padding: 0;
}

.slide-switch span {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  transform: translateX(-5px);
  transition: transform 0.18s ease;
}

.slide-switch.is-on {
  background: var(--gy-forest);
}

.slide-switch.is-on span {
  transform: translateX(5px);
  background: #fff;
}

.slide-chip {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.slide-chip[data-status="active"] {
  background: var(--gy-forest);
}

.slide-chip[data-status="scheduled"] {
  background: var(--gy-gold-deep);
}

.slide-chip[data-status="hidden"] {
  background: rgba(69, 76, 75, 0.72);
}

.slide-card__copy h2 {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.15;
}

.slide-card__copy p {
  margin: 0.25rem 0 0;
  font-size: 0.86rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.86);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slide-card__cta {
  display: inline-flex;
  margin-top: 0.45rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  background: #fff;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-empty {
  display: grid;
  justify-items: start;
  gap: 0.55rem;
  max-width: 28rem;
  padding: 1.5rem;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow: 0 16px 40px rgba(69, 76, 75, 0.06);
}

.hero-empty__art {
  display: grid;
  place-items: center;
  width: 100%;
  margin-bottom: 0.35rem;
}

.hero-empty h2 {
  margin: 0;
  font-size: 1.45rem;
}

.hero-empty p {
  margin: 0 0 0.45rem;
  color: var(--gy-muted);
  line-height: 1.5;
}

.editor-card {
  width: min(980px, calc(100vw - 1.5rem));
  max-width: 980px;
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  border-radius: 18px;
  padding: 1rem 1rem 0.85rem;
}

.editor-card__head,
.editor-card__foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.editor-card__head h2,
.confirm-card h2 {
  margin: 0;
  font-size: 1.45rem;
}

.admin-kicker {
  margin: 0 0 0.2rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr);
  gap: 1rem;
  margin-top: 0.9rem;
  align-items: start;
}

.editor-form {
  display: grid;
  gap: 0.75rem;
}

.editor-split {
  display: grid;
  gap: 0.75rem;
}

.field-error {
  margin: -0.35rem 0 0;
  color: var(--q-negative);
  font-size: 0.82rem;
}

.editor-preview {
  display: grid;
  align-content: start;
  gap: 0.45rem;
}

.mini-hero {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 16px;
  background: #2c2926;
}

.mini-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-hero__shade {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0.9rem;
  background: linear-gradient(
    180deg,
    rgba(12, 11, 10, 0.1) 20%,
    rgba(12, 11, 10, 0.78) 100%
  );
  color: #fff;
}

.mini-hero__brand {
  margin: 0 0 auto;
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.mini-hero h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.15;
}

.mini-hero__shade > p:last-of-type {
  margin: 0.3rem 0 0;
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.86);
}

.mini-hero__cta {
  align-self: flex-start;
  margin-top: 0.55rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #fff;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
}

.editor-card__foot {
  align-items: center;
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(69, 76, 75, 0.08);
}

.confirm-card {
  width: min(420px, calc(100vw - 1.5rem));
  padding: 1.15rem 1.1rem 1rem;
  border-radius: 18px;
}

.confirm-card p {
  margin: 0.55rem 0 0;
  color: var(--gy-muted);
  line-height: 1.45;
}

.confirm-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 1rem;
}

@media (max-width: 799px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .editor-card {
    width: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
    min-height: 100%;
  }

  .slide-card__copy h2 {
    font-size: 1.05rem;
  }
}

@media (min-width: 800px) {
  .slide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editor-split {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1100px) {
  .slide-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
