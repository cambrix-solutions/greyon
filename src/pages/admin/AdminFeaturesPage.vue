<template>
  <q-page padding class="pkg-page">
    <AdminPageHeader
      eyebrow="Developer"
      title="User packages"
      subtitle="Each package is a seat: one role + feature set. Users only link to a package — they never store a role."
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          icon="content_copy"
          label="Duplicate active"
          :disable="!activePkg"
          @click="duplicateActive"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="New package"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <q-banner class="bg-white q-mb-md" rounded>
      Site default:
      <strong>{{ activePkg?.name ?? "—" }}</strong>
      <span v-if="activePkg?.priceNote" class="text-grey-7">
        · {{ activePkg.priceNote }}</span
      >
      · used for the public site and as the default when creating users. Assign
      packages per user under
      <router-link to="/admin/users">Users</router-link>.
    </q-banner>

    <div class="pkg-layout">
      <aside v-reveal class="pkg-list">
        <button
          v-for="pkg in cms.packages"
          :key="pkg.id"
          type="button"
          class="pkg-card"
          :class="{
            'pkg-card--active': pkg.id === cms.activePackageId,
            'pkg-card--selected': pkg.id === selectedId
          }"
          @click="selectPackage(pkg.id)"
        >
          <div class="pkg-card__top">
            <span class="pkg-card__name">{{ pkg.name }}</span>
            <q-badge v-if="pkg.id === cms.activePackageId" color="positive"
              >Site default</q-badge
            >
          </div>
          <p class="pkg-card__desc">{{ pkg.description }}</p>
          <div class="pkg-card__meta">
            <span>{{ pkg.priceNote || "Custom" }}</span>
            <span>{{ roleLabels[pkg.role] }}</span>
            <span>{{ pkg.featureKeys.length }} features</span>
            <span>{{ cms.usersOnPackage(pkg.id).length }} users</span>
          </div>
        </button>
      </aside>

      <section v-if="editing" v-reveal="{ delay: '80ms' }" class="pkg-editor">
        <div class="pkg-editor__head">
          <div>
            <p class="gy-eyebrow">Customize package</p>
            <h2 class="pkg-editor__title">{{ editing.name || "Untitled" }}</h2>
          </div>
          <div class="pkg-editor__actions">
            <q-btn
              v-if="editing.id !== cms.activePackageId"
              unelevated
              no-caps
              color="positive"
              label="Set as site default"
              @click="activate(editing.id)"
            />
            <q-btn
              v-if="!editing.isSystem || isNew"
              flat
              no-caps
              color="negative"
              label="Delete"
              :disable="isNew"
              @click="remove"
            />
            <q-btn outline no-caps label="Save package" color="primary" @click="save" />
          </div>
        </div>

        <div class="pkg-editor__fields q-gutter-md">
          <q-input v-model="form.name" label="Package name" outlined dense />
          <q-input
            v-model="form.priceNote"
            label="Price / plan note"
            outlined
            dense
            hint="e.g. $X / month — only for your reference"
          />
          <q-select
            v-model="form.role"
            :options="roleOptions"
            emit-value
            map-options
            label="Role granted by this package"
            outlined
            dense
            hint="Users on this package inherit this role — nothing else"
          />
          <q-input
            v-model="form.description"
            label="Description"
            type="textarea"
            outlined
            autogrow
          />
        </div>

        <div class="pkg-features">
          <div
            v-for="group in featureGroups"
            :key="group.category"
            class="pkg-features__group"
          >
            <h3>{{ group.category }} features</h3>
            <label
              v-for="feat in group.items"
              :key="feat.key"
              class="pkg-feat"
              :class="{ 'pkg-feat--locked': feat.key === 'features' && form.role !== 'customer' }"
            >
              <q-checkbox
                :model-value="form.featureKeys.includes(feat.key)"
                :disable="feat.key === 'features' && form.role !== 'customer'"
                dense
                @update:model-value="(v: boolean) => toggleFeat(feat.key, v)"
              />
              <span>
                <strong>{{ feat.label }}</strong>
                <small>{{ feat.description }}</small>
                <q-badge v-if="feat.paidAddOn" color="warning" outline class="q-ml-xs"
                  >add-on</q-badge
                >
              </span>
            </label>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { PACKAGE_CLIENT_ROLES } from "@/data/seed-packages";
import { roleLabels } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { AdminRole, ProductPackage } from "@/types/greyon";

const cms = useCmsStore();
const $q = useQuasar();
const selectedId = ref(cms.activePackageId);
const isNew = ref(false);

const roleOptions = [
  { label: roleLabels.developer, value: "developer" as AdminRole },
  ...PACKAGE_CLIENT_ROLES.map(r => ({ label: roleLabels[r], value: r }))
];

const form = reactive({
  name: "",
  description: "",
  priceNote: "",
  featureKeys: [] as string[],
  role: "org_admin" as AdminRole
});

const editing = computed(() =>
  isNew.value
    ? ({
        id: "",
        name: form.name,
        description: form.description,
        priceNote: form.priceNote,
        featureKeys: form.featureKeys,
        role: form.role,
        isSystem: false
      } as ProductPackage)
    : cms.packages.find(p => p.id === selectedId.value) ?? null
);

const activePkg = computed(() =>
  cms.packages.find(p => p.id === cms.activePackageId)
);

const featureGroups = computed(() => {
  const admin = cms.features.filter(f => f.category === "admin");
  const pub = cms.features.filter(f => f.category === "public");
  return [
    { category: "Admin", items: admin },
    { category: "Public", items: pub }
  ];
});

function loadForm(pkg: ProductPackage) {
  form.name = pkg.name;
  form.description = pkg.description;
  form.priceNote = pkg.priceNote;
  form.featureKeys = [...pkg.featureKeys];
  form.role = pkg.role;
}

function selectPackage(id: string) {
  isNew.value = false;
  selectedId.value = id;
  const pkg = cms.packages.find(p => p.id === id);
  if (pkg) loadForm(pkg);
}

watch(
  () => cms.activePackageId,
  id => {
    if (!isNew.value) selectPackage(id);
  },
  { immediate: true }
);

function toggleFeat(key: string, on: boolean) {
  if (key === "features" && form.role !== "customer") return;
  const set = new Set(form.featureKeys);
  if (on) set.add(key);
  else set.delete(key);
  form.featureKeys = Array.from(set);
}

function openCreate() {
  isNew.value = true;
  selectedId.value = "";
  form.name = "Custom seat";
  form.description = "Custom role + feature bundle.";
  form.priceNote = "Custom";
  form.role = "hotel_admin";
  form.featureKeys = [...(activePkg.value?.featureKeys ?? ["features", "dashboard"])];
}

function save() {
  if (!form.name.trim()) {
    $q.notify({ type: "negative", message: "Package name is required." });
    return;
  }
  if (!form.role) {
    $q.notify({ type: "negative", message: "Pick the role this package grants." });
    return;
  }
  const saved = cms.upsertPackage({
    ...(isNew.value ? {} : { id: selectedId.value }),
    name: form.name.trim(),
    description: form.description,
    priceNote: form.priceNote,
    featureKeys: form.featureKeys,
    role: form.role
  });
  isNew.value = false;
  selectedId.value = saved.id;
  loadForm(saved);
  $q.notify({ type: "positive", message: `Saved “${saved.name}”.` });
}

function activate(id: string) {
  cms.setActivePackage(id);
  $q.notify({
    type: "positive",
    message: `Site default is now “${cms.packages.find(p => p.id === id)?.name}”.`
  });
}

function duplicateActive() {
  if (!activePkg.value) return;
  const copy = cms.duplicatePackage(activePkg.value.id);
  if (!copy) return;
  selectPackage(copy.id);
  $q.notify({ type: "info", message: "Duplicated — customize and save when ready." });
}

function remove() {
  if (!selectedId.value || isNew.value) return;
  const pkg = cms.packages.find(p => p.id === selectedId.value);
  if (!pkg || pkg.isSystem) {
    $q.notify({ type: "warning", message: "System packages cannot be deleted. Duplicate to customize." });
    return;
  }
  $q.dialog({
    title: `Delete “${pkg.name}”?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    cms.deletePackage(pkg.id);
    selectPackage(cms.activePackageId);
    $q.notify({ type: "positive", message: "Package deleted." });
  });
}
</script>

<style scoped>
.pkg-layout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  gap: 1rem;
  align-items: start;
}

.pkg-list {
  display: grid;
  gap: 0.65rem;
}

.pkg-card {
  text-align: left;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(28, 36, 33, 0.1);
  background: #fff;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.pkg-card:hover {
  border-color: rgba(154, 123, 60, 0.35);
  transform: translateY(-1px);
}

.pkg-card--selected {
  border-color: var(--gy-gold-deep);
  box-shadow: 0 10px 28px rgba(26, 24, 20, 0.06);
}

.pkg-card--active {
  background: rgba(154, 123, 60, 0.06);
}

.pkg-card__top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.pkg-card__name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
}

.pkg-card__desc {
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.pkg-card__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 0.65rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.pkg-editor {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.1);
  padding: 1.25rem 1.35rem 1.5rem;
}

.pkg-editor__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: start;
  margin-bottom: 1.25rem;
}

.pkg-editor__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
}

.pkg-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.pkg-features {
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.pkg-features__group h3 {
  margin: 0 0 0.65rem;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.pkg-roles-hint {
  margin: -0.25rem 0 0.75rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.pkg-feat {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
  padding: 0.55rem 0;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
  cursor: pointer;
}

.pkg-feat strong {
  display: block;
  font-size: 0.92rem;
}

.pkg-feat small {
  display: block;
  color: var(--gy-muted);
  font-size: 0.8rem;
  line-height: 1.4;
  margin-top: 0.15rem;
}

.pkg-feat--locked {
  opacity: 0.7;
}

@media (max-width: 900px) {
  .pkg-layout {
    grid-template-columns: 1fr;
  }
}
</style>
