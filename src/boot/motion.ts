import { defineBoot } from "#q-app";
import type { Directive } from "vue";

type RevealValue = {
  delay?: string;
  once?: boolean;
};

const reveal: Directive<HTMLElement, RevealValue | undefined> = {
  mounted(el, binding) {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      el.classList.add("gy-reveal", "gy-reveal--in");
      return;
    }

    el.classList.add("gy-reveal");
    const delay = binding.value?.delay;
    if (delay) el.style.setProperty("--reveal-delay", delay);

    const show = () => el.classList.add("gy-reveal--in");

    // Tall admin lists (hotels / rooms) can be many viewports high. A
    // 0.12 threshold never fires for those — content stayed opacity:0
    // forever ("36 rooms" in the subtitle, blank page below).
    const topInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };
    if (topInView()) {
      // Defer one frame so the initial opacity:0 paint can settle, then in.
      requestAnimationFrame(show);
      return;
    }

    const once = binding.value?.once !== false;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            show();
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("gy-reveal--in");
          }
        });
      },
      // Any visible pixel is enough — do not require a % of tall wrappers.
      { threshold: 0, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(el);
    (el as HTMLElement & { __revealIo?: IntersectionObserver }).__revealIo = io;
  },
  unmounted(el) {
    const node = el as HTMLElement & { __revealIo?: IntersectionObserver };
    node.__revealIo?.disconnect();
  }
};

/**
 * Missing CMS photos (404) otherwise show the browser's broken-image icon plus
 * alt text over the card. Hide the failed <img> so the media block's neutral
 * placeholder background shows instead. `error` does not bubble, so listen in
 * the capture phase once for the whole app.
 */
function bindImageFallback() {
  if (typeof document === "undefined") return;
  document.addEventListener(
    "error",
    event => {
      const el = event.target;
      if (el instanceof HTMLImageElement) el.classList.add("gy-img--broken");
    },
    true
  );
  document.addEventListener(
    "load",
    event => {
      const el = event.target;
      if (el instanceof HTMLImageElement) el.classList.remove("gy-img--broken");
    },
    true
  );
}

/** Slight pull toward the pointer. Home-section buttons only. */
const magnetic: Directive<HTMLElement> = {
  mounted(el) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-12, Math.min(12, dx * 0.28));
      const y = Math.max(-10, Math.min(6, dy * 0.22)) - 4;
      el.style.transition = "transform 0.12s linear";
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onLeave = () => {
      el.style.transition = "";
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    (
      el as HTMLElement & {
        __magnetic?: {
          onMove: (event: PointerEvent) => void;
          onLeave: () => void;
        };
      }
    ).__magnetic = { onMove, onLeave };
  },
  unmounted(el) {
    const node = el as HTMLElement & {
      __magnetic?: {
        onMove: (event: PointerEvent) => void;
        onLeave: () => void;
      };
    };
    if (!node.__magnetic) return;
    el.removeEventListener("pointermove", node.__magnetic.onMove);
    el.removeEventListener("pointerleave", node.__magnetic.onLeave);
  }
};

type PointerHandlers = {
  onMove: (event: PointerEvent) => void;
  onLeave: () => void;
};

/** Subtle 3D tilt. No-ops for touch and reduced motion. */
const tilt: Directive<HTMLElement, { max?: number } | undefined> = {
  mounted(el, binding) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const max = binding.value?.max ?? 8;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rx = Math.max(-max, Math.min(max, -py * max * 2));
      const ry = Math.max(-max, Math.min(max, px * max * 2));
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    (el as HTMLElement & { __tilt?: PointerHandlers }).__tilt = {
      onMove,
      onLeave
    };
  },
  unmounted(el) {
    const node = el as HTMLElement & { __tilt?: PointerHandlers };
    if (!node.__tilt) return;
    el.removeEventListener("pointermove", node.__tilt.onMove);
    el.removeEventListener("pointerleave", node.__tilt.onLeave);
  }
};

export default defineBoot(({ app }) => {
  app.directive("reveal", reveal);
  app.directive("magnetic", magnetic);
  app.directive("tilt", tilt);
  bindImageFallback();
});
