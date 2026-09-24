<script setup lang="ts">
import { computed } from "vue";

/**
 * Shared admin card/row action bar — status + primary + icon cluster.
 * Keeps Destinations / Hotels / Rooms / News action UI consistent.
 */
export type EntityAction = {
  key: string;
  icon: string;
  tip: string;
  show?: boolean;
  to?: string;
  href?: string;
  target?: string;
  danger?: boolean;
  onClick?: () => void;
};

const props = withDefaults(
  defineProps<{
    status?: string | null;
    statusOptions?: string[];
    statusDisable?: boolean;
    hideStatus?: boolean;
    primaryLabel?: string;
    primaryTo?: string;
    primaryShow?: boolean;
    primaryIcon?: string;
    primaryOutline?: boolean;
    actions?: EntityAction[];
    dense?: boolean;
    /** Status/meta on top row, primary+icons on the row below. */
    stack?: boolean;
  }>(),
  {
    status: null,
    statusOptions: () => [],
    statusDisable: false,
    hideStatus: false,
    primaryShow: true,
    primaryOutline: false,
    actions: () => [],
    dense: false,
    stack: false
  }
);

const emit = defineEmits<{
  "update:status": [value: string];
  primary: [];
}>();

const visibleActions = computed(() =>
  (props.actions ?? []).filter(a => a.show !== false)
);

const showPrimary = computed(
  () => props.primaryShow !== false && Boolean(props.primaryLabel)
);

const showStatus = computed(
  () =>
    !props.hideStatus &&
    props.status != null &&
    (props.statusOptions?.length ?? 0) > 0
);

function onPrimaryClick() {
  if (!props.primaryTo) emit("primary");
}
</script>

<template>
  <div
    class="entity-actions"
    :class="{
      'entity-actions--dense': dense,
      'entity-actions--stack': stack
    }"
  >
    <q-select
      v-if="showStatus"
      dense
      borderless
      :model-value="status"
      :options="statusOptions"
      class="entity-actions__status"
      :disable="statusDisable"
      @update:model-value="(v: string) => emit('update:status', v)"
    />

    <div v-if="$slots.meta" class="entity-actions__meta">
      <slot name="meta" />
    </div>

    <div
      v-if="showPrimary || visibleActions.length"
      class="entity-actions__cluster"
    >
      <q-btn
        v-if="showPrimary"
        dense
        no-caps
        :unelevated="!primaryOutline"
        :outline="primaryOutline"
        color="primary"
        class="entity-actions__primary"
        :icon="primaryIcon"
        :label="primaryLabel"
        :to="primaryTo"
        @click="onPrimaryClick"
      />
      <span
        v-if="showPrimary && visibleActions.length"
        class="entity-actions__rule"
        aria-hidden="true"
      />
      <div v-if="visibleActions.length" class="entity-actions__icons">
        <q-btn
          v-for="action in visibleActions"
          :key="action.key"
          flat
          dense
          class="entity-actions__icon"
          :class="{ 'entity-actions__icon--danger': action.danger }"
          :icon="action.icon"
          :to="action.to"
          :href="action.href"
          :target="action.target"
          :aria-label="action.tip"
          @click="action.onClick?.()"
        >
          <q-tooltip>{{ action.tip }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entity-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
}

.entity-actions--stack {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    "meta status"
    "cluster cluster";
  align-items: end;
  justify-content: end;
  column-gap: 0.55rem;
  row-gap: 0.45rem;
}

.entity-actions--stack .entity-actions__meta {
  grid-area: meta;
  justify-self: start;
}

.entity-actions--stack .entity-actions__status {
  grid-area: status;
  justify-self: end;
  align-self: end;
}

.entity-actions--stack .entity-actions__cluster {
  grid-area: cluster;
  justify-self: end;
}

.entity-actions__status {
  min-width: 7.25rem;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(28, 25, 23, 0.1);
  box-shadow: 0 1px 0 rgba(28, 25, 23, 0.03);
}

.entity-actions__status :deep(.q-field__control) {
  min-height: 34px !important;
  height: 34px;
  padding: 0 0.55rem 0 0.7rem;
}

.entity-actions__status :deep(.q-field__native),
.entity-actions__status :deep(.q-field__append) {
  min-height: 34px !important;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gy-ink, #1c1917);
  text-transform: capitalize;
}

.entity-actions__status :deep(.q-field__marginal) {
  height: 34px;
}

.entity-actions__meta {
  display: flex;
  align-items: center;
}

.entity-actions__cluster {
  display: inline-flex;
  align-items: stretch;
  border-radius: 11px;
  border: 1px solid rgba(28, 25, 23, 0.1);
  background: #fff;
  box-shadow: 0 1px 0 rgba(28, 25, 23, 0.03);
  overflow: hidden;
}

.entity-actions__primary {
  border-radius: 0 !important;
  padding: 0 0.85rem !important;
  min-height: 34px;
  font-size: 0.8rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.entity-actions__primary.q-btn--outline {
  border: none !important;
}

.entity-actions__rule {
  width: 1px;
  align-self: stretch;
  background: rgba(28, 25, 23, 0.08);
}

.entity-actions__icons {
  display: inline-flex;
  align-items: center;
  padding: 0 0.15rem;
  background: rgba(250, 248, 244, 0.9);
}

.entity-actions__icon {
  width: 34px;
  min-height: 34px;
  border-radius: 8px !important;
  color: var(--gy-muted, #78716c) !important;
}

.entity-actions__icon :deep(.q-icon) {
  font-size: 1.05rem;
}

.entity-actions__icon:hover {
  color: var(--gy-gold-deep, #9a7b3c) !important;
  background: rgba(154, 123, 60, 0.1) !important;
}

.entity-actions__icon--danger:hover {
  color: #b91c1c !important;
  background: rgba(185, 28, 28, 0.1) !important;
}

.entity-actions--dense .entity-actions__status :deep(.q-field__control),
.entity-actions--dense .entity-actions__status :deep(.q-field__native),
.entity-actions--dense .entity-actions__status :deep(.q-field__append),
.entity-actions--dense .entity-actions__status :deep(.q-field__marginal) {
  min-height: 30px !important;
  height: 30px;
}

.entity-actions--dense .entity-actions__primary,
.entity-actions--dense .entity-actions__icon {
  min-height: 30px;
}

.entity-actions--dense .entity-actions__icon {
  width: 30px;
}

.entity-actions--dense .entity-actions__primary {
  padding: 0 0.7rem !important;
  font-size: 0.76rem;
}

@media (max-width: 640px) {
  .entity-actions {
    width: 100%;
    justify-content: stretch;
  }

  .entity-actions__status {
    flex: 1 1 auto;
  }

  .entity-actions__cluster {
    flex: 1 1 100%;
  }

  .entity-actions__icons {
    margin-left: auto;
  }
}
</style>
