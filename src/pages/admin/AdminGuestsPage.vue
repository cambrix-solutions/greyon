<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Insights"
      title="Guests"
      subtitle="People who have reserved, from the hotels you can see."
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          label="Export CSV"
          :loading="exporting"
          @click="exportCsv"
        />
      </template>
    </AdminPageHeader>

    <div class="gy-adm-field">
      <label class="gy-adm-label" for="guest-search">Search</label>
      <input
        id="guest-search"
        v-model="query"
        class="gy-adm-input"
        type="search"
        placeholder="Name, email or phone"
        autocomplete="off"
      />
    </div>

    <section class="gy-adm-panel gy-adm-scroll">
      <table class="gy-adm-table">
        <thead>
          <tr>
            <th>Guest</th>
            <th>Phone</th>
            <th>Reservations</th>
            <th>Cancelled</th>
            <th>Nights</th>
            <th>Value</th>
            <th>Last check-in</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="guest in guests"
            :key="guest.email"
            class="is-clickable"
            :class="{ 'is-selected': selected?.email === guest.email }"
            tabindex="0"
            @click="open(guest.email)"
            @keydown.enter="open(guest.email)"
          >
            <td>
              <span class="gy-adm-strong">{{ guest.fullName }}</span>
              <span class="gy-adm-sub">{{ guest.email }}</span>
            </td>
            <td>{{ guest.phone || "—" }}</td>
            <td>{{ guest.reservations }}</td>
            <td>{{ guest.cancelled }}</td>
            <td>{{ guest.nights }}</td>
            <td>{{ formatMoney(guest.reservedValue) }}</td>
            <td>{{ formatDay(guest.lastCheckIn) }}</td>
          </tr>
          <tr v-if="!loading && !guests.length">
            <td colspan="7" class="gy-adm-empty">
              {{
                query.trim()
                  ? "No guests match this search."
                  : "No guests yet. Guests appear here after their first reservation."
              }}
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="gy-adm-empty">Loading guests…</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="meta.lastPage > 1" class="gy-adm-row guests-pager">
      <button
        type="button"
        class="gy-adm-btn gy-adm-btn--ghost"
        :disabled="meta.page <= 1"
        @click="goTo(meta.page - 1)"
      >
        Previous
      </button>
      <span class="gy-adm-muted"
        >Page {{ meta.page }} of {{ meta.lastPage }} ·
        {{ meta.total }} guests</span
      >
      <button
        type="button"
        class="gy-adm-btn gy-adm-btn--ghost"
        :disabled="meta.page >= meta.lastPage"
        @click="goTo(meta.page + 1)"
      >
        Next
      </button>
    </div>

    <section v-if="selected" class="gy-adm-panel">
      <div class="gy-adm-panel__body">
        <h2 class="gy-adm-panel__title">
          {{ selected.fullName }}
          <span class="guest-email">· {{ selected.email }}</span>
        </h2>

        <span class="gy-adm-label">History</span>
        <ul class="guest-history">
          <li v-for="r in history" :key="r.id">
            <span
              ><strong>{{ r.reference }}</strong>
              <template v-if="r.hotel"> · {{ r.hotel.name }}</template></span
            >
            <span class="gy-adm-muted"
              >{{ formatShortDay(r.checkIn) }} →
              {{ formatShortDay(r.checkOut) }}</span
            >
            <span>
              <span class="gy-adm-pill" :class="`gy-adm-pill--${r.status}`">{{
                capitalise(r.status)
              }}</span>
            </span>
          </li>
        </ul>

        <label class="gy-adm-label" for="guest-note"
          >Private note (staff only)</label
        >
        <textarea
          id="guest-note"
          v-model="note"
          class="gy-adm-input"
          maxlength="2000"
          :readonly="!auth.canDo('guests', 'edit')"
        />
        <div
          v-if="auth.canDo('guests', 'edit')"
          class="gy-adm-row"
          style="margin-top: 0.85rem"
        >
          <button
            type="button"
            class="gy-adm-btn"
            :disabled="savingNote"
            @click="saveNote"
          >
            {{ savingNote ? "Saving…" : "Save note" }}
          </button>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import "@/css/admin-access.css";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import {
  exportGuestsCsv,
  fetchGuestProfile,
  fetchGuests,
  saveGuestNote,
  type GuestReservation,
  type GuestSummary
} from "@/services/engine/adminAccess";
import { useAuthStore } from "@/stores/auth-store";
import {
  capitalise,
  formatDay,
  formatMoney,
  formatShortDay
} from "@/utils/adminFormat";

const auth = useAuthStore();
const $q = useQuasar();

const query = ref("");
const guests = ref<GuestSummary[]>([]);
const meta = ref({ total: 0, page: 1, perPage: 25, lastPage: 1 });
const loading = ref(true);
const exporting = ref(false);
const selected = ref<GuestSummary | null>(null);
const history = ref<GuestReservation[]>([]);
const note = ref("");
const savingNote = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function load(page = 1) {
  loading.value = true;
  try {
    const result = await fetchGuests({
      q: query.value.trim() || undefined,
      page,
      perPage: 25
    });
    guests.value = result.guests ?? [];
    meta.value = result.meta;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not load guests."
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => load());
onUnmounted(() => clearTimeout(searchTimer));

watch(query, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void load(1), 300);
});

function goTo(page: number) {
  void load(page);
}

async function open(email: string) {
  try {
    const result = await fetchGuestProfile(email);
    selected.value = result.guest;
    history.value = result.reservations ?? [];
    note.value = result.guest.note ?? "";
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not open this guest."
    });
  }
}

async function saveNote() {
  if (!selected.value) return;
  savingNote.value = true;
  try {
    const result = await saveGuestNote(selected.value.email, note.value);
    note.value = result.note ?? "";
    const row = guests.value.find(g => g.email === selected.value?.email);
    if (row) row.note = result.note;
    $q.notify({ type: "positive", message: "Note saved." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not save the note."
    });
  } finally {
    savingNote.value = false;
  }
}

async function exportCsv() {
  exporting.value = true;
  try {
    await exportGuestsCsv(query.value.trim() || undefined);
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Export failed."
    });
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.guest-email {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.guest-history {
  list-style: none;
  margin: 0 0 1.1rem;
  padding: 0;
}

.guest-history li {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(18, 17, 16, 0.08);
  font-size: 0.88rem;
}

.guests-pager {
  justify-content: space-between;
  margin: -0.4rem 0 1.1rem;
}

@media (max-width: 600px) {
  .guest-history li {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
}
</style>
