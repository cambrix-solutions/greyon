import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import type {
  AvailabilityResult,
  Booking,
  BookingGuest,
  BookingSearchParams
} from "@/types/greyon";
import {
  createBooking,
  searchAvailability
} from "@/services/bookingService";
import {
  addLocalDays,
  nightsBetweenLocal,
  toLocalYmd
} from "@/utils/datetime";

function defaultCheckIn() {
  return addLocalDays(toLocalYmd(new Date()), 1);
}

function defaultCheckOut() {
  return addLocalDays(toLocalYmd(new Date()), 2);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const useBookingStore = defineStore("booking", () => {
  const step = ref(1);
  const search = ref<BookingSearchParams>({
    locationSlug: "",
    hotelSlug: "",
    checkIn: defaultCheckIn(),
    checkOut: defaultCheckOut(),
    rooms: 1,
    adults: 2,
    children: 0
  });
  const results = ref<AvailabilityResult[]>([]);
  const selected = ref<AvailabilityResult | null>(null);
  const guest = ref<BookingGuest>({
    fullName: "",
    email: "",
    phone: "",
    specialRequests: ""
  });
  const acceptedPolicy = ref(false);
  const confirmedBooking = ref<Booking | null>(null);
  const errorMessage = ref("");
  const submitting = ref(false);
  const guestAttempted = ref(false);

  const nights = computed(() => selected.value?.nights ?? 0);

  const searchError = computed(() => {
    const today = toLocalYmd(new Date());
    const { checkIn, checkOut, rooms, adults, children } = search.value;
    if (!checkIn || !checkOut) return "Choose check-in and check-out dates.";
    if (checkIn < today) return "Check-in cannot be in the past.";
    if (checkOut <= checkIn) return "Check-out must be after check-in.";
    if (nightsBetweenLocal(checkIn, checkOut) < 1) {
      return "Stay must include at least one night.";
    }
    if (!Number.isFinite(rooms) || rooms < 1) return "At least 1 room is required.";
    if (!Number.isFinite(adults) || adults < 1) return "At least 1 adult is required.";
    if (!Number.isFinite(children) || children < 0) {
      return "Children cannot be negative.";
    }
    return "";
  });

  const guestErrors = computed(() => {
    const errors: Partial<Record<"fullName" | "email" | "phone", string>> = {};
    if (!guest.value.fullName.trim()) errors.fullName = "Full name is required.";
    if (!guest.value.email.trim()) errors.email = "Email is required.";
    else if (!isEmail(guest.value.email)) errors.email = "Enter a valid email.";
    if (!guest.value.phone.trim()) errors.phone = "Phone is required.";
    return errors;
  });

  const guestValid = computed(() => Object.keys(guestErrors.value).length === 0);

  function setSearch(partial: Partial<BookingSearchParams>) {
    search.value = { ...search.value, ...partial };
  }

  async function runSearch() {
    errorMessage.value = "";
    if (searchError.value) {
      errorMessage.value = searchError.value;
      return false;
    }
    search.value.rooms = Math.max(1, Number(search.value.rooms) || 1);
    search.value.adults = Math.max(1, Number(search.value.adults) || 1);
    search.value.children = Math.max(0, Number(search.value.children) || 0);
    if (search.value.checkOut <= search.value.checkIn) {
      search.value.checkOut = addLocalDays(search.value.checkIn, 1);
    }
    try {
      results.value = (await searchAvailability(
        search.value
      )) as AvailabilityResult[];
    } catch (e) {
      errorMessage.value =
        e instanceof Error ? e.message : "Search failed. Try again.";
      results.value = [];
    }
    selected.value = null;
    confirmedBooking.value = null;
    step.value = 2;
    return true;
  }

  function selectResult(result: AvailabilityResult) {
    selected.value = result;
    step.value = 3;
  }

  function goToGuestDetails() {
    if (!selected.value) return;
    guestAttempted.value = false;
    step.value = 4;
  }

  function goToReview() {
    errorMessage.value = "";
    guestAttempted.value = true;
    if (!guestValid.value) {
      errorMessage.value = "Please complete guest contact details.";
      return false;
    }
    guest.value = {
      ...guest.value,
      fullName: guest.value.fullName.trim(),
      email: guest.value.email.trim(),
      phone: guest.value.phone.trim(),
      specialRequests: guest.value.specialRequests?.trim() || ""
    };
    step.value = 5;
    return true;
  }

  async function confirm() {
    if (!selected.value) return;
    if (!acceptedPolicy.value) {
      errorMessage.value = "Please accept the cancellation policy to continue.";
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    const result = await createBooking({
      hotelId: selected.value.hotel.id,
      roomTypeId: selected.value.roomType.id,
      ratePlanId: selected.value.ratePlan.id,
      checkIn: search.value.checkIn,
      checkOut: search.value.checkOut,
      rooms: search.value.rooms,
      adults: search.value.adults,
      children: search.value.children,
      guest: { ...guest.value }
    });
    submitting.value = false;
    if (!result.ok) {
      errorMessage.value = result.message;
      try {
        results.value = (await searchAvailability(
          search.value
        )) as AvailabilityResult[];
      } catch {
        results.value = [];
      }
      step.value = 2;
      return;
    }
    confirmedBooking.value = result.booking;
    step.value = 6;
  }

  function resetFlow() {
    step.value = 1;
    selected.value = null;
    confirmedBooking.value = null;
    acceptedPolicy.value = false;
    errorMessage.value = "";
    guestAttempted.value = false;
  }

  function startFromHotel(hotelSlug: string, locationSlug = "") {
    setSearch({ hotelSlug, locationSlug });
    step.value = 1;
  }

  return {
    step,
    search,
    results,
    selected,
    guest,
    acceptedPolicy,
    confirmedBooking,
    errorMessage,
    submitting,
    guestAttempted,
    searchError,
    guestErrors,
    guestValid,
    nights,
    setSearch,
    runSearch,
    selectResult,
    goToGuestDetails,
    goToReview,
    confirm,
    resetFlow,
    startFromHotel
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBookingStore, import.meta.hot));
}
