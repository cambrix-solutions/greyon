/**
 * Add types (that are not auto-magically added by Quasar CLI already)
 * for your custom variables to avoid TypeScript errors, like dynamic
 * process.env variables or definitions in dotenv files configured ONLY
 * for the /quasar.config file itself.
 *
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 */
interface ImportMetaEnv {
  readonly VITE_USE_API?: string;
  readonly VITE_APP_MODE?: string;
  readonly VITE_ENGINE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GTM_ID?: string;
}

declare module "vue" {
  interface ComponentCustomProperties {
    $engineAPI: import("./src/helpers/api/createApiClient").ApiClient;
    $apiMode: import("./src/helpers/api/apiConfig").ApiMode;
    $apiEndpoints: import("./src/helpers/api/apiConfig").ApiEndpoints;
  }
}
