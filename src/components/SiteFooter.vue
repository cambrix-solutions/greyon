<template>
  <footer class="gy-footer">
    <div class="gy-container gy-footer__grid">
      <div>
        <p class="gy-footer__brand gy-display">Greyon</p>
        <p class="gy-muted">
          Premium hotel stays across Cambodia — discover, stay, and book with
          confidence.
        </p>
      </div>
      <div>
        <p class="gy-footer__title">Explore</p>
        <nav class="gy-footer__links">
          <router-link to="/hotels">Hotels</router-link>
          <router-link to="/locations">Locations</router-link>
          <router-link to="/news">News</router-link>
          <router-link to="/booking">Booking</router-link>
          <router-link to="/contact">Contact</router-link>
          <router-link to="/sitemap">Sitemap</router-link>
        </nav>
      </div>
      <div>
        <p class="gy-footer__title">Portfolios</p>
        <nav class="gy-footer__links">
          <router-link to="/hotels">Hotel</router-link>
          <router-link to="/portfolios/service-apartment"
            >Service Apartment</router-link
          >
          <router-link to="/portfolios/boutique">Boutique</router-link>
          <router-link to="/portfolios/resort">Resort</router-link>
        </nav>
      </div>
      <div>
        <p class="gy-footer__title">Legal</p>
        <nav class="gy-footer__links">
          <router-link to="/privacy">Privacy</router-link>
          <router-link to="/terms">Terms</router-link>
          <router-link to="/booking-terms">Booking terms</router-link>
        </nav>
        <p class="gy-muted q-mt-md">www.greyon.com.kh</p>
        <p class="gy-muted">hello@greyon.com.kh</p>
        <p class="gy-muted">+855 23 000 000</p>
      </div>
    </div>
    <div class="gy-container gy-footer__bottom">
      <span>© {{ year }} Greyon. All rights reserved.</span>
      <router-link to="/admin/login" class="gy-footer__admin"
        >Admin</router-link
      >
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<style scoped>
.gy-footer {
  background:
    linear-gradient(180deg, #18201d 0%, var(--gy-ink) 40%);
  color: rgba(255, 255, 255, 0.88);
  padding: 4rem 0 1.75rem;
  margin-top: auto;
}

.gy-footer__grid {
  display: grid;
  grid-template-columns: 1.45fr repeat(3, 1fr);
  gap: 2.25rem;
}

.gy-footer__brand {
  font-size: 2.25rem;
  margin: 0 0 0.85rem;
  color: var(--gy-white);
}

.gy-footer :deep(.gy-muted),
.gy-footer .gy-muted {
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.6;
}

.gy-footer__title {
  margin: 0 0 0.95rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: var(--gy-gold);
}

.gy-footer__links {
  display: grid;
  gap: 0.5rem;
}

.gy-footer__links a {
  transition: color 0.25s ease, padding-left 0.25s ease;
}

.gy-footer__links a:hover {
  color: var(--gy-gold);
  padding-left: 0.2rem;
}

.gy-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2.75rem;
  padding-top: 1.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

@media (max-width: 900px) {
  .gy-footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .gy-footer__grid {
    grid-template-columns: 1fr;
  }

  .gy-footer__bottom {
    flex-direction: column;
  }
}
</style>
