import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";

/**
 * Tracks whether any in-page booking search bar is visible in the viewport.
 * MainLayout hides the navbar compact search while this is true so the two
 * bars never stack. Both bars share booking-store search state.
 *
 * Header rootMargin pulls the “visible” line below the sticky header so the
 * compact bar appears as soon as the page search scrolls under the nav.
 */

const visibleEls = ref(new Set<Element>());
const pageSearchInView = computed(() => visibleEls.value.size > 0);

let observer: IntersectionObserver | null = null;
let headerPx = 88;

function syncHeaderOffset() {
  if (typeof document === "undefined") return;
  const header = document.querySelector(".gy-header") as HTMLElement | null;
  const h = header?.getBoundingClientRect().height;
  if (h && h > 0) headerPx = Math.round(h);
}

function markVisible(el: Element, on: boolean) {
  const has = visibleEls.value.has(el);
  if (on === has) return;
  const next = new Set(visibleEls.value);
  if (on) next.add(el);
  else next.delete(el);
  visibleEls.value = next;
}

function isRoughlyInView(el: Element) {
  if (typeof window === "undefined") return false;
  syncHeaderOffset();
  const rect = el.getBoundingClientRect();
  return rect.bottom > headerPx && rect.top < window.innerHeight;
}

function ensureObserver() {
  if (
    typeof window === "undefined" ||
    typeof IntersectionObserver === "undefined"
  ) {
    return null;
  }
  syncHeaderOffset();
  if (observer) return observer;
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        markVisible(entry.target, entry.isIntersecting);
      }
    },
    {
      root: null,
      // Once the page search sits under the sticky header, treat it as gone.
      rootMargin: `-${headerPx}px 0px 0px 0px`,
      threshold: 0
    }
  );
  return observer;
}

function rebuildObserver(tracked: Element[]) {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  visibleEls.value = new Set();
  const obs = ensureObserver();
  if (!obs) return;
  for (const el of tracked) {
    obs.observe(el);
    if (isRoughlyInView(el)) markVisible(el, true);
  }
}

const trackedEls = new Set<Element>();

let resizeBound = false;
function bindResize() {
  if (resizeBound || typeof window === "undefined") return;
  window.addEventListener(
    "resize",
    () => {
      const prev = headerPx;
      syncHeaderOffset();
      if (prev !== headerPx) rebuildObserver([...trackedEls]);
    },
    { passive: true }
  );
  resizeBound = true;
}

function observe(el: HTMLElement) {
  if (trackedEls.has(el)) return;
  bindResize();
  trackedEls.add(el);
  el.setAttribute("data-gy-page-search", "");
  const obs = ensureObserver();
  obs?.observe(el);
  // Sync first paint so the navbar compact bar does not flash over a visible page search.
  if (isRoughlyInView(el)) markVisible(el, true);
}

function unobserve(el: HTMLElement) {
  if (!trackedEls.has(el)) return;
  trackedEls.delete(el);
  observer?.unobserve(el);
  markVisible(el, false);
  el.removeAttribute("data-gy-page-search");
}

/**
 * Register a page-level search root when `enabled` is true.
 * Always call from setup (hooks rules); toggle via the enabled flag/ref.
 */
export function usePageSearchAnchor(
  elRef: Ref<HTMLElement | null>,
  enabled: Ref<boolean> | boolean = true
) {
  const isEnabled = () =>
    typeof enabled === "boolean" ? enabled : enabled.value;

  watch(
    () => [elRef.value, isEnabled()] as const,
    (curr, prev) => {
      const [el, on] = curr;
      const prevEl = prev?.[0] ?? null;
      if (prevEl && prevEl !== el) unobserve(prevEl as HTMLElement);
      if (el && on) observe(el);
      else if (el && !on) unobserve(el);
    },
    { immediate: true, flush: "post" }
  );

  onBeforeUnmount(() => {
    const el = elRef.value;
    if (el) unobserve(el);
  });
}

export function usePageSearchVisibility() {
  return { pageSearchInView };
}
