# Greyon Foundation — Backend API Spec

**Audience:** NestJS / PostgreSQL backend  
**Source of truth (SPA today):** `src/types/greyon.ts`, Pinia stores, admin route guards  
**Existing API stub:** `api/` (needs schema + auth rewrite to match this doc)  
**Base URL:** `http://localhost:3000/api`  
**Auth:** Bearer JWT on all `/admin/*` routes  

This document describes the **access foundation** the frontend already follows. Implement the API so the SPA can switch from Pinia/`localStorage` (`VITE_USE_API=true`) without changing product rules.

---

## 1. Product rules (must implement)

```
users  ←M2M→  packages   (join: user_packages)
                │
                ├── roles[]      (many)
                └── featureKeys[] (many; includes parent + sub-features)

User row does NOT store role or packageId.
Roles + features are derived only via user_packages → packages.

Scope (property isolation):
  manager     → location_ids[]   (destinations they manage)
  hotel_admin → hotel_ids[]      (properties they manage)
  admin / developer → global (all locations/hotels)

Only developer may:
  - create/edit/delete packages
  - assign packages to users (user_packages)
  - set user location_ids / hotel_ids

Users cannot add packages to themselves.
```

### Hierarchy reminder

```
Location (destination)
  └── Hotel
        └── Room types → Rate plans / availability / bookings
```

A location can have several hotels. Each location can have a **manager**. Each hotel can have a **hotel_admin**. Managers must not see other locations’ bookings/hotels.

---

## 2. Roles

Canonical values (Postgres `enum` or check constraint):

| Role | Meaning | Scope |
|------|---------|--------|
| `developer` | Platform owner | Global; only role that may manage packages |
| `admin` | Client org admin | Global within package features |
| `manager` | Location manager | `user.location_ids` |
| `hotel_admin` | Property desk | `user.hotel_ids` |
| `customer` | Guest | No admin access |

**Do not ship** these as first-class roles (legacy SPA aliases only):  
`org_admin`, `location_admin`, `super_admin`, `content_admin`, `booking_admin`.

A **package** may grant **multiple** roles (e.g. `["admin","manager"]`).  
A **user** may have **multiple** packages → union of roles and feature keys.

### Role → permission matrix (admin page keys)

Access to an admin page requires **both**:

1. Feature key present on at least one of the user’s packages  
2. At least one of the user’s roles allows that permission  

| Permission key | developer | admin | manager | hotel_admin | customer |
|----------------|-----------|-------|---------|-------------|----------|
| `dashboard` | ✓ | ✓ | ✓ | ✓ | |
| `locations` (+ `locations_*` sub-keys) | ✓ | ✓ | ✓ | | |
| `hotels` | ✓ | ✓ | ✓ | ✓ | |
| `rooms` | ✓ | ✓ | ✓ | ✓ | |
| `rates` | ✓ | ✓ | ✓ | ✓ | |
| `bookings` | ✓ | ✓ | ✓ | ✓ | |
| `news` | ✓ | ✓ | ✓ | | |
| `enquiries` | ✓ | ✓ | ✓* | ✓* | |
| `media` | ✓ | ✓ | | | |
| `settings` | ✓ | ✓ | | | |
| `users` | ✓ | ✓ | ✓ (read own) | ✓ (read own) | |
| `features` (packages UI) | ✓ | | | | |

\* Contact enquiries are currently **site-wide** (no `hotel_id`). Until enquiries gain optional `hotel_id` / `location_id`, only **global** seats (`developer`, `admin`) should list them. Managers / hotel admins get empty enquiry lists (matches SPA).

---

## 3. Features catalog

Seed / manage a `features` table. Keys used by the SPA:

### Admin (parent)

| key | Notes |
|-----|--------|
| `dashboard` | |
| `locations` | Parent module |
| `hotels` | |
| `rooms` | |
| `rates` | |
| `bookings` | |
| `news` | |
| `media` | paid add-on |
| `enquiries` | |
| `settings` | |
| `users` | |
| `features` | Packages builder — developer only |

### Admin (sub-features of `locations`)

| key | parent_key | Purpose |
|-----|------------|---------|
| `locations_list` | `locations` | Edit destination pages |
| `locations_managers` | `locations` | Assign managers per destination |
| `locations_hotels` | `locations` | Hotels under locations |
| `locations_publish` | `locations` | Publish / archive |
| `locations_seo` | `locations` | SEO fields |

### Public (site gates)

| key | Purpose |
|-----|---------|
| `booking_public` | `/booking` |
| `news_public` | `/news` |
| `contact_public` | `/contact` |
| `portfolios` | portfolio stubs |

**Site default package** (`settings.active_package_id` or `packages.is_site_default`) drives which **public** features are enabled for anonymous visitors.

---

## 4. Database schema

### 4.1 `features`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `key` | varchar unique | e.g. `locations_managers` |
| `label` | varchar | |
| `description` | text | |
| `category` | enum `admin` \| `public` | |
| `parent_key` | varchar nullable | FK logical to `features.key` |
| `paid_add_on` | boolean default false | |
| `sort_order` | int | optional |

> `enabled` on the SPA is **derived** from the site-default package’s `feature_keys`, not stored per feature row (or store a denormalized cache updated when default package changes).

### 4.2 `packages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | varchar | |
| `description` | text | |
| `price_note` | varchar | Internal label e.g. `Enterprise` |
| `roles` | jsonb / text[] | e.g. `["admin","manager"]` |
| `feature_keys` | jsonb / text[] | Parent + sub-feature keys |
| `is_system` | boolean | System packages cannot be deleted |
| `created_at` / `updated_at` | timestamptz | |

### 4.3 `user_packages` (M2M)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | ON DELETE CASCADE |
| `package_id` | uuid FK → packages | ON DELETE RESTRICT |
| unique `(user_id, package_id)` | | |

### 4.4 `users` (replace current entity)

**Remove:** `role`, `package_id`  
**Add:** scope arrays

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | varchar | |
| `email` | varchar unique | |
| `password_hash` | varchar | |
| `location_ids` | uuid[] / jsonb | Managers only; empty otherwise |
| `hotel_ids` | uuid[] / jsonb | Hotel admins only; empty otherwise |
| `active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

Optional join tables instead of arrays:

- `user_locations (user_id, location_id)`
- `user_hotels (user_id, hotel_id)`

### 4.5 `settings` (or single-row config)

| Column | Type |
|--------|------|
| `active_package_id` | uuid FK → packages | Site default for public feature flags |

### 4.6 Existing content tables (keep / already stubbed)

`locations`, `hotels` (`location_id`), `room_types` (`hotel_id`), `rate_plans`, `availability`, `rate_calendar`, `bookings` (`hotel_id`), `news`, `enquiries`

---

## 5. Authorization helpers (server-side, every admin query)

```ts
// Pseudocode — implement once, reuse everywhere

effectiveRoles(user) = UNION packages.roles via user_packages
effectiveFeatures(user) = UNION packages.feature_keys via user_packages

can(user, permKey) =
  developer? → check role matrix
  else → permKey in effectiveFeatures AND some role allows permKey

isGlobal(user) = roles ∩ {developer, admin} ≠ ∅

canAccessHotel(user, hotelId) =
  isGlobal? true
  : hotel_admin? hotelId ∈ user.hotel_ids
  : manager? hotel.location_id ∈ user.location_ids
  : false

canAccessLocation(user, locationId) =
  isGlobal? true
  : manager? locationId ∈ user.location_ids
  : hotel_admin? ∃ hotel in location with hotel.id ∈ user.hotel_ids
  : false
```

**Hard rule:** list endpoints for bookings / hotels / rooms / rates **must** filter with `canAccessHotel`. Never return another location’s booking to a manager.

Return `403` if the user opens a resource outside scope.  
Return `404` (preferred for SPA parity) when they lack the **feature/role** for a page module — frontend already redirects to an access-denied page.

---

## 6. Auth endpoints

### `POST /auth/login`

```json
{ "email": "sr@greyon.com.kh", "password": "…" }
```

**Response `200`:**

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "…",
    "name": "Siem Reap Manager",
    "email": "sr@greyon.com.kh",
    "locationIds": ["loc-sr-uuid"],
    "hotelIds": [],
    "roles": ["manager"],
    "featureKeys": ["dashboard", "locations", "hotels", "…"],
    "packages": [
      { "id": "…", "name": "Manager · Content+" }
    ]
  }
}
```

Reject `customer`-only accounts for admin login (`403`).

JWT claims suggestion: `sub` (user id), `roles[]`, optionally short feature hash. Prefer reloading effective roles/features from DB on each request (or short TTL cache).

### `GET /auth/me`

Same `user` payload as login (refresh after package changes).

### `POST /auth/logout` (optional)

Stateless JWT — client discards token; or blacklist if required.

---

## 7. Foundation admin endpoints

All require JWT. Guard with `can(user, …)`.

### Features

| Method | Path | Who | Notes |
|--------|------|-----|-------|
| `GET` | `/admin/features` | any admin with `users` or `features` | Full catalog tree |
| `PUT` | `/admin/features/:key` | developer | Optional; catalog usually seeded |

### Packages

| Method | Path | Who | Notes |
|--------|------|-----|-------|
| `GET` | `/admin/packages` | developer | List + user counts |
| `GET` | `/admin/packages/:id` | developer | |
| `POST` | `/admin/packages` | developer | Body below |
| `PATCH` | `/admin/packages/:id` | developer | |
| `DELETE` | `/admin/packages/:id` | developer | Block if `is_system` |
| `POST` | `/admin/packages/:id/duplicate` | developer | |
| `POST` | `/admin/packages/:id/activate` | developer | Sets site default |

**Create / patch body:**

```json
{
  "name": "Manager · Booking Pro",
  "description": "…",
  "priceNote": "Pro",
  "roles": ["manager"],
  "featureKeys": ["dashboard", "locations", "locations_list", "hotels", "rooms", "bookings", "…"]
}
```

Validation:

- `roles` non-empty  
- If roles include non-customer, ensure `features` + `dashboard` keys present (SPA does this)  
- Unknown feature keys → `400`

### Users + user_packages

| Method | Path | Who | Notes |
|--------|------|-----|-------|
| `GET` | `/admin/users` | developer: all; others: self only | Include packages, roles, scope |
| `GET` | `/admin/users/:id` | developer or self | |
| `POST` | `/admin/users` | developer | |
| `PATCH` | `/admin/users/:id` | developer | |
| `DELETE` | `/admin/users/:id` | developer | Keep ≥1 developer |
| `PUT` | `/admin/users/:id/packages` | developer | Replace M2M set |

**Create / patch body:**

```json
{
  "name": "Phnom Penh Manager",
  "email": "pp@greyon.com.kh",
  "password": "optional-on-create",
  "packageIds": ["pkg-uuid-1", "pkg-uuid-2"],
  "locationIds": ["loc-pp-uuid"],
  "hotelIds": []
}
```

Validation:

- ≥1 `packageIds`  
- If effective roles include `manager` → `locationIds` required non-empty  
- If effective roles include `hotel_admin` → `hotelIds` required non-empty  
- Clear unused scope arrays when roles no longer need them  
- Non-developers calling PATCH on self → **forbid** changing packages / scope (read-only “My access”)

---

## 8. Scoped content admin endpoints (summary)

Apply hotel/location scope on every list/get/mutate.

| Resource | Scope filter |
|----------|----------------|
| Locations | `canAccessLocation` |
| Hotels | `canAccessHotel` |
| Room types | via `hotel_id` |
| Rate plans / availability / rate calendar | via room → hotel |
| Bookings | via `hotel_id` |
| News | global for seats with `news` feature (or later location-tagged) |
| Enquiries | global seats only until scoped fields exist |
| Media / settings | admin / developer |

### Bookings (critical)

```
GET  /admin/bookings?status=&q=
GET  /admin/bookings/:reference
PATCH /admin/bookings/:reference/status   { "status": "confirmed" }
POST /admin/bookings                      (admin-created; hotel must be in scope)
```

**Bug this fixes:** Siem Reap manager must **never** see a Phnom Penh hotel booking.

### Public (unchanged conceptually)

Gate by **site default package** public feature keys:

- `GET /hotels`, `/locations`, `/news`, …  
- `POST /bookings`, `POST /enquiries`  
- `GET /availability`  

If `booking_public` off → booking routes return `404`.

---

## 9. Suggested Nest modules

```
auth/          login, jwt, me
users/         CRUD + package assignment
packages/      CRUD + activate + duplicate
features/      catalog
guards/        JwtAuthGuard, FeaturesGuard, ScopeInterceptor
locations|hotels|rooms|rates|bookings|news|enquiries|media|settings
public/        already stubbed
```

Guards:

1. JWT valid  
2. `can(user, route.meta.perm)` → else `403`/`404`  
3. Service layer applies `canAccessHotel` / `canAccessLocation`

---

## 10. Migration from current `api/` stub

Current `User` entity is **wrong** for this product:

- Has `role` enum (`content_admin` \| `booking_admin` \| `super_admin`)  
- Has singular `package_id`  

**Migration plan:**

1. Create `features`, `packages`, `user_packages`  
2. Add `location_ids`, `hotel_ids` to users  
3. Seed packages/features/users from SPA seeds (`src/data/seed-*.ts`)  
4. Backfill `user_packages` from old `package_id` if any  
5. Drop `users.role`, `users.package_id`  
6. Replace `AdminRole` enum in `api/src/common/enums.ts`  
7. Update `RolesGuard` → feature + role + scope guards  
8. Expand admin controllers beyond bookings  

Update `api/GREYON_API.md` to link here when endpoints land.

---

## 11. Seed accounts (parity with SPA demo)

| Email | Packages | Scope |
|-------|----------|--------|
| `dev@greyon.com.kh` | Platform Developer | global |
| `admin@greyon.com.kh` | Admin · Full suite | global |
| `pp@greyon.com.kh` | Manager · Booking Pro | location PP |
| `sr@greyon.com.kh` | Manager · Content+ | location SR |
| `angkor@greyon.com.kh` | Hotel Admin · Booking Pro | hotel Angkor |
| `hotel@greyon.com.kh` | Hotel Admin · Core | hotel Riverside |
| `guest@example.com` | Customer | none (no admin login) |

Passwords: bcrypt hashes; demo may use a shared password until real auth policy.

---

## 12. Acceptance tests (backend)

1. Login as `sr@…` → `GET /admin/bookings` returns **only** hotels in Siem Reap.  
2. Login as `hotel@…` → only Riverside hotel bookings/rooms/rates.  
3. Login as `admin@…` → all bookings.  
4. Login as `pp@…` → `GET /admin/features` (packages) → `403`.  
5. Login as `dev@…` → can `PUT` user packages; user cannot.  
6. Manager with no `location_ids` → empty hotel/booking lists (not all data).  
7. Package with `roles: ["admin","manager"]` → user gets both roles + must still have location scope if they act as manager for scoped ops (prefer: global wins when `admin` present).  
8. Site default package without `booking_public` → public `POST /bookings` → `404`.  
9. Customer login to `/admin` → `403`.  
10. Delete last developer → `400`.

---

## 13. Frontend contract notes

SPA types live in `src/types/greyon.ts`. Prefer camelCase JSON (`locationIds`, `featureKeys`, `packageIds`).

When `VITE_USE_API=true`, replace Pinia persistence with these endpoints; keep the same effective shape on `/auth/me` so `auth-store` can map:

- `roles` / `featureKeys` / `packages`  
- `can()` / `canAccessHotel()` logic may stay client-side for UX, but **server must enforce**.

---

## 14. Out of scope for this foundation doc

- Payment gateway  
- Multi-tenant orgs (single Greyon deployment assumed)  
- Push / realtime  
- Media upload binary storage details (S3 etc.)  

---

## Quick ER diagram

```
┌──────────┐     ┌───────────────┐     ┌──────────┐
│  users   │────<│ user_packages │>────│ packages │
│ loc_ids  │     └───────────────┘     │ roles[]  │
│ hotel_ids│                           │ feats[]  │
└──────────┘                           └────┬─────┘
                                            │
                                       references
                                            ▼
                                      ┌──────────┐
                                      │ features │
                                      │ parent_key│
                                      └──────────┘

locations 1──* hotels 1──* room_types 1──* rate_plans
                │
                └──* bookings
```

Questions while implementing: align with SPA seeds in `src/data/seed-features.ts`, `seed-packages.ts`, `seed-users.ts`.
