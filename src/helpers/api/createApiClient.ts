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
  const {
    withCredentials = true,
    bearerStorageKey = "greyon_api_token"
  } = options;
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
      const message =
        typeof body === "object" && body?.message
          ? body.message
          : text || `API error ${response.status}`;
      throw new ApiError(response.status, message, body);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
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
