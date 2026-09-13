# Greyon API (Nest stub — temporary)

**Production target:** Laravel + Breeze — see [../docs/BACKEND_API.md](../docs/BACKEND_API.md)  
**This folder:** NestJS demo API. Keep for now. **Delete when Laravel is integrated.**

## Run it now

Needs PostgreSQL.

```bash
cd api
cp .env.example .env   # if you don't have .env yet
npm install
npm run start:dev
```

API: `http://localhost:3000/api`

Optional Quasar wiring (Nest port **3000**, not Laravel’s 8000):

```
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:3000/api
```

Without those env vars, the SPA keeps using Pinia mock data (fine for UI work).

## What this stub covers today

Public hotels/locations/news, availability, bookings, login, limited admin bookings.  
It does **not** yet match the full foundation (user_packages / multi-role / location scope) in the Laravel handoff doc.
