import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * Vertical shift for an image inside an overflow-hidden frame.
 * `distance` is the full travel in px (± distance/2).
 */
export function useParallax(el: Ref<HTMLElement | null>, distance = 220) {
  const offset = ref(0);
  let reduce = false;
  let ticking = false;

  function update() {
    const node = el.value;
    if (!node || reduce) {
      offset.value = 0;
      return;
    }
    const rect = node.getBoundingClientRect();
    const view = window.innerHeight || 1;
    const raw = (view - rect.top) / (view + rect.height);
    const progress = Math.min(1, Math.max(0, raw));
    offset.value = Math.round((progress - 0.5) * -distance);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  onMounted(() => {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  });

  watch(el, () => update());

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  return offset;
}

/** One scroll listener for several frames, keyed by id. */
export function useParallaxGroup(distance = 160) {
  const offsets = ref<Record<string, number>>({});
  const nodes = new Map<string, HTMLElement>();
  let reduce = false;
  let ticking = false;

  function setFrame(id: string, el: unknown) {
    if (el instanceof HTMLElement) {
      if (nodes.get(id) === el) return;
      nodes.set(id, el);
      requestAnimationFrame(update);
      return;
    }
    nodes.delete(id);
  }

  function update() {
    if (reduce || nodes.size === 0) {
      if (Object.keys(offsets.value).length) offsets.value = {};
      return;
    }
    const view = window.innerHeight || 1;
    const next: Record<string, number> = {};
    let changed = false;
    nodes.forEach((node, id) => {
      const rect = node.getBoundingClientRect();
      const raw = (view - rect.top) / (view + rect.height);
      const progress = Math.min(1, Math.max(0, raw));
      const value = Math.round((progress - 0.5) * -distance);
      next[id] = value;
      if (offsets.value[id] !== value) changed = true;
    });
    if (changed || Object.keys(offsets.value).length !== nodes.size) {
      offsets.value = next;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  onMounted(() => {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  return { setFrame, offsets };
}
