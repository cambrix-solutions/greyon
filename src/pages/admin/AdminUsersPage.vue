<template>
  <q-page padding>
    <template v-if="auth.isDeveloper">
      <AdminPageHeader
        eyebrow="Foundation"
        title="Users"
        :subtitle="`${filtered.length} users · packages linked via user_package (M2M)`"
      >
        <template #actions>
          <q-btn
            outline
            no-caps
            color="primary"
            label="User packages"
            to="/admin/features"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Add user"
            @click="openCreate"
          />
        </template>
        <template #toolbar>
          <q-input
            v-model="query"
            dense
            outlined
            clearable
            placeholder="Search users…"
            style="min-width: min(100%, 220px); background: #fff"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </template>
      </AdminPageHeader>

      <q-banner class="bg-white q-mb-md" rounded>
        Foundation:
        <strong>users</strong> ↔
        <strong>user_package</strong> ↔
        <strong>packages</strong> (roles + features).
        Only developers assign packages. Managers get location scope; hotel admins get hotel scope.
      </q-banner>

      <div class="admin-scroll">
        <q-markup-table flat bordered class="bg-white">
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Email</th>
              <th class="text-left">Packages</th>
              <th class="text-left">Roles</th>
              <th class="text-left">Scope</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filtered" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <div class="pkg-chips">
                  <span
                    v-for="pkg in cms.getPackagesForUser(user.id)"
                    :key="pkg.id"
                    class="pkg-chip"
                  >{{ pkg.name }}</span>
                  <span v-if="!cms.getPackagesForUser(user.id).length" class="text-grey-6"
                    >None</span
                  >
                </div>
              </td>
              <td>
                <span
                  v-for="r in cms.getUserRoles(user)"
                  :key="r"
                  class="role-pill"
                  >{{ roleLabels[r] }}</span
                >
              </td>
              <td class="text-caption">{{ scopeLabel(user) }}</td>
              <td>
                <q-btn flat dense color="primary" label="Edit" @click="openEdit(user)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  :disable="
                    cms.getUserRoles(user).includes('developer') && developerCount <= 1
                  "
                  @click="remove(user.id)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </template>

    <template v-else>
      <AdminPageHeader
        eyebrow="Account"
        title="My access"
        subtitle="Role and scope from your user packages — view only."
      />
      <article v-if="me" class="my-access">
        <header class="my-access__head">
          <h2>{{ me.name }}</h2>
          <p>{{ me.email }}</p>
        </header>
        <div class="my-access__grid">
          <section>
            <p class="label">Roles</p>
            <p>
              <span
                v-for="r in cms.getUserRoles(me)"
                :key="r"
                class="role-pill"
                >{{ roleLabels[r] }}</span
              >
            </p>
          </section>
          <section>
            <p class="label">Scope</p>
            <p>{{ scopeLabel(me) }}</p>
            <p class="hint">Only a developer can change your locations or hotels.</p>
          </section>
          <section class="span-2">
            <p class="label">Packages</p>
            <p>
              <span
                v-for="pkg in cms.getPackagesForUser(me.id)"
                :key="pkg.id"
                class="pkg-chip"
                >{{ pkg.name }}</span
              >
            </p>
          </section>
        </div>
      </article>
    </template>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="person"
      eyebrow="Foundation"
      :title="editing ? 'Edit user' : 'Add user'"
      subtitle="Assign one or more packages. Roles and features come from those packages."
    >
      <AdminFormSection title="Profile" :columns="2">
        <q-input v-model="form.name" label="Full name" outlined dense />
        <q-input v-model="form.email" type="email" label="Email" outlined dense />
      </AdminFormSection>
      <AdminFormSection
        title="Packages (user_package)"
        hint="Many-to-many — only developers can assign. Users cannot add packages."
      >
        <q-select
          v-model="form.packageIds"
          :options="packageOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Packages"
          outlined
          dense
          @update:model-value="onPackagesChange"
        />
        <p v-if="formRolesHint" class="hint">{{ formRolesHint }}</p>
      </AdminFormSection>
      <AdminFormSection
        v-if="needsManagerScope || needsHotelScope"
        title="Property scope"
      >
        <q-select
          v-if="needsManagerScope"
          v-model="form.locationIds"
          :options="locationOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Managed locations"
          outlined
          dense
          hint="Each location can have a manager"
        />
        <q-select
          v-if="needsHotelScope"
          v-model="form.hotelIds"
          :options="hotelOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Managed hotels"
          outlined
          dense
          hint="Hotel admins sit under a location’s hotels"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn unelevated no-caps color="primary" label="Save" @click="save" />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { roleLabels, useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { AdminUser } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const dialog = ref(false);
const editing = ref<string | null>(null);
const query = ref("");

const packageOptions = computed(() =>
  cms.packages.map(p => ({
    label: `${p.name} · ${p.roles.map(r => roleLabels[r]).join(", ")}`,
    value: p.id
  }))
);
const locationOptions = computed(() =>
  cms.locations.map(l => ({ label: l.name, value: l.id }))
);
const hotelOptions = computed(() =>
  cms.hotels.map(h => ({ label: h.name, value: h.id }))
);

const developerCount = computed(
  () => cms.users.filter(u => cms.getUserRoles(u).includes("developer")).length
);

const me = computed(() => {
  if (!auth.user) return null;
  return (
    cms.users.find(u => u.id === auth.user!.id || u.email === auth.user!.email) ??
    auth.user
  );
});

const form = reactive({
  name: "",
  email: "",
  packageIds: [] as string[],
  locationIds: [] as string[],
  hotelIds: [] as string[]
});

const formRoles = computed(() => {
  const roles = form.packageIds.flatMap(
    id => cms.getPackageById(id)?.roles ?? []
  );
  return Array.from(new Set(roles));
});
const needsManagerScope = computed(() => formRoles.value.includes("manager"));
const needsHotelScope = computed(() => formRoles.value.includes("hotel_admin"));
const formRolesHint = computed(() => {
  if (!formRoles.value.length) return "Pick at least one package.";
  return `Effective roles: ${formRoles.value.map(r => roleLabels[r]).join(", ")}`;
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.users.filter(u => {
    if (!q) return true;
    const pkgs = cms.getPackagesForUser(u.id).map(p => p.name).join(" ");
    const roles = cms.getUserRoles(u).join(" ");
    return `${u.name} ${u.email} ${pkgs} ${roles}`.toLowerCase().includes(q);
  });
});

function scopeLabel(user: AdminUser) {
  const roles = cms.getUserRoles(user);
  const parts: string[] = [];
  if (roles.includes("manager")) {
    parts.push(
      user.locationIds?.length
        ? `Locations: ${user.locationIds.map(id => cms.getLocationById(id)?.name ?? id).join(", ")}`
        : "Locations: none"
    );
  }
  if (roles.includes("hotel_admin")) {
    parts.push(
      user.hotelIds?.length
        ? `Hotels: ${user.hotelIds.map(id => cms.getHotelById(id)?.name ?? id).join(", ")}`
        : "Hotels: none"
    );
  }
  if (!parts.length) return "All (admin / developer)";
  return parts.join(" · ");
}

function onPackagesChange() {
  if (!needsManagerScope.value) form.locationIds = [];
  if (!needsHotelScope.value) form.hotelIds = [];
}

function openCreate() {
  if (!auth.isDeveloper) return;
  editing.value = null;
  form.name = "";
  form.email = "";
  form.packageIds = ["pkg-hotel-core"];
  form.locationIds = [];
  form.hotelIds = [];
  dialog.value = true;
}

function openEdit(user: AdminUser) {
  if (!auth.isDeveloper) return;
  editing.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.packageIds = cms.getPackagesForUser(user.id).map(p => p.id);
  form.locationIds = [...(user.locationIds ?? [])];
  form.hotelIds = [...(user.hotelIds ?? [])];
  dialog.value = true;
}

function save() {
  if (!auth.isDeveloper) return;
  if (!form.name || !form.email) {
    $q.notify({ type: "negative", message: "Name and email are required." });
    return;
  }
  if (!form.packageIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one package." });
    return;
  }
  if (needsManagerScope.value && !form.locationIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one location for managers." });
    return;
  }
  if (needsHotelScope.value && !form.hotelIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one hotel for hotel admins." });
    return;
  }
  cms.upsertUser({
    ...(editing.value ? { id: editing.value } : {}),
    name: form.name,
    email: form.email,
    packageIds: form.packageIds,
    locationIds: form.locationIds,
    hotelIds: form.hotelIds
  });
  dialog.value = false;
  auth.hydrate();
  $q.notify({ type: "positive", message: "User saved." });
}

function remove(id: string) {
  if (!auth.isDeveloper) return;
  $q.dialog({ title: "Delete user?", cancel: true, persistent: true }).onOk(() => {
    cms.deleteUser(id);
    $q.notify({ type: "positive", message: "User deleted." });
  });
}
</script>

<style scoped>
.role-pill,
.pkg-chip {
  display: inline-block;
  margin: 0.1rem 0.25rem 0.1rem 0;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 999px;
}
.role-pill {
  color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.12);
}
.pkg-chip {
  color: var(--gy-ink);
  background: rgba(28, 36, 33, 0.06);
}
.pkg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
}
.hint {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}
.my-access {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
}
.my-access__head {
  padding: 1.2rem 1.35rem;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}
.my-access__head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.4rem;
}
.my-access__head p {
  margin: 0.25rem 0 0;
  color: var(--gy-muted);
}
.my-access__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.2rem 1.35rem;
}
.my-access__grid .span-2 {
  grid-column: 1 / -1;
}
.my-access__grid .label {
  margin: 0 0 0.35rem;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
}
@media (max-width: 700px) {
  .my-access__grid {
    grid-template-columns: 1fr;
  }
}
</style>
