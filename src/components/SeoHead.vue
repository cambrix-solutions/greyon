<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";

const props = defineProps<{
  title?: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL. When set, og:url and the canonical link use it. */
  url?: string;
  jsonLd?: Record<string, unknown> | null;
}>();

const CANONICAL_ID = "greyon-canonical";

const route = useRoute();

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function applySeo() {
  const title =
    props.title ||
    (typeof route.meta.title === "string" ? route.meta.title : "Greyon");
  document.title = title;
  if (props.description) {
    upsertMeta("name", "description", props.description);
    upsertMeta("property", "og:description", props.description);
  }
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:url", props.url || window.location.href);
  setCanonical(props.url);
  if (props.image) {
    upsertMeta("property", "og:image", props.image);
  }

  const existing = document.getElementById("greyon-jsonld");
  if (existing) existing.remove();
  if (props.jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "greyon-jsonld";
    script.textContent = JSON.stringify(props.jsonLd);
    document.head.appendChild(script);
  }
}

function setCanonical(href: string | undefined) {
  const existing = document.getElementById(CANONICAL_ID);
  if (!href) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement("link");
  el.id = CANONICAL_ID;
  el.setAttribute("rel", "canonical");
  el.setAttribute("href", href);
  if (!existing) document.head.appendChild(el);
}

onMounted(applySeo);
watch(
  () => [props.title, props.description, props.image, props.url, props.jsonLd],
  applySeo
);
onUnmounted(() => {
  if (props.url) document.getElementById(CANONICAL_ID)?.remove();
});
</script>

<template>
  <span class="seo-noop" aria-hidden="true" />
</template>
