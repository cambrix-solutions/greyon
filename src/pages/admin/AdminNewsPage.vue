<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Publishing"
      title="News"
      :subtitle="`${filtered.length} articles · site stories, not property inventory`"
    >
      <template #actions>
        <q-btn outline no-caps color="primary" label="View live" to="/news" target="_blank" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add article"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search articles…"
          style="min-width: min(100%, 240px); background: #fff"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          label="Status"
          style="min-width: 140px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <p v-reveal class="pub-note">
      News sits outside the property tree. Locations, hotels, and rooms stay linked by foreign keys;
      articles publish independently to the public site.
    </p>

    <div v-reveal="{ delay: '80ms' }" class="news-grid">
      <article v-for="item in filtered" :key="item.id" class="news-card">
        <div class="news-card__media" v-if="item.coverImage">
          <img :src="item.coverImage" :alt="item.title" />
        </div>
        <div class="news-card__body">
          <div class="news-card__top">
            <span class="news-card__date">{{ item.publishedAt }}</span>
            <span class="news-card__status" :data-status="item.status">{{ item.status }}</span>
          </div>
          <h2 class="news-card__title">{{ item.title }}</h2>
          <p class="news-card__excerpt">{{ item.excerpt }}</p>
          <p class="news-card__slug">{{ item.slug }}</p>
        </div>
        <div class="news-card__foot">
          <q-select
            dense
            outlined
            :model-value="item.status"
            :options="cms.statusOptions"
            style="min-width: 120px"
            @update:model-value="(v: string) => setStatus(item.id, v)"
          />
          <div class="news-card__actions">
            <q-btn flat dense no-caps color="primary" label="Edit" @click="openEdit(item)" />
            <q-btn
              v-if="item.status === 'published'"
              flat
              dense
              round
              icon="open_in_new"
              :to="`/news/${item.slug}`"
              target="_blank"
            />
            <q-btn
              v-if="item.status !== 'published'"
              flat
              dense
              no-caps
              color="positive"
              label="Publish"
              @click="setStatus(item.id, 'published')"
            />
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="remove(item.id)"
            />
          </div>
        </div>
      </article>

      <div v-if="!filtered.length" class="news-grid__empty">
        No articles match.
        <q-btn flat dense color="primary" label="Add article" @click="openCreate" />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="newspaper"
      eyebrow="Publishing"
      :title="editing ? 'Edit article' : 'Add article'"
      subtitle="Stories for the public news feed — independent of hotels and locations."
    >
      <AdminFormSection title="Headline" :columns="2">
        <q-input v-model="form.title" label="Title" outlined dense class="admin-form-span-2" />
        <q-input v-model="form.slug" label="URL slug" outlined dense />
        <q-input v-model="form.publishedAt" type="date" label="Publish date" outlined dense />
      </AdminFormSection>
      <AdminFormSection title="Story" hint="Excerpt appears in lists; body is the full article.">
        <q-input v-model="form.excerpt" label="Excerpt" outlined dense />
        <q-input
          v-model="form.body"
          label="Body"
          type="textarea"
          outlined
          autogrow
          hint="HTML allowed"
        />
      </AdminFormSection>
      <AdminFormSection title="Cover & SEO" :columns="2">
        <q-input
          v-model="form.coverImage"
          label="Cover image URL"
          outlined
          dense
          class="admin-form-span-2"
        />
        <q-input v-model="form.seoTitle" label="SEO title" outlined dense />
        <q-input v-model="form.seoDescription" label="SEO description" outlined dense />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create article'"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus, NewsArticle } from "@/types/greyon";

const cms = useCmsStore();
const $q = useQuasar();
const dialog = ref(false);
const editing = ref<string | null>(null);
const query = ref("");
const statusFilter = ref("all");
const statusOptions = [
  { label: "All statuses", value: "all" },
  ...cms.statusOptions.map(s => ({ label: s, value: s }))
];

const form = reactive({
  title: "",
  slug: "",
  coverImage: "",
  excerpt: "",
  body: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  status: "draft" as ContentStatus,
  seoTitle: "",
  seoDescription: ""
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.news.filter(item => {
    if (statusFilter.value !== "all" && item.status !== statusFilter.value) return false;
    if (!q) return true;
    return `${item.title} ${item.excerpt} ${item.slug}`.toLowerCase().includes(q);
  });
});

function openCreate() {
  editing.value = null;
  form.title = "";
  form.slug = "";
  form.coverImage = "";
  form.excerpt = "";
  form.body = "<p></p>";
  form.publishedAt = new Date().toISOString().slice(0, 10);
  form.status = "draft";
  form.seoTitle = "";
  form.seoDescription = "";
  dialog.value = true;
}

function openEdit(item: NewsArticle) {
  editing.value = item.id;
  form.title = item.title;
  form.slug = item.slug;
  form.coverImage = item.coverImage;
  form.excerpt = item.excerpt;
  form.body = item.body;
  form.publishedAt = item.publishedAt;
  form.status = item.status;
  form.seoTitle = item.seoTitle ?? "";
  form.seoDescription = item.seoDescription ?? "";
  dialog.value = true;
}

function save() {
  if (!form.title) {
    $q.notify({ type: "negative", message: "Title is required." });
    return;
  }
  cms.upsertNews({
    ...(editing.value ? { id: editing.value } : {}),
    title: form.title,
    slug: form.slug,
    coverImage: form.coverImage,
    excerpt: form.excerpt,
    body: form.body,
    publishedAt: form.publishedAt,
    status: form.status,
    ...(form.seoTitle ? { seoTitle: form.seoTitle } : {}),
    ...(form.seoDescription ? { seoDescription: form.seoDescription } : {})
  });
  dialog.value = false;
  $q.notify({ type: "positive", message: "Article saved." });
}

function setStatus(id: string, status: string) {
  const item = cms.news.find(n => n.id === id);
  if (!item) return;
  cms.upsertNews({ ...item, status: status as ContentStatus });
  $q.notify({ type: "positive", message: `Article → ${status}` });
}

function remove(id: string) {
  $q.dialog({ title: "Delete article?", cancel: true, persistent: true }).onOk(() => {
    cms.deleteNews(id);
    $q.notify({ type: "positive", message: "Article deleted." });
  });
}
</script>

<style scoped>
.pub-note {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid rgba(154, 123, 60, 0.16);
  border-radius: 12px;
  font-size: 0.86rem;
  color: var(--gy-muted);
  line-height: 1.45;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.news-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.news-card__media {
  aspect-ratio: 16 / 10;
  background: var(--gy-stone);
}

.news-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-card__body {
  padding: 0.95rem 1rem 0.5rem;
  flex: 1;
}

.news-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.news-card__date {
  font-size: 0.75rem;
  color: var(--gy-muted);
}

.news-card__status {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: rgba(28, 36, 33, 0.06);
  color: var(--gy-muted);
}

.news-card__status[data-status="published"] {
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.news-card__title {
  margin: 0.45rem 0 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.news-card__excerpt {
  margin: 0.4rem 0 0;
  font-size: 0.86rem;
  color: var(--gy-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__slug {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--gy-muted);
  opacity: 0.8;
}

.news-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 1rem 0.9rem;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
}

.news-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
}

.news-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gy-muted);
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(28, 36, 33, 0.15);
}
</style>
