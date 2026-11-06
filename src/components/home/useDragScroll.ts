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
  let pointerId = -1;
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

  function releaseTracking() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    pointerId = -1;
  }

  function onDown(event: PointerEvent) {
    const node = el.value;
    if (!node || event.pointerType !== "mouse" || event.button !== 0) return;
    stopMomentum();
    releaseTracking();
    active = true;
    moved = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    lastX = event.clientX;
    startScroll = node.scrollLeft;
    lastT = performance.now();
    velocity = 0;
    node.classList.add("is-dragging");
    // Capturing on pointerdown retargets the click to this scroller, so a
    // child button never receives it. Capture only after a real drag.
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onMove(event: PointerEvent) {
    const node = el.value;
    if (!active || !node || event.pointerId !== pointerId) return;
    const now = performance.now();
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 8) {
      moved = true;
      if (!node.hasPointerCapture(event.pointerId)) {
        node.setPointerCapture(event.pointerId);
      }
    }
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

  function onUp(event: PointerEvent) {
    if (!active || event.pointerId !== pointerId) return;
    const node = el.value;
    active = false;
    releaseTracking();
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
    node.removeEventListener("click", onClick, true);
    node.removeEventListener("wheel", onWheel);
    active = false;
    releaseTracking();
    node.classList.remove("is-dragging");
  }

  function bind(node: HTMLElement) {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.addEventListener("pointerdown", onDown);
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
    releaseTracking();
    if (el.value) unbind(el.value);
  });
}
