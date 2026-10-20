import { engineAPI } from "@/helpers/api/clients";
import {
  ApiError,
  FRIENDLY_NETWORK_ERROR,
  FRIENDLY_SERVER_ERROR
} from "@/helpers/api/createApiClient";

/** Response from `POST /admin/uploads`. */
export type UploadResult = {
  url: string;
  path: string;
  width?: number;
  height?: number;
  size: number;
  mime: string;
};

export type UploadProgress = {
  /** 0–100 */
  percent: number;
  loaded: number;
  total: number;
};

export type UploadOptions = {
  /** Storage folder hint, e.g. `hotels/sihanoukville`, `rooms/12`, `media` */
  folder?: string | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: UploadProgress) => void) | undefined;
};

export const UPLOADS_NOT_ENABLED_MESSAGE =
  "Uploads aren't enabled on the server yet, paste an image URL instead.";

function uploadAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };
  if (typeof localStorage !== "undefined") {
    const token = localStorage.getItem("greyon_api_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function friendlyUploadError(status: number, bodyText: string): string {
  if (status === 404) return UPLOADS_NOT_ENABLED_MESSAGE;
  if (status === 413) {
    return "That image is too large for the server. Try a smaller file or paste a URL.";
  }
  if (status === 401 || status === 403) {
    return "Your session expired. Sign in again, then retry the upload.";
  }
  if (status === 422) {
    try {
      const parsed = JSON.parse(bodyText) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (parsed.message?.trim()) return parsed.message;
      const first = Object.values(parsed.errors ?? {})[0]?.[0];
      if (first) return first;
    } catch {
      /* fall through */
    }
    return "That image wasn't accepted. Use JPG, PNG, or WebP under 10 MB.";
  }
  if (status >= 500) return FRIENDLY_SERVER_ERROR;
  const trimmed = bodyText.trim();
  if (
    trimmed &&
    trimmed.length <= 280 &&
    !trimmed.includes("<") &&
    !/^failed to fetch$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return FRIENDLY_SERVER_ERROR;
}

/**
 * POST multipart/form-data to `/admin/uploads` with field `file`
 * and optional `folder`. Uses XHR so upload progress works.
 */
export function uploadAdminImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder, signal, onProgress } = options;
  const root = engineAPI.baseURL.replace(/\/$/, "");
  const url = `${root}/admin/uploads`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;

    const headers = uploadAuthHeaders();
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    const onAbort = () => {
      xhr.abort();
    };
    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Upload cancelled.", "AbortError"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.onprogress = event => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : file.size;
      const loaded = event.loaded;
      const percent =
        total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      onProgress({ percent, loaded, total });
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new ApiError(0, FRIENDLY_NETWORK_ERROR));
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload cancelled.", "AbortError"));
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      const text = xhr.responseText || "";
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(text) as UploadResult;
          if (!data?.url) {
            reject(
              new ApiError(
                xhr.status,
                "Upload succeeded but the server did not return a URL."
              )
            );
            return;
          }
          resolve(data);
        } catch {
          reject(
            new ApiError(
              xhr.status,
              "Upload succeeded but the response was not valid JSON."
            )
          );
        }
        return;
      }
      reject(
        new ApiError(xhr.status, friendlyUploadError(xhr.status, text), text)
      );
    };

    const form = new FormData();
    form.append("file", file, file.name);
    if (folder?.trim()) form.append("folder", folder.trim());
    xhr.send(form);
  });
}

/** Optional cleanup when the engine supports DELETE /admin/uploads. */
export async function deleteAdminUpload(path: string): Promise<void> {
  await engineAPI.request<void>("/admin/uploads", {
    method: "DELETE",
    body: JSON.stringify({ path })
  });
}
