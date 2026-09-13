<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const props = defineProps<{
  title?: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown> | null;
}>();

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
  upsertMeta("property", "og:url", window.location.href);
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

onMounted(applySeo);
watch(() => [props.title, props.description, props.image, props.jsonLd], applySeo);
</script>

<template>
  <span class="seo-noop" aria-hidden="true" />
</template>
