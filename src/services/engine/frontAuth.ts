import { engineAPI, getApiEndpoints } from "@/helpers/api";
import {
  mapEngineBooking,
  type EngineBooking
} from "@/services/engine/mappers";
import type { Booking } from "@/types/greyon";

export type FrontUser = {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  email_verified_at?: string | null;
  google_id?: string | null;
};

export async function frontLogin(
  email: string,
  password: string,
  remember = true
) {
  return engineAPI.post<{ user: FrontUser }>("/login", {
    email,
    password,
    remember
  });
}

export async function frontRegister(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}) {
  return engineAPI.post<{ user: FrontUser }>("/register", input);
}

export async function frontMe() {
  return engineAPI.get<{ user: FrontUser }>("/user");
}

export async function frontLogout() {
  return engineAPI.post<{ message: string }>("/logout");
}

export async function fetchMyBookings(): Promise<Booking[]> {
  const { bookings } = await engineAPI.get<{ bookings: EngineBooking[] }>(
    "/my/bookings"
  );
  return (bookings ?? []).map(mapEngineBooking);
}

export async function fetchMyBooking(reference: string): Promise<Booking> {
  const { booking } = await engineAPI.get<{ booking: EngineBooking }>(
    `/my/bookings/${encodeURIComponent(reference)}`
  );
  return mapEngineBooking(booking);
}

export async function frontGoogleExchange(ticket: string) {
  return engineAPI.post<{ user: FrontUser }>("/auth/google/exchange", {
    ticket
  });
}

/** Full-page navigate to Google consent (must use absolute engine host). */
export function startGoogleSignIn() {
  const { ENGINE_PUBLIC_URL } = getApiEndpoints();
  window.location.assign(`${ENGINE_PUBLIC_URL}/auth/google/redirect`);
}
