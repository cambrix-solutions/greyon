/** Build the optional `folder` value for `POST /admin/uploads`. */

export type UploadFolderKind = "hotels" | "rooms" | "locations" | "media";

function segment(value?: string | number | null): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || "new";
}

export function uploadFolder(
  kind: UploadFolderKind,
  idOrSlug?: string | number | null
): string {
  if (kind === "media") return "media";
  return `${kind}/${segment(idOrSlug)}`;
}
