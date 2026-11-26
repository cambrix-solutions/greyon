<template>
  <div class="cms-blocks">
    <template v-for="(block, idx) in blocks" :key="idx">
      <h2 v-if="block.type === 'heading' && block.level === 2">{{
        block.text
      }}</h2>
      <h3 v-else-if="block.type === 'heading'">{{ block.text }}</h3>
      <p v-else-if="block.type === 'paragraph'">{{ block.text }}</p>
      <aside v-else-if="block.type === 'callout'" class="cms-blocks__callout">
        {{ block.text }}
      </aside>
      <ol v-else-if="block.type === 'list' && block.style === 'number'">
        <li v-for="(item, i) in block.items" :key="i">{{ item }}</li>
      </ol>
      <ul v-else-if="block.type === 'list'">
        <li v-for="(item, i) in block.items" :key="i">{{ item }}</li>
      </ul>
      <figure v-else-if="block.type === 'image'" class="cms-blocks__figure">
        <img :src="block.url" :alt="block.alt || ''" loading="lazy" />
        <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
      </figure>
      <hr v-else-if="block.type === 'divider'" />
      <dl v-else-if="block.type === 'faq'" class="cms-blocks__faq">
        <div v-for="(item, i) in block.items" :key="i">
          <dt>{{ item.question }}</dt>
          <dd>{{ item.answer }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PageBlock } from "@/services/engine/adminAccess";

/** Renders Pages CMS blocks as plain text elements — never raw HTML. */
defineProps<{ blocks: PageBlock[] }>();
</script>

<style scoped>
.cms-blocks h2 {
  margin: 1.6rem 0 0.6rem;
  font-size: 1.35rem;
  font-weight: 700;
}

.cms-blocks h3 {
  margin: 1.2rem 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.cms-blocks p,
.cms-blocks li {
  white-space: pre-line;
}

.cms-blocks__callout {
  margin: 1rem 0;
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--gy-gold-deep);
  background: #f6f3ec;
}

.cms-blocks__figure {
  margin: 1.2rem 0;
}

.cms-blocks__figure img {
  display: block;
  max-width: 100%;
  height: auto;
}

.cms-blocks__figure figcaption {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.cms-blocks hr {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid rgba(18, 17, 16, 0.12);
}

.cms-blocks__faq > div {
  padding: 0.9rem 0;
  border-bottom: 1px solid rgba(18, 17, 16, 0.08);
}

.cms-blocks__faq dt {
  font-weight: 700;
}

.cms-blocks__faq dd {
  margin: 0.3rem 0 0;
  white-space: pre-line;
}
</style>
