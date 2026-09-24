import { defineBoot } from "#q-app";
import {
  engineAPI,
  getApiMode,
  endpoints,
  setUnauthorizedHandler
} from "@/helpers/api";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Registers named API clients on the Vue app (IBPF boot/axios pattern).
 * Import `engineAPI` from `@/helpers/api` or `@/boot/api` in stores/services.
 */
export default defineBoot(({ app }) => {
  app.config.globalProperties.$engineAPI = engineAPI;
  app.config.globalProperties.$apiMode = getApiMode();
  app.config.globalProperties.$apiEndpoints = endpoints;

  setUnauthorizedHandler(() => {
    useAuthStore().handleUnauthorized();
  });
});

export { engineAPI, getApiMode, endpoints };
