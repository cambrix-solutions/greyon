<template>
  <q-page padding>
    <header class="reports-head">
      <div>
        <p class="reports-head__eyebrow">Insights</p>
        <h1 class="reports-head__title">Reports</h1>
        <p class="reports-head__sub">
          Reservation value and where reservations come from.
        </p>
      </div>
      <div class="reports-head__filters">
        <div>
          <label class="gy-adm-label" for="rep-from">From</label>
          <input
            id="rep-from"
            v-model="from"
            type="date"
            class="gy-adm-input"
          />
        </div>
        <div>
          <label class="gy-adm-label" for="rep-to">To</label>
          <input
            id="rep-to"
            v-model="to"
            type="date"
            class="gy-adm-input"
            :min="from"
          />
        </div>
        <button
          type="button"
          class="gy-adm-btn gy-adm-btn--ghost"
          :disabled="exporting"
          @click="exportCsv"
        >
          Export CSV
        </button>
      </div>
    </header>

    <p v-if="error" class="gy-adm-notice">{{ error }}</p>

    <div class="reports-stats">
      <div
        v-for="card in cards"
        :key="card.label"
        class="gy-adm-panel reports-stat"
      >
        <span class="gy-adm-label">{{ card.label }}</span>
        <span class="reports-stat__value">{{ card.value }}</span>
      </div>
    </div>

    <div class="reports-grid">
      <section class="gy-adm-panel">
        <div class="gy-adm-panel__body">
          <h2 class="gy-adm-panel__title">By destination</h2>
          <div v-for="row in byDestination" :key="row.name" class="reports-bar">
            <span>{{ row.name }}</span>
            <span class="reports-bar__track">
              <span
                class="reports-bar__fill"
                :style="{ width: `${row.share}%` }"
              />
            </span>
            <strong>{{ formatMoney(row.value) }}</strong>
          </div>
          <p v-if="!loading && !byDestination.length" class="gy-adm-muted">
            No reservations in this period.
          </p>
        </div>
      </section>

      <section class="gy-adm-panel">
        <div class="gy-adm-panel__body">
          <h2 class="gy-adm-panel__title">By source</h2>
          <div v-for="row in bySource" :key="row.label" class="reports-line">
            <span>{{ row.label }}</span>
            <strong>{{ row.count }}</strong>
          </div>
          <p v-if="!loading && !bySource.length" class="gy-adm-muted">—</p>

          <hr class="reports-rule" />

          <h2 class="gy-adm-panel__title">By status</h2>
          <div v-for="row in byStatus" :key="row.label" class="reports-line">
            <span>{{ row.label }}</span>
            <strong>{{ row.count }}</strong>
          </div>
          <p v-if="!loading && !byStatus.length" class="gy-adm-muted">—</p>
        </div>
      </section>
    </div>

    <p class="reports-note">
      Value is reservations that were not cancelled. It is not money received,
      because payments are parked.
    </p>
  </q-page>
</template>

<script setup lang="ts">
import "@/css/admin-access.css";
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import {
  exportReportCsv,
  fetchReportSummary,
  type ReportSummary
} from "@/services/engine/adminAccess";
import { capitalise, formatMoney, formatSource } from "@/utils/adminFormat";

const $q = useQuasar();

function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const now = new Date();
const from = ref(ymd(new Date(now.getFullYear(), now.getMonth(), 1)));
const to = ref(ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
const summary = ref<ReportSummary | null>(null);
const loading = ref(true);
const exporting = ref(false);
const error = ref("");

async function load() {
  if (from.value && to.value && to.value < from.value) {
    error.value = "The end date must be on or after the start date.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    summary.value = await fetchReportSummary({
      from: from.value || undefined,
      to: to.value || undefined
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not load the report.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([from, to], load);

const cards = computed(() => {
  const t = summary.value?.totals;
  return [
    { label: "Reservations", value: t ? String(t.reservations) : "—" },
    {
      label: "Not cancelled",
      value: t ? String(t.reservations - t.cancelled) : "—"
    },
    { label: "Nights", value: t ? String(t.nights) : "—" },
    { label: "Value", value: t ? formatMoney(t.value) : "—" }
  ];
});

const byDestination = computed(() => {
  const rows = (summary.value?.byDestination ?? []).map(r => ({
    name: String(r.destination ?? "Unknown"),
    value: Number(r.value ?? 0)
  }));
  rows.sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map(r => r.value));
  return rows.map(r => ({ ...r, share: Math.round((r.value / max) * 100) }));
});

const bySource = computed(() =>
  (summary.value?.bySource ?? []).map(r => ({
    label: formatSource(String(r.source ?? "unknown")),
    count: r.reservations
  }))
);

const statusOrder = ["confirmed", "pending", "completed", "cancelled"];
const byStatus = computed(() =>
  [...(summary.value?.byStatus ?? [])]
    .sort(
      (a, b) =>
        statusOrder.indexOf(String(a.status)) -
        statusOrder.indexOf(String(b.status))
    )
    .map(r => ({ label: capitalise(String(r.status)), count: r.reservations }))
);

async function exportCsv() {
  exporting.value = true;
  try {
    await exportReportCsv({
      from: from.value || undefined,
      to: to.value || undefined
    });
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
.reports-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.reports-head__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.reports-head__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.2vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.reports-head__sub {
  margin: 0.3rem 0 0;
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.reports-head__filters {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.reports-head__filters .gy-adm-input {
  width: 150px;
}

.reports-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.reports-stat {
  padding: 1.1rem 1.2rem;
}

.reports-stat__value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gy-gold-deep);
}

.reports-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.reports-bar {
  display: grid;
  grid-template-columns: minmax(90px, 0.8fr) minmax(0, 1.6fr) auto;
  gap: 0.9rem;
  align-items: center;
  margin-bottom: 0.65rem;
  font-size: 0.88rem;
}

.reports-bar__track {
  display: block;
  height: 12px;
  background: #ece8de;
}

.reports-bar__fill {
  display: block;
  height: 100%;
  background: #4b5a4d;
}

.reports-line {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.88rem;
}

.reports-rule {
  margin: 0.8rem 0 0.9rem;
  border: 0;
  border-top: 1px solid rgba(18, 17, 16, 0.1);
}

.reports-note {
  font-size: 0.8rem;
  color: var(--gy-muted);
}

@media (max-width: 900px) {
  .reports-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
