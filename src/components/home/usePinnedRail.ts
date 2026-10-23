import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { useDragScroll } from "@/components/home/useDragScroll";

/**
 * Scroll-pinned horizontal rail. Wide screens translate the track as the
 * page scrolls; narrow screens and reduced motion keep a native drag scroller.
 * Same motion as the destinations journey, shared so rooms do not fork it.
 */
export function usePinnedRail(count: Ref<number>) {
  const canPin = ref(false);
  const spacer = ref(0);
  const activeIndex = ref(0);

  const pinRoot = ref<HTMLElement | null>(null);
  const railEl = ref<HTMLElement | null>(null);
  const trackEl = ref<HTMLElement | null>(null);
  const barEl = ref<HTMLElement | null>(null);
  const dragTarget = ref<HTMLElement | null>(null);

  useDragScroll(dragTarget, { momentum: true });

  let disposed = false;
  let ticking = false;
  let wideQuery: MediaQueryList | null = null;
  let reduceQuery: MediaQueryList | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function headerOffset() {
    const header = document.querySelector(".gy-header");
    if (header instanceof HTMLElement)
      return header.getBoundingClientRect().height;
    return 88;
  }

  function syncPinMode() {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const wide = window.matchMedia("(min-width: 900px)").matches;
    canPin.value = wide && !reduce && count.value > 1;
  }

  function syncDrag() {
    dragTarget.value = canPin.value ? null : railEl.value;
  }

  function paintProgress(progress: number, shiftPx: number) {
    const track = trackEl.value;
    if (track) {
      track.style.transform = canPin.value
        ? `translate3d(${(-shiftPx).toFixed(2)}px, 0, 0)`
        : "";
    }
    if (barEl.value) {
      const total = Math.max(count.value, 1);
      barEl.value.style.transform = `scaleX(${Math.max(progress, 1 / total)})`;
    }
    const total = count.value;
    const next =
      total <= 1 ? 0 : Math.min(total - 1, Math.round(progress * (total - 1)));
    if (activeIndex.value !== next) activeIndex.value = next;
  }

  function onScroll() {
    const root = pinRoot.value;
    const view = railEl.value;
    const track = trackEl.value;
    if (!canPin.value || !root || !view || !track) return;
    const distance = Math.max(0, track.scrollWidth - view.clientWidth);
    const scrolled = Math.min(
      Math.max(headerOffset() - root.getBoundingClientRect().top, 0),
      distance
    );
    const progress = distance > 0 ? scrolled / distance : 0;
    paintProgress(progress, distance * progress);
  }

  function onRailScroll() {
    if (canPin.value) return;
    const view = railEl.value;
    if (!view) return;
    const max = view.scrollWidth - view.clientWidth;
    const progress = max > 0 ? view.scrollLeft / max : 0;
    paintProgress(progress, 0);
  }

  function requestScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onScroll();
    });
  }

  function layoutPin() {
    if (disposed) return;
    syncPinMode();
    syncDrag();
    const view = railEl.value;
    const track = trackEl.value;
    if (!view || !track || !canPin.value) {
      spacer.value = 0;
      paintProgress(0, 0);
      if (!canPin.value) onRailScroll();
      return;
    }
    const distance = Math.max(0, track.scrollWidth - view.clientWidth);
    if (Math.abs(spacer.value - distance) > 1) spacer.value = distance;
    onScroll();
  }

  async function scheduleLayout() {
    if (disposed) return;
    syncPinMode();
    await nextTick();
    requestAnimationFrame(layoutPin);
  }

  function onResize() {
    void scheduleLayout();
  }

  function goToPanel(index: number) {
    const total = count.value;
    if (total < 1) return;
    const next = Math.min(total - 1, Math.max(0, index));
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const root = pinRoot.value;
    const track = trackEl.value;
    const view = railEl.value;
    if (!root || !track || !view) return;
    if (!canPin.value) {
      const panel = track.children.item(next);
      if (panel instanceof HTMLElement) {
        panel.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          inline: "start",
          block: "nearest"
        });
      }
      return;
    }
    const distance = Math.max(0, track.scrollWidth - view.clientWidth);
    const portion = total <= 1 ? 0 : next / (total - 1);
    const top =
      window.scrollY +
      root.getBoundingClientRect().top -
      headerOffset() +
      distance * portion;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  function observeRails() {
    resizeObserver?.disconnect();
    if (railEl.value) resizeObserver?.observe(railEl.value);
    if (trackEl.value) resizeObserver?.observe(trackEl.value);
  }

  watch(
    railEl,
    (node, prev) => {
      prev?.removeEventListener("scroll", onRailScroll);
      node?.addEventListener("scroll", onRailScroll, { passive: true });
      syncDrag();
      observeRails();
    },
    { flush: "post" }
  );

  watch(
    [count, pinRoot, trackEl],
    () => {
      if (activeIndex.value > count.value - 1) {
        activeIndex.value = Math.max(0, count.value - 1);
      }
      void scheduleLayout();
    },
    { flush: "post" }
  );

  onMounted(() => {
    wideQuery = window.matchMedia("(min-width: 900px)");
    reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    wideQuery.addEventListener("change", onResize);
    reduceQuery.addEventListener("change", onResize);
    window.addEventListener("scroll", requestScroll, { passive: true });
    window.addEventListener("resize", onResize);
    resizeObserver = new ResizeObserver(() => layoutPin());
    observeRails();
    void scheduleLayout();
  });

  onUnmounted(() => {
    disposed = true;
    window.removeEventListener("scroll", requestScroll);
    window.removeEventListener("resize", onResize);
    wideQuery?.removeEventListener("change", onResize);
    reduceQuery?.removeEventListener("change", onResize);
    railEl.value?.removeEventListener("scroll", onRailScroll);
    resizeObserver?.disconnect();
  });

  return {
    canPin,
    spacer,
    activeIndex,
    pinRoot,
    railEl,
    trackEl,
    barEl,
    goToPanel
  };
}
