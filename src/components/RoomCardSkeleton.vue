<template>
  <div class="room-skel" :class="`room-skel--${variant}`" aria-hidden="true">
    <div class="room-skel__media gy-pulse" />
    <div class="room-skel__body">
      <div class="room-skel__line room-skel__line--lg gy-pulse" />
      <div class="room-skel__line room-skel__line--md gy-pulse" />
      <div class="room-skel__facts">
        <span class="gy-pulse" />
        <span class="gy-pulse" />
        <span class="gy-pulse" />
      </div>
      <div class="room-skel__chips">
        <span class="gy-pulse" />
        <span class="gy-pulse" />
        <span class="gy-pulse" />
        <span class="gy-pulse" />
      </div>
      <div class="room-skel__foot">
        <div class="room-skel__price gy-pulse" />
        <div class="room-skel__btn gy-pulse" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "detail" | "result";
  }>(),
  { variant: "detail" }
);
</script>

<style scoped>
.room-skel {
  display: grid;
  overflow: hidden;
  background: var(--gy-white);
  border-radius: 16px;
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 12px 32px rgba(69, 76, 75, 0.08);
}

.room-skel__media {
  aspect-ratio: 4 / 3;
  background: var(--gy-sand);
}

.room-skel__body {
  display: grid;
  gap: 0.65rem;
  padding: 1rem 1.05rem 1.15rem;
}

.room-skel__line {
  height: 0.9rem;
  border-radius: 999px;
  background: var(--gy-sand);
}

.room-skel__line--lg {
  width: 78%;
  height: 1.15rem;
}

.room-skel__line--md {
  width: 52%;
}

.room-skel__facts,
.room-skel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.room-skel__facts span {
  width: 4.5rem;
  height: 0.85rem;
  border-radius: 999px;
  background: var(--gy-sand);
}

.room-skel__chips span {
  width: 5.5rem;
  height: 1.55rem;
  border-radius: 999px;
  background: var(--gy-sand);
}

.room-skel__foot {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.25rem;
}

.room-skel__price {
  width: 5rem;
  height: 1.4rem;
  border-radius: 8px;
  background: var(--gy-sand);
}

.room-skel__btn {
  width: 100%;
  height: 2.6rem;
  border-radius: 8px;
  background: var(--gy-sand);
}

.gy-pulse {
  animation: gy-skel-pulse 1.35s ease-in-out infinite;
}

@keyframes gy-skel-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

@media (min-width: 600px) {
  .room-skel--detail,
  .room-skel--result {
    grid-template-columns: minmax(280px, min(40%, 420px)) minmax(0, 1fr);
  }

  .room-skel--result .room-skel__media {
    border-radius: 16px 0 0 16px;
    height: 100%;
    min-height: 220px;
  }

  .room-skel__body {
    grid-template-columns: minmax(0, 1fr) 150px;
    align-items: center;
  }

  .room-skel__foot {
    justify-items: end;
  }

  .room-skel__btn {
    width: 8.5rem;
  }
}
</style>
