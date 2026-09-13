# Greyon API (NestJS + PostgreSQL)

> **Foundation access model (users · packages · roles · features · scope)**  
> See **[FOUNDATION_API_SPEC.md](./FOUNDATION_API_SPEC.md)** — implement that before expanding admin CRUD.  
> Current stub below is outdated (`User.role` / singular `package_id`).

## Setup

1. Copy `.env.example` to `.env`
2. Create PostgreSQL database `greyon`
3. Set `SEED_ON_BOOT=true` for first run
4. Install and run:

```bash
cd api
npm install
npm run start:dev
```

API base: `http://localhost:3000/api`

## Endpoints (stub — incomplete)

### Public
- `GET /api/hotels`
- `GET /api/hotels/:slug`
- `GET /api/locations`
- `GET /api/locations/:slug`
- `GET /api/news`
- `GET /api/news/:slug`
- `POST /api/enquiries`
- `GET /api/availability`
- `POST /api/bookings`
- `GET /api/bookings/:reference`

### Auth
- `POST /api/auth/login` → `{ accessToken, user }` (user payload must match foundation spec)

### Admin (JWT)
- Bookings list/status exist partially — **must filter by hotel scope**
- Full admin surface: see FOUNDATION_API_SPEC.md §7–8

## Schema entities

**Foundation (required):** Feature, Package, UserPackage, User (no role column; `location_ids` / `hotel_ids`), Settings.active_package_id  

**Content:** Location, Hotel, RoomType, RatePlan, Availability, RateCalendar, Booking, News, Enquiry  

Availability + RateCalendar drive per-night inventory and prices (fallback: room `baseInventory` / plan `basePrice`).

`synchronize` is enabled in development via `DB_SYNC=true`. Use migrations in production.

## Frontend wiring

Set on Quasar app:

```
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:3000/api
```

Without that flag the SPA uses Pinia/mock only.
