/**
 * Access (Roles, People + invites), Pages CMS, Guests and Reports — thin
 * wrappers over the greyon-engine admin API. Everything shown on those pages
 * comes from here, so the screens only ever show real data.
 */
import { engineAPI, getApiEndpoints } from "@/helpers/api";
import { ApiError } from "@/helpers/api/createApiClient";
import type { EngineAdmin } from "@/services/engine/mappers";

export type RoleAction = "view" | "create" | "edit" | "delete";
export const ROLE_ACTIONS: RoleAction[] = ["view", "create", "edit", "delete"];

export interface AccessRole {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  roles: { name: string; scope?: string }[];
  featureKeys: string[];
  featureActions: Record<string, RoleAction[]>;
  adminCount?: number;
}

export interface RoleFeatureOption {
  key: string;
  label: string;
  description: string | null;
  actions: RoleAction[];
}

export interface RoleOptions {
  features: RoleFeatureOption[];
}

export interface RoleInput {
  name: string;
  description?: string | null;
  features: { key: string; actions: RoleAction[] }[];
}

export async function fetchRoles(): Promise<AccessRole[]> {
  const { roles } = await engineAPI.get<{ roles: AccessRole[] }>(
    "/admin/roles"
  );
  return (roles ?? []).map(r => ({
    ...r,
    featureActions: r.featureActions ?? {}
  }));
}

export async function fetchRoleOptions(): Promise<RoleOptions> {
  return engineAPI.get<RoleOptions>("/admin/roles/options");
}

export async function createRole(input: RoleInput): Promise<AccessRole> {
  const { role } = await engineAPI.post<{ role: AccessRole }>(
    "/admin/roles",
    input
  );
  return role;
}

export async function updateRole(
  id: number,
  input: Partial<RoleInput>
): Promise<AccessRole> {
  const { role } = await engineAPI.patch<{ role: AccessRole }>(
    `/admin/roles/${id}`,
    input
  );
  return role;
}

export async function deleteRole(id: number): Promise<void> {
  await engineAPI.delete(`/admin/roles/${id}`);
}

/* ---------- People ---------- */

export interface TeamPackage {
  id: number;
  name: string;
  roleNames: string[];
  locationIds: number[];
  hotelIds: number[];
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | string;
  packages: TeamPackage[];
}

export interface SeatOption {
  id: number;
  name: string;
  isSystem: boolean;
  roles: { name: string; scope?: string }[];
}

export interface SeatAssignment {
  packageId: number;
  locationIds: number[];
  hotelIds: number[];
}

export type InviteStatus = "pending" | "expired" | "accepted" | "revoked";

export interface AdminInvite {
  id: number;
  email: string;
  name: string | null;
  status: InviteStatus;
  expiresAt: string | null;
  acceptedAt: string | null;
  invitedBy: string | null;
  packages: (SeatAssignment & { name: string | null })[];
}

export interface InviteResult {
  invite: AdminInvite;
  inviteUrl: string;
  emailSent: boolean;
}

export async function fetchTeam(): Promise<TeamMember[]> {
  const { admins } = await engineAPI.get<{ admins: EngineAdmin[] }>(
    "/admin/team"
  );
  return (admins ?? []).map(a => ({
    id: Number(a.id),
    name: a.name,
    email: a.email,
    status: a.status,
    packages: (a.packages ?? []).map(p => ({
      id: Number(p.id),
      name: p.name,
      roleNames: (p.roles ?? []).map(r => r.name),
      locationIds: (p.locationIds ?? []).map(Number),
      hotelIds: (p.hotelIds ?? []).map(Number)
    }))
  }));
}

export async function setTeamMemberStatus(
  id: number,
  status: "active" | "inactive"
) {
  await engineAPI.patch(`/admin/team/${id}`, { status });
}

export async function fetchSeatOptions(): Promise<SeatOption[]> {
  const { seats } = await engineAPI.get<{ seats: SeatOption[] }>(
    "/admin/seats"
  );
  return seats ?? [];
}

export async function fetchInvites(): Promise<AdminInvite[]> {
  const { invites } = await engineAPI.get<{ invites: AdminInvite[] }>(
    "/admin/invites"
  );
  return invites ?? [];
}

export async function createInvite(input: {
  email: string;
  name?: string | null;
  packages: SeatAssignment[];
}): Promise<InviteResult> {
  return engineAPI.post<InviteResult>("/admin/invites", input);
}

export async function resendInvite(id: number): Promise<InviteResult> {
  return engineAPI.post<InviteResult>(`/admin/invites/${id}/resend`);
}

export async function revokeInvite(id: number): Promise<void> {
  await engineAPI.delete(`/admin/invites/${id}`);
}

export interface InvitePreview {
  valid: boolean;
  email?: string;
  invitedBy?: string | null;
  roles?: string[];
  expiresAt?: string;
  message?: string;
}

export async function previewInvite(token: string): Promise<InvitePreview> {
  try {
    return await engineAPI.get<InvitePreview>(
      `/admin/invites/${encodeURIComponent(token)}/preview`
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return {
        valid: false,
        message: "This invite is invalid or has expired."
      };
    }
    throw e;
  }
}

/** Full-page redirect target for "Continue with Google" (engine starts OAuth). */
export function adminGoogleRedirectUrl(inviteToken?: string): string {
  const base = getApiEndpoints().ENGINE_URL.replace(/\/$/, "");
  const query = inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : "";
  return `${base}/admin/auth/google/redirect${query}`;
}

export async function exchangeAdminGoogleTicket(ticket: string) {
  return engineAPI.post<{ admin: EngineAdmin }>("/admin/auth/google/exchange", {
    ticket
  });
}

/* ---------- Pages CMS ---------- */

export type PageBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "callout"; text: string }
  | { type: "list"; style: "bullet" | "number"; items: string[] }
  | { type: "image"; url: string; alt?: string | null; caption?: string | null }
  | { type: "faq"; items: { question: string; answer: string }[] }
  | { type: "divider" };

export type PageBlockType = PageBlock["type"];

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  blocks: PageBlock[];
  seoTitle: string | null;
  seoDescription: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  isSystem: boolean;
  updatedAt: string | null;
}

export type CmsPageInput = Partial<
  Pick<
    CmsPage,
    | "title"
    | "slug"
    | "subtitle"
    | "blocks"
    | "seoTitle"
    | "seoDescription"
    | "status"
  >
>;

export async function fetchCmsPages(): Promise<CmsPage[]> {
  const { pages } = await engineAPI.get<{ pages: CmsPage[] }>("/admin/pages");
  return pages ?? [];
}

export async function createCmsPage(input: CmsPageInput): Promise<CmsPage> {
  const { page } = await engineAPI.post<{ page: CmsPage }>(
    "/admin/pages",
    input
  );
  return page;
}

export async function updateCmsPage(
  id: number,
  input: CmsPageInput
): Promise<CmsPage> {
  const { page } = await engineAPI.patch<{ page: CmsPage }>(
    `/admin/pages/${id}`,
    input
  );
  return page;
}

export async function deleteCmsPage(id: number): Promise<void> {
  await engineAPI.delete(`/admin/pages/${id}`);
}

/** Published page for the public site, or null while it is a draft / missing. */
export async function fetchPublicCmsPage(
  slug: string
): Promise<CmsPage | null> {
  try {
    const { page } = await engineAPI.get<{ page: CmsPage }>(
      `/pages/${encodeURIComponent(slug)}`
    );
    return page ?? null;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 0))
      return null;
    throw e;
  }
}

/* ---------- Guests ---------- */

export interface GuestSummary {
  email: string;
  fullName: string;
  phone: string | null;
  reservations: number;
  cancelled: number;
  nights: number;
  reservedValue: number;
  firstReservationAt: string | null;
  lastReservationAt: string | null;
  lastCheckIn: string | null;
  note: string | null;
}

export interface GuestReservation {
  id: number;
  reference: string;
  hotel?: { id: number; name: string };
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  total: number | null;
}

export async function fetchGuests(params: {
  q?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));
  const qs = search.toString();
  return engineAPI.get<{
    guests: GuestSummary[];
    meta: { total: number; page: number; perPage: number; lastPage: number };
  }>(`/admin/guests${qs ? `?${qs}` : ""}`);
}

export async function fetchGuestProfile(email: string) {
  return engineAPI.get<{
    guest: GuestSummary;
    reservations: GuestReservation[];
  }>(`/admin/guests/profile?email=${encodeURIComponent(email)}`);
}

export async function saveGuestNote(email: string, note: string) {
  return engineAPI.put<{ note: string | null }>("/admin/guests/note", {
    email,
    note
  });
}

/* ---------- Reports ---------- */

export interface ReportGroup {
  reservations: number;
  nights: number;
  value?: number;
  [label: string]: string | number | undefined;
}

export interface ReportSummary {
  totals: {
    reservations: number;
    cancelled: number;
    nights: number;
    value: number;
    averageValue: number;
    averageNights: number;
  };
  byStatus: ReportGroup[];
  bySource: ReportGroup[];
  byDestination: ReportGroup[];
  byHotel: ReportGroup[];
  note: string;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  basis?: "created" | "stay";
}

function reportQuery(f: ReportFilters) {
  const search = new URLSearchParams();
  if (f.from) search.set("from", f.from);
  if (f.to) search.set("to", f.to);
  if (f.basis) search.set("basis", f.basis);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchReportSummary(
  f: ReportFilters
): Promise<ReportSummary> {
  return engineAPI.get<ReportSummary>(
    `/admin/reports/summary${reportQuery(f)}`
  );
}

/* ---------- CSV downloads ---------- */

/** Downloads a CSV the engine streams (session cookie / bearer, like engineAPI). */
export async function downloadEngineCsv(path: string, filename: string) {
  const base = getApiEndpoints().ENGINE_URL.replace(/\/$/, "");
  const headers: Record<string, string> = {
    Accept: "text/csv",
    "X-Requested-With": "XMLHttpRequest"
  };
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("greyon_api_token")
      : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${base}${path}`, {
    headers,
    credentials: "include"
  });
  if (!response.ok) {
    throw new ApiError(response.status, `Export failed (${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGuestsCsv(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return downloadEngineCsv(`/admin/guests/export${qs}`, "greyon-guests.csv");
}

export function exportReportCsv(f: ReportFilters) {
  return downloadEngineCsv(
    `/admin/reports/export${reportQuery(f)}`,
    "greyon-reservations.csv"
  );
}

/** Feature keys → labels used across Roles / People. */
export const FEATURE_LABELS: Record<string, string> = {
  bookings: "Reservations",
  guests: "Guests",
  reports: "Reports",
  pages: "Pages",
  news: "News",
  enquiries: "Enquiries"
};
