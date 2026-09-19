/**
 * Compatibility surface for services/stores.
 * Real config + clients live under `src/helpers/api` (IBPF-style).
 */
import { engineAPI, getApiEndpoints } from "@/helpers/api";
import { ApiError } from "@/helpers/api/createApiClient";

export { ApiError };
export { engineAPI };

/** Always true — greyon SPA talks only to greyon-engine. */
export function isApiEnabled() {
  return true;
}

export function getApiBase() {
  return getApiEndpoints().ENGINE_URL;
}

/** @deprecated Prefer `engineAPI.get/post/...` — kept for existing call sites */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return engineAPI.request<T>(path, init);
}
