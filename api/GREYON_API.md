# Greyon API (NestJS + PostgreSQL)

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

## Endpoints

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
- `POST /api/auth/login` → `{ accessToken, user }`

### Admin (JWT + role)
- `GET /api/admin/bookings` — super_admin, booking_admin
- `PATCH /api/admin/bookings/:reference/status` — body `{ "status": "confirmed" }`

## Schema entities

Location, Hotel, RoomType, RatePlan, Availability, RateCalendar, Booking, News, Enquiry, User

Availability + RateCalendar drive per-night inventory and prices (fallback: room `baseInventory` / plan `basePrice`).

`synchronize` is enabled in development via `DB_SYNC=true`. Use migrations in production.

## Frontend wiring

Set on Quasar app:

```
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:3000/api
```

Without that flag the SPA uses Pinia/mock only.
