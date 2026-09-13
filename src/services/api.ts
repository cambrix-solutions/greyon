/**
 * HTTP helper for Nest Greyon API (`api/`).
 * Enable with VITE_USE_API=true and VITE_API_BASE_URL=http://localhost:3000/api
 * Default SPA mode stays on Pinia/mock when VITE_USE_API is unset/false.
 */
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:3000/api";

export function isApiEnabled() {
  return String(import.meta.env.VITE_USE_API || "").toLowerCase() === "true";
}

export function getApiBase() {
  return API_BASE;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("greyon_api_token")
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
