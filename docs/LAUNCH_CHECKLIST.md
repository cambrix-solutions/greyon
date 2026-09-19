# Greyon — Launch, QA & Content Checklist

## Environments
- [ ] Staging URL + HTTPS
- [ ] Production domain `www.greyon.com.kh` DNS + SSL
- [ ] greyon-engine (Laravel) + database backups scheduled
- [ ] SMTP / mail configured on greyon-engine (booking & enquiry notify)
- [ ] Media/object storage bucket configured (when leaving URL/data-URL media)
- [ ] Production secrets rotated (`APP_KEY`, DB credentials, SMTP)

## Content entry (business approved)
- [x] Logo, brand colors, typography (Poppins + Syne titles; white/gold)
- [x] Demo hotel names, addresses, coordinates, phone/email (engine seeders)
- [x] Room types, capacities, amenities, inventory (engine)
- [x] Rates, taxes/fees, cancellation policies (engine)
- [x] Location copy for destinations
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
- [x] Admin login (admin / developer guards via greyon-engine)
- [x] Admin bookings status change
- [x] SEO meta + robots.txt + sitemap.xml present
- [ ] Chrome, Edge, Safari, iOS/Android smoke test (run before go-live)

## UAT & handover
- [ ] Business owner sign-off on content and booking rules
- [ ] Admin users provisioned (greyon-engine seed / developer UI)
- [ ] Monitoring/logging enabled
- [ ] Production deploy checklist completed

## Runtime
- Quasar SPA always uses greyon-engine (`VITE_USE_API=true`, `VITE_APP_MODE=local|staging|production`)
- Local: Vite `/engine` proxy → greyon-engine (see `.env.example`)
