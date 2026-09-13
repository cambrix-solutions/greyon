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

    const once = binding.value?.once !== false;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add("gy-reveal--in");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("gy-reveal--in");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
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
