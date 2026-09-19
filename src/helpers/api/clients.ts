import { getApiEndpoints } from "@/helpers/api/apiConfig";
import { createApiClient } from "@/helpers/api/createApiClient";

const endpoints = getApiEndpoints();

/** greyon-engine JSON API (session cookies) */
export const engineAPI = createApiClient(endpoints.ENGINE_URL);

export { endpoints };
