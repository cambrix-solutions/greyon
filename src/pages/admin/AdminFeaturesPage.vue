<template>
  <q-page padding class="pkg-page">
    <AdminPageHeader
      eyebrow="Access"
      title="Seat types"
      subtitle="Bundle a role + features + permissions into a seat. Assign seats under People."
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          icon="content_copy"
          label="Duplicate"
          :disable="!activePkg"
          @click="duplicateActive"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="New seat"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <AccessHubBanner focus="seats" />

    <div class="pkg-notice">
      <span>
        Site default:
        <strong>{{ activePkg?.name ?? "—" }}</strong>
        <template v-if="activePkg?.priceNote">
          · {{ activePkg.priceNote }}</template
        >
      </span>
      <router-link class="pkg-notice__link" to="/admin/users"
        >Assign on People →</router-link
      >
    </div>

    <div class="pkg-layout">
      <!-- Package rail -->
      <aside class="pkg-rail">
        <q-input
          v-model="listQuery"
          dense
          outlined
          clearable
          placeholder="Filter packages…"
          class="pkg-rail__search"
        >
          <template #prepend><q-icon name="search" size="18px" /></template>
        </q-input>

        <div class="pkg-rail__filters">
          <button
            v-for="f in roleFilters"
            :key="f.value"
            type="button"
            class="pkg-filter"
            :class="{ 'pkg-filter--on': roleFilter === f.value }"
            @click="roleFilter = roleFilter === f.value ? 'all' : f.value"
          >
            {{ f.label }}
          </button>
        </div>

        <div class="pkg-rail__list">
          <button
            v-for="pkg in filteredPackages"
            :key="pkg.id"
            type="button"
            class="pkg-card"
            :class="{
              'pkg-card--selected': pkg.id === selectedId && !isNew,
              'pkg-card--default': pkg.id === cms.activePackageId
            }"
            @click="selectPackage(pkg.id)"
          >
            <div class="pkg-card__top">
              <span class="pkg-card__name">{{ pkg.name }}</span>
              <span
                v-if="pkg.id === cms.activePackageId"
                class="pkg-card__badge"
                >Default</span
              >
            </div>
            <p class="pkg-card__desc">{{ pkg.description }}</p>
            <div class="pkg-card__stats">
              <span>{{ pkg.priceNote || "Custom" }}</span>
              <span>{{ shortRoles(pkg.roles) }}</span>
              <span>{{ featureOnlyCount(pkg) }} feat</span>
              <span>{{ permissionOnlyCount(pkg) }} perm</span>
              <span
                >{{ cms.usersOnPackage(pkg.id).length }} user{{
                  cms.usersOnPackage(pkg.id).length === 1 ? "" : "s"
                }}</span
              >
            </div>
          </button>

          <button
            v-if="isNew"
            type="button"
            class="pkg-card pkg-card--selected pkg-card--draft"
          >
            <div class="pkg-card__top">
              <span class="pkg-card__name">{{ form.name || "Untitled" }}</span>
              <span class="pkg-card__badge pkg-card__badge--draft">Draft</span>
            </div>
            <p class="pkg-card__desc">New package — not saved yet</p>
          </button>

          <p v-if="!filteredPackages.length && !isNew" class="pkg-rail__empty">
            No packages match this filter.
          </p>
        </div>
      </aside>

      <!-- Editor -->
      <section v-if="editing" class="pkg-editor">
        <header class="pkg-editor__bar">
          <div>
            <p class="pkg-editor__eyebrow">
              {{ isNew ? "New package" : "Customize package" }}
              <span v-if="dirty" class="pkg-editor__dirty">· Unsaved</span>
            </p>
            <h2 class="pkg-editor__title">{{ form.name || "Untitled" }}</h2>
          </div>
          <div class="pkg-editor__actions">
            <q-btn
              v-if="!isNew && editing.id !== cms.activePackageId"
              flat
              no-caps
              dense
              color="primary"
              label="Make site default"
              @click="activate(editing.id)"
            />
            <q-btn
              v-if="!isNew && !editing.isSystem"
              flat
              no-caps
              dense
              color="negative"
              label="Delete"
              @click="remove"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Save seat"
              :disable="!dirty && !isNew"
              @click="save"
            />
          </div>
        </header>

        <div class="pkg-editor__body">
          <ol class="pkg-steps" aria-label="Seat setup flow">
            <li class="pkg-steps__item">
              <span class="pkg-steps__n">1</span>
              <span>Basics</span>
            </li>
            <li class="pkg-steps__item">
              <span class="pkg-steps__n">2</span>
              <span>Roles &amp; scope</span>
            </li>
            <li class="pkg-steps__item">
              <span class="pkg-steps__n">3</span>
              <span>Features &amp; permissions</span>
            </li>
          </ol>

          <!-- 1 Basics -->
          <div class="pkg-section">
            <div class="pkg-section__head">
              <h3><span class="pkg-section__step">1</span> Basics</h3>
            </div>
            <div class="pkg-basics">
              <q-input v-model="form.name" label="Seat name" outlined dense />
              <q-input
                v-model="form.priceNote"
                label="Price / plan note"
                outlined
                dense
                hint="Internal reference only"
              />
              <q-input
                v-model="form.description"
                class="pkg-basics__full"
                label="Description"
                type="textarea"
                outlined
                dense
                autogrow
              />
            </div>
          </div>

          <!-- 2 Roles & scope -->
          <div class="pkg-section">
            <div class="pkg-section__head">
              <h3
                ><span class="pkg-section__step">2</span> Roles &amp; scope</h3
              >
              <span class="pkg-section__meta"
                >{{ form.roles.length }} selected · who can use this seat</span
              >
            </div>
            <p class="pkg-section__hint">
              Each role carries a scope type. Property lists (locations /
              hotels) are set when you assign this seat on
              <router-link to="/admin/users">People</router-link>.
            </p>
            <div class="pkg-roles">
              <button
                v-for="opt in roleOptions"
                :key="opt.value"
                type="button"
                class="pkg-role"
                :class="{ 'pkg-role--on': form.roles.includes(opt.value) }"
                @click="toggleRole(opt.value)"
              >
                <span class="pkg-role__check">
                  <q-icon
                    :name="form.roles.includes(opt.value) ? 'check' : 'add'"
                    size="16px"
                  />
                </span>
                <span class="pkg-role__text">
                  <strong>{{ opt.label }}</strong>
                  <small>{{ roleHints[opt.value] }}</small>
                  <em class="pkg-role__scope">{{
                    roleScopeLabel[opt.value]
                  }}</em>
                </span>
              </button>
            </div>
          </div>

          <!-- 3 Features + 4 Permissions (nested) -->
          <div class="pkg-section">
            <div class="pkg-section__head">
              <h3>
                <span class="pkg-section__step">3</span>
                Features &amp; permissions
              </h3>
              <span class="pkg-section__meta"
                >{{ selectedFeatureCount }} features ·
                {{ selectedPermissionCount }} permissions ·
                {{ adminOnCount }}/{{ adminTotal }} admin ·
                {{ publicOnCount }}/{{ publicTotal }} public</span
              >
            </div>
            <p class="pkg-section__hint">
              Turn on a <strong>feature</strong> (module), then open it to grant
              nested <strong>permissions</strong>. Permissions belong to their
              feature.
            </p>

            <div class="pkg-feat-toolbar">
              <q-input
                v-model="featQuery"
                dense
                outlined
                clearable
                placeholder="Search features or permissions…"
                style="min-width: min(100%, 220px); background: #fff"
              >
                <template #prepend
                  ><q-icon name="search" size="18px"
                /></template>
              </q-input>
              <div class="pkg-feat-toolbar__tabs">
                <button
                  type="button"
                  class="pkg-tab"
                  :class="{ 'pkg-tab--on': featTab === 'admin' }"
                  @click="featTab = 'admin'"
                >
                  Admin
                </button>
                <button
                  type="button"
                  class="pkg-tab"
                  :class="{ 'pkg-tab--on': featTab === 'public' }"
                  @click="featTab = 'public'"
                >
                  Public site
                </button>
              </div>
            </div>

            <div class="pkg-modules">
              <article
                v-for="node in visibleModules"
                :key="node.parent.key"
                class="pkg-mod"
                :class="{
                  'pkg-mod--on': form.featureKeys.includes(node.parent.key),
                  'pkg-mod--locked':
                    node.parent.key === 'features' && !isCustomerOnly
                }"
              >
                <header class="pkg-mod__head">
                  <label class="pkg-mod__toggle">
                    <q-checkbox
                      :model-value="form.featureKeys.includes(node.parent.key)"
                      :disable="
                        node.parent.key === 'features' && !isCustomerOnly
                      "
                      dense
                      @update:model-value="
                        (v: boolean | null) =>
                          toggleFeat(node.parent.key, Boolean(v))
                      "
                    />
                    <span>
                      <strong>{{ node.parent.label }}</strong>
                      <small>{{ node.parent.description }}</small>
                    </span>
                  </label>
                  <div class="pkg-mod__side">
                    <q-badge
                      v-if="node.parent.paidAddOn"
                      color="warning"
                      outline
                      >add-on</q-badge
                    >
                    <template v-if="node.children.length">
                      <span class="pkg-mod__count"
                        >{{ childOnCount(node) }}/{{
                          node.children.length
                        }}
                        perms</span
                      >
                      <q-btn
                        flat
                        dense
                        round
                        size="sm"
                        :icon="
                          expanded[node.parent.key]
                            ? 'expand_less'
                            : 'expand_more'
                        "
                        :aria-label="
                          expanded[node.parent.key]
                            ? 'Hide permissions'
                            : 'Show permissions'
                        "
                        @click="toggleExpand(node.parent.key)"
                      />
                    </template>
                  </div>
                </header>

                <div
                  v-if="node.children.length && expanded[node.parent.key]"
                  class="pkg-mod__subs"
                >
                  <div class="pkg-mod__subs-bar">
                    <span>Permissions under {{ node.parent.label }}</span>
                    <button
                      type="button"
                      class="pkg-mod__link"
                      @click="setAllChildren(node, true)"
                    >
                      All on
                    </button>
                    <button
                      type="button"
                      class="pkg-mod__link"
                      @click="setAllChildren(node, false)"
                    >
                      All off
                    </button>
                  </div>
                  <div class="pkg-subs">
                    <label
                      v-for="child in node.children"
                      :key="child.key"
                      class="pkg-sub"
                      :class="{
                        'pkg-sub--on': form.featureKeys.includes(child.key)
                      }"
                    >
                      <q-checkbox
                        :model-value="form.featureKeys.includes(child.key)"
                        dense
                        @update:model-value="
                          (v: boolean | null) =>
                            toggleFeat(child.key, Boolean(v))
                        "
                      />
                      <span>
                        <strong>{{ child.label }}</strong>
                        <small>{{ child.description }}</small>
                      </span>
                    </label>
                  </div>
                </div>
              </article>

              <p v-if="!visibleModules.length" class="pkg-rail__empty">
                No features match “{{ featQuery }}”.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import AccessHubBanner from "@/components/admin/AccessHubBanner.vue";
import { PACKAGE_CLIENT_ROLES } from "@/constants/roles";
import { roleLabels, useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { AdminRole, ProductFeature, ProductPackage } from "@/types/greyon";

type FeatNode = { parent: ProductFeature; children: ProductFeature[] };

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const selectedId = ref(cms.activePackageId);
const isNew = ref(false);
const listQuery = ref("");
const roleFilter = ref<AdminRole | "all">("all");
const featQuery = ref("");
const featTab = ref<"admin" | "public">("admin");
const expanded = reactive<Record<string, boolean>>({});
const snapshot = ref("");

onMounted(async () => {
  await cms.ensureDeveloperBundle();
  if (!selectedId.value && cms.activePackageId) {
    selectedId.value = cms.activePackageId;
  }
});

const roleOptions = [
  { label: roleLabels.developer, value: "developer" as AdminRole },
  ...PACKAGE_CLIENT_ROLES.map(r => ({ label: roleLabels[r], value: r }))
];

const roleHints: Record<AdminRole, string> = {
  developer: "Platform owner — packages & full access",
  admin: "Org admin — locations + assign Manager / Hotel desk",
  manager: "Runs assigned destinations (many OK)",
  hotel_admin: "Front desk for assigned hotels",
  customer: "Guest — public site, own bookings only",
  org_admin: "",
  location_admin: "",
  super_admin: "",
  content_admin: "",
  booking_admin: ""
};

const roleScopeLabel: Record<AdminRole, string> = {
  developer: "Scope: global",
  admin: "Scope: all locations",
  manager: "Scope: assigned locations",
  hotel_admin: "Scope: assigned hotels",
  customer: "Scope: own bookings",
  org_admin: "",
  location_admin: "",
  super_admin: "",
  content_admin: "",
  booking_admin: ""
};

const roleFilters: { label: string; value: AdminRole | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Hotel", value: "hotel_admin" },
  { label: "Customer", value: "customer" }
];

const form = reactive({
  name: "",
  description: "",
  priceNote: "",
  featureKeys: [] as string[],
  roles: ["admin"] as AdminRole[]
});

const isCustomerOnly = computed(
  () => form.roles.length === 1 && form.roles[0] === "customer"
);

const dirty = computed(() => JSON.stringify(formSnapshot()) !== snapshot.value);

const editing = computed(() =>
  isNew.value
    ? ({
        id: "",
        name: form.name,
        description: form.description,
        priceNote: form.priceNote,
        featureKeys: form.featureKeys,
        roles: form.roles,
        isSystem: false
      } as ProductPackage)
    : (cms.packages.find(p => p.id === selectedId.value) ?? null)
);

const activePkg = computed(() =>
  cms.packages.find(p => p.id === cms.activePackageId)
);

const filteredPackages = computed(() => {
  const q = listQuery.value.trim().toLowerCase();
  return cms.packages.filter(pkg => {
    if (roleFilter.value !== "all" && !pkg.roles.includes(roleFilter.value)) {
      return false;
    }
    if (!q) return true;
    const hay =
      `${pkg.name} ${pkg.description} ${pkg.roles.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
});

const featureTree = computed(() => {
  const build = (category: "admin" | "public"): FeatNode[] => {
    const items = cms.features.filter(f => f.category === category);
    const parents = items.filter(f => !f.parentKey);
    return parents.map(parent => ({
      parent,
      children: items.filter(f => f.parentKey === parent.key)
    }));
  };
  return {
    admin: build("admin"),
    public: build("public")
  };
});

const visibleModules = computed(() => {
  const nodes = featureTree.value[featTab.value];
  const q = featQuery.value.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.filter(n => {
    const parentHit =
      `${n.parent.label} ${n.parent.description} ${n.parent.key}`
        .toLowerCase()
        .includes(q);
    const childHit = n.children.some(c =>
      `${c.label} ${c.description} ${c.key}`.toLowerCase().includes(q)
    );
    return parentHit || childHit;
  });
});

const adminTotal = computed(
  () => cms.features.filter(f => f.category === "admin").length
);
const publicTotal = computed(
  () => cms.features.filter(f => f.category === "public").length
);
const adminOnCount = computed(
  () =>
    form.featureKeys.filter(k =>
      cms.features.some(f => f.key === k && f.category === "admin")
    ).length
);
const publicOnCount = computed(
  () =>
    form.featureKeys.filter(k =>
      cms.features.some(f => f.key === k && f.category === "public")
    ).length
);

const selectedFeatureCount = computed(
  () =>
    form.featureKeys.filter(k =>
      cms.features.some(f => f.key === k && !f.parentKey)
    ).length
);
const selectedPermissionCount = computed(
  () =>
    form.featureKeys.filter(k =>
      cms.features.some(f => f.key === k && Boolean(f.parentKey))
    ).length
);

function formSnapshot() {
  return {
    name: form.name,
    description: form.description,
    priceNote: form.priceNote,
    featureKeys: [...form.featureKeys].sort(),
    roles: [...form.roles].sort()
  };
}

function markClean() {
  snapshot.value = JSON.stringify(formSnapshot());
}

function shortRoles(roles: AdminRole[]) {
  return roles.map(r => roleLabels[r]?.replace(" admin", "") ?? r).join(" · ");
}

function featureOnlyCount(pkg: ProductPackage) {
  return pkg.featureKeys.filter(k =>
    cms.features.some(f => f.key === k && !f.parentKey)
  ).length;
}

function permissionOnlyCount(pkg: ProductPackage) {
  return pkg.featureKeys.filter(k =>
    cms.features.some(f => f.key === k && Boolean(f.parentKey))
  ).length;
}

function childOnCount(node: FeatNode) {
  return node.children.filter(c => form.featureKeys.includes(c.key)).length;
}

function toggleExpand(key: string) {
  expanded[key] = !expanded[key];
}

function ensureParentsExpanded() {
  for (const node of [
    ...featureTree.value.admin,
    ...featureTree.value.public
  ]) {
    if (!node.children.length) continue;
    const parentOn = form.featureKeys.includes(node.parent.key);
    const childOn = node.children.some(c => form.featureKeys.includes(c.key));
    if (parentOn || childOn) expanded[node.parent.key] = true;
  }
}

function loadForm(pkg: ProductPackage) {
  form.name = pkg.name;
  form.description = pkg.description;
  form.priceNote = pkg.priceNote;
  form.featureKeys = [...pkg.featureKeys];
  form.roles = [
    ...(pkg.roles?.length ? pkg.roles : (["admin"] as AdminRole[]))
  ];
  ensureParentsExpanded();
  markClean();
}

function selectPackage(id: string) {
  isNew.value = false;
  selectedId.value = id;
  const pkg = cms.packages.find(p => p.id === id);
  if (pkg) loadForm(pkg);
}

watch(
  () => cms.activePackageId,
  id => {
    if (!isNew.value) selectPackage(id);
  },
  { immediate: true }
);

function toggleRole(role: AdminRole) {
  const set = new Set(form.roles);
  if (set.has(role)) {
    if (set.size === 1) return;
    set.delete(role);
  } else {
    set.add(role);
  }
  form.roles = Array.from(set);
}

function toggleFeat(key: string, on: boolean) {
  if (key === "features" && !isCustomerOnly.value) return;
  const set = new Set(form.featureKeys);
  if (on) {
    set.add(key);
    const feat = cms.features.find(f => f.key === key);
    if (feat?.parentKey) {
      set.add(feat.parentKey);
      expanded[feat.parentKey] = true;
    } else {
      // Enabling a feature → show its permissions
      const hasPerms = cms.features.some(f => f.parentKey === key);
      if (hasPerms) expanded[key] = true;
    }
  } else {
    set.delete(key);
    cms.features
      .filter(f => f.parentKey === key)
      .forEach(c => set.delete(c.key));
  }
  form.featureKeys = Array.from(set);
}

function setAllChildren(node: FeatNode, on: boolean) {
  if (on) toggleFeat(node.parent.key, true);
  const set = new Set(form.featureKeys);
  if (on) {
    set.add(node.parent.key);
    node.children.forEach(c => set.add(c.key));
  } else {
    node.children.forEach(c => set.delete(c.key));
  }
  form.featureKeys = Array.from(set);
}

function openCreate() {
  isNew.value = true;
  selectedId.value = "";
  form.name = "Custom package";
  form.description = "Custom roles + feature bundle.";
  form.priceNote = "Custom";
  form.roles = ["hotel_admin"];
  form.featureKeys = [
    ...(activePkg.value?.featureKeys ?? ["features", "dashboard"])
  ];
  ensureParentsExpanded();
  snapshot.value = "";
}

async function save() {
  if (!form.name.trim()) {
    $q.notify({ type: "negative", message: "Package name is required." });
    return;
  }
  if (!form.roles.length) {
    $q.notify({ type: "negative", message: "Pick at least one role." });
    return;
  }
  try {
    const saved = await cms.upsertPackage({
      ...(isNew.value ? {} : { id: selectedId.value }),
      name: form.name.trim(),
      description: form.description,
      priceNote: form.priceNote,
      featureKeys: form.featureKeys,
      roles: form.roles
    });
    isNew.value = false;
    selectedId.value = saved.id;
    loadForm(saved);
    // Refresh this session so toggles apply immediately for the developer
    // (assignees pick up changes on next /me refresh or page focus).
    void auth.refreshEngineSession();
    $q.notify({ type: "positive", message: `Saved “${saved.name}”.` });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Save failed."
    });
  }
}

function activate(id: string) {
  cms.setActivePackage(id);
  $q.notify({
    type: "positive",
    message: `Site default is now “${cms.packages.find(p => p.id === id)?.name}”.`
  });
}

async function duplicateActive() {
  if (!activePkg.value) return;
  try {
    const copy = await cms.duplicatePackage(activePkg.value.id);
    if (!copy) return;
    selectPackage(copy.id);
    $q.notify({
      type: "info",
      message: "Duplicated — customize and save when ready."
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Duplicate failed."
    });
  }
}

function remove() {
  if (!selectedId.value || isNew.value) return;
  const pkg = cms.packages.find(p => p.id === selectedId.value);
  if (!pkg || pkg.isSystem) {
    $q.notify({
      type: "warning",
      message: "System packages cannot be deleted. Duplicate to customize."
    });
    return;
  }
  $q.dialog({
    title: `Delete “${pkg.name}”?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await cms.deletePackage(pkg.id);
      selectPackage(cms.activePackageId);
      $q.notify({ type: "positive", message: "Package deleted." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Delete failed."
      });
    }
  });
}
</script>

<style scoped>
.pkg-page {
  max-width: 1280px;
}

.pkg-notice {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.7rem 1rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 10px;
  font-size: 0.88rem;
  color: var(--gy-muted);
}

.pkg-notice strong {
  color: var(--gy-ink);
}

.pkg-notice__link {
  color: var(--gy-gold-deep);
  font-weight: 600;
  text-decoration: none;
}

.pkg-layout {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.pkg-rail {
  position: sticky;
  top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: calc(100vh - 5.5rem);
}

.pkg-rail__search {
  background: #fff;
}

.pkg-rail__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.pkg-filter {
  border: 1px solid rgba(28, 36, 33, 0.12);
  background: #fff;
  color: var(--gy-muted);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  cursor: pointer;
}

.pkg-filter--on {
  border-color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.12);
  color: var(--gy-gold-deep);
}

.pkg-rail__list {
  display: grid;
  gap: 0.5rem;
  overflow: auto;
  padding-right: 0.15rem;
  padding-bottom: 0.5rem;
}

.pkg-rail__empty {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.pkg-card {
  text-align: left;
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-left: 3px solid transparent;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.pkg-card:hover {
  border-color: rgba(154, 123, 60, 0.35);
}

.pkg-card--selected {
  border-color: var(--gy-gold-deep);
  border-left-color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.07);
  box-shadow: 0 8px 22px rgba(26, 24, 20, 0.05);
}

.pkg-card--default:not(.pkg-card--selected) {
  background: rgba(154, 123, 60, 0.03);
}

.pkg-card--draft {
  border-style: dashed;
}

.pkg-card__top {
  display: flex;
  justify-content: space-between;
  gap: 0.45rem;
  align-items: start;
}

.pkg-card__name {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 650;
  line-height: 1.25;
}

.pkg-card__badge {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.18rem 0.4rem;
  border-radius: 4px;
  color: #fff;
  background: var(--gy-gold-deep);
}

.pkg-card__badge--draft {
  background: #6b7280;
}

.pkg-card__desc {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pkg-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem 0.5rem;
  margin-top: 0.55rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.pkg-editor {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-radius: 12px;
  overflow: hidden;
  min-width: 0;
}

.pkg-editor__bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 0.95rem 1.2rem;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid rgba(28, 36, 33, 0.08);
  backdrop-filter: blur(8px);
}

.pkg-editor__eyebrow {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.pkg-editor__dirty {
  color: #b45309;
  letter-spacing: 0.04em;
}

.pkg-editor__title {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.pkg-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.pkg-editor__body {
  padding: 0 1.2rem 1.5rem;
}

.pkg-steps {
  list-style: none;
  margin: 1rem 0 0.35rem;
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  background: #faf9f7;
  border: 1px solid rgba(28, 36, 33, 0.06);
  border-radius: 10px;
}

.pkg-steps__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
  font-weight: 600;
}

.pkg-steps__n {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.15);
  color: var(--gy-gold-deep);
  font-size: 0.72rem;
  font-weight: 700;
}

.pkg-section {
  padding: 1.15rem 0 0.25rem;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
}

.pkg-section:first-of-type {
  border-top: 0;
}

.pkg-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem 0.85rem;
  margin-bottom: 0.55rem;
}

.pkg-section__head h3 {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.pkg-section__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.15);
  color: var(--gy-gold-deep);
  font-size: 0.68rem;
  letter-spacing: 0;
  text-transform: none;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1;
  box-sizing: border-box;
}

.pkg-section__meta {
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.pkg-section__hint {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.pkg-basics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.pkg-basics__full {
  grid-column: 1 / -1;
}

.pkg-roles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.55rem;
  align-items: stretch;
}

.pkg-role {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
  text-align: left;
  padding: 0.75rem 0.8rem;
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-radius: 10px;
  background: #faf9f7;
  cursor: pointer;
  font: inherit;
  color: inherit;
  min-height: 6.5rem;
  height: 100%;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.pkg-role:hover {
  border-color: rgba(154, 123, 60, 0.4);
}

.pkg-role--on {
  border-color: var(--gy-gold-deep);
  background: rgba(154, 123, 60, 0.1);
}

.pkg-role__check {
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: rgba(28, 36, 33, 0.06);
  color: var(--gy-muted);
}

.pkg-role--on .pkg-role__check {
  background: var(--gy-gold-deep);
  color: #fff;
}

.pkg-role__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
}

.pkg-role__text strong {
  display: block;
  font-size: 0.9rem;
  line-height: 1.25;
}

.pkg-role__text small {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--gy-muted);
  line-height: 1.35;
  flex: 1;
}

.pkg-role__scope {
  display: block;
  margin-top: 0.45rem;
  font-size: 0.68rem;
  font-style: normal;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 700;
}

.pkg-feat-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pkg-feat-toolbar__tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.2rem;
  background: rgba(28, 36, 33, 0.05);
  border-radius: 8px;
}

.pkg-tab {
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  color: var(--gy-muted);
  cursor: pointer;
}

.pkg-tab--on {
  background: #fff;
  color: var(--gy-ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.pkg-modules {
  display: grid;
  gap: 0.55rem;
}

.pkg-mod {
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-radius: 10px;
  background: #faf9f7;
  overflow: hidden;
}

.pkg-mod--on {
  border-color: rgba(154, 123, 60, 0.35);
  background: #fff;
}

.pkg-mod--locked {
  opacity: 0.72;
}

.pkg-mod__head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: start;
  padding: 0.65rem 0.75rem;
}

.pkg-mod__toggle {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: start;
  cursor: pointer;
  min-width: 0;
}

.pkg-mod__toggle strong {
  display: block;
  font-size: 0.92rem;
}

.pkg-mod__toggle small {
  display: block;
  margin-top: 0.12rem;
  font-size: 0.76rem;
  color: var(--gy-muted);
  line-height: 1.35;
}

.pkg-mod__side {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.pkg-mod__count {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--gy-gold-deep);
  letter-spacing: 0.02em;
}

.pkg-mod__subs {
  border-top: 1px solid rgba(28, 36, 33, 0.06);
  padding: 0.55rem 0.75rem 0.75rem;
  background: rgba(154, 123, 60, 0.04);
}

.pkg-mod__subs-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
  font-weight: 600;
}

.pkg-mod__link {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--gy-gold-deep);
  font-weight: 700;
  cursor: pointer;
}

.pkg-subs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.4rem;
}

.pkg-sub {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem;
  align-items: start;
  padding: 0.5rem 0.55rem;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.pkg-sub--on {
  border-color: rgba(154, 123, 60, 0.4);
  background: rgba(154, 123, 60, 0.08);
}

.pkg-sub strong {
  display: block;
  font-size: 0.82rem;
}

.pkg-sub small {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: var(--gy-muted);
  line-height: 1.3;
}

@media (max-width: 960px) {
  .pkg-layout {
    grid-template-columns: 1fr;
  }

  .pkg-rail {
    position: static;
    max-height: none;
  }

  .pkg-rail__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    max-height: 280px;
  }

  .pkg-basics {
    grid-template-columns: 1fr;
  }
}
</style>
