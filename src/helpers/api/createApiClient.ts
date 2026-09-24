/**
 * Lightweight API client factory (IBPF-style createAxiosInstance, but fetch).
 * Session-cookie auth for greyon-engine — no Bearer refresh queue.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type EngineErrorBody = {
  statusCode?: number;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

type UnauthorizedHandler = (error: ApiError) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedHandling = false;

/** Register a global 401 handler (wired from boot to avoid circular imports). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function notifyUnauthorized(error: ApiError) {
  if (!unauthorizedHandler || unauthorizedHandling) return;
  unauthorizedHandling = true;
  try {
    unauthorizedHandler(error);
  } finally {
    window.setTimeout(() => {
      unauthorizedHandling = false;
    }, 1500);
  }
}

/** Avoid dumping HTML error pages (e.g. Herd 404) into the UI. */
function messageFromErrorBody(
  status: number,
  text: string,
  body: EngineErrorBody | string | undefined
): string {
  if (typeof body === "object" && body) {
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  }

  const trimmed = text.trim();
  const looksHtml =
    /^<!DOCTYPE\s+html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    /<title>\s*Herd\s*-\s*Site not found/i.test(trimmed);

  if (looksHtml) {
    if (/Herd\s*-\s*Site not found/i.test(trimmed) || status === 404) {
      return "Booking API is unreachable. Check that greyon-engine is running in Herd (https://greyon-engine.test).";
    }
    return `Booking API returned an unexpected response (${status}).`;
  }

  if (trimmed && trimmed.length <= 280 && !trimmed.includes("<")) {
    return trimmed;
  }

  return `API error ${status}`;
}

export type CreateApiClientOptions = {
  /** Default true — required for greyon-engine session cookies */
  withCredentials?: boolean;
  /** Attach Authorization: Bearer from localStorage key when present */
  bearerStorageKey?: string | null;
};

export type ApiClient = {
  baseURL: string;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  get: <T>(path: string, init?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  put: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  delete: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export function createApiClient(
  baseURL: string,
  options: CreateApiClientOptions = {}
): ApiClient {
  const { withCredentials = true, bearerStorageKey = "greyon_api_token" } =
    options;
  const root = baseURL.replace(/\/$/, "");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(init?.headers as Record<string, string> | undefined)
    };

    if (bearerStorageKey && typeof localStorage !== "undefined") {
      const token = localStorage.getItem(bearerStorageKey);
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const url = path.startsWith("http") ? path : `${root}${path}`;
    const response = await fetch(url, {
      ...init,
      headers,
      credentials: withCredentials ? "include" : "same-origin"
    });

    if (!response.ok) {
      let body: EngineErrorBody | string | undefined;
      const text = await response.text();
      try {
        body = text ? (JSON.parse(text) as EngineErrorBody) : undefined;
      } catch {
        body = text;
      }
      const error = new ApiError(
        response.status,
        messageFromErrorBody(response.status, text, body),
        body
      );
      // Only treat /me 401 as session death. Resource 401s (e.g. a
      // developer briefly hitting an admin-only path, or a soft gate)
      // must not clear a still-valid local session — that felt like a
      // random logout when opening Destinations / Hotels / Rooms.
      if (response.status === 401) {
        const soft =
          /\/login(?:\?|$)/.test(path) ||
          /\/notifications(?:\/|$|\?)/.test(path);
        const sessionProbe = /\/(?:admin|developer)\/me(?:\?|$)/.test(path);
        if (!soft && sessionProbe) notifyUnauthorized(error);
      }
      throw error;
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(
        response.status,
        messageFromErrorBody(response.status, text, text),
        text
      );
    }
  }

  function withJsonBody<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<T> {
    const next: RequestInit = { ...init, method };
    if (body !== undefined) {
      next.body = JSON.stringify(body);
    }
    return request<T>(path, next);
  }

  return {
    baseURL: root,
    request,
    get: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      withJsonBody<T>("POST", path, body, init),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      withJsonBody<T>("PUT", path, body, init),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
      withJsonBody<T>("PATCH", path, body, init),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "DELETE" })
  };
}
