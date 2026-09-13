<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Operations"
      title="Enquiries"
      :subtitle="`${filtered.length} enquiries shown`"
    >
      <template #actions>
        <q-btn outline no-caps color="primary" label="Export JSON" @click="exportAll" />
      </template>
      <template #toolbar>
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          dense
          outlined
          style="min-width: 160px; background: #fff"
          label="Status"
        />
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          label="Search"
          style="min-width: 200px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal="{ delay: '120ms' }" class="admin-scroll"><q-markup-table flat bordered class="bg-white">
      <thead>
        <tr>
          <th class="text-left">When</th>
          <th class="text-left">Name</th>
          <th class="text-left">Subject</th>
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
            <div>{{ item.subject }}</div>
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
              @update:model-value="(v) => setNotes(item.id, String(v ?? ''))"
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
            <q-btn flat dense color="negative" label="Delete" @click="remove(item.id)" />
          </td>
        </tr>
        <tr v-if="!filtered.length">
          <td colspan="7" class="text-grey">
            No enquiries match. Submit one from /contact.
          </td>
        </tr>
      </tbody>
    </q-markup-table></div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
const statusFilter = ref("all");
const statusOptions = ["all", ...cms.enquiryStatusOptions];
let syncingFromRoute = false;

function applyRouteQuery() {
  const status = String(route.query.status || "");
  syncingFromRoute = true;
  if (status && cms.enquiryStatusOptions.includes(status as EnquiryStatus)) {
    statusFilter.value = status;
  } else if (!status) {
    statusFilter.value = "all";
  }
  syncingFromRoute = false;
}

onMounted(applyRouteQuery);
watch(() => route.query.status, applyRouteQuery);
watch(statusFilter, value => {
  if (syncingFromRoute) return;
  const next = { ...route.query } as Record<string, string | string[] | undefined>;
  if (value === "all") {
    delete next.status;
  } else {
    next.status = value;
  }
  void router.replace({ query: next });
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return auth.scopedEnquiries.filter(item => {
    if (statusFilter.value !== "all" && item.status !== statusFilter.value) {
      return false;
    }
    if (!q) return true;
    return `${item.name} ${item.subject} ${item.email} ${item.message} ${item.phone}`
      .toLowerCase()
      .includes(q);
  });
});

function setStatus(id: string, status: string) {
  cms.updateEnquiry(id, { status: status as EnquiryStatus });
  $q.notify({
    type: "positive",
    message: `Enquiry → ${status.replaceAll("_", " ")}`
  });
}

function setNotes(id: string, internalNotes: string) {
  cms.updateEnquiry(id, { internalNotes });
}

function remove(id: string) {
  $q.dialog({ title: "Delete enquiry?", cancel: true, persistent: true }).onOk(() => {
    cms.deleteEnquiry(id);
    $q.notify({ type: "positive", message: "Enquiry deleted." });
  });
}

function exportAll() {
  const blob = new Blob([JSON.stringify(filtered.value, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "greyon-enquiries.json";
  a.click();
  URL.revokeObjectURL(url);
}
</script>
