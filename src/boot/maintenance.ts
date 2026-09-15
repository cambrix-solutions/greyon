import { defineBoot } from "#q-app";
import { useMaintenanceStore } from "@/stores/maintenance-store";

/**
 * Loads /maintenance.json (or VITE_MAINTENANCE=true) before first navigation.
 * Flip public/maintenance.json → enabled:true during deploy without a full rebuild
 * if that file is updated on the server.
 */
export default defineBoot(async () => {
  await useMaintenanceStore().hydrate();
});
