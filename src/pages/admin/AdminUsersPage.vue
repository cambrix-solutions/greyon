<template>
  <q-page padding>
    <!-- Developer: full user + package management -->
    <template v-if="auth.isDeveloper">
      <AdminPageHeader
        eyebrow="System"
        title="Users"
        :subtitle="`${filtered.length} users · assign a user package (role + features live on the package)`"
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
          <q-select
            v-model="packageFilter"
            :options="packageFilterOptions"
            dense
            outlined
            emit-value
            map-options
            label="Package"
            style="min-width: 220px; background: #fff"
          />
        </template>
      </AdminPageHeader>

      <q-banner v-reveal="{ delay: '100ms' }" class="bg-white q-mb-md" rounded>
        Only <strong>developers</strong> can add users, change packages, or assign
        location/hotel scope. Other accounts see their role and scope as read-only.
      </q-banner>

      <div v-reveal="{ delay: '120ms' }" class="admin-scroll">
        <q-markup-table flat bordered class="bg-white">
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Email</th>
              <th class="text-left">User package</th>
              <th class="text-left">Role</th>
              <th class="text-left">Scope</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filtered" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <q-select
                  dense
                  outlined
                  :model-value="user.packageId"
                  :options="packageOptions"
                  emit-value
                  map-options
                  style="min-width: 220px"
                  @update:model-value="(v: string) => setPackage(user.id, v)"
                />
              </td>
              <td>
                <span class="role-pill">{{ roleLabelFor(user) }}</span>
              </td>
              <td class="text-caption">{{ scopeLabel(user) }}</td>
              <td>
                <q-btn flat dense color="primary" label="Edit" @click="openEdit(user)" />
                <q-btn flat dense color="primary" label="Copy email" @click="copy(user.email)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  :disable="
                    cms.getUserRole(user) === 'developer' && developerCount <= 1
                  "
                  @click="remove(user.id)"
                />
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-grey text-center q-pa-lg">No users match.</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </template>

    <!-- Everyone else: only their role + scope -->
    <template v-else>
      <AdminPageHeader
        eyebrow="Account"
        title="My access"
        subtitle="Your role and property scope are assigned by a developer — view only."
      />

      <article v-if="me" v-reveal class="my-access">
        <header class="my-access__head">
          <div>
            <p class="my-access__eyebrow">Signed in</p>
            <h2 class="my-access__name">{{ me.name }}</h2>
            <p class="my-access__email">{{ me.email }}</p>
          </div>
        </header>

        <div class="my-access__grid">
          <section class="my-access__card">
            <p class="my-access__label">Role</p>
            <p class="my-access__value">
              <span class="role-pill">{{ roleLabelFor(me) }}</span>
            </p>
            <p class="my-access__hint">
              Comes from your user package. Only a developer can change it.
            </p>
          </section>

          <section class="my-access__card">
            <p class="my-access__label">Scope</p>
            <p class="my-access__value">{{ scopeLabel(me) }}</p>
            <p class="my-access__hint">
              Assigned by a developer. You cannot change your own locations or hotels.
            </p>
          </section>
        </div>
      </article>
    </template>

    <AdminDialog
      v-model="dialog"
      size="lg"
      icon="person"
      eyebrow="System"
      :title="editing ? 'Edit user' : 'Add user'"
      subtitle="Assign a user package. Role is fixed by that package."
    >
      <template #notice>
        To change someone’s role, assign a different package (or edit the package’s role).
      </template>
      <AdminFormSection title="Profile" :columns="2">
        <q-input v-model="form.name" label="Full name" outlined dense />
        <q-input v-model="form.email" type="email" label="Email" outlined dense />
      </AdminFormSection>
      <AdminFormSection
        title="User package"
        hint="This seat defines both role and unlocked modules."
      >
        <q-select
          v-model="form.packageId"
          :options="packageOptions"
          emit-value
          map-options
          label="Package"
          outlined
          dense
          @update:model-value="onPackageChange"
        />
        <p v-if="selectedPackageHint" class="pkg-hint">{{ selectedPackageHint }}</p>
      </AdminFormSection>
      <AdminFormSection
        v-if="needsLocationScope || needsHotelScope"
        title="Property scope"
        hint="Required for location / hotel admin packages."
      >
        <q-select
          v-if="needsLocationScope"
          v-model="form.locationIds"
          :options="locationOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Assigned locations"
          outlined
          dense
        />
        <q-select
          v-if="needsHotelScope"
          v-model="form.hotelIds"
          :options="hotelOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Assigned hotels"
          outlined
          dense
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create user'"
          @click="save"
        />
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
const packageFilter = ref("all");

const packageOptions = computed(() =>
  cms.packages.map(p => ({
    label: `${p.name}${p.priceNote ? ` · ${p.priceNote}` : ""}`,
    value: p.id
  }))
);

const packageFilterOptions = computed(() => [
  { label: "All packages", value: "all" },
  ...packageOptions.value
]);

const locationOptions = computed(() =>
  cms.locations.map(l => ({ label: l.name, value: l.id }))
);
const hotelOptions = computed(() =>
  cms.hotels.map(h => ({ label: h.name, value: h.id }))
);

const developerCount = computed(
  () => cms.users.filter(u => cms.getUserRole(u) === "developer").length
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
  packageId: cms.activePackageId,
  locationIds: [] as string[],
  hotelIds: [] as string[]
});

const formPackageRole = computed(
  () => cms.getPackageById(form.packageId)?.role ?? null
);
const needsLocationScope = computed(
  () => formPackageRole.value === "location_admin"
);
const needsHotelScope = computed(() => formPackageRole.value === "hotel_admin");

const selectedPackageHint = computed(() => {
  const pkg = cms.getPackageById(form.packageId);
  if (!pkg) return "";
  return `Role: ${roleLabels[pkg.role]} · ${pkg.featureKeys.length} features · ${pkg.description}`;
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.users.filter(u => {
    if (packageFilter.value !== "all" && u.packageId !== packageFilter.value)
      return false;
    if (!q) return true;
    const pkg = cms.getPackageById(u.packageId);
    const role = cms.getUserRole(u);
    return `${u.name} ${u.email} ${pkg?.name ?? ""} ${role ?? ""}`
      .toLowerCase()
      .includes(q);
  });
});

function roleLabelFor(user: AdminUser) {
  const role = cms.getUserRole(user);
  return role ? roleLabels[role] : "—";
}

function scopeLabel(user: AdminUser) {
  const role = cms.getUserRole(user);
  if (role === "location_admin") return locationNames(user.locationIds);
  if (role === "hotel_admin") return hotelNames(user.hotelIds);
  return "All (role-wide)";
}

function locationNames(ids?: string[]) {
  if (!ids?.length) return "None assigned";
  return ids
    .map(id => cms.getLocationById(id)?.name ?? id)
    .join(", ");
}

function hotelNames(ids?: string[]) {
  if (!ids?.length) return "None assigned";
  return ids.map(id => cms.getHotelById(id)?.name ?? id).join(", ");
}

function onPackageChange() {
  if (!needsLocationScope.value) form.locationIds = [];
  if (!needsHotelScope.value) form.hotelIds = [];
}

function openCreate() {
  if (!auth.isDeveloper) return;
  editing.value = null;
  form.name = "";
  form.email = "";
  form.packageId = "pkg-hotel-core";
  form.locationIds = [];
  form.hotelIds = [];
  dialog.value = true;
}

function openEdit(user: AdminUser) {
  if (!auth.isDeveloper) return;
  editing.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.packageId = user.packageId;
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
  if (!form.packageId) {
    $q.notify({ type: "negative", message: "Assign a user package." });
    return;
  }
  const pkgRole = cms.getPackageById(form.packageId)?.role;
  if (pkgRole === "location_admin" && !form.locationIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one location." });
    return;
  }
  if (pkgRole === "hotel_admin" && !form.hotelIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one hotel." });
    return;
  }
  cms.upsertUser({
    ...(editing.value ? { id: editing.value } : {}),
    name: form.name,
    email: form.email,
    packageId: form.packageId,
    locationIds: form.locationIds,
    hotelIds: form.hotelIds
  });
  dialog.value = false;
  auth.hydrate();
  $q.notify({ type: "positive", message: "User saved." });
}

function setPackage(id: string, packageId: string) {
  if (!auth.isDeveloper) return;
  const user = cms.users.find(u => u.id === id);
  if (!user) return;
  const pkg = cms.getPackageById(packageId);
  cms.upsertUser({
    ...user,
    packageId,
    locationIds: pkg?.role === "location_admin" ? user.locationIds : [],
    hotelIds: pkg?.role === "hotel_admin" ? user.hotelIds : []
  });
  auth.hydrate();
  $q.notify({
    type: "positive",
    message: `Package → ${pkg?.name ?? packageId} (${pkg ? roleLabels[pkg.role] : ""})`
  });
}

function copy(value: string) {
  void navigator.clipboard.writeText(value);
  $q.notify({ type: "info", message: "Email copied." });
}

function remove(id: string) {
  if (!auth.isDeveloper) return;
  if (cms.users.length <= 1) {
    $q.notify({ type: "negative", message: "Keep at least one admin user." });
    return;
  }
  $q.dialog({ title: "Delete user?", cancel: true, persistent: true }).onOk(() => {
    cms.deleteUser(id);
    $q.notify({ type: "positive", message: "User deleted." });
  });
}
</script>

<style scoped>
.pkg-hint {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.role-pill {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.12);
  border-radius: 999px;
}

.my-access {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.my-access__head {
  padding: 1.25rem 1.35rem;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
  background: linear-gradient(180deg, #fbfaf8 0%, #fff 100%);
}

.my-access__eyebrow {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.my-access__name {
  margin: 0.25rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.my-access__email {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  color: var(--gy-muted);
}

.my-access__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  padding: 1.15rem 1.35rem;
}

.my-access__card {
  padding: 1rem;
  background: #faf9f7;
  border-radius: 12px;
  border: 1px solid rgba(28, 36, 33, 0.06);
}

.my-access__label {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.my-access__value {
  margin: 0.55rem 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--gy-ink);
  line-height: 1.35;
}

.my-access__hint {
  margin: 0.45rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

@media (max-width: 700px) {
  .my-access__grid {
    grid-template-columns: 1fr;
  }
}
</style>
