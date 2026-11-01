/** Start the hero image before the <img> is parsed. Safe to call more than once. */
export function preloadImage(href: string | null | undefined) {
  const url = href?.trim() ?? "";
  if (!url || typeof document === "undefined") return;
  const key = encodeURIComponent(url);
  if (document.querySelector(`link[data-gy-preload="${key}"]`)) return;
  const link = document.createElement("link");
  link.dataset.gyPreload = key;
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  link.setAttribute("fetchpriority", "high");
  document.head.appendChild(link);
}
