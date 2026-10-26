<script setup lang="ts">
/**
 * Shared select. Field and menu styles live in app.css (.gy-select, .gy-select-menu).
 * Props and slots pass through to q-select; behaviour is unchanged.
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <q-select
    v-bind="$attrs"
    class="gy-select"
    behavior="menu"
    dropdown-icon="expand_more"
    popup-content-class="gy-select-menu"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </q-select>
</template>
