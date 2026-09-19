# Greyon

Hotel portfolio and booking website for [www.greyon.com.kh](https://www.greyon.com.kh).

**Frontend:** Quasar Vue 3 SPA  
**Backend:** [greyon-engine](../greyon-engine) (Laravel session API)

## Quick start (frontend)

```bash
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:9000 (or the port Quasar prints). Local mode proxies `/engine` to greyon-engine.

## Backend

Run **greyon-engine** separately (Herd / `php artisan serve`). Seed demo admins and packages from that repo.

SPA `.env`:

```
VITE_APP_MODE=local
VITE_USE_API=true
```

## Features

- Public: Home, Hotels, Locations, News, Booking flow, Contact
- Admin CMS at `/admin` (session cookie against greyon-engine)
- Developer: packages, features, admins via `/developer/*`
- SEO helpers, robots.txt, sitemap.xml, cookie notice, analytics placeholder

## Docs

- [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)
- [docs/BACKEND_API.md](docs/BACKEND_API.md) (product contract; live implementation is greyon-engine)

## Demo accounts (engine seeders)

Use credentials from greyon-engine seeders (e.g. developer / admin emails with password `password`).
