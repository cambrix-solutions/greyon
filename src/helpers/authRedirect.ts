/** Safe post-auth return path (same-origin relative paths only). */

const KEY = "greyon_auth_redirect";

export function setAuthRedirect(path: string | null | undefined) {
  if (typeof sessionStorage === "undefined") return;
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    sessionStorage.removeItem(KEY);
    return;
  }
  sessionStorage.setItem(KEY, path);
}

export function peekAuthRedirect(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const path = sessionStorage.getItem(KEY);
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export function consumeAuthRedirect(fallback = "/account"): string {
  const path = peekAuthRedirect();
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(KEY);
  return path ?? fallback;
}
