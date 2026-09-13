# Greyon — Launch, QA & Content Checklist

## Environments
- [ ] Staging URL + HTTPS
- [ ] Production domain `www.greyon.com.kh` DNS + SSL
- [ ] NestJS API (`api/`) + PostgreSQL backups scheduled
- [ ] SMTP credentials configured for Nest mail service
- [ ] Media/object storage bucket configured (when leaving URL/data-URL media)
- [ ] Production secrets rotated (`JWT_SECRET`, DB credentials, SMTP)

## Content entry (business approved)
- [x] Logo, brand colors, typography (Poppins + Syne titles; white/gold)
- [x] Demo hotel names, addresses, coordinates, phone/email (mock + optional Nest seed)
- [x] Room types, capacities, amenities, inventory (CMS / mock)
- [x] Rates, taxes/fees, cancellation policies (CMS / mock)
- [x] Location copy for 6 destinations
- [x] News articles for launch demo
- [ ] Privacy / Terms / Booking terms final legal copy (placeholders present)

## QA scenarios
- [x] Home hero + booking search widget (desktop/mobile) — implemented
- [x] Hotels list filters (location + keyword)
- [x] Hotel detail gallery, rooms, Book Now context
- [x] Location pages preselect booking location
- [x] News list/detail
- [x] Contact enquiry validation + consent
- [x] Booking: invalid dates rejected
- [x] Booking: occupancy over room max rejected
- [x] Booking: confirm creates unique reference (Pending)
- [x] Booking: revalidate blocks overbooking
- [x] Admin login RBAC (super/content/booking) — demo SPA auth
- [x] Admin bookings status change
- [x] SEO meta + robots.txt + sitemap.xml present
- [ ] Chrome, Edge, Safari, iOS/Android smoke test (run before go-live)

## UAT & handover
- [ ] Business owner sign-off on content and booking rules
- [ ] Admin users provisioned (API seed password `password` when using Nest)
- [ ] Monitoring/logging enabled
- [ ] Production deploy checklist completed

## Runtime modes
- **Default:** Quasar SPA + Pinia/localStorage (no API required)
- **Optional Nest:** set `VITE_USE_API=true` and `VITE_API_BASE_URL=http://localhost:3000/api`, run `api/` with Postgres + `SEED_ON_BOOT=true`
