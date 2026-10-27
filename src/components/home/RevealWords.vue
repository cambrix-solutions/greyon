<template>
  <component
    :is="tag"
    :id="id"
    ref="root"
    class="reveal-words"
    :class="{ 'is-in': shown }"
    :aria-label="text"
  >
    <span
      v-for="(word, i) in words"
      :key="`${i}-${word}`"
      class="reveal-words__w"
      :style="{ '--d': `${Math.min(i, 14) * 72}ms` }"
      aria-hidden="true"
      >{{ word }}</span
    >
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(
  defineProps<{ text: string; tag?: string; id?: string }>(),
  { tag: "h2" }
);

const words = computed(() => props.text.trim().split(/\s+/).filter(Boolean));
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
  if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
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
.reveal-words__w {
  display: inline-block;
  margin-right: 0.26em;
  opacity: 0;
  transform: translate3d(0, 0.72em, 0);
  transition:
    opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--d, 0ms);
}

.reveal-words__w:last-child {
  margin-right: 0;
}

.reveal-words.is-in .reveal-words__w {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-words__w {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
