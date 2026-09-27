<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Operations"
      title="Enquiries"
      :subtitle="`${filtered.length} enquiries shown`"
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          label="Export Excel"
          @click="exportAll"
        />
      </template>
      <template #toolbar>
        <q-select
          v-model="statusFilter"
          :options="statusFilterOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          style="min-width: 160px; background: #fff"
          label="Status"
          popup-content-class="admin-filter-menu"
        />
        <q-input
          :model-value="query"
          dense
          outlined
          clearable
          label="Search"
          style="min-width: 200px; background: #fff"
          @update:model-value="onQueryUpdate"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal="{ delay: '120ms' }" class="admin-scroll"
      ><q-markup-table flat bordered class="bg-white">
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
              <q-select
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
      </q-markup-table></div
    >
  </q-page>
</template>

<script setup lang="ts">
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
