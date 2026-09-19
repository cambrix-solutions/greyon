# Greyon SPA ↔ greyon-engine integration

## Status

| Slice | Status |
|-------|--------|
| IBPF-style `apiConfig` + `engineAPI` | done |
| Admin / developer session login | done |
| Public catalog hydrate (`GET /catalog`) | done |
| Admin locations / hotels / rooms / rates CRUD | done |
| Bookings / availability / news / enquiries | engine not ready — still mock |
| Developer packages / features UI | not wired yet |

## Local setup

1. Herd: `https://greyon-engine.test` → greyon-engine (migrated + seeded)
2. Engine `.env`: `APP_URL=https://greyon-engine.test`, `FRONTEND_URL=http://localhost:9000`
3. SPA `.env`:
   ```
   VITE_APP_MODE=local
   VITE_USE_API=true
   ```
4. `npm run dev` in greyon
5. Public pages load published inventory from `/catalog`
6. Admin login (`password`) refreshes full admin catalog (includes drafts)

## What matches today

Engine ↔ SPA field shapes are camelCase and align for:

- Locations, hotels, room types, rate plans
- Admin packages → roles / featureKeys / locationIds / hotelIds (flattened in mappers)

IDs are numeric on the engine and stringified in the SPA.

## Code map

| Path | Role |
|------|------|
| `src/helpers/api/*` | `apiConfig`, `createApiClient`, `engineAPI` |
| `src/services/engine/*` | auth, public/admin catalog, mappers |
| `src/stores/cms-store.ts` | `syncCatalogFromEngine` + engine-backed upserts |
| `src/boot/catalog.ts` | public hydrate on app start |
| Engine `GET /catalog` | published locations+hotels+rooms+rates |

## Next slices

1. Developer packages / features / admins UI → `/developer/*`
2. Bookings + availability when engine ships those tables
3. News / enquiries / media
