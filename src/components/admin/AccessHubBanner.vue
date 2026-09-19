<template>
  <div
    v-if="auth.isDeveloper"
    class="access-hub"
    role="navigation"
    aria-label="Access management"
  >
    <div class="access-hub__intro">
      <p class="access-hub__eyebrow">Access hub</p>
      <p class="access-hub__copy">
        {{ copy }}
      </p>
    </div>
    <div class="access-hub__steps">
      <router-link
        v-for="step in steps"
        :key="step.to"
        :to="step.to"
        class="access-hub__step"
        :class="{ 'access-hub__step--on': step.on }"
      >
        <span class="access-hub__n">{{ step.n }}</span>
        <span class="access-hub__label">
          <strong>{{ step.label }}</strong>
          <small>{{ step.hint }}</small>
        </span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth-store";

const props = withDefaults(
  defineProps<{
    focus?: "people" | "seats" | "catalog";
  }>(),
  { focus: "people" }
);

const route = useRoute();
const auth = useAuthStore();

const copy = computed(() => {
  if (props.focus === "catalog") {
    return "Hierarchy: Dev → Admin → Manager / Hotel desk. Guest books on the public site. Define roles, features, then permissions.";
  }
  if (props.focus === "seats") {
    return "Bundle a role + features + permissions into a seat. Admin seats get People; Manager gets locations; Hotel desk gets hotels.";
  }
  return "Assign seats: Manager (many locations) or Hotel desk (hotels). Guests sign up themselves — not created here.";
});

const steps = computed(() => {
  const path = route.path;
  return [
    {
      n: "1",
      label: "Catalog",
      hint: "Roles · features · permissions",
      to: "/admin/access-catalog",
      on: path.startsWith("/admin/access-catalog")
    },
    {
      n: "2",
      label: "Seat types",
      hint: "Roles bundled into seats",
      to: "/admin/features",
      on: path.startsWith("/admin/features")
    },
    {
      n: "3",
      label: "People",
      hint: "Assign seats + location / hotel scope",
      to: "/admin/users",
      on: path.startsWith("/admin/users")
    }
  ];
});
</script>

<style scoped>
.access-hub {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1.15rem;
  padding: 1rem 1.1rem;
  background:
    linear-gradient(135deg, rgba(196, 163, 90, 0.12), rgba(255, 255, 255, 0.9)),
    #fff;
  border: 1px solid rgba(154, 123, 60, 0.22);
  border-radius: 14px;
}

.access-hub__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 700;
}

.access-hub__copy {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.92rem;
  line-height: 1.45;
  max-width: 42rem;
}

.access-hub__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.access-hub__step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: center;
  padding: 0.7rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(28, 36, 33, 0.08);
  background: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.access-hub__step:hover {
  border-color: rgba(154, 123, 60, 0.45);
  transform: translateY(-1px);
}

.access-hub__step--on {
  border-color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.12);
}

.access-hub__n {
  display: grid;
  place-items: center;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 999px;
  background: var(--gy-gold-deep);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.access-hub__label {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.access-hub__label strong {
  font-size: 0.9rem;
  color: var(--gy-ink);
}

.access-hub__label small {
  font-size: 0.72rem;
  color: var(--gy-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 820px) {
  .access-hub__steps {
    grid-template-columns: 1fr;
  }
}
</style>
