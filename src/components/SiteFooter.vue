<template>
  <footer class="gy-footer">
    <div class="gy-container">
      <div class="gy-footer__brand-block">
        <router-link to="/" class="gy-footer__brand" aria-label="Greyon home">
          <img
            class="gy-footer__logo"
            src="/logo/Logo white V1-05.png"
            alt="Greyon"
            width="280"
            height="100"
          />
        </router-link>
        <p class="gy-footer__tagline">
          Always on, always home — stays across Cambodia’s cities, coast, and
          countryside.
        </p>
        <nav class="gy-footer__social" aria-label="Social media">
          <a
            v-for="link in socialLinks"
            :key="link.id"
            class="gy-footer__social-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="link.label"
          >
            <span class="gy-footer__social-icon" aria-hidden="true">
              <svg
                v-if="link.id === 'facebook'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path
                  d="M14 8.2h2.4V4.8H14c-2.1 0-3.6 1.6-3.6 3.7v1.7H8.2v3.4h2.2V19.2h3.4v-5.6h2.5l.5-3.4h-3V8.9c0-.4.3-.7.7-.7z"
                />
              </svg>
              <svg
                v-else-if="link.id === 'youtube'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path
                  d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z"
                />
              </svg>
              <svg
                v-else-if="link.id === 'tiktok'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path
                  d="M16.6 4c.5 1.7 1.7 3.1 3.4 3.6v2.4a6.4 6.4 0 0 1-3.4-1v6.3a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V4h2.6z"
                />
              </svg>
            </span>
          </a>
        </nav>
      </div>

      <div class="gy-footer__columns">
        <div
          v-for="column in columns"
          :key="column.id"
          class="gy-footer__col"
          :class="{ 'is-open': !isMobile || openColumnId === column.id }"
        >
          <button
            type="button"
            class="gy-footer__title"
            :aria-expanded="!isMobile || openColumnId === column.id"
            :tabindex="isMobile ? 0 : -1"
            @click="toggleColumn(column.id)"
          >
            {{ column.title }}
          </button>
          <nav
            v-show="!isMobile || openColumnId === column.id"
            class="gy-footer__links"
          >
            <template v-for="item in column.links" :key="item.label">
              <router-link v-if="item.to" :to="item.to">{{
                item.label
              }}</router-link>
              <a v-else-if="item.href" :href="item.href">{{ item.label }}</a>
              <span v-else class="gy-footer__plain">{{ item.label }}</span>
            </template>
          </nav>
        </div>
      </div>

      <nav class="gy-footer__legal-row" aria-label="Site utilities">
        <router-link to="/map">Map</router-link>
        <router-link v-if="auth.featureEnabled('booking_public')" to="/booking"
          >Booking</router-link
        >
        <router-link to="/sitemap">Sitemap</router-link>
      </nav>

      <div class="gy-footer__bottom">
        <span>© {{ year }} Greyon. All rights reserved.</span>
        <router-link to="/admin/login" class="gy-footer__admin"
          >Admin</router-link
        >
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { SOCIAL_LINKS } from "@/constants/socialLinks";
import { useAuthStore } from "@/stores/auth-store";

type FooterLink = {
  label: string;
  to?: string;
  href?: string;
};

type FooterColumn = {
  id: string;
  title: string;
  links: FooterLink[];
};

const auth = useAuthStore();
const year = new Date().getFullYear();
const socialLinks = SOCIAL_LINKS;

const isMobile = ref(false);
const openColumnId = ref<string | null>(null);
let mobileMq: MediaQueryList | null = null;

function syncMobile() {
  isMobile.value = Boolean(mobileMq?.matches);
  if (!isMobile.value) openColumnId.value = null;
}

function toggleColumn(id: string) {
  if (!isMobile.value) return;
  openColumnId.value = openColumnId.value === id ? null : id;
}

onMounted(() => {
  mobileMq = window.matchMedia("(max-width: 600px)");
  syncMobile();
  mobileMq.addEventListener("change", syncMobile);
});

onUnmounted(() => {
  mobileMq?.removeEventListener("change", syncMobile);
});

const columns = computed<FooterColumn[]>(() => {
  const discover: FooterLink[] = [
    { label: "Serviced Apartments", to: "/apartments" },
    { label: "Hotels", to: "/hotels" },
    { label: "Our story", to: "/about" }
  ];
  if (auth.featureEnabled("news_public")) {
    discover.push({ label: "News & insights", to: "/news" });
  }
  // Experiences live on hotel pages (services chips); no dedicated public page yet.
  discover.push({ label: "Experiences & services", to: "/hotels" });

  const findStay: FooterLink[] = [
    { label: "Phnom Penh", to: "/locations/phnom-penh" },
    { label: "Sihanoukville", to: "/locations/sihanoukville" },
    { label: "Kampot", to: "/locations/kampot" },
    { label: "All destinations", to: "/locations" }
  ];

  const stayConnected: FooterLink[] = [
    { label: "Privacy policy", to: "/privacy" },
    { label: "Terms & conditions", to: "/terms" },
    { label: "Booking terms", to: "/booking-terms" },
    { label: "hello@greyon.com.kh", href: "mailto:hello@greyon.com.kh" },
    { label: "+855 23 000 000", href: "tel:+85523000000" }
  ];

  const help: FooterLink[] = [];
  if (auth.featureEnabled("contact_public")) {
    help.push({ label: "Contact us", to: "/contact" });
  }
  // FAQ and Booking assistance: pending client confirmation — do not add yet.

  return [
    { id: "discover", title: "Discover GREYON", links: discover },
    { id: "find", title: "Find your next stay", links: findStay },
    { id: "connected", title: "Stay connected", links: stayConnected },
    { id: "help", title: "We're here to help", links: help }
  ].filter(col => col.links.length > 0);
});
</script>

<style scoped>
.gy-footer {
  background: linear-gradient(180deg, #3a322c 0%, var(--gy-ink) 42%);
  color: rgba(255, 255, 255, 0.88);
  padding: 4rem 0 1.75rem;
  margin-top: auto;
}

.gy-footer__brand-block {
  max-width: 28rem;
  margin-bottom: 2.5rem;
}

.gy-footer__brand {
  display: inline-block;
  margin: 0 0 1rem;
}

.gy-footer__logo {
  display: block;
  height: clamp(4.75rem, 9vw, 6.25rem);
  width: auto;
  object-fit: contain;
}

.gy-footer__tagline {
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.6;
  font-size: 0.95rem;
}

.gy-footer__social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.15rem;
}

.gy-footer__social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.gy-footer__social-link:hover,
.gy-footer__social-link:focus-visible {
  color: var(--gy-gold);
  border-color: rgba(196, 163, 90, 0.7);
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.gy-footer__social-icon {
  display: inline-flex;
  line-height: 0;
}

.gy-footer__columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2rem 1.75rem;
}

.gy-footer__col {
  min-width: 0;
}

.gy-footer__title {
  display: block;
  width: 100%;
  margin: 0 0 0.95rem;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--gy-gold);
  cursor: default;
  pointer-events: none;
}

.gy-footer__links {
  display: grid;
  gap: 0.15rem;
}

.gy-footer__links a,
.gy-footer__plain {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-block: 0.35rem;
  color: rgba(255, 255, 255, 0.82);
  transition:
    color 0.25s ease,
    padding-left 0.25s ease;
}

.gy-footer__links a:hover {
  color: var(--gy-gold);
  padding-left: 0.2rem;
}

.gy-footer__plain {
  color: rgba(255, 255, 255, 0.62);
}

.gy-footer__legal-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.35rem;
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

.gy-footer__legal-row a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(255, 255, 255, 0.62);
  transition: color 0.2s ease;
}

.gy-footer__legal-row a:hover {
  color: var(--gy-gold);
}

.gy-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
}

.gy-footer__admin {
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.25s ease;
}

.gy-footer__admin:hover {
  color: var(--gy-gold);
}

@media (max-width: 960px) {
  .gy-footer__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .gy-footer__brand-block {
    max-width: none;
    margin-bottom: 1.75rem;
  }

  .gy-footer__logo {
    height: 4.5rem;
  }

  .gy-footer__columns {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .gy-footer__col {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .gy-footer__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 1rem 0;
    cursor: pointer;
    pointer-events: auto;
  }

  .gy-footer__title::after {
    content: "";
    width: 0.45rem;
    height: 0.45rem;
    border-right: 1.5px solid var(--gy-gold);
    border-bottom: 1.5px solid var(--gy-gold);
    transform: rotate(45deg);
    transition: transform 0.2s ease;
    opacity: 0.85;
  }

  .gy-footer__col.is-open .gy-footer__title::after {
    transform: rotate(-135deg);
  }

  .gy-footer__links {
    padding-bottom: 0.75rem;
  }

  .gy-footer__legal-row {
    flex-direction: column;
    gap: 0;
    margin-top: 1.5rem;
  }

  .gy-footer__bottom {
    flex-direction: column;
  }
}
</style>
