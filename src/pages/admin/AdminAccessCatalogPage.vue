<template>
  <q-page padding class="access-page">
    <AdminPageHeader
      eyebrow="Developer"
      title="Access catalog"
      subtitle="Dev → Admin → Manager / Hotel desk · Guest is self-serve. Roles → features → permissions → seats."
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          icon="refresh"
          label="Reload"
          :loading="loading"
          @click="reload"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          :label="addLabel"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <AccessHubBanner focus="catalog" />

    <div class="access-ladder" aria-label="Role hierarchy">
      <div class="access-ladder__step">
        <span class="access-ladder__n">1</span>
        <div>
          <strong>Dev</strong>
          <small>Global · packages · creates Admin</small>
        </div>
      </div>
      <span class="access-ladder__arrow" aria-hidden="true">→</span>
      <div class="access-ladder__step">
        <span class="access-ladder__n">2</span>
        <div>
          <strong>Admin</strong>
          <small>Locations · assigns Manager / Hotel desk</small>
        </div>
      </div>
      <span class="access-ladder__arrow" aria-hidden="true">→</span>
      <div class="access-ladder__step">
        <span class="access-ladder__n">3</span>
        <div>
          <strong>Manager</strong>
          <small>Assigned locations</small>
        </div>
      </div>
      <span class="access-ladder__arrow" aria-hidden="true">→</span>
      <div class="access-ladder__step">
        <span class="access-ladder__n">3b</span>
        <div>
          <strong>Hotel desk</strong>
          <small>Assigned hotels</small>
        </div>
      </div>
      <span class="access-ladder__arrow" aria-hidden="true">→</span>
      <div class="access-ladder__step">
        <span class="access-ladder__n">4</span>
        <div>
          <strong>Guest</strong>
          <small>Own bookings · public site</small>
        </div>
      </div>
    </div>

    <q-tabs
      v-model="tab"
      dense
      class="text-primary q-mb-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="roles" label="Roles" icon="badge" />
      <q-tab name="features" label="Features" icon="widgets" />
      <q-tab name="permissions" label="Permissions" icon="key" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="bg-transparent">
      <!-- Roles -->
      <q-tab-panel name="roles" class="q-pa-none">
        <q-card flat bordered class="bg-white">
          <q-markup-table flat dense wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Scope</th>
                <th class="text-left">Global</th>
                <th class="text-left">Description</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in roles" :key="row.id">
                <td
                  ><code>{{ row.name }}</code></td
                >
                <td>
                  <q-badge outline color="primary">{{ row.scope }}</q-badge>
                </td>
                <td>{{ row.isGlobal ? "Yes" : "No" }}</td>
                <td class="text-grey-8">{{ row.description || "—" }}</td>
                <td class="text-right">
                  <q-btn flat dense round icon="edit" @click="editRole(row)" />
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    @click="removeRole(row)"
                  />
                </td>
              </tr>
              <tr v-if="!roles.length">
                <td colspan="5" class="text-grey-7">No roles yet.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </q-tab-panel>

      <!-- Features -->
      <q-tab-panel name="features" class="q-pa-none">
        <q-card flat bordered class="bg-white">
          <q-markup-table flat dense wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Key</th>
                <th class="text-left">Label</th>
                <th class="text-left">Category</th>
                <th class="text-left">Permissions</th>
                <th class="text-left">Sort</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in features" :key="row.id">
                <td
                  ><code>{{ row.key }}</code></td
                >
                <td>
                  <div>{{ row.label }}</div>
                  <div class="text-caption text-grey-7">
                    {{ row.description || "—" }}
                  </div>
                </td>
                <td>{{ row.category }}</td>
                <td>{{ row.permissionCount }}</td>
                <td>{{ row.sortOrder }}</td>
                <td class="text-right">
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    @click="editFeature(row)"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    @click="removeFeature(row)"
                  />
                </td>
              </tr>
              <tr v-if="!features.length">
                <td colspan="6" class="text-grey-7">No features yet.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </q-tab-panel>

      <!-- Permissions -->
      <q-tab-panel name="permissions" class="q-pa-none">
        <q-card flat bordered class="bg-white">
          <q-card-section class="text-body2 text-grey-8">
            Permissions are the actions under a feature — list, create, update,
            delete, and other capabilities users can perform.
          </q-card-section>
          <q-markup-table flat dense wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Key</th>
                <th class="text-left">Label</th>
                <th class="text-left">Feature</th>
                <th class="text-left">Sort</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in permissions" :key="row.id">
                <td
                  ><code>{{ row.key }}</code></td
                >
                <td>
                  <div>{{ row.label }}</div>
                  <div class="text-caption text-grey-7">
                    {{ row.description || "—" }}
                  </div>
                </td>
                <td>
                  <code v-if="row.featureKey">{{ row.featureKey }}</code>
                  <span v-else class="text-grey-6">—</span>
                </td>
                <td>{{ row.sortOrder }}</td>
                <td class="text-right">
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    @click="editPermission(row)"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    @click="removePermission(row)"
                  />
                </td>
              </tr>
              <tr v-if="!permissions.length">
                <td colspan="5" class="text-grey-7">No permissions yet.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Role dialog -->
    <AdminDialog
      v-model="roleDialog"
      :title="roleForm.id ? 'Edit role' : 'New role'"
      icon="badge"
      size="md"
    >
      <div class="q-gutter-md">
        <q-input
          v-model="roleForm.name"
          label="Name (key)"
          outlined
          dense
          :disable="Boolean(roleForm.id)"
        />
        <q-input
          v-model="roleForm.description"
          label="Description"
          type="textarea"
          outlined
          dense
          autogrow
        />
        <q-select
          v-model="roleForm.scope"
          :options="scopeOptions"
          label="Scope"
          outlined
          dense
          emit-value
          map-options
        />
        <q-toggle
          v-model="roleForm.isGlobal"
          label="Global (no property scope required)"
          color="primary"
        />
      </div>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Save"
          :loading="saving"
          @click="saveRole"
        />
      </template>
    </AdminDialog>

    <!-- Feature dialog -->
    <AdminDialog
      v-model="featureDialog"
      :title="featureForm.id ? 'Edit feature' : 'New feature'"
      icon="widgets"
      size="md"
    >
      <div class="q-gutter-md">
        <q-input
          v-model="featureForm.key"
          label="Key"
          outlined
          dense
          hint="e.g. bookings"
        />
        <q-input v-model="featureForm.label" label="Label" outlined dense />
        <q-input
          v-model="featureForm.description"
          label="Description"
          type="textarea"
          outlined
          dense
          autogrow
        />
        <q-select
          v-model="featureForm.category"
          :options="categoryOptions"
          label="Category"
          outlined
          dense
          emit-value
          map-options
        />
        <q-input
          v-model.number="featureForm.sortOrder"
          type="number"
          label="Sort order"
          outlined
          dense
        />
      </div>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Save"
          :loading="saving"
          @click="saveFeature"
        />
      </template>
    </AdminDialog>

    <!-- Permission dialog -->
    <AdminDialog
      v-model="permissionDialog"
      :title="permissionForm.id ? 'Edit permission' : 'New permission'"
      icon="key"
      size="md"
    >
      <div class="q-gutter-md">
        <q-input
          v-model="permissionForm.key"
          label="Key"
          outlined
          dense
          hint="e.g. bookings_create, bookings_list"
        />
        <q-input v-model="permissionForm.label" label="Label" outlined dense />
        <q-input
          v-model="permissionForm.description"
          label="Description"
          type="textarea"
          outlined
          dense
          autogrow
        />
        <q-select
          v-model="permissionForm.featureKey"
          :options="featureKeyOptions"
          label="Parent feature"
          outlined
          dense
          emit-value
          map-options
          clearable
          hint="Permissions belong under a feature"
        />
        <q-input
          v-model.number="permissionForm.sortOrder"
          type="number"
          label="Sort order"
          outlined
          dense
        />
      </div>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Save"
          :loading="saving"
          @click="savePermission"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import AccessHubBanner from "@/components/admin/AccessHubBanner.vue";
import { ApiError } from "@/services/api";
import {
  createDeveloperFeature,
  createDeveloperPermission,
  createDeveloperRole,
  destroyDeveloperFeature,
  destroyDeveloperPermission,
  destroyDeveloperRole,
  fetchDeveloperFeatureRows,
  fetchDeveloperPermissions,
  fetchDeveloperRoles,
  updateDeveloperFeature,
  updateDeveloperPermission,
  updateDeveloperRole,
  type AccessFeature,
  type AccessPermission,
  type AccessRole
} from "@/services/engine/developer";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const $q = useQuasar();

const tab = ref<"roles" | "features" | "permissions">("roles");
const loading = ref(false);
const saving = ref(false);

const roles = ref<AccessRole[]>([]);
const features = ref<AccessFeature[]>([]);
const permissions = ref<AccessPermission[]>([]);

const roleDialog = ref(false);
const featureDialog = ref(false);
const permissionDialog = ref(false);

const scopeOptions = [
  { label: "None (global)", value: "none" },
  { label: "Location", value: "location" },
  { label: "Hotel", value: "hotel" }
];
const categoryOptions = [
  { label: "Admin", value: "admin" },
  { label: "Public site", value: "public" }
];

const roleForm = reactive({
  id: "",
  name: "",
  description: "",
  scope: "none",
  isGlobal: true
});

const featureForm = reactive({
  id: "",
  key: "",
  label: "",
  description: "",
  category: "admin",
  sortOrder: 0
});

const permissionForm = reactive({
  id: "",
  key: "",
  label: "",
  description: "",
  featureKey: null as string | null,
  sortOrder: 0
});

const addLabel = computed(() => {
  if (tab.value === "roles") return "New role";
  if (tab.value === "features") return "New feature";
  return "New permission";
});

const featureKeyOptions = computed(() =>
  features.value.map(f => ({ label: `${f.label} (${f.key})`, value: f.key }))
);

function errMessage(e: unknown) {
  return e instanceof ApiError
    ? e.message
    : e instanceof Error
      ? e.message
      : "Request failed.";
}

async function reload() {
  loading.value = true;
  try {
    const [r, f, p] = await Promise.all([
      fetchDeveloperRoles(),
      fetchDeveloperFeatureRows(),
      fetchDeveloperPermissions()
    ]);
    roles.value = r;
    features.value = f;
    permissions.value = p;
    await cms.refreshDeveloperFeatures();
  } catch (e) {
    $q.notify({ type: "negative", message: errMessage(e) });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  if (tab.value === "roles") {
    Object.assign(roleForm, {
      id: "",
      name: "",
      description: "",
      scope: "none",
      isGlobal: true
    });
    roleDialog.value = true;
  } else if (tab.value === "features") {
    Object.assign(featureForm, {
      id: "",
      key: "",
      label: "",
      description: "",
      category: "admin",
      sortOrder: features.value.length
    });
    featureDialog.value = true;
  } else {
    Object.assign(permissionForm, {
      id: "",
      key: "",
      label: "",
      description: "",
      featureKey: features.value[0]?.key ?? null,
      sortOrder: 0
    });
    permissionDialog.value = true;
  }
}

function editRole(row: AccessRole) {
  Object.assign(roleForm, {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: row.scope,
    isGlobal: row.isGlobal
  });
  roleDialog.value = true;
}

function editFeature(row: AccessFeature) {
  Object.assign(featureForm, {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    category: row.category,
    sortOrder: row.sortOrder
  });
  featureDialog.value = true;
}

function editPermission(row: AccessPermission) {
  Object.assign(permissionForm, {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    featureKey: row.featureKey,
    sortOrder: row.sortOrder
  });
  permissionDialog.value = true;
}

async function saveRole() {
  if (!roleForm.name.trim()) {
    $q.notify({ type: "warning", message: "Role name is required." });
    return;
  }
  saving.value = true;
  try {
    if (roleForm.id) {
      await updateDeveloperRole(roleForm.id, {
        name: roleForm.name.trim(),
        description: roleForm.description,
        scope: roleForm.scope,
        isGlobal: roleForm.isGlobal
      });
    } else {
      await createDeveloperRole({
        name: roleForm.name.trim(),
        description: roleForm.description,
        scope: roleForm.scope,
        isGlobal: roleForm.isGlobal
      });
    }
    roleDialog.value = false;
    await reload();
    $q.notify({ type: "positive", message: "Role saved." });
  } catch (e) {
    $q.notify({ type: "negative", message: errMessage(e) });
  } finally {
    saving.value = false;
  }
}

async function saveFeature() {
  if (!featureForm.key.trim() || !featureForm.label.trim()) {
    $q.notify({ type: "warning", message: "Key and label are required." });
    return;
  }
  saving.value = true;
  try {
    if (featureForm.id) {
      await updateDeveloperFeature(featureForm.id, {
        key: featureForm.key.trim(),
        label: featureForm.label.trim(),
        description: featureForm.description,
        category: featureForm.category,
        sortOrder: Number(featureForm.sortOrder) || 0
      });
    } else {
      await createDeveloperFeature({
        key: featureForm.key.trim(),
        label: featureForm.label.trim(),
        description: featureForm.description,
        category: featureForm.category,
        sortOrder: Number(featureForm.sortOrder) || 0
      });
    }
    featureDialog.value = false;
    await reload();
    $q.notify({ type: "positive", message: "Feature saved." });
  } catch (e) {
    $q.notify({ type: "negative", message: errMessage(e) });
  } finally {
    saving.value = false;
  }
}

async function savePermission() {
  if (!permissionForm.key.trim() || !permissionForm.label.trim()) {
    $q.notify({ type: "warning", message: "Key and label are required." });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      key: permissionForm.key.trim(),
      label: permissionForm.label.trim(),
      description: permissionForm.description,
      featureKey: permissionForm.featureKey,
      sortOrder: Number(permissionForm.sortOrder) || 0
    };
    if (permissionForm.id) {
      await updateDeveloperPermission(permissionForm.id, payload);
    } else {
      await createDeveloperPermission(payload);
    }
    permissionDialog.value = false;
    await reload();
    $q.notify({ type: "positive", message: "Permission saved." });
  } catch (e) {
    $q.notify({ type: "negative", message: errMessage(e) });
  } finally {
    saving.value = false;
  }
}

function removeRole(row: AccessRole) {
  $q.dialog({
    title: `Delete role “${row.name}”?`,
    message: "Only allowed if no package uses this role.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await destroyDeveloperRole(row.id);
      await reload();
      $q.notify({ type: "positive", message: "Role deleted." });
    } catch (e) {
      $q.notify({ type: "negative", message: errMessage(e) });
    }
  });
}

function removeFeature(row: AccessFeature) {
  $q.dialog({
    title: `Delete feature “${row.key}”?`,
    message:
      "Remove it from packages first, and delete or reassign its permissions.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await destroyDeveloperFeature(row.id);
      await reload();
      $q.notify({ type: "positive", message: "Feature deleted." });
    } catch (e) {
      $q.notify({ type: "negative", message: errMessage(e) });
    }
  });
}

function removePermission(row: AccessPermission) {
  $q.dialog({
    title: `Delete permission “${row.key}”?`,
    message: "Only allowed if no package grants this permission.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await destroyDeveloperPermission(row.id);
      await reload();
      $q.notify({ type: "positive", message: "Permission deleted." });
    } catch (e) {
      $q.notify({ type: "negative", message: errMessage(e) });
    }
  });
}

onMounted(() => {
  void reload();
});
</script>

<style scoped>
.access-ladder {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.45rem 0.35rem;
  margin-bottom: 1.1rem;
  padding: 0.85rem 1rem;
  background:
    linear-gradient(135deg, rgba(196, 163, 90, 0.1), rgba(255, 255, 255, 0.95)),
    #fff;
  border: 1px solid rgba(154, 123, 60, 0.2);
  border-radius: 14px;
}

.access-ladder__step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  flex: 1 1 9rem;
  min-width: 8.5rem;
  padding: 0.55rem 0.65rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 10px;
}

.access-ladder__n {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--gy-gold-deep);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
}

.access-ladder__step strong {
  display: block;
  font-size: 0.88rem;
  color: var(--gy-ink);
  line-height: 1.2;
}

.access-ladder__step small {
  display: block;
  margin-top: 0.12rem;
  font-size: 0.7rem;
  color: var(--gy-muted);
  line-height: 1.3;
}

.access-ladder__arrow {
  color: var(--gy-gold-deep);
  font-weight: 700;
  align-self: center;
  padding: 0 0.1rem;
}

.access-flow {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  background: #faf9f7;
  border: 1px solid rgba(28, 36, 33, 0.06);
  border-radius: 10px;
  color: var(--gy-muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.access-flow a {
  color: var(--gy-gold-deep);
  font-weight: 600;
  text-decoration: none;
}

.access-flow a:hover {
  text-decoration: underline;
}

code {
  font-size: 0.82rem;
}

@media (max-width: 720px) {
  .access-ladder__arrow {
    display: none;
  }
}
</style>
