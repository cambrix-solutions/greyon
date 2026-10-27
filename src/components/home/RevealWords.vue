<template>
  <component
    :is="tag"
    :id="id"
    ref="root"
    class="reveal-words"
    :class="{ 'is-in': shown }"
    >{{ text }}</component
  >
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

withDefaults(defineProps<{ text: string; tag?: string; id?: string }>(), {
  tag: "h2"
});

const root = ref<HTMLElement | null>(null);
const shown = ref(false);
let io: IntersectionObserver | null = null;

onMounted(() => {
  const el = root.value;
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    shown.value = true;
    return;
  }
  const arm = () => {
    shown.value = true;
    io?.disconnect();
  };
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    requestAnimationFrame(arm);
    return;
  }
  io = new IntersectionObserver(
    entries => {
      if (entries.some(entry => entry.isIntersecting)) arm();
    },
    { threshold: 0, rootMargin: "0px 0px -4% 0px" }
  );
  io.observe(el);
});

onUnmounted(() => io?.disconnect());
</script>

<style>
.reveal-words {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.55s ease,
    transform 0.55s ease;
}

.reveal-words.is-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-words {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
