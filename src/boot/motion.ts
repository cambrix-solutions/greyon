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

export default defineBoot(({ app }) => {
  app.directive("reveal", reveal);
});
