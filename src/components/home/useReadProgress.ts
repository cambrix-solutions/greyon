import { onMounted, onUnmounted, ref, type Ref } from "vue";

/** Page scroll progress for the news read-bar. Respects reduced motion. */
export function useReadProgress(target: Ref<HTMLElement | null>) {
  const progress = ref(0);
  const reduceMotion = ref(false);
  let ticking = false;

  function measure() {
    const node = target.value;
    if (!node) {
      progress.value = 0;
      return;
    }
    const start = node.getBoundingClientRect().top + window.scrollY;
    const distance = node.offsetHeight - window.innerHeight;
    if (distance <= 0) {
      progress.value = 1;
      return;
    }
    const next = (window.scrollY - start) / distance;
    progress.value = Math.min(1, Math.max(0, next));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      measure();
      ticking = false;
    });
  }

  onMounted(() => {
    reduceMotion.value = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  return { progress, reduceMotion };
}
