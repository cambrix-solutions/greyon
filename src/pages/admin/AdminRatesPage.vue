<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Operations"
      title="Rates & availability"
      :subtitle="`${filteredPlans.length} of ${cms.ratePlans.length} rate plans`"
    >
      <template #actions>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add rate plan"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="planQuery"
          dense
          outlined
          clearable
          label="Search plans / rooms"
          style="min-width: 220px; background: #fff"
        />
        <q-select
          v-model="planStatusFilter"
          :options="planStatusOptions"
          dense
          outlined
          style="min-width: 140px; background: #fff"
          label="Status"
        />
        <q-select
          v-model="planRoomFilter"
          :options="planRoomFilterOptions"
          dense
          outlined
          emit-value
          map-options
          clearable
          label="Room type"
          style="min-width: 200px; background: #fff"
        />
        <q-select
          v-model="planPageSize"
          :options="planPageSizeOptions"
          dense
          outlined
          emit-value
          map-options
          label="Per page"
          style="min-width: 110px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <q-banner v-reveal="{ delay: '100ms' }" class="bg-grey-2 q-mb-md" rounded>
      Base rate plans below. Hotel check-in / check-out
      <strong>times</strong> come from each hotel (edit under Hotels).
      <template v-if="auth.isDeveloper">
        Inventory is per night — use List or Calendar below to set units,
        stop-sell, and prices.
      </template>
    </q-banner>

    <div v-reveal="{ delay: '140ms' }" class="admin-scroll">
      <q-markup-table flat bordered class="bg-white">
        <thead>
          <tr>
            <th class="text-left">Rate plan</th>
            <th class="text-left">Room type</th>
            <th class="text-right">Base price</th>
            <th class="text-left">Tax / fee</th>
            <th class="text-left">Status</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in pagedPlans" :key="plan.id">
            <td>{{ plan.name }}</td>
            <td>{{ roomName(plan.roomTypeId) }}</td>
            <td class="text-right">${{ plan.basePrice }}</td>
            <td>{{ plan.taxPercent }}% + {{ plan.serviceFeePercent }}%</td>
            <td>{{ plan.status }}</td>
            <td>
              <q-btn
                flat
                dense
                color="primary"
                label="Edit"
                @click="openEdit(plan)"
              />
              <q-btn
                v-if="auth.isDeveloper"
                flat
                dense
                color="primary"
                label="Inventory"
                @click="jumpToInventory(plan.roomTypeId)"
              />
              <q-btn
                flat
                dense
                color="negative"
                label="Delete"
                @click="remove(plan.id)"
              />
            </td>
          </tr>
          <tr v-if="!filteredPlans.length">
            <td colspan="6" class="text-grey">
              No rate plans match.
              <q-btn
                flat
                dense
                color="primary"
                label="Add rate plan"
                @click="openCreate"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <div v-if="filteredPlans.length" class="rates-pager">
        <p class="rates-pager__meta">
          Showing {{ planRangeStart }}–{{ planRangeEnd }} of
          {{ filteredPlans.length }}
        </p>
        <q-pagination
          v-model="planPage"
          :max="planPageCount"
          :max-pages="7"
          direction-links
          boundary-links
          color="primary"
          size="sm"
          :disable="planPageCount <= 1"
        />
      </div>
    </div>

    <template v-if="auth.isDeveloper">
      <div
        id="inventory-section"
        class="row items-center justify-between q-mb-md q-mt-lg"
      >
        <h2 class="text-h6 q-ma-none">Inventory & rates</h2>
        <q-btn-toggle
          v-model="inventoryView"
          toggle-color="primary"
          unelevated
          dense
          :options="[
            { label: 'List', value: 'list', icon: 'view_list' },
            { label: 'Calendar', value: 'calendar', icon: 'calendar_month' }
          ]"
        />
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedRoomId"
            :options="roomOptions"
            label="Room type"
            outlined
            dense
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="selectedPlanId"
            :options="planOptionsForRoom"
            label="Rate plan (for prices)"
            outlined
            dense
            emit-value
            map-options
            clearable
          />
        </div>
        <div v-if="inventoryView === 'list'" class="col-12 col-md-3">
          <q-input
            v-model="calendarStart"
            type="date"
            label="Start date"
            outlined
            dense
          />
        </div>
      </div>

      <q-banner v-if="roomHotelTimes" dense rounded class="bg-blue-1 q-mb-md">
        Selected room hotel times: check-in
        <strong>{{ roomHotelTimes.checkIn }}</strong>
        · check-out
        <strong>{{ roomHotelTimes.checkOut }}</strong>
      </q-banner>

      <div
        v-if="inventoryView === 'list'"
        v-reveal="{ delay: '160ms' }"
        class="admin-scroll"
      >
        <q-markup-table flat bordered>
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Units</th>
              <th class="text-left">Stop-sell</th>
              <th class="text-left">Booked</th>
              <th class="text-left">Free</th>
              <th class="text-left">Night price</th>
              <th class="text-left">Min / max stay</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in listDays" :key="day">
              <td>
                <div>{{ formatDate(day) }}</div>
                <div class="text-caption text-grey-7">{{ day }}</div>
              </td>
              <td>
                <q-input
                  dense
                  outlined
                  type="number"
                  style="max-width: 90px"
                  :model-value="unitsValue(day)"
                  @update:model-value="v => setUnits(day, Number(v))"
                />
              </td>
              <td>
                <q-toggle
                  :model-value="stopSellValue(day)"
                  @update:model-value="(v: boolean) => setStopSell(day, v)"
                />
              </td>
              <td>{{ cms.bookedOnNight(selectedRoomId, day) }}</td>
              <td>{{ freeUnits(day) }}</td>
              <td>
                <q-input
                  dense
                  outlined
                  type="number"
                  style="max-width: 110px"
                  :disable="!selectedPlanId"
                  :model-value="priceValue(day)"
                  @update:model-value="v => setPrice(day, Number(v))"
                />
              </td>
              <td>
                <div class="row q-gutter-xs items-center">
                  <q-input
                    dense
                    outlined
                    type="number"
                    style="max-width: 70px"
                    :disable="!selectedPlanId"
                    :model-value="minStayValue(day)"
                    label="min"
                    @update:model-value="v => setMinStay(day, v)"
                  />
                  <q-input
                    dense
                    outlined
                    type="number"
                    style="max-width: 70px"
                    :disable="!selectedPlanId"
                    :model-value="maxStayValue(day)"
                    label="max"
                    @update:model-value="v => setMaxStay(day, v)"
                  />
                </div>
              </td>
              <td>
                <q-btn
                  flat
                  dense
                  color="grey-8"
                  label="Clear day"
                  @click="clearDay(day)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <div v-else v-reveal="{ delay: '160ms' }" class="cal">
        <div class="cal__toolbar">
          <q-btn flat dense round icon="chevron_left" @click="shiftMonth(-1)" />
          <div class="cal__month">{{ monthLabel }}</div>
          <q-btn flat dense round icon="chevron_right" @click="shiftMonth(1)" />
          <q-space />
          <q-btn flat dense label="Today" @click="goToday" />
        </div>

        <div class="cal__weekdays">
          <span v-for="wd in weekdays" :key="wd">{{ wd }}</span>
        </div>

        <div class="cal__grid">
          <button
            v-for="(cell, idx) in monthCells"
            :key="`${cell.date}-${idx}`"
            type="button"
            class="cal__cell"
            :class="{
              'cal__cell--outside': !cell.inMonth,
              'cal__cell--today': cell.date === today,
              'cal__cell--stop': cell.inMonth && stopSellValue(cell.date),
              'cal__cell--low':
                cell.inMonth &&
                !stopSellValue(cell.date) &&
                freeUnits(cell.date) <= 1
            }"
            :disabled="!cell.inMonth || !selectedRoomId"
            @click="openDayEditor(cell.date)"
          >
            <span class="cal__day">{{ cell.day }}</span>
            <template v-if="cell.inMonth && selectedRoomId">
              <span class="cal__meta">
                {{
                  stopSellValue(cell.date)
                    ? "Stop"
                    : `${freeUnits(cell.date)} free`
                }}
              </span>
              <span v-if="selectedPlanId" class="cal__price">
                ${{ priceValue(cell.date) }}
              </span>
            </template>
          </button>
        </div>

        <p class="text-caption text-grey-7 q-mt-sm">
          Click a day to edit units, stop-sell, price, and stay rules.
        </p>
      </div>
    </template>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="sell"
      eyebrow="Operations"
      :title="editing ? 'Edit rate plan' : 'Add rate plan'"
      subtitle="Base pricing and policies for one room type."
    >
      <AdminFormSection title="Plan" :columns="2">
        <q-select
          v-model="form.roomTypeId"
          :options="roomOptions"
          label="Room type"
          outlined
          dense
          emit-value
          map-options
          class="admin-form-span-2"
        />
        <q-input v-model="form.name" label="Plan name" outlined dense />
        <q-input
          v-model="form.mealBenefit"
          label="Meal / benefit"
          outlined
          dense
        />
        <q-input
          v-model="form.description"
          label="Description"
          outlined
          dense
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Pricing"
        hint="Nightly base price plus tax and service fee percentages."
        :columns="3"
      >
        <q-input
          v-model.number="form.basePrice"
          type="number"
          label="Base price"
          outlined
          dense
          prefix="$"
        />
        <q-input
          v-model.number="form.taxPercent"
          type="number"
          label="Tax %"
          outlined
          dense
        />
        <q-input
          v-model.number="form.serviceFeePercent"
          type="number"
          label="Service fee %"
          outlined
          dense
        />
      </AdminFormSection>
      <AdminFormSection title="Policy & status">
        <q-input
          v-model="form.cancellationPolicy"
          label="Cancellation policy"
          type="textarea"
          outlined
          autogrow
        />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
          style="max-width: 220px"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create plan'"
          @click="save"
        />
      </template>
    </AdminDialog>

    <template v-if="auth.isDeveloper">
      <AdminDialog
        v-model="dayDialog"
        size="md"
        icon="event"
        :persistent="false"
        eyebrow="Inventory"
        :title="editingDay ? `Edit ${formatDate(editingDay)}` : 'Edit day'"
        :subtitle="dayDialogSubtitle"
      >
        <template v-if="editingDay">
          <AdminFormSection
            title="Availability"
            hint="Units available for this night after stop-sell and bookings."
            :columns="2"
          >
            <q-input
              v-model.number="dayForm.units"
              type="number"
              label="Available units"
              outlined
              dense
            />
            <div class="day-toggle">
              <q-toggle
                v-model="dayForm.stopSell"
                label="Stop-sell this night"
              />
            </div>
            <p class="day-preview admin-form-span-2">
              Booked: {{ cms.bookedOnNight(selectedRoomId, editingDay) }} · Free
              preview:
              {{
                dayForm.stopSell
                  ? 0
                  : Math.max(
                      0,
                      Number(dayForm.units) -
                        cms.bookedOnNight(selectedRoomId, editingDay)
                    )
              }}
            </p>
          </AdminFormSection>
          <AdminFormSection title="Price & stay rules" :columns="3">
            <q-input
              v-model.number="dayForm.price"
              type="number"
              label="Night price"
              outlined
              dense
              prefix="$"
              :disable="!selectedPlanId"
              :hint="selectedPlanId ? undefined : 'Select a rate plan first'"
            />
            <q-input
              v-model.number="dayForm.minStay"
              type="number"
              label="Min stay"
              outlined
              dense
              :disable="!selectedPlanId"
              clearable
            />
            <q-input
              v-model.number="dayForm.maxStay"
              type="number"
              label="Max stay"
              outlined
              dense
              :disable="!selectedPlanId"
              clearable
            />
          </AdminFormSection>
        </template>
        <template #actions>
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Clear day"
            @click="clearEditingDay"
          />
          <q-space />
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            unelevated
            no-caps
            label="Save day"
            @click="saveDayEditor"
          />
        </template>
      </AdminDialog>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus, RatePlan } from "@/types/greyon";
import {
  formatDate,
  hotelCheckInTime,
  hotelCheckOutTime
} from "@/utils/datetime";

type InventoryView = "list" | "calendar";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const dialog = ref(false);
const editing = ref<string | null>(null);
const inventoryView = ref<InventoryView>("list");

const selectedRoomId = ref(auth.scopedRoomTypes[0]?.id ?? "");
const selectedPlanId = ref("");
const calendarStart = ref(new Date().toISOString().slice(0, 10));
const monthCursor = ref(monthStart(new Date()));
const planQuery = ref("");
const planStatusFilter = ref("all");
const planRoomFilter = ref<string | null>(null);
const planStatusOptions = ["all", ...cms.statusOptions];
const planPage = ref(1);
const planPageSize = ref(10);
const planPageSizeOptions = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 }
];

onMounted(async () => {
  await Promise.all([
    cms.ensureHotels(),
    cms.ensureRoomTypes(),
    cms.ensureRatePlans(),
    cms.ensureAvailability().catch(() => undefined),
    cms.ensureRateCalendars().catch(() => undefined)
  ]);
  const roomId = String(route.query.roomId || "");
  if (auth.scopedRoomTypes.some(r => r.id === roomId)) {
    selectedRoomId.value = roomId;
    planRoomFilter.value = roomId;
  } else if (
    selectedRoomId.value &&
    !auth.canAccessHotel(
      cms.getRoomTypeById(selectedRoomId.value)?.hotelId ?? ""
    )
  ) {
    selectedRoomId.value = auth.scopedRoomTypes[0]?.id ?? "";
  }
  if (route.query.view === "calendar") {
    inventoryView.value = "calendar";
  }
});

function jumpToInventory(roomTypeId: string) {
  selectedRoomId.value = roomTypeId;
  inventoryView.value = "calendar";
  document.getElementById("inventory-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

const dayDialog = ref(false);
const editingDay = ref<string | null>(null);
const dayForm = reactive({
  units: 0,
  stopSell: false,
  price: 0 as number | null,
  minStay: null as number | null,
  maxStay: null as number | null
});

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date().toISOString().slice(0, 10);

const form = reactive({
  roomTypeId: "",
  name: "",
  description: "",
  mealBenefit: "Breakfast included",
  cancellationPolicy: "Free cancellation up to 48 hours before arrival.",
  basePrice: 100,
  taxPercent: 10,
  serviceFeePercent: 5,
  status: "draft" as ContentStatus
});

const roomOptions = computed(() =>
  auth.scopedRoomTypes.map(r => ({
    label: `${r.name} (${cms.getHotelById(r.hotelId)?.name ?? ""})`,
    value: r.id
  }))
);

const planRoomFilterOptions = computed(() => roomOptions.value);

const filteredPlans = computed(() => {
  const q = planQuery.value.trim().toLowerCase();
  const allowed = new Set(auth.scopedRatePlans.map(p => p.id));
  return cms.ratePlans.filter(plan => {
    if (!allowed.has(plan.id)) return false;
    if (
      planStatusFilter.value !== "all" &&
      plan.status !== planStatusFilter.value
    ) {
      return false;
    }
    if (planRoomFilter.value && plan.roomTypeId !== planRoomFilter.value) {
      return false;
    }
    if (!q) return true;
    const room = roomName(plan.roomTypeId);
    return `${plan.name} ${room} ${plan.description ?? ""}`
      .toLowerCase()
      .includes(q);
  });
});

const planPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredPlans.value.length / planPageSize.value))
);

const pagedPlans = computed(() => {
  const start = (planPage.value - 1) * planPageSize.value;
  return filteredPlans.value.slice(start, start + planPageSize.value);
});

const planRangeStart = computed(() =>
  filteredPlans.value.length ? (planPage.value - 1) * planPageSize.value + 1 : 0
);

const planRangeEnd = computed(() =>
  Math.min(planPage.value * planPageSize.value, filteredPlans.value.length)
);

watch([planQuery, planStatusFilter, planRoomFilter, planPageSize], () => {
  planPage.value = 1;
});

watch(planPageCount, count => {
  if (planPage.value > count) planPage.value = count;
});

const planOptionsForRoom = computed(() =>
  cms.ratePlans
    .filter(p => p.roomTypeId === selectedRoomId.value)
    .map(p => ({ label: p.name, value: p.id }))
);

const roomHotelTimes = computed(() => {
  const room = cms.getRoomTypeById(selectedRoomId.value);
  const hotel = room ? cms.getHotelById(room.hotelId) : null;
  if (!hotel) return null;
  return {
    checkIn: hotelCheckInTime(hotel.checkInTime),
    checkOut: hotelCheckOutTime(hotel.checkOutTime)
  };
});

const dayDialogSubtitle = computed(() => {
  if (!editingDay.value) return "";
  const times = roomHotelTimes.value
    ? ` · in ${roomHotelTimes.value.checkIn} / out ${roomHotelTimes.value.checkOut}`
    : "";
  return `${editingDay.value}${times}`;
});

const listDays = computed(() =>
  selectedRoomId.value ? cms.getCalendarDays(calendarStart.value, 14) : []
);

const monthLabel = computed(() => {
  const d = parseYmd(monthCursor.value);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
});

const monthCells = computed(() => {
  const start = parseYmd(monthCursor.value);
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];

  // Leading days from previous month
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDow - 1; i >= 0; i--) {
    const day = prevDays - i;
    const date = toYmd(new Date(year, month - 1, day));
    cells.push({ date, day, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: toYmd(new Date(year, month, day)),
      day,
      inMonth: true
    });
  }

  // Trailing to fill 6 weeks (42 cells) for stable layout
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({
      date: toYmd(new Date(year, month + 1, nextDay)),
      day: nextDay,
      inMonth: false
    });
    nextDay += 1;
    if (cells.length >= 42) break;
  }

  return cells;
});

watch(
  [selectedRoomId, planOptionsForRoom],
  () => {
    if (
      !selectedPlanId.value ||
      !planOptionsForRoom.value.some(p => p.value === selectedPlanId.value)
    ) {
      selectedPlanId.value = planOptionsForRoom.value[0]?.value ?? "";
    }
  },
  { immediate: true }
);

function parseYmd(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthStart(date: Date) {
  return toYmd(new Date(date.getFullYear(), date.getMonth(), 1));
}

function shiftMonth(delta: number) {
  const d = parseYmd(monthCursor.value);
  monthCursor.value = monthStart(
    new Date(d.getFullYear(), d.getMonth() + delta, 1)
  );
}

function goToday() {
  monthCursor.value = monthStart(new Date());
}

function roomName(id: string) {
  return cms.getRoomTypeById(id)?.name ?? id;
}

function roomBase() {
  return cms.getRoomTypeById(selectedRoomId.value)?.baseInventory ?? 0;
}

function unitsValue(date: string) {
  return (
    cms.getAvailability(selectedRoomId.value, date)?.availableUnits ??
    roomBase()
  );
}

function stopSellValue(date: string) {
  return Boolean(cms.getAvailability(selectedRoomId.value, date)?.stopSell);
}

function freeUnits(date: string) {
  return Math.max(
    0,
    cms.unitsForNight(selectedRoomId.value, date, roomBase()) -
      cms.bookedOnNight(selectedRoomId.value, date)
  );
}

function priceValue(date: string) {
  if (!selectedPlanId.value) return "";
  const plan = cms.getRatePlanById(selectedPlanId.value);
  return (
    cms.getRateForDate(selectedPlanId.value, date)?.price ??
    plan?.basePrice ??
    0
  );
}

function minStayValue(date: string) {
  return cms.getRateForDate(selectedPlanId.value, date)?.minStay ?? "";
}

function maxStayValue(date: string) {
  return cms.getRateForDate(selectedPlanId.value, date)?.maxStay ?? "";
}

function setUnits(date: string, availableUnits: number) {
  if (!selectedRoomId.value || Number.isNaN(availableUnits)) return;
  cms.upsertAvailability({
    roomTypeId: selectedRoomId.value,
    date,
    availableUnits,
    stopSell: stopSellValue(date)
  });
}

function setStopSell(date: string, stopSell: boolean) {
  if (!selectedRoomId.value) return;
  cms.upsertAvailability({
    roomTypeId: selectedRoomId.value,
    date,
    availableUnits: unitsValue(date),
    stopSell
  });
}

function setPrice(date: string, price: number) {
  if (!selectedPlanId.value || Number.isNaN(price)) return;
  const existing = cms.getRateForDate(selectedPlanId.value, date);
  cms.upsertRateCalendar({
    ratePlanId: selectedPlanId.value,
    date,
    price,
    ...(existing?.minStay !== undefined ? { minStay: existing.minStay } : {}),
    ...(existing?.maxStay !== undefined ? { maxStay: existing.maxStay } : {})
  });
}

function setMinStay(date: string, value: string | number | null) {
  if (!selectedPlanId.value) return;
  const n = value === "" || value === null ? undefined : Number(value);
  cms.upsertRateCalendar({
    ratePlanId: selectedPlanId.value,
    date,
    price: Number(priceValue(date)),
    ...(n !== undefined && !Number.isNaN(n) ? { minStay: n } : {}),
    ...(maxStayValue(date) !== ""
      ? { maxStay: Number(maxStayValue(date)) }
      : {})
  });
}

function setMaxStay(date: string, value: string | number | null) {
  if (!selectedPlanId.value) return;
  const n = value === "" || value === null ? undefined : Number(value);
  cms.upsertRateCalendar({
    ratePlanId: selectedPlanId.value,
    date,
    price: Number(priceValue(date)),
    ...(minStayValue(date) !== ""
      ? { minStay: Number(minStayValue(date)) }
      : {}),
    ...(n !== undefined && !Number.isNaN(n) ? { maxStay: n } : {})
  });
}

function clearDay(date: string) {
  if (selectedRoomId.value) cms.clearAvailability(selectedRoomId.value, date);
  if (selectedPlanId.value) cms.clearRateCalendar(selectedPlanId.value, date);
  $q.notify({ type: "info", message: `Cleared overrides for ${date}` });
}

function openDayEditor(date: string) {
  editingDay.value = date;
  dayForm.units = unitsValue(date);
  dayForm.stopSell = stopSellValue(date);
  dayForm.price = selectedPlanId.value ? Number(priceValue(date)) : null;
  const min = minStayValue(date);
  const max = maxStayValue(date);
  dayForm.minStay = min === "" ? null : Number(min);
  dayForm.maxStay = max === "" ? null : Number(max);
  dayDialog.value = true;
}

function saveDayEditor() {
  if (!editingDay.value || !selectedRoomId.value) return;
  const date = editingDay.value;
  cms.upsertAvailability({
    roomTypeId: selectedRoomId.value,
    date,
    availableUnits: Number(dayForm.units),
    stopSell: dayForm.stopSell
  });
  if (
    selectedPlanId.value &&
    dayForm.price !== null &&
    !Number.isNaN(Number(dayForm.price))
  ) {
    cms.upsertRateCalendar({
      ratePlanId: selectedPlanId.value,
      date,
      price: Number(dayForm.price),
      ...(dayForm.minStay !== null && !Number.isNaN(Number(dayForm.minStay))
        ? { minStay: Number(dayForm.minStay) }
        : {}),
      ...(dayForm.maxStay !== null && !Number.isNaN(Number(dayForm.maxStay))
        ? { maxStay: Number(dayForm.maxStay) }
        : {})
    });
  }
  dayDialog.value = false;
  $q.notify({ type: "positive", message: `Saved ${date}` });
}

function clearEditingDay() {
  if (!editingDay.value) return;
  clearDay(editingDay.value);
  dayDialog.value = false;
}

function openCreate() {
  editing.value = null;
  form.roomTypeId = cms.roomTypes[0]?.id ?? "";
  form.name = "Flexible Rate";
  form.description = "";
  form.mealBenefit = "Breakfast included";
  form.cancellationPolicy = "Free cancellation up to 48 hours before arrival.";
  form.basePrice = 100;
  form.taxPercent = 10;
  form.serviceFeePercent = 5;
  form.status = "draft";
  dialog.value = true;
}

function openEdit(plan: RatePlan) {
  editing.value = plan.id;
  Object.assign(form, plan);
  dialog.value = true;
}

function save() {
  if (!form.name || !form.roomTypeId) {
    $q.notify({
      type: "negative",
      message: "Name and room type are required."
    });
    return;
  }
  void (async () => {
    try {
      await cms.upsertRate({
        ...(editing.value ? { id: editing.value } : {}),
        ...form
      });
      dialog.value = false;
      $q.notify({ type: "positive", message: "Rate plan saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

function remove(id: string) {
  $q.dialog({
    title: "Delete rate plan?",
    cancel: true,
    persistent: true
  }).onOk(() => {
    void cms
      .deleteRate(id)
      .then(() => $q.notify({ type: "positive", message: "Rate deleted." }))
      .catch(e =>
        $q.notify({
          type: "negative",
          message: e instanceof Error ? e.message : "Delete failed."
        })
      );
  });
}
</script>

<style scoped>
.cal {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.cal__toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.cal__month {
  font-weight: 600;
  min-width: 10rem;
  text-align: center;
}

.cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.cal__weekdays span {
  padding: 0.45rem 0.25rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal__cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  min-height: 88px;
  padding: 0.45rem 0.5rem;
  border: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    background 0.2s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.cal__cell:nth-child(7n) {
  border-right: 0;
}

.cal__cell:hover:not(:disabled) {
  background: #f8f4ec;
  transform: translateY(-1px);
  box-shadow: inset 0 0 0 1px rgba(154, 123, 60, 0.22);
}

.cal__cell--outside {
  background: #fafafa;
  color: rgba(0, 0, 0, 0.28);
  cursor: default;
}

.cal__cell--today .cal__day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--q-primary);
  color: #fff;
}

.cal__cell--stop {
  background: #fff5f5;
}

.cal__cell--low:not(.cal__cell--stop) {
  background: #fffaf0;
}

.cal__day {
  font-weight: 600;
  font-size: 0.9rem;
}

.cal__meta,
.cal__price {
  font-size: 0.72rem;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.65);
}

.cal__price {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}

@media (max-width: 700px) {
  .cal {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .cal__weekdays,
  .cal__grid {
    min-width: 560px;
  }

  .cal__cell {
    min-height: 68px;
    padding: 0.3rem;
  }

  .cal__meta,
  .cal__price {
    font-size: 0.62rem;
  }

  .cal__weekdays span {
    font-size: 0.65rem;
    padding: 0.35rem 0.1rem;
  }
}

.day-toggle {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0.35rem 0.65rem;
  background: #faf9f7;
  border-radius: 12px;
  border: 1px solid rgba(28, 36, 33, 0.06);
}

.day-preview {
  margin: 0;
  font-size: 0.84rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.rates-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin: 0.85rem 0 1.75rem;
  padding: 0.65rem 0.85rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 12px;
}

.rates-pager__meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}
</style>
