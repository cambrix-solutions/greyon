import { onMounted, onUnmounted, ref, type Ref } from "vue";

/** Vertical scroll drives a horizontal track. Off for narrow screens and reduced motion. */
export function usePinScroll(
  section: Ref<HTMLElement | null>,
  track: Ref<HTMLElement | null>
) {
  const shift = ref(0);
  const pinned = ref(false);
  let reduce = false;
  let narrow = false;
  let ticking = false;

  function allowed() {
    return !reduce && !narrow;
  }

  function measure() {
    const sec = section.value;
    const row = track.value;
    pinned.value = allowed();
    if (!sec) return;
    if (!pinned.value || !row) {
      sec.style.height = "";
      shift.value = 0;
      return;
    }
    const distance = Math.max(0, row.scrollWidth - window.innerWidth + 48);
    const capped = Math.min(distance, Math.round(window.innerHeight * 2.4));
    sec.style.height = `${window.innerHeight + capped}px`;
    const start = sec.getBoundingClientRect().top + window.scrollY;
    const progress = (window.scrollY - start) / Math.max(capped, 1);
    const p = Math.min(1, Math.max(0, progress));
    const next = Math.round(-p * distance);
    if (next !== shift.value) shift.value = next;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      measure();
      ticking = false;
    });
  }

  function onChange() {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    narrow = window.matchMedia("(max-width: 860px)").matches;
    measure();
  }

  onMounted(() => {
    onChange();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onChange);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onChange);
    if (section.value) section.value.style.height = "";
  });

  return { shift, pinned };
}
