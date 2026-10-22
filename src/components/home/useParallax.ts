import { onMounted, onUnmounted, ref, type Ref } from "vue";

/** Subtle vertical shift for an image inside an overflow-hidden frame. */
export function useParallax(el: Ref<HTMLElement | null>) {
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
    const progress = (view - rect.top) / (view + rect.height);
    offset.value = (progress - 0.5) * -90;
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

  return offset;
}
