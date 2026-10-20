<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Catalog"
      title="Products"
      :subtitle="`${filtered.length} products · attach on hotel edit`"
    >
      <template #actions>
        <q-btn
          v-if="auth.canAction('products', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add product"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          :model-value="query"
          dense
          outlined
          clearable
          placeholder="Search products…"
          style="min-width: min(100%, 240px); background: #fff"
          @update:model-value="onQueryUpdate"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          label="Status"
          style="min-width: 140px; background: #fff"
          popup-content-class="admin-filter-menu"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="text-body2 text-grey-7 q-pa-md">Loading…</div>

    <div v-else v-reveal="{ delay: '80ms' }" class="prod-grid">
      <article v-for="item in filtered" :key="item.id" class="prod-card">
        <div v-if="item.imageUrl" class="prod-card__media">
          <img :src="item.imageUrl" :alt="item.name" loading="lazy" />
        </div>
        <div v-else class="prod-card__media prod-card__media--icon">
          <q-icon :name="item.icon || 'storefront'" size="28px" />
        </div>
        <div class="prod-card__body">
          <div class="prod-card__top">
            <span v-if="item.sortOrder !== undefined" class="prod-card__order"
              >#{{ item.sortOrder }}</span
            >
            <span v-else class="prod-card__order" />
            <span class="prod-card__status" :data-status="item.status">{{
              item.status
            }}</span>
          </div>
          <h2 class="prod-card__title">{{ item.name }}</h2>
          <p class="prod-card__slug">{{ item.slug }}</p>
          <p v-if="priceLabel(item)" class="prod-card__price">
            {{ priceLabel(item) }}
          </p>
          <p v-if="item.hotelsCount !== undefined" class="prod-card__meta">
            {{ item.hotelsCount }} hotel{{ item.hotelsCount === 1 ? "" : "s" }}
          </p>
        </div>
        <div class="prod-card__foot">
          <AdminEntityActions
            :status="item.status"
            :status-options="cms.statusOptions"
            :status-disable="!auth.canAction('products', 'update')"
            primary-label="Edit"
            :primary-show="auth.canAction('products', 'update')"
            @primary="openEdit(item)"
            :actions="[
              {
                key: 'delete',
                icon: 'delete',
                tip: 'Delete',
                danger: true,
                show: auth.canAction('products', 'delete'),
                onClick: () => remove(item)
              }
            ]"
            @update:status="(v: string) => setStatus(item, v)"
          />
        </div>
      </article>

      <div v-if="!filtered.length" class="prod-grid__empty">
        No products match.
        <q-btn
          v-if="auth.canAction('products', 'create')"
          flat
          dense
          color="primary"
          label="Add product"
          @click="openCreate"
        />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="md"
      icon="storefront"
      eyebrow="Catalog"
      :title="editing ? 'Edit product' : 'Add product'"
      subtitle="Sellable add-ons shown as cards on the public hotel page."
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
        <q-select
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
        hint="Shown when no product image is returned by the API."
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
              ? auth.canAction('products', 'update')
              : auth.canAction('products', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :loading="saving"
          :label="editing ? 'Save changes' : 'Create product'"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminEntityActions from "@/components/admin/AdminEntityActions.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import IconPicker from "@/components/admin/IconPicker.vue";
import {
  compareCatalogItems,
  createProduct,
  destroyProduct,
  fetchAdminProducts,
  updateProduct,
  type CatalogProduct
} from "@/services/engine/adminCatalogEntities";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus } from "@/types/greyon";
import { fieldErrorsFromApi, friendlyApiError } from "@/utils/apiErrors";
import { slugify } from "@/utils/slugify";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

const items = ref<CatalogProduct[]>([]);
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
  icon: "storefront",
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

/** Only when API returned a price (optional field). */
function priceLabel(item: CatalogProduct) {
  if (item.price === undefined || item.price === null) return "";
  const cur = (item.currency || "USD").toUpperCase();
  if (cur === "KHR") {
    return `${Math.round(item.price).toLocaleString()} KHR`;
  }
  return `$${Number(item.price).toFixed(2)}`;
}

async function reload() {
  loading.value = true;
  try {
    items.value = await fetchAdminProducts();
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
  form.icon = "storefront";
  form.status = "draft";
  slugTouched.value = false;
  clearFieldErrors();
  dialog.value = true;
}

function openEdit(item: CatalogProduct) {
  editing.value = item.id;
  form.name = item.name;
  form.slug = item.slug;
  form.description = item.description;
  form.icon = item.icon || "storefront";
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
      icon: form.icon.trim() || "storefront",
      status: form.status
    };
    if (editing.value) {
      await updateProduct(editing.value, payload);
    } else {
      await createProduct(payload);
    }
    dialog.value = false;
    $q.notify({ type: "positive", message: "Product saved." });
    await reload();
  } catch (e) {
    Object.assign(fieldErrors, fieldErrorsFromApi(e));
    $q.notify({ type: "negative", message: friendlyApiError(e) });
  } finally {
    saving.value = false;
  }
}

async function setStatus(item: CatalogProduct, status: string) {
  try {
    await updateProduct(item.id, { status: status as ContentStatus });
    $q.notify({ type: "positive", message: `Product → ${status}` });
    await reload();
  } catch (e) {
    $q.notify({ type: "negative", message: friendlyApiError(e) });
  }
}

function remove(item: CatalogProduct) {
  $q.dialog({
    title: "Delete product?",
    message: `Remove “${item.name}”? Hotels linked to it will lose this product. Requires a global admin seat.`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void (async () => {
      try {
        await destroyProduct(item.id);
        $q.notify({ type: "positive", message: "Product deleted." });
        await reload();
      } catch (e) {
        $q.notify({ type: "negative", message: friendlyApiError(e) });
      }
    })();
  });
}
</script>

<style scoped>
.prod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.prod-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  border-radius: 14px;
  overflow: hidden;
}

.prod-card__media {
  aspect-ratio: 4 / 3;
  background: var(--gy-sand);
}

.prod-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.prod-card__media--icon {
  display: grid;
  place-items: center;
  color: var(--gy-forest);
}

.prod-card__body {
  padding: 0.85rem 1rem 0.35rem;
}

.prod-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.25rem;
}

.prod-card__order {
  font-size: 0.72rem;
  color: var(--gy-muted);
}

.prod-card__status {
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(18, 17, 16, 0.06);
}

.prod-card__status[data-status="published"] {
  background: rgba(84, 112, 89, 0.14);
  color: var(--gy-forest);
}

.prod-card__status[data-status="draft"] {
  background: rgba(176, 141, 87, 0.16);
  color: var(--gy-gold-deep);
}

.prod-card__title {
  margin: 0.35rem 0 0;
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.25;
}

.prod-card__slug,
.prod-card__meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.prod-card__price {
  margin: 0.4rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--gy-ink);
}

.prod-card__foot {
  padding: 0.5rem 0.75rem 0.85rem;
}

.prod-grid__empty {
  grid-column: 1 / -1;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--gy-muted);
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(18, 17, 16, 0.12);
}
</style>
