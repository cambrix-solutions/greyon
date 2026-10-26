<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Catalog"
      title="Services"
      :subtitle="`${filtered.length} services · attach on hotel edit`"
    >
      <template #actions>
        <q-btn
          v-if="auth.canAction('services', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add service"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          :model-value="query"
          dense
          outlined
          clearable
          placeholder="Search services…"
          style="min-width: min(100%, 240px); background: #fff"
          @update:model-value="onQueryUpdate"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <GySelect
          v-model="statusFilter"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          label="Status"
          style="min-width: 140px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="text-body2 text-grey-7 q-pa-md">Loading…</div>

    <div v-else v-reveal="{ delay: '80ms' }" class="svc-grid">
      <article v-for="item in filtered" :key="item.id" class="svc-card">
        <div class="svc-card__icon" aria-hidden="true">
          <q-icon :name="item.icon || 'spa'" size="22px" />
        </div>
        <div class="svc-card__body">
          <div class="svc-card__top">
            <span v-if="item.sortOrder !== undefined" class="svc-card__order"
              >#{{ item.sortOrder }}</span
            >
            <span v-else class="svc-card__order" />
            <span class="svc-card__status" :data-status="item.status">{{
              item.status
            }}</span>
          </div>
          <h2 class="svc-card__title">{{ item.name }}</h2>
          <p class="svc-card__slug">{{ item.slug }}</p>
          <p v-if="item.description" class="svc-card__desc">
            {{ item.description }}
          </p>
          <p v-if="item.hotelsCount !== undefined" class="svc-card__meta">
            {{ item.hotelsCount }} hotel{{ item.hotelsCount === 1 ? "" : "s" }}
          </p>
        </div>
        <div class="svc-card__foot">
          <AdminEntityActions
            :status="item.status"
            :status-options="cms.statusOptions"
            :status-disable="!auth.canAction('services', 'update')"
            primary-label="Edit"
            :primary-show="auth.canAction('services', 'update')"
            @primary="openEdit(item)"
            :actions="[
              {
                key: 'delete',
                icon: 'delete',
                tip: 'Delete',
                danger: true,
                show: auth.canAction('services', 'delete'),
                onClick: () => remove(item)
              }
            ]"
            @update:status="(v: string) => setStatus(item, v)"
          />
        </div>
      </article>

      <div v-if="!filtered.length" class="svc-grid__empty">
        No services match.
        <q-btn
          v-if="auth.canAction('services', 'create')"
          flat
          dense
          color="primary"
          label="Add service"
          @click="openCreate"
        />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="md"
      icon="spa"
      eyebrow="Catalog"
      :title="editing ? 'Edit service' : 'Add service'"
      subtitle="Hotel experiences guests can expect — shown as icon chips on the hotel page."
    >
      <AdminFormSection title="Essentials" :columns="2">
        <q-input
          :model-value="form.name"
          label="Name *"
          outlined
          dense
          :error="Boolean(fieldErrors.name)"
          :error-message="fieldErrors.name"
          maxlength="255"
          class="admin-form-span-2"
          @update:model-value="onNameUpdate"
        />
        <q-input
          :model-value="form.slug"
          label="URL slug *"
          outlined
          dense
          hint="Lowercase dashes — auto-filled from name"
          :error="Boolean(fieldErrors.slug)"
          :error-message="fieldErrors.slug"
          class="admin-form-span-2"
          @update:model-value="onSlugUpdate"
        />
        <GySelect
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Icon"
        hint="Same Material icons used for amenity chips."
      >
        <IconPicker
          v-model="form.icon"
          :error="fieldErrors.icon"
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection title="Description">
        <q-input
          v-model="form.description"
          label="Description"
          type="textarea"
          outlined
          autogrow
          :error="Boolean(fieldErrors.description)"
          :error-message="fieldErrors.description"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            editing
              ? auth.canAction('services', 'update')
              : auth.canAction('services', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :loading="saving"
          :label="editing ? 'Save changes' : 'Create service'"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import GySelect from "@/components/GySelect.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminEntityActions from "@/components/admin/AdminEntityActions.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import IconPicker from "@/components/admin/IconPicker.vue";
import { DEFAULT_SERVICE_ICON } from "@/data/serviceIcons";
import {
  compareCatalogItems,
  createService,
  destroyService,
  fetchAdminServices,
  updateService,
  type CatalogService
} from "@/services/engine/adminCatalogEntities";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus } from "@/types/greyon";
import { fieldErrorsFromApi, friendlyApiError } from "@/utils/apiErrors";
import { slugify } from "@/utils/slugify";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

const items = ref<CatalogService[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editing = ref<string | null>(null);
const query = ref("");
const statusFilter = ref("all");
const slugTouched = ref(false);
const fieldErrors = reactive<Record<string, string>>({});

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "draft", value: "draft" },
  { label: "published", value: "published" },
  { label: "archived", value: "archived" }
];

const form = reactive({
  name: "",
  slug: "",
  description: "",
  icon: DEFAULT_SERVICE_ICON,
  status: "draft" as ContentStatus
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return [...items.value]
    .filter(item => {
      if (statusFilter.value !== "all" && item.status !== statusFilter.value) {
        return false;
      }
      if (!q) return true;
      return `${item.name} ${item.slug} ${item.description}`
        .toLowerCase()
        .includes(q);
    })
    .sort(compareCatalogItems);
});

onMounted(() => {
  void reload();
});

function onQueryUpdate(value: string | number | null) {
  query.value = value == null ? "" : String(value);
}

function clearFieldErrors() {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];
}

function onNameUpdate(value: string | number | null) {
  form.name = value == null ? "" : String(value);
  if (!slugTouched.value) {
    form.slug = slugify(form.name);
  }
}

function onSlugUpdate(value: string | number | null) {
  slugTouched.value = true;
  form.slug = value == null ? "" : String(value);
}

async function reload() {
  loading.value = true;
  try {
    items.value = await fetchAdminServices();
  } catch (e) {
    $q.notify({ type: "negative", message: friendlyApiError(e) });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.slug = "";
  form.description = "";
  form.icon = DEFAULT_SERVICE_ICON;
  form.status = "draft";
  slugTouched.value = false;
  clearFieldErrors();
  dialog.value = true;
}

function openEdit(item: CatalogService) {
  editing.value = item.id;
  form.name = item.name;
  form.slug = item.slug;
  form.description = item.description;
  form.icon = item.icon || DEFAULT_SERVICE_ICON;
  form.status = item.status;
  slugTouched.value = true;
  clearFieldErrors();
  dialog.value = true;
}

async function save() {
  clearFieldErrors();
  if (!form.name.trim()) {
    fieldErrors.name = "Name is required.";
    return;
  }
  const slug = form.slug.trim() || slugify(form.name);
  if (!slug) {
    fieldErrors.slug = "Slug is required.";
    return;
  }
  form.slug = slug;
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim(),
      icon: form.icon.trim() || DEFAULT_SERVICE_ICON,
      status: form.status
    };
    if (editing.value) {
      await updateService(editing.value, payload);
    } else {
      await createService(payload);
    }
    dialog.value = false;
    $q.notify({ type: "positive", message: "Service saved." });
    await reload();
  } catch (e) {
    Object.assign(fieldErrors, fieldErrorsFromApi(e));
    $q.notify({ type: "negative", message: friendlyApiError(e) });
  } finally {
    saving.value = false;
  }
}

async function setStatus(item: CatalogService, status: string) {
  try {
    await updateService(item.id, { status: status as ContentStatus });
    $q.notify({ type: "positive", message: `Service → ${status}` });
    await reload();
  } catch (e) {
    $q.notify({ type: "negative", message: friendlyApiError(e) });
  }
}

function remove(item: CatalogService) {
  $q.dialog({
    title: "Delete service?",
    message: `Remove “${item.name}”? Hotels linked to it will lose this service. Requires a global admin seat.`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void (async () => {
      try {
        await destroyService(item.id);
        $q.notify({ type: "positive", message: "Service deleted." });
        await reload();
      } catch (e) {
        $q.notify({ type: "negative", message: friendlyApiError(e) });
      }
    })();
  });
}
</script>

<style scoped>
.svc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.svc-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  border-radius: 14px;
}

.svc-card__icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  background: var(--gy-sand);
  color: var(--gy-forest);
}

.svc-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.25rem;
}

.svc-card__order {
  font-size: 0.72rem;
  color: var(--gy-muted);
}

.svc-card__status {
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(18, 17, 16, 0.06);
}

.svc-card__status[data-status="published"] {
  background: rgba(84, 112, 89, 0.14);
  color: var(--gy-forest);
}

.svc-card__status[data-status="draft"] {
  background: rgba(176, 141, 87, 0.16);
  color: var(--gy-gold-deep);
}

.svc-card__title {
  margin: 0.35rem 0 0;
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.25;
}

.svc-card__slug,
.svc-card__desc,
.svc-card__meta {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.svc-card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.svc-grid__empty {
  grid-column: 1 / -1;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--gy-muted);
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(18, 17, 16, 0.12);
}
</style>
