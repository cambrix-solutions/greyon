import { onUnmounted, watch, type Ref } from "vue";

type DragOptions = {
  /** Coast after the pointer is released. Touch keeps native momentum. */
  momentum?: boolean;
};

/** Mouse drag for a horizontal scroller. Touch keeps native scrolling. */
export function useDragScroll(
  el: Ref<HTMLElement | null>,
  options: DragOptions = {}
) {
  let active = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let raf = 0;
  let reduce = false;

  function stopMomentum() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.value?.classList.remove("is-coasting");
  }

  function onDown(event: PointerEvent) {
    const node = el.value;
    if (!node || event.pointerType !== "mouse" || event.button !== 0) return;
    stopMomentum();
    active = true;
    moved = false;
    startX = event.clientX;
    lastX = event.clientX;
    startScroll = node.scrollLeft;
    lastT = performance.now();
    velocity = 0;
    node.classList.add("is-dragging");
    node.setPointerCapture(event.pointerId);
  }

  function onMove(event: PointerEvent) {
    const node = el.value;
    if (!active || !node) return;
    const now = performance.now();
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 8) moved = true;
    const dt = Math.max(now - lastT, 1);
    velocity = (event.clientX - lastX) / dt;
    lastX = event.clientX;
    lastT = now;
    node.scrollLeft = startScroll - dx;
  }

  function coast() {
    const node = el.value;
    if (!node || !options.momentum || reduce || !moved) return;
    let v = Math.max(-42, Math.min(42, -velocity * 16));
    if (Math.abs(v) < 0.6) return;
    node.classList.add("is-coasting");
    const tick = () => {
      if (Math.abs(v) < 0.45) {
        raf = 0;
        node.classList.remove("is-coasting");
        return;
      }
      node.scrollLeft += v;
      v *= 0.92;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function onUp() {
    const node = el.value;
    active = false;
    node?.classList.remove("is-dragging");
    coast();
  }

  function onClick(event: MouseEvent) {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  }

  function onWheel() {
    stopMomentum();
  }

  function unbind(node: HTMLElement) {
    node.removeEventListener("pointerdown", onDown);
    node.removeEventListener("pointermove", onMove);
    node.removeEventListener("pointerup", onUp);
    node.removeEventListener("pointercancel", onUp);
    node.removeEventListener("click", onClick, true);
    node.removeEventListener("wheel", onWheel);
  }

  function bind(node: HTMLElement) {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
    node.addEventListener("click", onClick, true);
    node.addEventListener("wheel", onWheel, { passive: true });
  }

  watch(
    el,
    (node, prev) => {
      if (prev) unbind(prev);
      if (node) bind(node);
    },
    { flush: "post" }
  );

  onUnmounted(() => {
    stopMomentum();
    if (el.value) unbind(el.value);
  });
}
