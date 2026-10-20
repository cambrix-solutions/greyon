# Greyon — Feedback handoff (Oct 2026)

**Audience:** Grok (or any follow-up agent) continuing UAT / styling / booking polish.  
**Source:** `Greyon_Website_Feedback.pdf` (5 Oct 2026) + media-library base64 bug from live admin.  
**SPA:** `D:\cambrix\greyon` · **API:** `D:\cambrix\greyon-engine`  
**Public site:** https://greyon.site · **Admin:** https://greyon.site/admin

**Latest pass (Oct 2026 feedback A/B/C):** branch `feat/feedback-oct-abc` — Marriott-style Special Rates, larger logo + **Services** nav (Hotels / Apartments flyouts; product-owner decision) + nav↔compact-search transition, `/map` destination picker. See sections **12–14** below.

This doc lists **what Composer already implemented**, **where**, and **how to test** so you can find leftover style debt and booking-flow gaps. Do **not** re-do completed items unless tests fail.

---

## Status legend

| Tag           | Meaning                                                   |
| ------------- | --------------------------------------------------------- |
| `DONE`        | Implemented in SPA (may still need visual polish)         |
| `PARTIAL`     | Works functionally; style / copy / edge cases may be weak |
| `BACKEND-GAP` | UI collects data but API does not store dedicated columns |
| `FOLLOW-UP`   | Intentionally left for design/product or next pass        |

---

## 1. P0 — Homepage cards: BOOK → View Hotel

**Status:** `DONE`

**Intent:** Stop pushing users straight into booking from listing cards. Discovery first.

**Changes:**

- `src/components/HotelCard.vue` — removed “From $X / night” + Book; CTA is `View Hotel` → `/hotels/:slug`
- Used on home featured grid, hotels list, location detail, related hotels

**Test steps:**

1. Open `/` and `/hotels` (and a destination with hotels).
2. Confirm each hotel card has **View Hotel**, not **Book**.
3. Confirm no “From $xx / night” on the card footer.
4. Click **View Hotel** → hotel detail loads (not `/booking`).
5. **Style check:** CTA alignment, card footer spacing after removing price; hover on image/title still OK on mobile.

---

## 2. P0 — Remove 6-step progress bar

**Status:** `DONE`

**Intent:** Keep step-by-step flow; remove numbered Search → Results → Room → Guest → Review → Confirm bar.

**Changes:**

- `src/pages/BookingPage.vue` — deleted `<ol class="steps">` and related CSS
- Store steps 1–6 in `src/stores/booking-store.ts` **unchanged**
- Page title / lead still reflect current step (`stepTitle` / `stepLead`)

**Test steps:**

1. Go `/booking` (feature `booking_public` must be on).
2. Walk Search → Results → Room → Guest → Review → Confirm.
3. Confirm **no** numbered 6-step indicator anywhere.
4. Confirm **Back** / **Continue** (or equivalent) still work on each step.
5. **Style check:** header spacing after removing the bar (no large empty gap); titles clear per step.

---

## 3. P0 — Room photos, date-aware prices, room detail before guest

**Status:** `DONE` / `PARTIAL` (photos depend on CMS images)

**Intent:** Photos on room cards; prices only after dates; explicit room-detail step before guest form.

**Changes:**

- Booking step 2 (`BookingPage.vue`): room image (or placeholder), **View room details**, price = search total for selected dates
- Booking step 3: photo + amenities chips + total for nights; then Continue → guest
- Hotel detail (`HotelDetailPage.vue`):
  - Hero CTA **View rooms** (scrolls to `#rooms`), not instant Book
  - Search widget label **Check availability**
  - Hint: prices appear after dates
  - Badges show **search total** only after results exist for this hotel
  - Room CTA: **View room details** (if priced) or **Check availability**

**Test steps:**

1. Open a hotel with room images in CMS; open one without images (placeholder OK).
2. On hotel detail **before** searching: no misleading “From $X” badge on rooms; hint visible.
3. Set dates → **Check availability** → badge/total appears only for available rooms.
4. **View room details** → lands on booking step 3 (room summary), **not** guest form.
5. Continue → guest form (step 4).
6. From `/booking` search: results show photos + date totals.
7. **Style check:** result-card grid (image | info | price) on desktop; stacks on mobile; placeholder grey block acceptable but may need brand polish; sticky aside on guest step.

**Known gaps for you:**

- If `room.images` empty, placeholder is a gradient only — may want a proper asset.
- Hotel detail “hasSearchedDates” requires `booking.results` for **this** hotel; switching hotels mid-session can look confusing — verify UX.

---

## 4. P0 — Hotel detail as main decision layer

**Status:** `DONE` / `PARTIAL`

**Changes:**

- Amenities → `FeatureChips` (icon + label)
- Policies → chips (icons off)
- Booking deferred until dates + room detail path above

**Test steps:**

1. Hotel detail: features look like icon chips, not `A · B · C` text.
2. Policies section uses chips / clear list (not one dense string).
3. User can understand property before booking.
4. **Style check:** chip colors vs new palette (`#627063`); density on long amenity lists; landmark list + gallery still balanced.

---

## 5. P1 — Bigger logo in nav

**Status:** `DONE` (final file from design still `FOLLOW-UP`)

**Changes:**

- `src/layouts/MainLayout.vue` — logo height ~`3.35rem`, width/height attrs 180×62

**Test steps:**

1. Home (transparent header) + scrolled/solid header + inner pages.
2. Logo swaps dark/white assets correctly; not clipped; header bar taller OK.
3. **Style check:** mobile hamburger row; logo vs compact search crowding.

**Follow-up:** Replace assets when design delivers new logo files under `/public/logo/`.

---

## 6. P1 — Compact search / booking bar in nav

**Status:** `DONE` / `PARTIAL`

**Changes:**

- `MainLayout.vue` — when `booking_public` and route is `hotel-detail` | `booking` | `hotels` **or** home past hero scroll: primary nav replaced by compact `BookingSearchWidget`
- Uses existing `compact` prop on `BookingSearchWidget.vue`

**Test steps:**

1. `/hotels`, `/hotels/:slug`, `/booking` — compact bar in header (desktop `gt-md`).
2. Home: after scrolling past ~1 viewport, compact bar appears; at top, normal nav.
3. Submit search from header → booking results.
4. Mobile: compact bar hidden (`gt-md`); drawer still has Booking link.
5. **Style check:** compact fields too tight / overflowing; solid header contrast; Book Now button still present and not colliding.

**Gaps:** No animated “morph” from nav → bar; abrupt swap. Visual polish welcome.

---

## 7. P1 — Amenities icon + label + admin multi-select

**Status:** `DONE`

**Changes:**

- Public: `FeatureChips.vue` used on hotel detail, booking results/summary
- Catalog: `src/data/standardAmenities.ts`
- Admin: `src/components/admin/AmenitiesEditor.vue` (multi-select + custom Enter)
- Wired in: `AdminHotelsPage.vue`, `AdminRoomsPage.vue`, `AdminLocationDetailPage.vue` (hotel + room dialogs)

**Test steps:**

1. Admin → Hotels (or destination hub) → edit amenities: pick chips, add custom, save, reload.
2. Same for room amenities + stay policies (policies reuse same editor).
3. Public hotel page shows matching chips with sensible icons (Wi‑Fi, pool, etc.).
4. **Style check:** chip radius/padding; unknown amenity falls back to `check` icon — OK?

---

## 8. P1 — Guest form fields + selected-room summary

**Status:** `DONE` + `BACKEND-GAP`

**UI fields (booking step 4):**

- First name, Last name (required)
- Nationality (required)
- Email, Phone (required)
- Address, City of residence (required)
- Special requests (optional)
- Sticky **Selected room** aside (photo, hotel, room, dates, total)

**Store:** `booking-store.ts` — validates new fields; composes `fullName` from first+last on review.

**API:** Engine still accepts `guestFullName`, `guestEmail`, `guestPhone`, `specialRequests` only.  
**SPA workaround:** `src/services/engine/ops.ts` → `composeGuestNotes()` appends nationality / address / city into `specialRequests` text so ops staff still see them.

**Test steps:**

1. Reach guest step with a selected room.
2. Leave fields blank → Continue → inline errors; do not advance.
3. Fill all required → Review shows name + contact + nationality + address/city.
4. Confirm booking → reference created; admin/booking record shows notes with Nationality/Address/City lines.
5. Signed-in customer: first/last prefilled from account name when possible.
6. **Style check:** two-column guest layout (form | summary); summary sticky; on &lt;900px summary stacks above form; form spacing vs design PDF.

**Follow-up (backend):** Dedicated DB columns + validation for nationality/address/city if product wants structured data.

---

## 9. P2 — Strong password on sign-up

**Status:** `DONE` (SPA) / `PARTIAL` (engine may still use Laravel Password::defaults)

**Changes:** `src/pages/SignUpPage.vue` — live strength meter; rules: 8+, upper, lower, number, symbol; confirm mismatch message.

**Test steps:**

1. `/sign-up` — type weak password → meter Weak/Fair; submit blocked with clear message.
2. Strong password + mismatch confirm → “Passwords do not match.”
3. Strong + match → account creates (or API error if server stricter/looser — note mismatch).
4. **Style check:** meter bar uses forest green; rules list readability.

**Follow-up:** Align `RegisteredUserController` / `Password::defaults()` with the same rules if API accepts weak passwords.

---

## 10. Color system (feedback palette)

**Status:** `DONE` / `PARTIAL` (global tokens; many components still hard-code old rgba)

**Tokens updated in `src/css/app.css`:**

| Token            | Value     | Role                      |
| ---------------- | --------- | ------------------------- |
| `--gy-cream`     | `#FAF8F6` | Page / card wash          |
| `--gy-sand`      | `#F1F1F1` | Section contrast          |
| `--gy-forest`    | `#627063` | Primary CTA / active      |
| `--gy-ink`       | `#454C4B` | Text / dark UI            |
| `--gy-gold-deep` | `#8F7340` | Accent on dark / eyebrows |
| `--gy-white`     | `#FFFFFF` | Cards / inputs            |

- Primary buttons / `--light` / outline lean on `--gy-forest`
- Quasar `primary` in `quasar.config.ts` → `#627063`
- Page background uses cream

**Test steps:**

1. Spot-check home, hotel detail, booking, admin: buttons green-grey not old brass-only.
2. Eyebrows / gold accents still readable.
3. **Style audit (your job):** hunt leftover `#8f7340` as primary fill, old cream `#f8f5f0`, purple/AI defaults, low-contrast text on `#454C4B` vs true black headings if design wants darker display type.

---

## 11. Media library — base64 / `src` max 2048

**Status:** `DONE` (client guard; storage still URL-first)

**Problem:** Paste/upload produced data-URL base64 → API `"The src field must not be greater than 2048 characters."`

**Changes:**

- `ImageDropField.vue` — warn that local files cannot be saved; URL field with length error
- `AdminMediaPage.vue` — `add()` blocks `data:` and `length > 2048` before POST
- Engine still validates `src` max 2048 (`MediaItemController`)

**Test steps:**

1. Admin → Media → Add media → choose local image → preview may show; **Add to library** → clear toast, no 422 spam.
2. Paste short https image URL → saves.
3. Paste huge base64 into URL field → blocked client-side.
4. **Follow-up:** Real object storage upload endpoint when product ships it.

---

## Related work in same stretch (not in PDF, still live)

| Item                               | Notes                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| SEO Settings site name required    | `AdminSettingsPage.vue` + engine `filled` on `siteName`                                               |
| Sitemap excludes disabled surfaces | `src/utils/sitemap.ts`, `SitemapPage.vue`, conservative `public/sitemap.xml`; portfolios never listed |
| Portfolios feature default **off** | `auth-store` `featureEnabled('portfolios')` requires explicit `enabled`                               |

---

## Booking process map (current)

| Step | UI                             | How user advances       |
| ---- | ------------------------------ | ----------------------- |
| 1    | Search widget                  | Run search              |
| 2    | Results + photos + date totals | **View room details**   |
| 3    | Room summary                   | **Continue**            |
| 4    | Guest form + aside summary     | **Continue** → review   |
| 5    | Review + policy checkbox       | **Confirm reservation** |
| 6    | Confirmation + reference       | New search / account    |

**Recommended happy-path test script for Grok:**

1. Home → hotel card **View Hotel**.
2. Read amenities chips → scroll rooms → set dates → Check availability.
3. View room details → Continue → fill guest → Continue → accept policy → Confirm.
4. Note reference; open My account if signed in.
5. Repeat as guest (no account) and as signed-in customer.
6. Fail path: empty guest fields; checkout ≤ check-in; media base64 add.

---

## Files touched (primary)

```
src/components/HotelCard.vue
src/components/FeatureChips.vue
src/components/BookingSearchWidget.vue
src/components/DestinationsMap.vue               (new — feedback A/B/C)
src/components/admin/AmenitiesEditor.vue          (new)
src/components/admin/ImageDropField.vue
src/data/standardAmenities.ts                    (new)
src/data/specialRates.ts                         (new)
src/css/app.css
src/layouts/MainLayout.vue
src/pages/BookingPage.vue
src/pages/HotelDetailPage.vue
src/pages/HotelsListPage.vue
src/pages/MapPage.vue                            (new)
src/pages/SignUpPage.vue
src/pages/SitemapPage.vue
src/pages/admin/AdminHotelsPage.vue
src/pages/admin/AdminRoomsPage.vue
src/pages/admin/AdminLocationDetailPage.vue
src/pages/admin/AdminMediaPage.vue
src/pages/admin/AdminSettingsPage.vue
src/stores/booking-store.ts
src/stores/auth-store.ts
src/services/engine/ops.ts
src/types/greyon.ts
src/utils/bookingSearchQuery.ts                  (new)
src/utils/propertyKind.ts                        (new)
src/utils/sitemap.ts
src/router/routes.ts
public/sitemap.xml
quasar.config.ts
greyon-engine/.../SiteSettingController.php      (siteName filled)
```

---

## 12. P1 — Marriott-style search + Special Rates

**Status:** `DONE` / `BACKEND-GAP`

**Intent:** Homepage (and compact navbar) search bar mirrors Courtyard: **Dates** / **Rooms & Guests** / **Special Rates**, with rates passed through discovery URLs.

**Changes:**

- `BookingSearchWidget.vue` — labels, Rooms-first guests popover, Special Rates panel (`None`, `AAA/CAA`, `Senior`, `Government/Military`, `Corporate/Promo code` + text input)
- `src/data/specialRates.ts` — option catalog
- `BookingSearchParams.specialRate` / `promoCode` in `greyon.ts`, booking store defaults, draft restore
- `src/utils/bookingSearchQuery.ts` — serialize/parse query for `/booking` and `/hotels`
- `ops.ts` `searchAvailability` — forwards `specialRate` / `promoCode` on `/availability` (engine may ignore)
- Compact navbar search uses the same widget (inherits Special Rates)

**Test steps:**

1. Home hero + scrolled compact header + `/booking` search: all three segments present.
2. Pick Corporate → enter promo → Search → URL has `specialRate=corporate&promoCode=…`.
3. Open `/booking?specialRate=aaa&checkIn=…&checkOut=…` → store hydrated; search runs when dates present.
4. Mobile sheet for Special Rates works; existing date/guest validation still friendly.

**Gaps:** Engine has no dedicated special-rate pricing; values are query-only until backend supports them. Do not invent rate math in the SPA.

---

## 13. P1 — Bigger logo, Services menu, nav transition

**Status:** `DONE`  
**Owner decision:** Product owner chose **one `Services` nav item** (Hotels / Apartments nested) over separate Hotel + Apartment top-level items.

**Changes:**

- `MainLayout.vue` + `ServicesMegaMenu.vue` — logo larger; **Services** desktop mega-menu (2 columns: Hotels / Apartments with thumbnails, city, View all); hover-open + close delay; mobile full-height sheet with safe-area header (logo + close), accordion Services cards, property rows (thumb / name / city), skeletons while catalog loads, Coming soon only when truly empty; pinned Sign in / Book now; fetches catalog when drawer/Services opens
- `usePageSearchVisibility.ts` — IntersectionObserver dual-search fix

**Test steps:**

1. Transparent home header + solid header: logo larger, not clipped on phone.
2. Hover **Services** → two-column mega-menu; Hotels lists real properties with thumbs; Apartments → Coming soon when empty.
3. Phone drawer: logo clear of status bar; Hotels expanded lists properties (not false Coming soon); consistent sentence-case nesting.
4. Scroll home past hero: nav ↔ compact search transition.

---

## 14. P1 — Map page destination picker

**Status:** `DONE`

**Changes:**

- New `/map` (`MapPage.vue` + `DestinationsMap.vue`) — Leaflet + OSM tiles, destination chips (desktop) / select (mobile), recenter + filter markers from hotel coordinates
- Footer + sitemap include `/map`
- Query `?locationSlug=` pre-selects a destination

**Test steps:**

1. Open `/map` — markers for hotels with coordinates; chips filter and recenter.
2. `/map?locationSlug=siem-reap` pre-selects that city.
3. Marker popup / list cards link to hotel detail.
4. Friendly empty state when a destination has no mapped hotels.

**Gaps:** No Google Maps JS key in SPA — OSM/Leaflet only. Hotels without coordinates are omitted from markers.

---

## What Grok should prioritize next

1. **Visual QA** against PDF pages 2–10: spacing, typography, chip grids, compact header (now 4 segments), booking panels — flag anything that still feels “dev default” or brass-era.
2. **Booking UX friction:** confusing empty results, date prefill on hotel detail, compact header search on mobile gap.
3. **Room image placeholders** when CMS has no photos.
4. **Backend guest fields** if structured nationality/address/city required.
5. **Password rules** parity SPA ↔ Laravel.
6. **Backend special rates** if AAA/senior/gov/corporate should affect availability pricing.
7. **Do not** reintroduce the 6-step bar or HotelCard Book CTA unless product reverses the PDF.

---

## How to report back

For each section above, reply with:

```
## <feature name>
Result: PASS | FAIL | PARTIAL
Notes: …
Screens / routes: …
Suggested fix: … (file paths if known)
```

Keep style notes separate from functional booking failures.
