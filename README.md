# Greyon

Hotel portfolio and booking website for [www.greyon.com.kh](https://www.greyon.com.kh).

**Frontend:** Quasar Vue 3 SPA (Pinia CMS + mock by default)  
**Backend:** NestJS + PostgreSQL in `api/` (optional; wire with `VITE_USE_API=true`)

## Quick start (frontend)

```bash
npm install
npm run dev
```

App: http://localhost:9000

## Optional Nest API

```bash
cd api
cp .env.example .env
# Create Postgres DB greyon, then:
npm install
# SEED_ON_BOOT=true in .env for demo data
npm run start:dev
```

API: http://localhost:3000/api

Frontend `.env`:

```
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:3000/api
```

## MVP features

- Public: Home, Hotels, Locations (6), News, Booking flow, Contact
- Admin CMS at `/admin` with role-based demo auth (Pinia)
- Nest: public reads, availability, bookings, JWT login, admin booking status
- SEO helpers, robots.txt, sitemap.xml, cookie notice, analytics placeholder

## Docs

- [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)
- [api/GREYON_API.md](api/GREYON_API.md)

## Admin demo users (SPA)

| Email | Role |
|-------|------|
| admin@greyon.com.kh | Super Admin |
| content@greyon.com.kh | Content Admin |
| bookings@greyon.com.kh | Booking Admin |

SPA demo: any password. Nest seed users: password `password`.
