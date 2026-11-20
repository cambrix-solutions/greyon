<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Publishing"
      title="Pages"
      subtitle="Privacy, Terms, Reservation terms and FAQ — edit without a developer."
    >
      <template #actions>
        <q-btn
          v-if="auth.canDo('pages', 'create')"
          unelevated
          no-caps
          color="primary"
          label="+ New page"
          @click="newPage"
        />
      </template>
    </AdminPageHeader>

    <div class="pages-layout">
      <aside class="gy-adm-panel pages-list">
        <div class="gy-adm-panel__body">
          <span class="gy-adm-label">All pages</span>
          <button
            v-for="page in pages"
            :key="page.id"
            type="button"
            class="pages-list__item"
            :class="{ 'is-active': current?.id === page.id }"
            @click="select(page)"
          >
            <span>{{ page.title }}</span>
            <span
              class="gy-adm-pill"
              :class="{ 'gy-adm-pill--draft': page.status === 'draft' }"
              >{{ page.status === "published" ? "Published" : "Draft" }}</span
            >
          </button>
          <p v-if="!loading && !pages.length" class="gy-adm-muted">
            No pages yet.
          </p>
          <p v-if="loading" class="gy-adm-muted">Loading…</p>
        </div>
      </aside>

      <section v-if="draft" class="gy-adm-panel pages-editor">
        <div class="gy-adm-panel__body">
          <div class="gy-adm-field">
            <label class="gy-adm-label" for="page-title">Title</label>
            <input
              id="page-title"
              v-model="draft.title"
              class="gy-adm-input"
              :readonly="!canWrite"
              maxlength="255"
            />
          </div>

          <div v-if="!current?.isSystem" class="gy-adm-field">
            <label class="gy-adm-label" for="page-slug">Address</label>
            <input
              id="page-slug"
              v-model="draft.slug"
              class="gy-adm-input"
              :readonly="!canWrite"
              placeholder="e.g. house-rules"
              maxlength="255"
            />
          </div>

          <div v-if="canWrite" class="gy-adm-chips pages-palette">
            <button
              v-for="kind in blockKinds"
              :key="kind.type"
              type="button"
              class="gy-adm-chip"
              @click="addBlock(kind.type)"
            >
              {{ kind.label }}
            </button>
          </div>

          <div class="pages-canvas">
            <p v-if="!draft.blocks.length" class="gy-adm-muted">
              This page has no content yet. Add a block above.
            </p>

            <div
              v-for="(block, idx) in draft.blocks"
              :key="idx"
              class="pages-block"
              :class="`pages-block--${block.type}`"
            >
              <div class="pages-block__bar">
                <span class="gy-adm-label"
                  >{{ kindLabel(block.type) }} block</span
                >
                <span v-if="canWrite" class="gy-adm-row" style="gap: 0.5rem">
                  <button
                    type="button"
                    class="gy-adm-link"
                    :disabled="idx === 0"
                    aria-label="Move up"
                    @click="move(idx, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="gy-adm-link"
                    :disabled="idx === draft.blocks.length - 1"
                    aria-label="Move down"
                    @click="move(idx, 1)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="gy-adm-link gy-adm-link--danger"
                    @click="draft.blocks.splice(idx, 1)"
                  >
                    Remove
                  </button>
                </span>
              </div>

              <template v-if="block.type === 'heading'">
                <div class="gy-adm-row">
                  <select
                    v-model.number="block.level"
                    class="gy-adm-input pages-level"
                    :disabled="!canWrite"
                  >
                    <option :value="2">Large heading</option>
                    <option :value="3">Small heading</option>
                  </select>
                </div>
                <input
                  v-model="block.text"
                  class="gy-adm-input pages-heading-input"
                  :readonly="!canWrite"
                  placeholder="Heading"
                />
              </template>

              <textarea
                v-else-if="
                  block.type === 'paragraph' || block.type === 'callout'
                "
                v-model="block.text"
                class="gy-adm-input"
                :readonly="!canWrite"
                :placeholder="
                  block.type === 'callout' ? 'Highlighted note' : 'Text'
                "
              />

              <template v-else-if="block.type === 'list'">
                <select
                  v-model="block.style"
                  class="gy-adm-input pages-level"
                  :disabled="!canWrite"
                >
                  <option value="bullet">Bullets</option>
                  <option value="number">Numbered</option>
                </select>
                <textarea
                  class="gy-adm-input"
                  :value="block.items.join('\n')"
                  :readonly="!canWrite"
                  placeholder="One item per line"
                  @input="onListInput(block, $event)"
                />
              </template>

              <template v-else-if="block.type === 'image'">
                <input
                  v-model="block.url"
                  class="gy-adm-input"
                  :readonly="!canWrite"
                  placeholder="Image address (https://… or uploads/…)"
                />
                <div class="gy-adm-grid" style="margin-top: 0.5rem">
                  <input
                    v-model="block.alt"
                    class="gy-adm-input"
                    :readonly="!canWrite"
                    placeholder="Describe the image (alt text)"
                  />
                  <input
                    v-model="block.caption"
                    class="gy-adm-input"
                    :readonly="!canWrite"
                    placeholder="Caption (optional)"
                  />
                </div>
              </template>

              <hr v-else-if="block.type === 'divider'" class="pages-divider" />

              <template v-else-if="block.type === 'faq'">
                <div
                  v-for="(item, i) in block.items"
                  :key="i"
                  class="pages-faq"
                >
                  <input
                    v-model="item.question"
                    class="gy-adm-input pages-faq__q"
                    :readonly="!canWrite"
                    placeholder="Question"
                  />
                  <textarea
                    v-model="item.answer"
                    class="gy-adm-input"
                    :readonly="!canWrite"
                    placeholder="Answer"
                  />
                  <button
                    v-if="canWrite"
                    type="button"
                    class="gy-adm-link gy-adm-link--danger"
                    @click="block.items.splice(i, 1)"
                  >
                    Remove question
                  </button>
                </div>
                <button
                  v-if="canWrite"
                  type="button"
                  class="pages-add"
                  @click="block.items.push({ question: '', answer: '' })"
                >
                  + Add question
                </button>
              </template>
            </div>
          </div>

          <p v-if="saveError" class="pages-error">{{ saveError }}</p>

          <div class="pages-foot">
            <span class="gy-adm-muted"
              >/{{ draft.slug || "…" }} ·
              {{ draft.status === "published" ? "Published" : "Draft" }}</span
            >
            <span v-if="canWrite" class="gy-adm-row">
              <button
                v-if="
                  current && !current.isSystem && auth.canDo('pages', 'delete')
                "
                type="button"
                class="gy-adm-link gy-adm-link--danger"
                @click="remove"
              >
                Delete page
              </button>
              <button
                type="button"
                class="gy-adm-btn gy-adm-btn--ghost"
                :disabled="saving"
                @click="save('draft')"
              >
                {{ draft.status === "published" ? "Unpublish" : "Save draft" }}
              </button>
              <button
                type="button"
                class="gy-adm-btn"
                :disabled="saving"
                @click="save('published')"
              >
                Publish
              </button>
            </span>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import "@/css/admin-access.css";
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import {
  createCmsPage,
  deleteCmsPage,
  fetchCmsPages,
  updateCmsPage,
  type CmsPage,
  type PageBlock,
  type PageBlockType
} from "@/services/engine/adminAccess";
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore();
const $q = useQuasar();

const pages = ref<CmsPage[]>([]);
const current = ref<CmsPage | null>(null);
const draft = ref<{
  title: string;
  slug: string;
  status: "draft" | "published";
  blocks: PageBlock[];
} | null>(null);
const loading = ref(true);
const saving = ref(false);
const saveError = ref("");

const blockKinds: { type: PageBlockType; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "list", label: "List" },
  { type: "image", label: "Image" },
  { type: "callout", label: "Callout" },
  { type: "divider", label: "Divider" },
  { type: "faq", label: "FAQ" }
];

const canWrite = computed(() =>
  current.value ? auth.canDo("pages", "edit") : auth.canDo("pages", "create")
);

function kindLabel(type: PageBlockType) {
  return blockKinds.find(k => k.type === type)?.label ?? type;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function load(selectId?: number) {
  loading.value = true;
  try {
    pages.value = await fetchCmsPages();
    const next =
      pages.value.find(p => p.id === (selectId ?? current.value?.id)) ??
      pages.value[0];
    if (next) select(next);
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Could not load pages."
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => load());

function select(page: CmsPage) {
  current.value = page;
  saveError.value = "";
  draft.value = {
    title: page.title,
    slug: page.slug,
    status: page.status,
    blocks: clone(page.blocks ?? [])
  };
}

function newPage() {
  current.value = null;
  saveError.value = "";
  draft.value = { title: "", slug: "", status: "draft", blocks: [] };
}

function addBlock(type: PageBlockType) {
  if (!draft.value) return;
  const blank: Record<PageBlockType, PageBlock> = {
    heading: { type: "heading", level: 2, text: "" },
    paragraph: { type: "paragraph", text: "" },
    list: { type: "list", style: "bullet", items: [] },
    image: { type: "image", url: "", alt: "", caption: "" },
    callout: { type: "callout", text: "" },
    divider: { type: "divider" },
    faq: { type: "faq", items: [{ question: "", answer: "" }] }
  };
  draft.value.blocks.push(clone(blank[type]));
}

function move(idx: number, delta: number) {
  if (!draft.value) return;
  const list = draft.value.blocks;
  const target = idx + delta;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(idx, 1);
  if (item) list.splice(target, 0, item);
}

function onListInput(block: PageBlock, event: Event) {
  if (block.type !== "list") return;
  block.items = (event.target as HTMLTextAreaElement).value.split("\n");
}

/** Drop empty rows; the engine rejects blank text, list items and questions. */
function cleanBlocks(blocks: PageBlock[]): PageBlock[] {
  const out: PageBlock[] = [];
  for (const b of blocks) {
    if (b.type === "list") {
      const items = b.items.map(i => i.trim()).filter(Boolean);
      if (items.length) out.push({ ...b, items });
    } else if (b.type === "faq") {
      const items = b.items
        .map(i => ({ question: i.question.trim(), answer: i.answer.trim() }))
        .filter(i => i.question && i.answer);
      if (items.length) out.push({ ...b, items });
    } else if (b.type === "image") {
      if (b.url.trim()) out.push({ ...b, url: b.url.trim() });
    } else if (b.type === "divider") {
      out.push(b);
    } else if (b.text.trim()) {
      out.push({ ...b, text: b.text.trim() });
    }
  }
  return out;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function save(status: "draft" | "published") {
  if (!draft.value) return;
  saveError.value = "";
  const title = draft.value.title.trim();
  if (!title) {
    saveError.value = "Give the page a title.";
    return;
  }
  const blocks = cleanBlocks(draft.value.blocks);
  saving.value = true;
  try {
    let saved: CmsPage;
    if (current.value) {
      saved = await updateCmsPage(current.value.id, {
        title,
        blocks,
        status,
        ...(current.value.isSystem
          ? {}
          : { slug: slugify(draft.value.slug || title) })
      });
    } else {
      saved = await createCmsPage({
        title,
        slug: slugify(draft.value.slug || title),
        blocks,
        status
      });
    }
    $q.notify({
      type: "positive",
      message: status === "published" ? "Page published." : "Draft saved."
    });
    await load(saved.id);
  } catch (e) {
    saveError.value =
      e instanceof Error ? e.message : "Could not save the page.";
  } finally {
    saving.value = false;
  }
}

function remove() {
  const page = current.value;
  if (!page) return;
  $q.dialog({
    title: `Delete “${page.title}”?`,
    message: "The page is removed from the site.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await deleteCmsPage(page.id);
      current.value = null;
      draft.value = null;
      await load();
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Could not delete the page."
      });
    }
  });
}
</script>

<style scoped>
.pages-layout {
  display: grid;
  grid-template-columns: minmax(200px, 0.42fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.pages-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.75rem 0.7rem;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.95rem;
  text-align: left;
  color: var(--gy-ink);
  cursor: pointer;
}

.pages-list__item.is-active {
  background: #efece3;
}

.pages-palette {
  margin-bottom: 1rem;
}

.pages-canvas {
  padding: 1rem;
  border: 1px solid rgba(18, 17, 16, 0.12);
  margin-bottom: 1rem;
}

.pages-block {
  margin-bottom: 0.9rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid rgba(18, 17, 16, 0.14);
}

.pages-block--faq {
  border-color: rgba(18, 17, 16, 0.4);
}

.pages-block__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.pages-level {
  width: auto;
  min-width: 160px;
  margin-bottom: 0.5rem;
}

.pages-heading-input {
  font-size: 1.1rem;
  font-weight: 700;
}

.pages-faq {
  padding: 0.65rem 0;
  border-top: 1px solid rgba(18, 17, 16, 0.08);
}

.pages-faq__q {
  margin-bottom: 0.4rem;
  font-weight: 700;
}

.pages-add {
  margin-top: 0.4rem;
  padding: 0.4rem 0.75rem;
  border: 1px dashed rgba(18, 17, 16, 0.4);
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.pages-divider {
  border: 0;
  border-top: 1px solid rgba(18, 17, 16, 0.2);
}

.pages-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pages-error {
  margin: 0 0 0.9rem;
  color: #8a3b33;
  font-size: 0.88rem;
}

@media (max-width: 900px) {
  .pages-layout {
    grid-template-columns: 1fr;
  }
}
</style>
