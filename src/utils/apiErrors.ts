import { ApiError } from "@/helpers/api/createApiClient";

type ErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
};

/** First friendly line from an API / validation failure. */
export function friendlyApiError(
  e: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (e instanceof ApiError) {
    const fields = fieldErrorsFromApi(e);
    const firstField = Object.values(fields)[0];
    if (firstField) return firstField;
    if (e.message?.trim()) return e.message;
  }
  if (e instanceof Error && e.message.trim()) return e.message;
  return fallback;
}

/** Map 422 `errors` keys → single message per field. */
export function fieldErrorsFromApi(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError) || !e.body || typeof e.body !== "object") {
    return {};
  }
  const body = e.body as ErrorBody;
  const raw = body.errors;
  if (!raw || typeof raw !== "object") return {};

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value) && value[0]) {
      out[key] = String(value[0]);
    } else if (typeof value === "string" && value.trim()) {
      out[key] = value;
    }
  }
  return out;
}
