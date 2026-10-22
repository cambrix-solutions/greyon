import { onMounted, onUnmounted, type Ref } from "vue";

/** Mouse drag for a horizontal scroller. Touch keeps native scrolling. */
export function useDragScroll(el: Ref<HTMLElement | null>) {
  let active = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  function onDown(event: PointerEvent) {
    const node = el.value;
    if (!node || event.pointerType !== "mouse" || event.button !== 0) return;
    active = true;
    moved = false;
    startX = event.clientX;
    startScroll = node.scrollLeft;
    node.setPointerCapture(event.pointerId);
  }

  function onMove(event: PointerEvent) {
    const node = el.value;
    if (!active || !node) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 8) moved = true;
    node.scrollLeft = startScroll - dx;
  }

  function onUp() {
    active = false;
  }

  function onClick(event: MouseEvent) {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  }

  onMounted(() => {
    const node = el.value;
    if (!node) return;
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
    node.addEventListener("click", onClick, true);
  });

  onUnmounted(() => {
    const node = el.value;
    if (!node) return;
    node.removeEventListener("pointerdown", onDown);
    node.removeEventListener("pointermove", onMove);
    node.removeEventListener("pointerup", onUp);
    node.removeEventListener("pointercancel", onUp);
    node.removeEventListener("click", onClick, true);
  });
}
