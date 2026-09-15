import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type MaintenanceConfig = {
  enabled: boolean;
  title?: string;
  message?: string;
  eta?: string;
};

const DEFAULT_TITLE = "We’ll be right back";
const DEFAULT_MESSAGE =
  "Greyon is undergoing scheduled maintenance. Thank you for your patience.";

function envForced() {
  return String(import.meta.env.VITE_MAINTENANCE || "").toLowerCase() === "true";
}

export const useMaintenanceStore = defineStore("maintenance", () => {
  const loaded = ref(false);
  const config = ref<MaintenanceConfig>({
    enabled: envForced(),
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
    eta: ""
  });

  const isEnabled = computed(() => config.value.enabled === true);
  const title = computed(() => config.value.title || DEFAULT_TITLE);
  const message = computed(() => config.value.message || DEFAULT_MESSAGE);
  const eta = computed(() => config.value.eta || "");

  async function hydrate() {
    if (envForced()) {
      config.value = {
        enabled: true,
        title: DEFAULT_TITLE,
        message:
          (import.meta.env.VITE_MAINTENANCE_MESSAGE as string | undefined) ||
          DEFAULT_MESSAGE,
        eta: (import.meta.env.VITE_MAINTENANCE_ETA as string | undefined) || ""
      };
      loaded.value = true;
      return;
    }

    try {
      const res = await fetch(`/maintenance.json?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = (await res.json()) as Partial<MaintenanceConfig>;
        config.value = {
          enabled: Boolean(data.enabled),
          title: data.title || DEFAULT_TITLE,
          message: data.message || DEFAULT_MESSAGE,
          eta: data.eta || ""
        };
      }
    } catch {
      // offline / missing file — stay open
    }
    loaded.value = true;
  }

  return {
    loaded,
    config,
    isEnabled,
    title,
    message,
    eta,
    hydrate
  };
});
