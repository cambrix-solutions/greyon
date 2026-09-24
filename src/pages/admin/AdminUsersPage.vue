<template>
  <q-page padding>
    <template v-if="canManagePeople">
      <AdminPageHeader
        eyebrow="Access"
        title="People"
        :subtitle="`${filtered.length} people · Admin assigns Manager (locations) or Hotel desk (hotels)`"
      >
        <template #actions>
          <q-btn
            v-if="auth.isDeveloper"
            outline
            no-caps
            color="primary"
            label="Seat types"
            to="/admin/features"
          />
          <q-btn
            v-if="auth.canAction('users', 'create')"
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Add person"
            @click="openCreate"
          />
        </template>
        <template #toolbar>
          <q-input
            v-model="query"
            dense
            outlined
            clearable
            placeholder="Search people…"
            style="min-width: min(100%, 220px); background: #fff"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </template>
      </AdminPageHeader>

      <AccessHubBanner focus="people" />

      <div class="admin-scroll">
        <q-markup-table flat bordered class="bg-white">
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Email</th>
              <th class="text-left">Seat (role)</th>
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
                    v-for="seat in seatsFor(user)"
                    :key="seat.id"
                    class="pkg-chip"
                    >{{ seat.label }}</span
                  >
                  <span v-if="!seatsFor(user).length" class="text-grey-6"
                    >None</span
                  >
                </div>
              </td>
              <td class="text-caption">{{ scopeLabel(user) }}</td>
              <td>
                <q-btn
                  v-if="auth.canAction('users', 'update')"
                  flat
                  dense
                  color="primary"
                  label="Edit"
                  :disable="!canEditRow(user)"
                  @click="openEdit(user)"
                />
                <q-btn
                  v-if="auth.canAction('users', 'delete')"
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  :disable="!canDeleteRow(user)"
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
        eyebrow="Access"
        title="My seat"
        subtitle="Your role, seat type, and property scope."
      />
      <AccessHubBanner focus="people" />
      <article v-if="me" class="my-access">
        <header class="my-access__head">
          <h2>{{ me.name }}</h2>
          <p>{{ me.email }}</p>
        </header>
        <div class="my-access__grid">
          <section>
            <p class="label">Role</p>
            <p>
              <span
                v-for="seat in seatsFor(me)"
                :key="`role-${seat.id}`"
                class="role-pill"
                >{{ seat.label }}</span
              >
              <span v-if="!seatsFor(me).length" class="text-grey-6">None</span>
            </p>
          </section>
          <section>
            <p class="label">Scope</p>
            <p>{{ scopeLabel(me) }}</p>
            <p class="hint">
              Managers can hold many locations. Hotel desks hold hotels.
            </p>
          </section>
          <section class="span-2">
            <p class="label">Seat type</p>
            <p>
              <span
                v-for="seat in seatsFor(me)"
                :key="seat.id"
                class="pkg-chip"
                >{{ seat.label }}</span
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
      eyebrow="Access"
      :title="editing ? 'Edit person' : 'Add person'"
      subtitle="Pick a seat by role. Managers can get many locations; hotel desks get hotels."
    >
      <AdminFormSection title="Profile" :columns="2">
        <q-input v-model="form.name" label="Full name" outlined dense />
        <q-input
          v-model="form.email"
          type="email"
          label="Email"
          outlined
          dense
        />
      </AdminFormSection>
      <AdminFormSection
        title="Seat (role)"
        hint="Shown as roles — each seat unlocks features + CRUD permissions."
      >
        <q-select
          v-model="form.packageIds"
          :options="seatOptions"
          emit-value
          map-options
          multiple
          use-chips
          label="Seat type"
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
          hint="Assign many locations to one manager (Phnom Penh, Sihanoukville, Kampot)."
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
          hint="Package limits: up to 3 hotels per location."
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            editing
              ? auth.canAction('users', 'update')
              : auth.canAction('users', 'create')
          "
          unelevated
          no-caps
          color="primary"
          label="Save"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AccessHubBanner from "@/components/admin/AccessHubBanner.vue";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { roleLabels, useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { AdminUser } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

const canManagePeople = computed(() => auth.isDeveloper || auth.can("users"));

onMounted(() => {
  void cms.ensureTeamBundle();
  void cms.ensureLocations();
  void cms.ensureHotels();
});

const dialog = ref(false);
const editing = ref<string | null>(null);
const query = ref("");

function seatLabel(pkg: { name: string; roles: string[]; priceNote?: string }) {
  // Prefer seat name so city packages read "Manager · Kampot", not plain "Manager".
  if (pkg.name?.trim()) return pkg.name.trim();
  const roles = pkg.roles
    .map(r => roleLabels[r as keyof typeof roleLabels] ?? r)
    .join(" + ");
  const note = pkg.priceNote ? ` · ${pkg.priceNote}` : "";
  return `${roles || "Seat"}${note}`;
}

const assignablePackages = computed(() => {
  if (auth.isDeveloper) return cms.packages;
  return cms.packages.filter(
    p =>
      p.roles.some(r => r === "manager" || r === "hotel_admin") &&
      !p.roles.includes("admin")
  );
});

const seatOptions = computed(() =>
  assignablePackages.value.map(p => ({
    label: seatLabel(p),
    value: p.id
  }))
);

function seatsFor(user: AdminUser | null | undefined) {
  if (!user?.id) return [] as Array<{ id: string; label: string }>;
  return cms.getPackagesForUser(user.id).map(p => ({
    id: p.id,
    label: seatLabel(p)
  }));
}

const locationOptions = computed(() =>
  cms.locations.map(l => ({ label: l.name, value: l.id }))
);
const hotelOptions = computed(() =>
  cms.hotels.map(h => ({
    label: `${h.name} (${cms.getLocationById(h.locationId)?.name ?? "—"})`,
    value: h.id
  }))
);

const developerCount = computed(
  () => cms.users.filter(u => cms.getUserRoles(u).includes("developer")).length
);

const me = computed(() => {
  if (!auth.user) return null;
  return (
    cms.users.find(
      u => u.id === auth.user!.id || u.email === auth.user!.email
    ) ?? auth.user
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
  if (!formRoles.value.length) return "Pick at least one seat.";
  return `Role: ${formRoles.value.map(r => roleLabels[r]).join(", ")}`;
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.users.filter(u => {
    if (!q) return true;
    const seats = seatsFor(u)
      .map(s => s.label)
      .join(" ");
    const roles = cms.getUserRoles(u).join(" ");
    return `${u.name} ${u.email} ${seats} ${roles}`.toLowerCase().includes(q);
  });
});

function canEditRow(user: AdminUser) {
  if (auth.isDeveloper) return true;
  const roles = cms.getUserRoles(user);
  if (roles.includes("admin") && user.id !== auth.user?.id) return false;
  return true;
}

function canDeleteRow(user: AdminUser) {
  if (auth.isDeveloper) {
    return !(
      cms.getUserRoles(user).includes("developer") && developerCount.value <= 1
    );
  }
  if (user.id === auth.user?.id) return false;
  return canEditRow(user);
}

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
  if (roles.includes("admin") || roles.includes("developer")) {
    parts.push("Org-wide");
  }
  return parts.join(" · ") || "—";
}

function onPackagesChange() {
  if (!needsManagerScope.value) form.locationIds = [];
  if (!needsHotelScope.value) form.hotelIds = [];
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.email = "";
  const hotelPkg =
    assignablePackages.value.find(
      p => p.roles.includes("hotel_admin") && !p.roles.includes("admin")
    ) ?? assignablePackages.value[0];
  form.packageIds = hotelPkg ? [hotelPkg.id] : [];
  form.locationIds = [];
  form.hotelIds = [];
  dialog.value = true;
}

function openEdit(user: AdminUser) {
  editing.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.packageIds = cms.getPackagesForUser(user.id).map(p => p.id);
  form.locationIds = [...(user.locationIds ?? [])];
  form.hotelIds = [...(user.hotelIds ?? [])];
  dialog.value = true;
}

async function save() {
  if (!form.packageIds.length) {
    $q.notify({ type: "negative", message: "Assign at least one seat." });
    return;
  }
  if (needsManagerScope.value && !form.locationIds.length) {
    $q.notify({
      type: "negative",
      message: "Pick at least one location for a manager."
    });
    return;
  }
  if (needsHotelScope.value && !form.hotelIds.length) {
    $q.notify({
      type: "negative",
      message: "Pick at least one hotel for a hotel desk."
    });
    return;
  }
  try {
    await cms.upsertUser({
      id: editing.value ?? undefined,
      name: form.name,
      email: form.email,
      packageIds: form.packageIds,
      locationIds: form.locationIds,
      hotelIds: form.hotelIds
    });
    dialog.value = false;
    $q.notify({ type: "positive", message: "Person saved." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Save failed."
    });
  }
}

function remove(id: string) {
  $q.dialog({
    title: "Remove this person?",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await cms.deleteUser(id);
      $q.notify({ type: "positive", message: "Removed." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Delete failed."
      });
    }
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
