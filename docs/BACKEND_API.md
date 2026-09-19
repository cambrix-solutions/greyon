# Greyon Backend API — Handoff Spec

**Status:** Implemented in **greyon-engine** (Laravel). The Quasar SPA talks to it with session cookies (`VITE_USE_API=true`). Nest `/api` and SPA seed mocks are removed.

**JSON:** camelCase request/response bodies (Laravel API Resources)  
**Auth:** Session cookies on `admin` / `developer` / `web` guards (CSRF disabled for JSON clients). Not Sanctum Bearer.

> This document remains the product contract. Prefer live routes in greyon-engine (`routes/admin.php`, `developer.php`, `public.php`) when they differ from older sketches below (e.g. packages live under `/developer/*`, not `/admin/*`).

---

## Table of contents

1. [Domain model](#1-domain-model)
2. [Roles & permissions](#2-roles--permissions)
3. [Features catalog](#3-features-catalog)
4. [Database schema](#4-database-schema)
5. [Authorization rules](#5-authorization-rules)
6. [Auth endpoints](#6-auth-endpoints)
7. [Foundation admin API](#7-foundation-admin-api-users--packages--features)
8. [Content & ops admin API](#8-content--ops-admin-api)
9. [Public API](#9-public-api)
10. [Error conventions](#10-error-conventions)
11. [Seed / demo accounts](#11-seed--demo-accounts)
12. [Acceptance tests](#12-acceptance-tests)
13. [Frontend wiring](#13-frontend-wiring)

---

## 1. Domain model

```
users  ←────── user_packages (M2M) ──────→  packages
                                                   │
                                                   ├── roles[]        (many)
                                                   └── featureKeys[]  (many)

User does NOT store role or packageId.
Effective roles + features = UNION of all linked packages.

Property hierarchy:
  Location (destination)
    └── Hotel
          └── RoomType → RatePlan / Availability / RateCalendar / Booking
```

**Scope (data isolation):**

| Seat | Field on user | Sees |
|------|---------------|------|
| `developer` / `admin` | — | All locations & hotels |
| `manager` | `locationIds[]` | Hotels + bookings in those destinations only |
| `hotel_admin` | `hotelIds[]` | Those hotels only |
| `customer` | — | Public site only (no admin) |

**Who can assign packages?** Only `developer`. End users cannot add packages to themselves.

**Locations sub-features:** A location can have several hotels; each location can have a manager; hotels under that location can have hotel admins. Feature keys under `locations` control finer capabilities (managers, hotels, publish, SEO).

---

## 2. Roles & permissions

### Canonical roles

```
developer | admin | manager | hotel_admin | customer
```

Do **not** invent new first-class roles. (Ignore legacy SPA aliases: `org_admin`, `super_admin`, etc.)

A package may grant **multiple** roles, e.g. `["admin","manager"]`.  
A user may hold **multiple** packages → union of roles and features.

### Permission check (every admin route)

```
can(user, perm) =
  developer → allowed if perm in developer matrix
  else →
    perm ∈ effectiveFeatureKeys(user)
    AND at least one effectiveRole(user) allows perm
```

### Role × permission matrix

| Permission | developer | admin | manager | hotel_admin | customer |
|------------|:---------:|:-----:|:-------:|:-----------:|:--------:|
| `dashboard` | ✓ | ✓ | ✓ | ✓ | |
| `locations` (+ `locations_*`) | ✓ | ✓ | ✓ | | |
| `hotels` | ✓ | ✓ | ✓ | ✓ | |
| `rooms` | ✓ | ✓ | ✓ | ✓ | |
| `rates` | ✓ | ✓ | ✓ | ✓ | |
| `bookings` | ✓ | ✓ | ✓ | ✓ | |
| `news` | ✓ | ✓ | ✓ | | |
| `enquiries` | ✓ | ✓ | * | * | |
| `media` | ✓ | ✓ | | | |
| `settings` | ✓ | ✓ | | | |
| `users` | ✓ | ✓ | self read | self read | |
| `features` (packages UI) | ✓ | | | | |

\* Contact enquiries have **no hotelId** today. Until you add optional `hotelId` / `locationId` on enquiries, only **global** seats (`developer`, `admin`) should list them. Managers / hotel admins get an empty list.

---

## 3. Features catalog

Seed these keys (table `features`). `enabled` for **public** visitors is derived from the **site default package**, not stored per row.

### Admin parents

| key | label |
|-----|--------|
| `dashboard` | Dashboard |
| `locations` | Locations (parent) |
| `hotels` | Hotels |
| `rooms` | Room types |
| `rates` | Rates & availability |
| `bookings` | Bookings |
| `news` | News |
| `media` | Media library (add-on) |
| `enquiries` | Enquiries |
| `settings` | SEO / Settings |
| `users` | Users |
| `features` | Packages builder |

### Admin children (`parentKey = locations`)

| key | Purpose |
|-----|---------|
| `locations_list` | Edit destination content |
| `locations_managers` | Assign managers per destination |
| `locations_hotels` | Hotels under locations |
| `locations_publish` | Publish / archive |
| `locations_seo` | SEO fields |

### Public

| key | Gates |
|-----|--------|
| `booking_public` | `/booking` |
| `news_public` | `/news` |
| `contact_public` | `/contact` |
| `portfolios` | Portfolio stubs |

---

## 4. Database schema

### `features`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| key | varchar UNIQUE | |
| label | varchar | |
| description | text | |
| category | `admin` \| `public` | |
| parent_key | varchar NULL | e.g. `locations` |
| paid_add_on | boolean | |
| sort_order | int | optional |

### `packages`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar | |
| description | text | |
| price_note | varchar | Internal label |
| roles | jsonb / text[] | e.g. `["manager"]` |
| feature_keys | jsonb / text[] | |
| is_system | boolean | System rows cannot be deleted |
| created_at / updated_at | timestamptz | |

### `user_packages`

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK → users ON DELETE CASCADE |
| package_id | uuid FK → packages ON DELETE RESTRICT |
| UNIQUE (user_id, package_id) | |

### `users`

**Remove** any `role` or `package_id` column.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar | |
| email | varchar UNIQUE | |
| password_hash | varchar | |
| location_ids | uuid[] / jsonb | Managers |
| hotel_ids | uuid[] / jsonb | Hotel admins |
| active | boolean | |
| created_at / updated_at | timestamptz | |

### `site_settings` (single row)

| Column | Type |
|--------|------|
| id | int PK (= 1) |
| active_package_id | uuid FK → packages | Site default for public feature flags |

### Content (already familiar)

- `locations`
- `hotels` (`location_id`)
- `room_types` (`hotel_id`)
- `rate_plans` (`room_type_id`)
- `availability` (`room_type_id`, `date`, `available_units`, `stop_sell`)
- `rate_calendar` (`rate_plan_id`, `date`, `price`, `min_stay`, `max_stay`)
- `bookings` (`hotel_id`, `room_type_id`, `rate_plan_id`, guest fields, money, `status`, `source`, `reference`)
- `news`
- `enquiries` (optional later: `hotel_id` / `location_id`)

### Enums

```
content_status: draft | published | archived
booking_status: pending | confirmed | cancelled | completed
enquiry_status: new | in_progress | closed
admin_role:     developer | admin | manager | hotel_admin | customer
```

---

## 5. Authorization rules

Implement once; reuse on every admin query.

```text
effectiveRoles(user)    = UNION package.roles via user_packages
effectiveFeatures(user) = UNION package.feature_keys via user_packages

isGlobal(user) = roles ∩ {developer, admin} ≠ ∅

canAccessHotel(user, hotelId):
  if isGlobal → true
  if hotel_admin → hotelId ∈ user.hotel_ids
  if manager → hotel.location_id ∈ user.location_ids
  else → false

canAccessLocation(user, locationId):
  if isGlobal → true
  if manager → locationId ∈ user.location_ids
  if hotel_admin → ∃ hotel in that location with id ∈ user.hotel_ids
  else → false
```

**Hard rule:** `GET /admin/bookings` (and hotels/rooms/rates) **must** filter by `canAccessHotel`.  
A Siem Reap manager must never see a Phnom Penh booking.

If the user lacks page permission → `403` (SPA shows access-denied / 404 UX).  
If resource exists but out of scope → `404` preferred (do not leak existence).

When user has both `admin` and `manager`, **global wins** for data scope.

---

## 6. Auth endpoints

### `POST /auth/login`

**Body**

```json
{ "email": "sr@greyon.com.kh", "password": "secret" }
```

**200**

```json
{
  "accessToken": "<sanctum-token>",
  "user": {
    "id": "uuid",
    "name": "Siem Reap Manager",
    "email": "sr@greyon.com.kh",
    "locationIds": ["uuid-loc-sr"],
    "hotelIds": [],
    "roles": ["manager"],
    "featureKeys": ["dashboard", "locations", "hotels", "bookings", "…"],
    "packages": [{ "id": "uuid", "name": "Manager · Content+" }]
  }
}
```

**Errors**

- `401` invalid credentials  
- `403` customer-only account trying admin login  

Token is a Sanctum personal access token (Breeze API). Prefer reloading roles/features from DB per request (or short cache).

### `GET /auth/me`

Requires Bearer token. Same `user` object as login (refresh after package changes).

### `POST /auth/logout` (optional)

Client discards token; or server blacklist if required.

---

## 7. Foundation admin API (users · packages · features)

All require Bearer token + `can(user, ...)`.

### Features

| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/admin/features` | seats with `users` or `features` | Full catalog (tree) |

### Packages (developer only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/packages` | List (+ user counts) |
| GET | `/admin/packages/:id` | Detail |
| POST | `/admin/packages` | Create |
| PATCH | `/admin/packages/:id` | Update |
| DELETE | `/admin/packages/:id` | Block if `isSystem` |
| POST | `/admin/packages/:id/duplicate` | Copy |
| POST | `/admin/packages/:id/activate` | Set site default |

**Create / patch body**

```json
{
  "name": "Manager · Booking Pro",
  "description": "Location manager with rates",
  "priceNote": "Pro",
  "roles": ["manager"],
  "featureKeys": [
    "features",
    "dashboard",
    "locations",
    "locations_list",
    "locations_managers",
    "locations_hotels",
    "hotels",
    "rooms",
    "rates",
    "bookings",
    "users",
    "booking_public",
    "contact_public"
  ]
}
```

**Validation**

- `roles` non-empty  
- Unknown feature keys → `400`  
- Non-customer packages should include `dashboard` (and usually `features` key for matrix consistency)

### Users

| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/admin/users` | developer: all; others: self | Include packages, roles, scope |
| GET | `/admin/users/:id` | developer or self | |
| POST | `/admin/users` | developer | |
| PATCH | `/admin/users/:id` | developer | |
| DELETE | `/admin/users/:id` | developer | Keep ≥1 developer |
| PUT | `/admin/users/:id/packages` | developer | Replace M2M set |

**Create / patch body**

```json
{
  "name": "Phnom Penh Manager",
  "email": "pp@greyon.com.kh",
  "password": "optional-on-create",
  "packageIds": ["uuid-pkg-1"],
  "locationIds": ["uuid-loc-pp"],
  "hotelIds": []
}
```

**Validation**

- ≥1 `packageIds`  
- Effective roles include `manager` → `locationIds` required  
- Effective roles include `hotel_admin` → `hotelIds` required  
- Clear unused scope when roles no longer need it  
- Non-developer cannot change own packages or scope (read-only “My access”)

**PUT packages body**

```json
{ "packageIds": ["uuid-1", "uuid-2"] }
```

---

## 8. Content & ops admin API

Apply **permission** + **hotel/location scope** on every list/get/write.

### Locations — perm `locations`

| Method | Path | Scope |
|--------|------|-------|
| GET | `/admin/locations` | `canAccessLocation` |
| GET | `/admin/locations/:id` | |
| POST | `/admin/locations` | global / allowed |
| PATCH | `/admin/locations/:id` | |
| DELETE | `/admin/locations/:id` | |

**Body fields:** `name`, `slug`, `description`, `heroImage`, `gallery[]`, `highlights[]`, `status`, `seoTitle`, `seoDescription`

### Hotels — perm `hotels`

| Method | Path | Scope |
|--------|------|-------|
| GET | `/admin/hotels` | `canAccessHotel` |
| GET | `/admin/hotels/:id` | |
| POST / PATCH / DELETE | `/admin/hotels…` | |

**Body fields:** `name`, `slug`, `locationId`, `shortDescription`, `description`, `address`, `coordinates {lat,lng}`, `phone`, `email`, `heroImage`, `gallery[]`, `amenities[]`, `policies[]`, `checkInTime`, `checkOutTime`, `featured`, `status`, SEO fields

### Room types — perm `rooms`

Scoped via `hotelId`.

Fields: `hotelId`, `name`, `slug`, `description`, `images[]`, `bedType`, `roomSize`, `maxAdults`, `maxChildren`, `maxGuests`, `amenities[]`, `baseInventory`, `status`

### Rate plans — perm `rates`

Scoped via room → hotel.

Fields: `roomTypeId`, `name`, `description`, `mealBenefit`, `cancellationPolicy`, `basePrice`, `taxPercent`, `serviceFeePercent`, `status`

### Availability & rate calendar — perm `rates`

```
GET  /admin/availability?roomTypeId=&from=&to=
PUT  /admin/availability          { roomTypeId, date, availableUnits, stopSell }
GET  /admin/rate-calendar?ratePlanId=&from=&to=
PUT  /admin/rate-calendar         { ratePlanId, date, price, minStay?, maxStay? }
```

### Bookings — perm `bookings` (**critical scope**)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/bookings?status=&q=` | Filter by scoped hotels |
| GET | `/admin/bookings/:reference` | 404 if out of scope |
| PATCH | `/admin/bookings/:reference/status` | `{ "status": "confirmed" }` |
| POST | `/admin/bookings` | Admin-created; hotel must be in scope |

Statuses: `pending` \| `confirmed` \| `cancelled` \| `completed`

### News — perm `news`

CRUD on articles: `title`, `slug`, `coverImage`, `excerpt`, `body`, `publishedAt`, `status`, SEO

### Enquiries — perm `enquiries`

```
GET   /admin/enquiries?status=
PATCH /admin/enquiries/:id     { status?, internalNotes? }
DELETE /admin/enquiries/:id
```

Global seats only until enquiry is location/hotel scoped.

### Media — perm `media`

List / upload / delete assets (storage detail up to you: S3, local, etc.).

### Settings — perm `settings`

Site SEO defaults, contact email, and optionally read `activePackageId` (activate package stays developer-only under packages).

---

## 9. Public API

No auth. Gate by **site default package** public `featureKeys`.

| Method | Path | Feature gate |
|--------|------|----------------|
| GET | `/hotels` | — (published only) |
| GET | `/hotels/:slug` | |
| GET | `/locations` | |
| GET | `/locations/:slug` | |
| GET | `/news` | `news_public` |
| GET | `/news/:slug` | `news_public` |
| GET | `/availability` | `booking_public` |
| POST | `/bookings` | `booking_public` |
| GET | `/bookings/:reference` | guest lookup |
| POST | `/enquiries` | `contact_public` |

If gate is off → `404`.

### Availability query

```
GET /availability?locationSlug=&hotelSlug=&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&rooms=1&adults=2&children=0
```

### Create booking body

```json
{
  "hotelId": "uuid",
  "roomTypeId": "uuid",
  "ratePlanId": "uuid",
  "checkIn": "2026-10-01",
  "checkOut": "2026-10-03",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "guestFullName": "Vireak Roeun",
  "guestEmail": "guest@example.com",
  "guestPhone": "+855…",
  "specialRequests": "Late check-in"
}
```

Response includes `reference` (e.g. `GRY-XXXXXX`), totals, `status: "pending"`.

### Create enquiry body

```json
{
  "name": "…",
  "email": "…",
  "phone": "…",
  "subject": "…",
  "message": "…",
  "consent": true
}
```

---

## 10. Error conventions

| Status | When |
|--------|------|
| 400 | Validation failed |
| 401 | Missing / invalid Bearer token |
| 403 | Authenticated but no permission (or customer on admin) |
| 404 | Not found, out of scope, or public feature disabled |
| 409 | Booking conflict / no availability |

```json
{ "statusCode": 403, "message": "Missing permission: features", "error": "Forbidden" }
```

---

## 11. Seed / demo accounts

Align with SPA demos for QA:

| Email | Package idea | Scope |
|-------|--------------|--------|
| `dev@greyon.com.kh` | Platform Developer | global |
| `admin@greyon.com.kh` | Admin · Full suite | global |
| `pp@greyon.com.kh` | Manager · Booking Pro | location Phnom Penh |
| `sr@greyon.com.kh` | Manager · Content+ | location Siem Reap |
| `angkor@greyon.com.kh` | Hotel Admin · Booking Pro | hotel Angkor |
| `hotel@greyon.com.kh` | Hotel Admin · Core | hotel Riverside (PP) |
| `guest@example.com` | Customer | no admin |

Reference package feature sets: greyon-engine `FeatureSeeder` / `PackageSeeder` (SPA loads them via `/developer/features` and `/developer/packages`).

---

## 12. Acceptance tests

1. Login `sr@…` → `GET /admin/bookings` → **only** Siem Reap hotels.  
2. Login `hotel@…` → only Riverside hotel data.  
3. Login `admin@…` → all bookings.  
4. Login `pp@…` → `GET /admin/packages` → `403`.  
5. Login `dev@…` → can assign packages; user cannot self-assign.  
6. Manager with empty `locationIds` → empty hotels/bookings (not everything).  
7. Package `roles: ["admin","manager"]` → global scope wins when `admin` present.  
8. Site default without `booking_public` → public `POST /bookings` → `404`.  
9. Customer → admin login → `403`.  
10. Delete last developer → `400`.

---

## 13. Frontend wiring

> **Live backend:** sibling repo **`greyon-engine`** uses **session cookies** (not Sanctum Bearer). See `docs/ENGINE_INTEGRATION.md`.
> API hosts are selected via **`VITE_APP_MODE`** + `src/helpers/api/apiConfig.ts` (IBPF-style).

Quasar env:

```
VITE_APP_MODE=local
VITE_USE_API=true
# optional: VITE_ENGINE_URL=https://greyon-engine.test
```

SPA types: `src/types/greyon.ts`  
SPA access UX already mirrors this model (user_package → roles + features + hotel/location scope).

**Server must enforce scope.** Client checks are UX only.

---

## Quick ER

```
┌──────────┐     ┌───────────────┐     ┌──────────┐
│  users   │────<│ user_packages │>────│ packages │
│ locationIds    └───────────────┘     │ roles[]  │
│ hotelIds │                           │ feats[]  │
└──────────┘                           └────┬─────┘
                                            ▼
                                      ┌──────────┐
                                      │ features │
                                      └──────────┘

locations 1──* hotels 1──* room_types 1──* rate_plans
                │
                └──* bookings
```

---

## Suggested Laravel + Breeze layout (optional)

Scaffold:

```bash
composer create-project laravel/laravel greyon-api
cd greyon-api
composer require laravel/breeze --dev
php artisan breeze:install api
php artisan migrate
```

Use **Breeze API** (not Blade/Inertia) so the Quasar SPA talks over token auth.

```
app/Models/          User, Package, Feature, UserPackage, Location, Hotel, ...
app/Http/Controllers/Api/Auth|Users|Packages|Features|...
app/Http/Middleware/ EnsurePermission.php   // can(user, perm)
app/Services/        AccessService (roles, features, hotel/location scope)
routes/api.php       // Breeze auth routes + Greyon admin/public routes
database/migrations/
database/seeders/
```

Auth: **Laravel Breeze (API)** → Sanctum bearer tokens.  
Map Breeze login to return the same `{ accessToken, user }` shape as section 6 — extend the user payload with `roles`, `featureKeys`, `packages`, `locationIds`, `hotelIds`.  
Guards: `auth:sanctum` → permission (`can`) → query-level hotel/location scope.

Nest `/api` and SPA seed mocks have been removed; the live backend is greyon-engine.

---

*Questions while building: match SPA seeds and types above. Prefer 404 for out-of-scope and disabled public features.*
