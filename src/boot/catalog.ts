import { defineBoot } from "#q-app";
import { useCmsStore } from "@/stores/cms-store";

/**
 * Hydrate marketing catalog only on public routes.
 * Skip on /admin/* so login doesn't hit /catalog + /settings.
 */
export default defineBoot(async () => {
  const path =
    typeof window !== "undefined" ? window.location.pathname : "/";
  if (path === "/admin" || path.startsWith("/admin/")) return;

  const cms = useCmsStore();
  try {
    await cms.syncCatalogFromEngine("public");
  } catch (e) {
    console.warn("[greyon] public catalog sync failed — empty catalog", e);
  }
});
