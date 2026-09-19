/**
 * Named backend URLs per APP_MODE — same idea as ibpf-framework's apiConfig.
 * Switch hosts with VITE_APP_MODE=local|staging|production in `.env`
 * (Vite has no Node `process` in the browser).
 * Optional VITE_ENGINE_URL overrides ENGINE_URL for one-off pointing.
 */

export type ApiMode = "local" | "staging" | "production";

export type ApiEndpoints = {
  /** greyon-engine (Laravel session API) — used by fetch client */
  ENGINE_URL: string;
  /**
   * Absolute engine origin for browser redirects (Google OAuth).
   * Local proxy `/engine` cannot start OAuth — Google must hit the real host.
   */
  ENGINE_PUBLIC_URL: string;
};

const API_CONFIG: Record<ApiMode, ApiEndpoints> = {
  production: {
    ENGINE_URL: "https://api.greyon.info",
    ENGINE_PUBLIC_URL: "https://api.greyon.info"
  },
  staging: {
    ENGINE_URL: "https://staging-api.greyon.info",
    ENGINE_PUBLIC_URL: "https://staging-api.greyon.info"
  },
  local: {
    ENGINE_URL: "/engine",
    ENGINE_PUBLIC_URL: "https://greyon-engine.test"
  }
};

export function getApiMode(): ApiMode {
  const raw = String(import.meta.env.VITE_APP_MODE || "local").toLowerCase();
  if (raw === "production" || raw === "staging" || raw === "local") {
    return raw;
  }
  return "local";
}

export function getApiEndpoints(): ApiEndpoints {
  const mode = getApiMode();
  const base = API_CONFIG[mode];
  const engineOverride = import.meta.env.VITE_ENGINE_URL as string | undefined;
  const publicOverride = import.meta.env.VITE_ENGINE_PUBLIC_URL as
    | string
    | undefined;
  return {
    ENGINE_URL: engineOverride?.trim()
      ? engineOverride.replace(/\/$/, "")
      : base.ENGINE_URL,
    ENGINE_PUBLIC_URL: publicOverride?.trim()
      ? publicOverride.replace(/\/$/, "")
      : base.ENGINE_PUBLIC_URL
  };
}

export default API_CONFIG;
