<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Access"
      title="People"
      subtitle="Team members and invites that are not accepted yet."
    >
      <template #actions>
        <q-btn
          v-if="auth.canDo('users', 'create')"
          unelevated
          no-caps
          color="primary"
          label="Invite by Google"
          @click="focusInvite"
        />
      </template>
    </AdminPageHeader>

    <section class="gy-adm-panel gy-adm-scroll">
      <table class="gy-adm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Seat</th>
            <th>Status</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in team" :key="person.id">
            <td>
              <span class="gy-adm-strong">{{ person.name }}</span>
              <span class="gy-adm-sub">{{ person.email }}</span>
            </td>
            <td>
              <div v-for="pkg in person.packages" :key="pkg.id">
                {{ seatLine(pkg) }}
              </div>
              <span v-if="!person.packages.length" class="gy-adm-muted"
                >No seat</span
              >
            </td>
            <td>
              <span
                class="gy-adm-pill"
                :class="{ 'gy-adm-pill--inactive': person.status !== 'active' }"
                >{{ person.status === "active" ? "Active" : "Inactive" }}</span
              >
            </td>
            <td>
              <button
                v-if="canToggle(person)"
                type="button"
                class="gy-adm-link"
                :disabled="busyId === person.id"
                @click="toggleStatus(person)"
              >
                {{ person.status === "active" ? "Deactivate" : "Activate" }}
              </button>
            </td>
          </tr>
          <tr v-if="!loading && !team.length">
            <td colspan="4" class="gy-adm-empty">No team members yet.</td>
          </tr>
          <tr v-if="loading">
            <td colspan="4" class="gy-adm-empty">Loading people…</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section
      v-if="auth.canDo('users', 'create')"
      ref="inviteSection"
      class="gy-adm-panel"
    >
      <form class="gy-adm-panel__body" @submit.prevent="sendInvite">
        <h2 class="gy-adm-panel__title">Invite by Google</h2>

        <p v-if="lastLink" class="gy-adm-notice">
          <strong>Invite link (shown once):</strong>
          {{ lastLink.url }}
          <br />
          <span class="gy-adm-muted">{{
            lastLink.emailSent
              ? `Also emailed to ${lastLink.email}.`
              : `Email could not be sent — copy this link to ${lastLink.email}.`
          }}</span>
          <br />
          <button type="button" class="gy-adm-link" @click="copyLink">
            Copy link
          </button>
        </p>

        <div class="gy-adm-grid">
          <div class="gy-adm-field">
            <label class="gy-adm-label" for="inv-email">Google email</label>
            <input
              id="inv-email"
              v-model.trim="invite.email"
              type="email"
              class="gy-adm-input"
              required
              autocomplete="off"
            />
          </div>
          <div class="gy-adm-field">
            <label class="gy-adm-label" for="inv-name">Name (optional)</label>
            <input
              id="inv-name"
              v-model.trim="invite.name"
              class="gy-adm-input"
              autocomplete="off"
            />
          </div>
        </div>

        <div
          v-for="(row, idx) in invite.seats"
          :key="idx"
          class="gy-adm-grid people-seat"
        >
          <div class="gy-adm-field">
            <label class="gy-adm-label" :for="`inv-seat-${idx}`">Seat</label>
            <select
              :id="`inv-seat-${idx}`"
              v-model.number="row.packageId"
              class="gy-adm-input"
              required
            >
              <option :value="0" disabled>Choose a role</option>
              <option v-for="seat in seats" :key="seat.id" :value="seat.id">
                {{ seat.name }}{{ seat.isSystem ? "" : " (custom)" }}
              </option>
            </select>
          </div>
          <div class="gy-adm-field">
            <label class="gy-adm-label" :for="`inv-dest-${idx}`"
              >Destination</label
            >
            <select
              :id="`inv-dest-${idx}`"
              v-model="row.locationId"
              class="gy-adm-input"
              required
              @change="row.hotelId = ''"
            >
              <option value="" disabled>Choose a destination</option>
              <option
                v-for="loc in cms.locations"
                :key="loc.id"
                :value="loc.id"
              >
                {{ loc.name }}
              </option>
            </select>
          </div>
          <div class="gy-adm-field">
            <label class="gy-adm-label" :for="`inv-hotel-${idx}`">
              Hotel{{ seatKinds(row.packageId).hotelOnly ? "" : " (optional)" }}
            </label>
            <select
              :id="`inv-hotel-${idx}`"
              v-model="row.hotelId"
              class="gy-adm-input"
              :required="seatKinds(row.packageId).hotelOnly"
              :disabled="seatKinds(row.packageId).locationOnly"
            >
              <option value="" :disabled="seatKinds(row.packageId).hotelOnly">
                {{
                  seatKinds(row.packageId).hotelOnly
                    ? "Choose a hotel"
                    : "Whole destination"
                }}
              </option>
              <option
                v-for="hotel in hotelsIn(row.locationId)"
                :key="hotel.id"
                :value="hotel.id"
              >
                {{ hotel.name }}
              </option>
            </select>
          </div>
          <div class="gy-adm-field people-seat__remove">
            <button
              v-if="invite.seats.length > 1"
              type="button"
              class="gy-adm-link gy-adm-link--danger"
              @click="invite.seats.splice(idx, 1)"
            >
              Remove this role
            </button>
          </div>
        </div>

        <p v-if="inviteError" class="people-error">{{ inviteError }}</p>

        <div class="gy-adm-row">
          <button type="submit" class="gy-adm-btn" :disabled="sending">
            {{ sending ? "Sending…" : "Send invite" }}
          </button>
          <button type="button" class="gy-adm-link" @click="addSeatRow">
            + Add another role
          </button>
          <span class="gy-adm-muted" style="font-size: 0.82rem"
            >The link is shown once and is also emailed.</span
          >
        </div>
      </form>
    </section>

    <section class="gy-adm-panel gy-adm-scroll">
      <table class="gy-adm-table">
        <thead>
          <tr>
            <th>Invited</th>
            <th>Seat</th>
            <th>Status</th>
            <th>Expires</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in invites" :key="item.id">
            <td>
              <span class="gy-adm-strong">{{ item.email }}</span>
              <span v-if="item.name" class="gy-adm-sub">{{ item.name }}</span>
            </td>
            <td>
              <div v-for="(pkg, i) in item.packages" :key="i">
                {{ inviteSeatLine(pkg) }}
              </div>
            </td>
            <td>
              <span
                class="gy-adm-pill"
                :class="`gy-adm-pill--${item.status}`"
                >{{ statusLabel(item.status) }}</span
              >
            </td>
            <td>{{ expiresLabel(item) }}</td>
            <td>
              <span
                v-if="
                  item.status !== 'accepted' && auth.canDo('users', 'create')
                "
                class="gy-adm-row"
                style="gap: 0.35rem"
              >
                <button
                  type="button"
                  class="gy-adm-link"
                  :disabled="busyInvite === item.id"
                  @click="resend(item)"
                >
                  Resend
                </button>
                <template v-if="item.status === 'pending'">
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    class="gy-adm-link"
                    :disabled="busyInvite === item.id"
                    @click="revoke(item)"
                  >
                    Revoke
                  </button>
                </template>
              </span>
            </td>
          </tr>
          <tr v-if="!loading && !invites.length">
            <td colspan="5" class="gy-adm-empty">No invites sent yet.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import "@/css/admin-access.css";
import { nextTick, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import {
  createInvite,
  fetchInvites,
  fetchSeatOptions,
  fetchTeam,
  resendInvite,
  revokeInvite,
  setTeamMemberStatus,
  type AdminInvite,
  type InviteResult,
  type InviteStatus,
  type SeatAssignment,
  type SeatOption,
  type TeamMember,
  type TeamPackage
} from "@/services/engine/adminAccess";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const auth = useAuthStore();
const cms = useCmsStore();
const $q = useQuasar();

const team = ref<TeamMember[]>([]);
const invites = ref<AdminInvite[]>([]);
const seats = ref<SeatOption[]>([]);
const loading = ref(true);
const busyId = ref<number | null>(null);
const busyInvite = ref<number | null>(null);
const sending = ref(false);
const inviteError = ref("");
const inviteSection = ref<HTMLElement | null>(null);
const lastLink = ref<{ url: string; email: string; emailSent: boolean } | null>(
  null
);

type SeatRow = { packageId: number; locationId: string; hotelId: string };
const invite = reactive<{ email: string; name: string; seats: SeatRow[] }>({
  email: "",
  name: "",
  seats: [{ packageId: 0, locationId: "", hotelId: "" }]
});

async function load() {
  loading.value = true;
  try {
    const [people, list, seatList] = await Promise.all([
      fetchTeam(),
      fetchInvites(),
      fetchSeatOptions(),
      cms.ensureLocations(),
      cms.ensureHotels()
    ]);
    team.value = people;
    invites.value = list;
    seats.value = seatList;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not load people."
    });
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function locationName(id: number | string) {
  return cms.locations.find(l => String(l.id) === String(id))?.name ?? "";
}

function hotelName(id: number | string) {
  return cms.hotels.find(h => String(h.id) === String(id))?.name ?? "";
}

function hotelsIn(locationId: string) {
  return cms.hotels.filter(h => String(h.locationId) === String(locationId));
}

function placeLabel(locationIds: number[], hotelIds: number[]) {
  const names = [
    ...locationIds.map(locationName),
    ...hotelIds.map(hotelName)
  ].filter(Boolean);
  return names.join(", ");
}

function seatLine(pkg: TeamPackage) {
  const where = placeLabel(pkg.locationIds, pkg.hotelIds);
  return where ? `${pkg.name} · ${where}` : pkg.name;
}

function inviteSeatLine(pkg: SeatAssignment & { name: string | null }) {
  const where = placeLabel(pkg.locationIds, pkg.hotelIds);
  const name = pkg.name ?? "Removed role";
  return where ? `${name} · ${where}` : name;
}

/**
 * What a seat can be placed on. Custom roles carry both base roles (no scope
 * of their own), so they work at a destination or at one hotel. The built-in
 * manager seat is destination-only and the hotel desk seat is hotel-only.
 */
function seatKinds(packageId: number) {
  const roles = seats.value.find(s => s.id === packageId)?.roles ?? [];
  const location = roles.some(r => r.scope === "location");
  const hotel = roles.some(r => r.scope === "hotel");
  return {
    locationOnly: location && !hotel,
    hotelOnly: hotel && !location
  };
}

function canToggle(person: TeamMember) {
  if (!auth.canDo("users", "edit")) return false;
  if (String(person.id) === String(auth.user?.id)) return false;
  // Org admin accounts are managed by the developer, not here.
  return !person.packages.some(p => p.roleNames.includes("admin"));
}

async function toggleStatus(person: TeamMember) {
  const next = person.status === "active" ? "inactive" : "active";
  busyId.value = person.id;
  try {
    await setTeamMemberStatus(person.id, next);
    person.status = next;
    $q.notify({
      type: "positive",
      message: next === "active" ? "Person activated." : "Person deactivated."
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not update this person."
    });
  } finally {
    busyId.value = null;
  }
}

function focusInvite() {
  void nextTick(() => {
    inviteSection.value?.scrollIntoView({ behavior: "smooth", block: "start" });
    inviteSection.value?.querySelector<HTMLInputElement>("#inv-email")?.focus();
  });
}

function addSeatRow() {
  invite.seats.push({ packageId: 0, locationId: "", hotelId: "" });
}

/**
 * The engine reads `locationIds` as "the whole destination" and `hotelIds` as
 * "only these hotels", and a location pick wins over a hotel pick. So a row
 * with a hotel sends just that hotel, and a row without one sends the
 * destination.
 */
function assignments(): SeatAssignment[] {
  return invite.seats.map(row => {
    const { locationOnly } = seatKinds(row.packageId);
    if (row.hotelId && !locationOnly) {
      return {
        packageId: row.packageId,
        locationIds: [],
        hotelIds: [Number(row.hotelId)]
      };
    }
    return {
      packageId: row.packageId,
      locationIds: [Number(row.locationId)],
      hotelIds: []
    };
  });
}

function showLink(result: InviteResult) {
  lastLink.value = {
    url: result.inviteUrl,
    email: result.invite.email,
    emailSent: result.emailSent
  };
}

async function sendInvite() {
  inviteError.value = "";
  if (invite.seats.some(s => !s.packageId)) {
    inviteError.value = "Choose a role for every seat.";
    return;
  }
  if (invite.seats.some(s => !s.locationId)) {
    inviteError.value = "Choose a destination for every role.";
    return;
  }
  if (invite.seats.some(s => seatKinds(s.packageId).hotelOnly && !s.hotelId)) {
    inviteError.value = "Choose a hotel for every hotel desk role.";
    return;
  }
  sending.value = true;
  try {
    const result = await createInvite({
      email: invite.email,
      name: invite.name || null,
      packages: assignments()
    });
    showLink(result);
    invite.email = "";
    invite.name = "";
    invite.seats = [{ packageId: 0, locationId: "", hotelId: "" }];
    invites.value = await fetchInvites();
    $q.notify({ type: "positive", message: "Invite created." });
  } catch (e) {
    inviteError.value =
      e instanceof Error ? e.message : "Could not send the invite.";
  } finally {
    sending.value = false;
  }
}

async function resend(item: AdminInvite) {
  busyInvite.value = item.id;
  try {
    showLink(await resendInvite(item.id));
    invites.value = await fetchInvites();
    focusInvite();
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not resend the invite."
    });
  } finally {
    busyInvite.value = null;
  }
}

function revoke(item: AdminInvite) {
  $q.dialog({
    title: `Revoke the invite for ${item.email}?`,
    message: "The link stops working straight away.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    busyInvite.value = item.id;
    try {
      await revokeInvite(item.id);
      invites.value = await fetchInvites();
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Could not revoke the invite."
      });
    } finally {
      busyInvite.value = null;
    }
  });
}

async function copyLink() {
  if (!lastLink.value) return;
  try {
    await navigator.clipboard.writeText(lastLink.value.url);
    $q.notify({ type: "positive", message: "Link copied." });
  } catch {
    $q.notify({
      type: "warning",
      message: "Copy failed — select the link and copy it."
    });
  }
}

function statusLabel(status: InviteStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function expiresLabel(item: AdminInvite) {
  if (
    item.status === "accepted" ||
    item.status === "revoked" ||
    !item.expiresAt
  ) {
    return "—";
  }
  const days = Math.round(
    (new Date(item.expiresAt).getTime() - Date.now()) / 86_400_000
  );
  if (days > 1) return `in ${days} days`;
  if (days === 1) return "in 1 day";
  if (days === 0) return "today";
  if (days === -1) return "1 day ago";
  return `${Math.abs(days)} days ago`;
}
</script>

<style scoped>
.people-seat {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.people-seat__remove {
  display: flex;
  align-items: end;
}

.people-error {
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
