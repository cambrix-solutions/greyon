import { onUnmounted, ref, watch, type Ref } from "vue";

/** True once `el` enters the viewport. Stays true. Reduced motion starts true. */
export function useInView(
  el: Ref<HTMLElement | null>,
  margin = "0px 0px -8% 0px"
) {
  const shown = ref(false);
  let io: IntersectionObserver | null = null;

  function stop() {
    io?.disconnect();
    io = null;
  }

  function arm(node: HTMLElement) {
    stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.value = true;
      return;
    }
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      requestAnimationFrame(() => {
        shown.value = true;
      });
      return;
    }
    io = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        shown.value = true;
        stop();
      },
      { threshold: 0.15, rootMargin: margin }
    );
    io.observe(node);
  }

  watch(
    el,
    node => {
      if (!node) return;
      arm(node);
    },
    { flush: "post" }
  );

  onUnmounted(stop);

  return shown;
}
