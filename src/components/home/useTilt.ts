import { onMounted, ref } from "vue";

/** Pointer tilt for a card. Disabled for touch and reduced motion. */
export function useTilt() {
  const enabled = ref(false);

  onMounted(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    enabled.value = hover && !reduce;
  });

  function onMove(event: PointerEvent) {
    if (!enabled.value || event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateY(-8px)`;
  }

  function onLeave(event: PointerEvent) {
    const el = event.currentTarget;
    if (el instanceof HTMLElement) el.style.transform = "";
  }

  return { onMove, onLeave };
}
