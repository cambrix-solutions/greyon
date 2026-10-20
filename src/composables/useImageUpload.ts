import { ref, type Ref } from "vue";
import { ApiError } from "@/helpers/api/createApiClient";
import {
  prepareImageForUpload,
  validateImageFile,
  MAX_UPLOAD_BYTES
} from "@/utils/imageCompress";
import {
  uploadAdminImage,
  UPLOADS_NOT_ENABLED_MESSAGE,
  type UploadResult
} from "@/services/engine/uploads";

export type ImageUploadState =
  | "idle"
  | "preparing"
  | "uploading"
  | "done"
  | "error";

export type UseImageUploadOptions = {
  folder?: Ref<string | undefined> | (() => string | undefined);
  maxBytes?: number;
  longEdge?: number;
};

function resolveFolder(
  folder: UseImageUploadOptions["folder"]
): string | undefined {
  if (!folder) return undefined;
  if (typeof folder === "function") return folder();
  return folder.value;
}

/**
 * Shared admin image upload: validate → optional compress → POST /admin/uploads.
 */
export function useImageUpload(options: UseImageUploadOptions = {}) {
  const state = ref<ImageUploadState>("idle");
  const progress = ref(0);
  const error = ref<string | null>(null);
  const result = ref<UploadResult | null>(null);
  const previewUrl = ref<string | null>(null);

  let abortController: AbortController | null = null;
  let objectUrl: string | null = null;

  function clearPreview() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    previewUrl.value = null;
  }

  function reset() {
    cancel();
    state.value = "idle";
    progress.value = 0;
    error.value = null;
    result.value = null;
    clearPreview();
  }

  function cancel() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  function setPreviewFromFile(file: File) {
    clearPreview();
    objectUrl = URL.createObjectURL(file);
    previewUrl.value = objectUrl;
  }

  async function upload(file: File): Promise<UploadResult | null> {
    cancel();
    error.value = null;
    result.value = null;
    progress.value = 0;

    const validation = validateImageFile(
      file,
      options.maxBytes ?? MAX_UPLOAD_BYTES
    );
    if (validation) {
      state.value = "error";
      error.value = validation;
      return null;
    }

    setPreviewFromFile(file);
    state.value = "preparing";

    let prepared: File;
    try {
      prepared = await prepareImageForUpload(file, {
        longEdge: options.longEdge
      });
    } catch (e) {
      state.value = "error";
      error.value =
        e instanceof Error
          ? e.message
          : "Could not prepare that image. Try another file.";
      return null;
    }

    abortController = new AbortController();
    state.value = "uploading";
    progress.value = 0;

    try {
      const uploaded = await uploadAdminImage(prepared, {
        folder: resolveFolder(options.folder),
        signal: abortController.signal,
        onProgress: p => {
          progress.value = p.percent;
        }
      });
      progress.value = 100;
      state.value = "done";
      result.value = uploaded;
      abortController = null;
      return uploaded;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        state.value = "idle";
        progress.value = 0;
        abortController = null;
        return null;
      }
      state.value = "error";
      if (e instanceof ApiError) {
        error.value =
          e.status === 404 ? UPLOADS_NOT_ENABLED_MESSAGE : e.message;
      } else if (e instanceof Error) {
        error.value = /failed to fetch/i.test(e.message)
          ? "We couldn’t reach Greyon just now. Please try again."
          : e.message;
      } else {
        error.value = "Upload failed. Please try again.";
      }
      abortController = null;
      return null;
    }
  }

  return {
    state,
    progress,
    error,
    result,
    previewUrl,
    upload,
    cancel,
    reset,
    clearPreview
  };
}
