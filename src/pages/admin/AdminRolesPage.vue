<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Access"
      title="Roles"
      subtitle="Create roles and choose which features each role gets."
    >
      <template #actions>
        <q-btn
          v-if="auth.canDo('roles', 'create')"
          unelevated
          no-caps
          color="primary"
          label="+ New role"
          @click="startNew"
        />
      </template>
    </AdminPageHeader>

    <section class="gy-adm-panel gy-adm-scroll">
      <table class="gy-adm-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Features</th>
            <th>People</th>
            <th>Type</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="role in roles"
            :key="role.id"
            :class="{ 'is-selected': editing?.id === role.id }"
          >
            <td>
              <span class="gy-adm-strong">{{ role.name }}</span>
              <span v-if="role.description" class="gy-adm-sub">{{
                role.description
              }}</span>
            </td>
            <td>{{ role.featureKeys.length }}</td>
            <td>{{ role.adminCount ?? 0 }}</td>
            <td>
              <span
                class="gy-adm-pill"
                :class="{ 'gy-adm-pill--system': role.isSystem }"
                >{{ role.isSystem ? "System" : "Custom" }}</span
              >
            </td>
            <td>
              <span v-if="role.isSystem" class="gy-adm-muted">Read only</span>
              <span v-else class="gy-adm-row" style="gap: 0.35rem">
                <button
                  v-if="auth.canDo('roles', 'edit')"
                  type="button"
                  class="gy-adm-link"
                  @click="startEdit(role)"
                >
                  Edit
                </button>
                <span
                  v-if="
                    auth.canDo('roles', 'edit') && auth.canDo('roles', 'delete')
                  "
                  aria-hidden="true"
                  >·</span
                >
                <button
                  v-if="auth.canDo('roles', 'delete')"
                  type="button"
                  class="gy-adm-link"
                  :disabled="(role.adminCount ?? 0) > 0"
                  :title="
                    (role.adminCount ?? 0) > 0
                      ? 'Reassign the people who hold this role first'
                      : ''
                  "
                  @click="remove(role)"
                >
                  Delete
                </button>
              </span>
            </td>
          </tr>
          <tr v-if="!loading && !roles.length">
            <td colspan="5" class="gy-adm-empty">No roles yet.</td>
          </tr>
          <tr v-if="loading">
            <td colspan="5" class="gy-adm-empty">Loading roles…</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="form" class="gy-adm-panel">
      <form class="gy-adm-panel__body" @submit.prevent="save">
        <h2 class="gy-adm-panel__title">
          {{ editing ? `Edit role: ${editing.name}` : "New role" }}
        </h2>

        <div class="gy-adm-field">
          <label class="gy-adm-label" for="role-name">Name</label>
          <input
            id="role-name"
            v-model.trim="form.name"
            class="gy-adm-input"
            required
            maxlength="255"
          />
        </div>

        <div class="gy-adm-field">
          <label class="gy-adm-label" for="role-desc">Description</label>
          <input
            id="role-desc"
            v-model.trim="form.description"
            class="gy-adm-input"
            maxlength="1000"
          />
        </div>

        <div class="gy-adm-field">
          <span class="gy-adm-label"
            >Features (only ones you hold are offered)</span
          >
          <div class="gy-adm-chips">
            <button
              v-for="feature in options?.features ?? []"
              :key="feature.key"
              type="button"
              class="gy-adm-chip"
              :class="{ 'is-on': !!form.features[feature.key] }"
              :title="feature.description || ''"
              @click="toggleFeature(feature)"
            >
              {{ featureLabel(feature.key, feature.label) }}
            </button>
          </div>
          <p
            v-if="options && !options.features.length"
            class="gy-adm-muted"
            style="margin-top: 0.5rem"
          >
            You have no features you can give to a role.
          </p>
        </div>

        <div v-if="selectedFeatures.length" class="gy-adm-field">
          <span class="gy-adm-label">What each feature allows</span>
          <div class="role-actions">
            <div
              v-for="feature in selectedFeatures"
              :key="feature.key"
              class="role-actions__row"
            >
              <span class="role-actions__name">{{
                featureLabel(feature.key, feature.label)
              }}</span>
              <div class="gy-adm-chips">
                <button
                  v-for="action in ROLE_ACTIONS"
                  :key="action"
                  type="button"
                  class="gy-adm-chip role-actions__chip"
                  :class="{
                    'is-on': form.features[feature.key]?.includes(action)
                  }"
                  :disabled="!feature.actions.includes(action)"
                  @click="toggleAction(feature.key, action)"
                >
                  {{ actionLabels[action] }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="formError" class="role-error">{{ formError }}</p>

        <div class="gy-adm-row">
          <button type="submit" class="gy-adm-btn" :disabled="saving">
            {{ saving ? "Saving…" : "Save role" }}
          </button>
          <button
            type="button"
            class="gy-adm-btn gy-adm-btn--ghost"
            @click="cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import "@/css/admin-access.css";
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import {
  createRole,
  deleteRole,
  fetchRoleOptions,
  fetchRoles,
  ROLE_ACTIONS,
  updateRole,
  type AccessRole,
  type RoleAction,
  type RoleFeatureOption,
  type RoleOptions
} from "@/services/engine/adminAccess";
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
const $q = useQuasar();

const roles = ref<AccessRole[]>([]);
const options = ref<RoleOptions | null>(null);
const loading = ref(true);
const saving = ref(false);
const formError = ref("");
const editing = ref<AccessRole | null>(null);
const form = ref<{
  name: string;
  description: string;
  features: Record<string, RoleAction[]>;
} | null>(null);

const actionLabels: Record<RoleAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete"
};

/** Admin wording: the engine key stays `bookings`, the screen says Reservations. */
function featureLabel(key: string, label: string) {
  if (key === "bookings") return "Reservations";
  return label;
}

const selectedFeatures = computed<RoleFeatureOption[]>(() =>
  (options.value?.features ?? []).filter(f => !!form.value?.features[f.key])
);

async function load() {
  loading.value = true;
  try {
    const [list, opts] = await Promise.all([fetchRoles(), fetchRoleOptions()]);
    roles.value = list;
    options.value = opts;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not load roles."
    });
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function startNew() {
  editing.value = null;
  formError.value = "";
  form.value = { name: "", description: "", features: {} };
}

function startEdit(role: AccessRole) {
  editing.value = role;
  formError.value = "";
  const own = new Map<string, RoleAction[]>(
    (options.value?.features ?? []).map(
      (f: RoleFeatureOption): [string, RoleAction[]] => [f.key, f.actions]
    )
  );
  const features: Record<string, RoleAction[]> = {};
  for (const key of role.featureKeys) {
    const granted = role.featureActions[key] ?? ROLE_ACTIONS;
    // Only keep what the signed-in admin can still give.
    features[key] = granted.filter(a => (own.get(key) ?? []).includes(a));
  }
  form.value = {
    name: role.name,
    description: role.description ?? "",
    features
  };
}

function cancel() {
  form.value = null;
  editing.value = null;
}

function toggleFeature(feature: RoleFeatureOption) {
  if (!form.value) return;
  const next = { ...form.value.features };
  if (next[feature.key]) delete next[feature.key];
  else next[feature.key] = feature.actions.includes("view") ? ["view"] : [];
  form.value.features = next;
}

function toggleAction(key: string, action: RoleAction) {
  if (!form.value) return;
  const current = form.value.features[key] ?? [];
  let next = current.includes(action)
    ? current.filter(a => a !== action)
    : [...current, action];
  // Every other action needs view; dropping view drops the rest.
  if (action === "view" && !next.includes("view")) next = [];
  if (action !== "view" && next.length && !next.includes("view")) {
    next = ["view", ...next];
  }
  form.value.features = {
    ...form.value.features,
    [key]: ROLE_ACTIONS.filter(a => next.includes(a))
  };
}

async function save() {
  if (!form.value) return;
  formError.value = "";
  const entries = Object.entries(form.value.features) as [
    string,
    RoleAction[]
  ][];
  const features = entries
    .filter(([, actions]) => actions.length)
    .map(([key, actions]) => ({ key, actions }));
  if (!features.length) {
    formError.value = "Pick at least one feature and what it allows.";
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
      features
    };
    if (editing.value) {
      await updateRole(editing.value.id, payload);
    } else {
      await createRole(payload);
    }
    $q.notify({ type: "positive", message: "Role saved." });
    cancel();
    await load();
  } catch (e) {
    formError.value =
      e instanceof Error ? e.message : "Could not save the role.";
  } finally {
    saving.value = false;
  }
}

function remove(role: AccessRole) {
  $q.dialog({
    title: `Delete “${role.name}”?`,
    message: "People cannot be given this role any more.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await deleteRole(role.id);
      if (editing.value?.id === role.id) cancel();
      $q.notify({ type: "positive", message: "Role deleted." });
      await load();
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Could not delete the role."
      });
    }
  });
}
</script>

<style scoped>
.role-actions {
  border: 1px solid rgba(18, 17, 16, 0.1);
}

.role-actions__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid rgba(18, 17, 16, 0.07);
}

.role-actions__row:last-child {
  border-bottom: 0;
}

.role-actions__name {
  font-weight: 600;
  font-size: 0.9rem;
}

.role-actions__chip {
  min-height: 30px;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
}

.role-error {
  margin: 0 0 0.9rem;
  color: #8a3b33;
  font-size: 0.88rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
