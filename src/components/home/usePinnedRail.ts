import { onUnmounted, ref, watch, type Ref } from "vue";
import { useDragScroll } from "@/components/home/useDragScroll";

/**
 * Horizontal rail with native scroll and drag. The track is not pinned to
 * the page scroll.
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

  function paintProgress(progress: number) {
    if (barEl.value) {
      const total = Math.max(count.value, 1);
      barEl.value.style.transform = `scaleX(${Math.max(progress, 1 / total)})`;
    }
    const total = count.value;
    const next =
      total <= 1 ? 0 : Math.min(total - 1, Math.round(progress * (total - 1)));
    if (activeIndex.value !== next) activeIndex.value = next;
  }

  function onRailScroll() {
    const view = railEl.value;
    if (!view) return;
    const max = view.scrollWidth - view.clientWidth;
    const progress = max > 0 ? view.scrollLeft / max : 0;
    paintProgress(progress);
  }

  function goToPanel(index: number) {
    const total = count.value;
    if (total < 1) return;
    const next = Math.min(total - 1, Math.max(0, index));
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const track = trackEl.value;
    if (!track) return;
    const panel = track.children.item(next);
    if (panel instanceof HTMLElement) {
      panel.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        inline: "start",
        block: "nearest"
      });
    }
  }

  watch(
    railEl,
    (node, prev) => {
      prev?.removeEventListener("scroll", onRailScroll);
      node?.addEventListener("scroll", onRailScroll, { passive: true });
      dragTarget.value = node;
      onRailScroll();
    },
    { flush: "post" }
  );

  watch(count, () => {
    if (activeIndex.value > count.value - 1) {
      activeIndex.value = Math.max(0, count.value - 1);
    }
  });

  onUnmounted(() => {
    railEl.value?.removeEventListener("scroll", onRailScroll);
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
