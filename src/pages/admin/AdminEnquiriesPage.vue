<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Operations"
      title="Enquiries"
      :subtitle="`${filtered.length} ${filtered.length === 1 ? 'enquiry' : 'enquiries'} shown`"
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          label="Export Excel"
          class="enquiries-export"
          @click="exportAll"
        />
      </template>
      <template #toolbar>
        <GySelect
          v-model="statusFilter"
          :options="statusFilterOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          class="enquiries-filter"
          label="Status"
        />
        <q-input
          :model-value="query"
          dense
          outlined
          clearable
          label="Search"
          class="enquiries-search"
          @update:model-value="onQueryUpdate"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal class="admin-data">
      <div class="admin-data__table">
        <q-markup-table flat bordered class="bg-white">
          <thead>
            <tr>
              <th class="text-left">When</th>
              <th class="text-left">Name</th>
              <th class="text-left">Destination</th>
              <th class="text-left">Contact</th>
              <th class="text-left">Status</th>
              <th class="text-left">Notes</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.id">
              <td>{{ formatDateTime(item.createdAt) }}</td>
              <td>{{ item.name }}</td>
              <td>
                <div>{{ item.locationName || item.subject }}</div>
                <div class="text-caption text-grey-7">{{ item.message }}</div>
              </td>
              <td>
                <div>{{ item.email }}</div>
                <div class="text-caption">{{ item.phone }}</div>
              </td>
              <td>
                <GySelect
                  dense
                  outlined
                  :model-value="item.status"
                  :options="cms.enquiryStatusOptions"
                  style="min-width: 140px"
                  @update:model-value="(v: string) => setStatus(item.id, v)"
                />
              </td>
              <td style="min-width: 180px">
                <q-input
                  dense
                  outlined
                  :model-value="item.internalNotes || ''"
                  placeholder="Internal notes"
                  @update:model-value="v => setNotes(item.id, String(v ?? ''))"
                />
              </td>
              <td>
                <q-btn
                  flat
                  dense
                  color="primary"
                  icon="mail"
                  :href="`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`"
                />
                <q-btn
                  v-if="item.status === 'new'"
                  flat
                  dense
                  color="primary"
                  label="Start"
                  @click="setStatus(item.id, 'in_progress')"
                />
                <q-btn
                  v-if="item.status !== 'closed'"
                  flat
                  dense
                  color="positive"
                  label="Close"
                  @click="setStatus(item.id, 'closed')"
                />
                <q-btn
                  v-if="auth.canAction('enquiries', 'delete')"
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  @click="remove(item.id)"
                />
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="7" class="text-grey">
                No enquiries match. Submit one from /contact.
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <div class="admin-data__cards" aria-label="Enquiries">
        <article
          v-for="item in filtered"
          :key="`card-${item.id}`"
          class="admin-data-card"
        >
          <div class="admin-data-card__head">
            <div>
              <h3 class="admin-data-card__title">{{ item.name }}</h3>
              <p class="admin-data-card__sub">{{
                formatDateTime(item.createdAt)
              }}</p>
            </div>
          </div>
          <dl class="admin-data-card__rows">
            <div class="admin-data-card__row">
              <dt>Destination</dt>
              <dd>
                <div>{{ item.locationName || item.subject }}</div>
                <div class="text-caption text-grey-7">{{ item.message }}</div>
              </dd>
            </div>
            <div class="admin-data-card__row">
              <dt>Contact</dt>
              <dd>
                <div>{{ item.email }}</div>
                <div class="text-caption">{{ item.phone }}</div>
              </dd>
            </div>
            <div class="admin-data-card__row">
              <dt>Status</dt>
              <dd>
                <GySelect
                  dense
                  outlined
                  :model-value="item.status"
                  :options="cms.enquiryStatusOptions"
                  @update:model-value="(v: string) => setStatus(item.id, v)"
                />
              </dd>
            </div>
            <div class="admin-data-card__row">
              <dt>Notes</dt>
              <dd>
                <q-input
                  dense
                  outlined
                  :model-value="item.internalNotes || ''"
                  placeholder="Internal notes"
                  @update:model-value="v => setNotes(item.id, String(v ?? ''))"
                />
              </dd>
            </div>
          </dl>
          <div class="admin-data-card__actions">
            <q-btn
              flat
              dense
              color="primary"
              icon="mail"
              :href="`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`"
            />
            <q-btn
              v-if="item.status === 'new'"
              flat
              dense
              color="primary"
              label="Start"
              @click="setStatus(item.id, 'in_progress')"
            />
            <q-btn
              v-if="item.status !== 'closed'"
              flat
              dense
              color="positive"
              label="Close"
              @click="setStatus(item.id, 'closed')"
            />
            <q-btn
              v-if="auth.canAction('enquiries', 'delete')"
              flat
              dense
              color="negative"
              label="Delete"
              @click="remove(item.id)"
            />
          </div>
        </article>
        <p v-if="!filtered.length" class="admin-data-card__empty">
          No enquiries match. Submit one from /contact.
        </p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import GySelect from "@/components/GySelect.vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { EnquiryStatus } from "@/types/greyon";
import { formatDateTime } from "@/utils/datetime";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const query = ref("");
const statusFilter = ref<"all" | EnquiryStatus>("all");
/** Static options — avoid depending on store identity at setup time. */
const statusFilterOptions: { label: string; value: "all" | EnquiryStatus }[] = [
  { label: "All statuses", value: "all" },
  { label: "new", value: "new" },
  { label: "in progress", value: "in_progress" },
  { label: "closed", value: "closed" }
];
let syncingFromRoute = false;

function onQueryUpdate(value: string | number | null) {
  // Quasar clearable emits null — keep a string so filtered/trim never crash.
  query.value = value == null ? "" : String(value);
}

function applyRouteQuery() {
  const status = String(route.query.status || "");
  syncingFromRoute = true;
  if (status && cms.enquiryStatusOptions.includes(status as EnquiryStatus)) {
    statusFilter.value = status as EnquiryStatus;
  } else if (!status) {
    statusFilter.value = "all";
  }
  query.value = String(route.query.q || "").trim();
  void nextTick(() => {
    syncingFromRoute = false;
  });
}

onMounted(async () => {
  await cms.ensureEnquiries();
  applyRouteQuery();
});
watch(() => [route.query.status, route.query.q] as const, applyRouteQuery);
watch([statusFilter, query], () => {
  if (syncingFromRoute) return;
  const next = { ...route.query } as Record<
    string,
    string | string[] | undefined
  >;
  if (statusFilter.value === "all") {
    delete next.status;
  } else {
    next.status = statusFilter.value;
  }
  const q = (query.value ?? "").trim();
  if (q) next.q = q;
  else delete next.q;
  void router.replace({ query: next });
});

const filtered = computed(() => {
  const q = (query.value ?? "").trim().toLowerCase();
  return auth.scopedEnquiries.filter(item => {
    if (statusFilter.value !== "all" && item.status !== statusFilter.value) {
      return false;
    }
    if (!q) return true;
    return `${item.name} ${item.subject} ${item.locationName ?? ""} ${item.email} ${item.message} ${item.phone}`
      .toLowerCase()
      .includes(q);
  });
});

async function setStatus(id: string, status: string) {
  await cms.updateEnquiry(id, { status: status as EnquiryStatus });
  $q.notify({
    type: "positive",
    message: `Enquiry → ${status.replaceAll("_", " ")}`
  });
}

async function setNotes(id: string, internalNotes: string) {
  await cms.updateEnquiry(id, { internalNotes });
}

function remove(id: string) {
  $q.dialog({ title: "Delete enquiry?", cancel: true, persistent: true }).onOk(
    async () => {
      await cms.deleteEnquiry(id);
      $q.notify({ type: "positive", message: "Enquiry deleted." });
    }
  );
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelCell(value: string | number | boolean | null | undefined) {
  const text = value == null ? "" : String(value);
  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
}

function exportAll() {
  const headers = [
    "When",
    "Name",
    "Destination",
    "Subject",
    "Message",
    "Email",
    "Phone",
    "Status",
    "Internal notes"
  ];
  const rows = filtered.value.map(item => [
    formatDateTime(item.createdAt),
    item.name,
    item.locationName || "",
    item.subject,
    item.message,
    item.email,
    item.phone,
    item.status,
    item.internalNotes || ""
  ]);
  const xmlRows = [
    `<Row>${headers.map(excelCell).join("")}</Row>`,
    ...rows.map(row => `<Row>${row.map(excelCell).join("")}</Row>`)
  ].join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Enquiries">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`;
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "greyon-enquiries.xls";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.enquiries-export {
  width: 100%;
}

.enquiries-filter,
.enquiries-search {
  flex: 1 1 140px;
  min-width: 0;
  max-width: 100%;
  background: #fff;
}

@media (min-width: 600px) {
  .enquiries-export {
    width: auto;
  }

  .enquiries-filter {
    flex: 0 1 160px;
  }

  .enquiries-search {
    flex: 1 1 200px;
    max-width: 280px;
  }
}
</style>
