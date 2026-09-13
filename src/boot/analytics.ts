import { defineBoot } from "#q-app";

/**
 * Analytics placeholder.
 * Set VITE_GTM_ID or save analytics ID in Admin → Settings to activate later.
 */
export default defineBoot(() => {
  const gtmId = import.meta.env.VITE_GTM_ID as string | undefined;
  if (!gtmId || typeof document === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
});
