<template>
  <q-page class="auth-shell">
    <div
      class="auth-shell__bg"
      :style="{ backgroundImage: `url(${image})` }"
      aria-hidden="true"
    />
    <div class="auth-shell__veil" aria-hidden="true" />
    <div class="auth-shell__glow" aria-hidden="true" />

    <div class="auth-shell__layout">
      <aside v-reveal class="auth-shell__brand">
        <p class="auth-shell__mark gy-display">Greyon</p>
        <p class="auth-shell__lede">{{ lede }}</p>
        <p class="auth-shell__rule" aria-hidden="true" />
      </aside>

      <div v-reveal="{ delay: '90ms' }" class="auth-shell__panel">
        <slot />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    image?: string;
    lede?: string;
  }>(),
  {
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80",
    lede: "Calm stays across Cambodia’s cities, coast, and countryside."
  }
);
</script>

<style scoped>
.auth-shell {
  position: relative;
  min-height: calc(100vh - 4rem);
  display: grid;
  align-items: center;
  padding: 5.5rem 1.25rem 3.5rem;
  overflow: hidden;
}

.auth-shell__bg {
  position: absolute;
  inset: -2%;
  background-position: center;
  background-size: cover;
  transform: scale(1.06);
  animation: auth-drift 32s ease-in-out infinite alternate;
  z-index: 0;
}

.auth-shell__veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(
      115deg,
      rgba(18, 17, 16, 0.78) 0%,
      rgba(18, 17, 16, 0.52) 42%,
      rgba(18, 17, 16, 0.62) 100%
    ),
    linear-gradient(180deg, rgba(18, 17, 16, 0.2), rgba(18, 17, 16, 0.55));
}

.auth-shell__glow {
  position: absolute;
  inset: auto auto -20% -10%;
  width: min(55vw, 520px);
  height: min(55vw, 520px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(196, 163, 90, 0.28) 0%,
    transparent 70%
  );
  filter: blur(8px);
  z-index: 0;
  pointer-events: none;
  animation: auth-glow 10s ease-in-out infinite alternate;
}

.auth-shell__layout {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
}

.auth-shell__brand {
  color: #fff;
  padding: 0.5rem 0;
}

.auth-shell__mark {
  margin: 0 0 0.85rem;
  font-size: clamp(3rem, 8vw, 4.6rem);
  line-height: 0.92;
  letter-spacing: -0.03em;
  color: #fff;
}

.auth-shell__lede {
  margin: 0;
  max-width: 22rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.78);
}

.auth-shell__rule {
  margin: 1.35rem 0 0;
  width: 3.5rem;
  height: 2px;
  background: linear-gradient(90deg, var(--gy-gold), transparent);
  animation: auth-rule 1.2s ease 0.35s both;
}

.auth-shell__panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  justify-self: end;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.32),
    0 0 0 1px rgba(196, 163, 90, 0.12);
  backdrop-filter: blur(10px);
  padding: clamp(1.85rem, 3.5vw, 2.35rem) clamp(1.5rem, 3vw, 2.1rem)
    clamp(1.65rem, 3vw, 2rem);
  overflow: hidden;
}

.auth-shell__panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 1.5rem;
  right: 1.5rem;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gy-gold) 20%,
    var(--gy-gold-deep) 50%,
    var(--gy-gold) 80%,
    transparent
  );
}

@keyframes auth-drift {
  from {
    transform: scale(1.06) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(-1.5%, -1%, 0);
  }
}

@keyframes auth-glow {
  from {
    opacity: 0.55;
    transform: translate(0, 0);
  }
  to {
    opacity: 0.9;
    transform: translate(8%, -6%);
  }
}

@keyframes auth-rule {
  from {
    transform: scaleX(0);
    transform-origin: left;
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@media (max-width: 820px) {
  .auth-shell {
    padding-top: 5rem;
    align-items: end;
  }

  .auth-shell__layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .auth-shell__panel {
    max-width: none;
    justify-self: stretch;
    border-radius: 14px;
  }

  .auth-shell__brand {
    text-align: left;
  }

  .auth-shell__mark {
    font-size: clamp(2.4rem, 12vw, 3.2rem);
  }

  .auth-shell__lede {
    font-size: 0.98rem;
    max-width: 26rem;
  }
}
</style>
