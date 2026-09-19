import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { setAuthRedirect } from "@/helpers/authRedirect";
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
import { useCustomerStore } from "@/stores/customer-store";
import {
  addLocalDays,
  nightsBetweenLocal,
  toLocalYmd
} from "@/utils/datetime";

const DRAFT_KEY = "greyon_booking_draft";

type BookingDraft = {
  step: number;
  search: BookingSearchParams;
  results: AvailabilityResult[];
  selected: AvailabilityResult | null;
  guest: BookingGuest;
  acceptedPolicy: boolean;
};

function defaultCheckIn() {
  return addLocalDays(toLocalYmd(new Date()), 1);
}

function defaultCheckOut() {
  return addLocalDays(toLocalYmd(new Date()), 2);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function emptyGuest(): BookingGuest {
  return {
    fullName: "",
    email: "",
    phone: "",
    specialRequests: ""
  };
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
  const guest = ref<BookingGuest>(emptyGuest());
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

  function persistDraft() {
    if (typeof sessionStorage === "undefined") return;
    // Don't keep a finished confirmation as the "resume" draft.
    if (step.value >= 6) {
      clearDraft();
      return;
    }
    if (step.value <= 1 && !selected.value && !results.value.length) {
      clearDraft();
      return;
    }
    const draft: BookingDraft = {
      step: step.value,
      search: { ...search.value },
      results: results.value,
      selected: selected.value,
      guest: { ...guest.value },
      acceptedPolicy: acceptedPolicy.value
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // quota / private mode — ignore
    }
  }

  function clearDraft() {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(DRAFT_KEY);
  }

  function restoreDraft(): boolean {
    if (typeof sessionStorage === "undefined") return false;
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    try {
      const draft = JSON.parse(raw) as BookingDraft;
      if (!draft || typeof draft.step !== "number") return false;
      search.value = { ...search.value, ...draft.search };
      results.value = Array.isArray(draft.results) ? draft.results : [];
      selected.value = draft.selected ?? null;
      guest.value = { ...emptyGuest(), ...draft.guest };
      acceptedPolicy.value = Boolean(draft.acceptedPolicy);
      confirmedBooking.value = null;
      guestAttempted.value = false;
      errorMessage.value = "";

      let nextStep = Math.min(Math.max(1, draft.step), 5);
      if (nextStep >= 3 && !selected.value) nextStep = results.value.length ? 2 : 1;
      if (nextStep >= 2 && !results.value.length && !selected.value) nextStep = 1;
      step.value = nextStep;
      applyCustomerToGuest();
      return true;
    } catch {
      clearDraft();
      return false;
    }
  }

  function applyCustomerToGuest() {
    const customer = useCustomerStore();
    customer.hydrate();
    if (!customer.isAuthenticated || !customer.user) return;
    guest.value = {
      ...guest.value,
      fullName: guest.value.fullName || customer.user.name || "",
      email: guest.value.email || customer.user.email || "",
      phone: guest.value.phone || customer.user.phone || ""
    };
  }

  function setSearch(partial: Partial<BookingSearchParams>) {
    search.value = { ...search.value, ...partial };
    persistDraft();
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
    persistDraft();
    return true;
  }

  function selectResult(result: AvailabilityResult) {
    selected.value = result;
    step.value = 3;
    persistDraft();
  }

  function goToGuestDetails() {
    if (!selected.value) return;
    guestAttempted.value = false;
    applyCustomerToGuest();
    step.value = 4;
    persistDraft();
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
    persistDraft();
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
      persistDraft();
      return;
    }
    confirmedBooking.value = result.booking;
    step.value = 6;
    clearDraft();
  }

  function resetFlow() {
    step.value = 1;
    selected.value = null;
    confirmedBooking.value = null;
    acceptedPolicy.value = false;
    errorMessage.value = "";
    guestAttempted.value = false;
    clearDraft();
  }

  function startFromHotel(hotelSlug: string, locationSlug = "") {
    setSearch({ hotelSlug, locationSlug });
    step.value = 1;
    persistDraft();
  }

  /** Call before leaving booking for sign-in so Google OAuth can resume. */
  function prepareAuthReturn() {
    persistDraft();
    setAuthRedirect("/booking");
  }

  // Resume mid-flow after full-page auth redirects (e.g. Google).
  restoreDraft();

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
    startFromHotel,
    persistDraft,
    restoreDraft,
    clearDraft,
    prepareAuthReturn,
    applyCustomerToGuest
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBookingStore, import.meta.hot));
}
