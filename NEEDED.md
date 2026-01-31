# Needed.co.nz — Project Brief (Speed-first local services)
Version: v1.1

## 1) Goal
Build a mobile-first product that helps people get practical help fast.

- User submits a request in under 60 seconds
- System notifies up to 3 available pros at once
- User should hear back within 10 minutes
- If not, user can re-send to 3 more

Web app exists for SEO discovery and conversion.

Mobile app exists for repeat use and speed.

---

## 2) Product promise
- “Sent to up to 3 available pros.”
- “You should hear back within 10 minutes.”
- “If you don’t, re-send to 3 more.”

No pro names shown.

No noisy marketplace UI.

---

## 2.5) How it works (stakeholder-friendly)
- Customer picks service, timing, and shares a short job description.
- Needed sends the request to up to 3 available pros in the area.
- Pros contact the customer directly by phone or text.
- If the customer doesn't hear back in 10 minutes, they can re-send to 3 more.

---

## 3) Core UX rules
Non-negotiables:

- 1 decision per screen
- 1–3 items per screen
- Big tap targets
- No account needed to request a service
- Fast defaults: suburb autofill, simple choices, clear CTAs

---

## 4) Primary customer flow (3 screens)
### Screen 1 — Service
Copy:
- Title: What do you need?
- Subtitle: We’ll send your request to 3 available pros.
- Tiles (top 6): Plumber, Electrician, Locksmith, Movers, Carpet cleaning, Rubbish removal
- Secondary: See all services
- Footer: No account needed to request a service.

Validation:
- If no selection: “Choose a service to continue.”

### Screen 2 — Time
Copy:
- Title: When do you need it?
- Options: Now / Today / This week
- Footer: For “Now”, we only notify pros who are available.

Validation:
- If no selection: “Choose when you need it.”

### Screen 3 — Details
Copy:
- Title: Tell us what’s going on
- Fields (max 3):
  - Your suburb (auto-fill + edit)
  - Job details (single textarea, category-specific placeholder)
  - Add photo (optional)
- CTA: Send to 3 pros
- Confirmation: Sent. You should hear back within 10 minutes.

Validation:
- No suburb: “Add your suburb to continue.”
- No details: “Add a short description so pros know what to do.”

### Phone verification (recommended)
Light OTP before dispatch:
- Title: Confirm your number
- Subtitle: We’ll only use this so pros can contact you about this request.
- Mobile + OTP flow

---

## 4.5) Customer retention
Your app is the retention engine.

You win with repeat convenience.

Do these three things:

### 1) "Request again"
- One button on the success screen:
  - "Need help again?"
  - "Request again in 10 seconds."

### 2) Save context
- Save:
  - suburb
  - common services used
  - preferred time windows
- Next request becomes 2 taps.

### 3) Light follow-up
- 24 hours later:
  - "All sorted?" (Yes/No)
- 7–14 days later (category-dependent):
  - cleaning: "Need a regular clean?"
  - lawns: "Book the next mow"
  - heat pump: seasonal reminders

Don't over-message.

One strong nudge beats five weak ones.

---

## 5) Status screens and states
### Sending
- Title: Sending to 3 pros…
- Subtitle: This usually takes under a minute.

### Waiting (0–10 mins)
- Title: Request sent
- Subtitle: You should hear back within 10 minutes.
- Lines (dynamic based on provider count):
  - If 3+ sent: "We've notified 3 available pros."
  - If 2 sent: "We've notified 2 pros (limited availability in your area)."
  - If 1 sent: "We've notified 1 pro (limited availability in your area)."
  - "They'll call or text you directly."
- Buttons:
  - Re-send to 3 more (disabled until 10 mins)
  - Edit request
  - Cancel request

Timer guidance:
- “If you don’t hear back by 10:00, re-send.”

### No reply at 10 mins
- Title: No reply yet
- Subtitle: Want us to send this to 3 more pros?
- Buttons:
  - Re-send to 3 more
  - Edit request
  - Cancel request

### Re-sent
- Title: Sent to 3 more pros
- Subtitle: You should hear back soon.

### Sorted confirmation
- Title: All sorted?
- Buttons:
  - Yes, sorted
  - Not yet (offers re-send)

### No providers available
- Title: No pros available right now
- Subtitle: Try ‘Today’ or ‘This week’, or change suburb.
- Buttons: Change time / Change suburb

---

## 6) “10-minute promise” policy text
Our 10-minute promise:
- When you send a request, we notify up to 3 available pros at the same time.
- You should hear back within 10 minutes.
- If you don’t, you can re-send to 3 more with one tap.
- We only send your request to pros who say they are available and cover your area.
- Pros contact you directly by phone or text.
- If you cancel the request, we stop sending it to more pros.

---

## 7) Provider experience (MVP)
Provider app is minimal and action-first.

### Provider home (1–3 items)
- Availability toggle: Available now (On/Off)
- Leads today (count)
- Primary behaviour: tap a lead → call/text

### Lead card
- Service + short job summary
- Suburb + distance
- Actions:
  - Call
  - Text
  - Pass (requires reason)

### Provider controls (MVP)
- Service categories offered
- Service area (radius or suburbs)
- Hours / availability

---

## 8) Security and environment variables
WARNING: Never commit real secrets to git.

1. Copy `.env.example` to `.env.local` for local development:
   ```bash
   cp .env.example .env.local
   ```
2. Ensure `.gitignore` includes:
   ```
   .env*.local
   .env
   ```
3. Only `NEXT_PUBLIC_*` variables are exposed to the browser. Keep sensitive keys (like `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) without this prefix.
4. Use the Vercel environment variables dashboard for production secrets.

### Provider dashboard (basic analytics)
MVP dashboard cards:
- Leads received (today / 7 days)
- Contact rate
- Median time to contact
- Spend (or credits used)
- Credits refunded

Keep it shallow.

Providers mainly want:
- control
- clarity
- fairness

---

## 7.5) Provider verification and onboarding
Do it in tiers so you can launch.

### Tier 1 (MVP, fast)
- Phone OTP
- Email verification
- NZBN (if business) or ID check (if sole trader)
- Manual approval for first 100–300 providers

### Tier 2 (trust signals)
- Upload docs:
  - public liability insurance (optional at first)
  - trade licence where relevant (electrician, gasfitter, plumber)
- Add "Verified" badges:
  - "Phone verified"
  - "Business verified"
  - "Licence verified" (where applicable)
  - "Insurance verified"

### Tier 3 (scale)
- Automate checks where possible
- Random audits
- Fast suspension workflow

Key: don't block supply early.

But don't pretend everyone is vetted either.

---

## 8) Monetisation (MVP)
Start with pay-per-contact.

- A lead is free to view
- Provider is charged when they tap:
  - Call
  - Text
  - Email (optional)

Pricing bands (initial, refine with data):
- Movers / carpet cleaning / rubbish removal: $15–$35 per contact
- Plumber / electrician / locksmith (urgent): $35–$75 per contact

Later upgrades:
- Credit packs
- Monthly plans (priority access / included contacts)
- Stripe Connect only when adding bookings/payments to the marketplace stage

---

## 9) SEO strategy (web app)
Web exists to rank and convert.

- Programmatic pages: /{service}/{location}/
- Page goal: one action → Send to 3 pros
- Short “how it works”
- FAQs + schema
- Internal linking: service hubs + location hubs
- Index at scale with sitemaps

Deep linking:
- If app installed: open app
- If not installed: complete on web, then prompt install for faster repeat use

---

## 10) First 50 SEO page targets (service × location)
Services:
- plumber
- electrician
- locksmith
- movers
- carpet-cleaning
- rubbish-removal
- house-cleaning
- heat-pump-servicing
- handyman
- lawn-mowing

Locations:
- auckland
- wellington
- christchurch
- hamilton
- tauranga

Routes:
- /plumber/auckland/
- /electrician/auckland/
- /locksmith/auckland/
- /movers/auckland/
- /carpet-cleaning/auckland/
- /rubbish-removal/auckland/
- /house-cleaning/auckland/
- /heat-pump-servicing/auckland/
- /handyman/auckland/
- /lawn-mowing/auckland/
(repeat for Wellington, Christchurch, Hamilton, Tauranga = 50 total)

---

# 11) TECH STACK (Optimum for speed + SEO + later marketplace)

## 11.1 Guiding principles
- One design system across iOS + Android + web
- Web is SSR/ISR for SEO
- Mobile is native-feel but consistent UI
- Backend is simple, reliable, measurable
- Timers and “10-minute” states must be deterministic

## 11.2 Monorepo
Tooling:
- Turborepo
- TypeScript everywhere
- ESLint + Prettier shared

Repo structure:
- apps/
  - web/ (Next.js App Router)
  - mobile/ (Expo React Native)
- packages/
  - ui/ (Tamagui config, tokens, shared components)
  - shared/ (types, validation schemas, constants, helpers)

## 11.3 UI layer
- Tamagui
  - shared design tokens (spacing, radius, type scale)
  - shared components (Tile, Chip, Button, Input, StatusCard, Header)
- Font
  - bundle 1 font family in mobile and use same on web for consistent look

## 11.4 Web app (SEO discovery)
- Next.js (App Router)
- Tamagui (same UI components as mobile)
- ISR (Incremental Static Regeneration) for /{service}/{location}/ pages
- Vercel hosting + caching
- Programmatic:
  - sitemap index + per-service sitemaps
  - robots.txt
  - schema (FAQ schema on service pages)
- Deep linking:
  - universal links/app links into mobile routes

## 11.5 Mobile app (speed + retention)
- Expo + React Native
- Expo Router
- Tamagui
- Push notifications:
  - Expo push initially
  - upgrade path to FCM/APNs direct later if needed
- Universal links/app links:
  - open app when installed
  - fall back to web when not installed

## 11.6 Backend + data
Primary:
- Supabase
  - Postgres database
  - Auth (provider login; customer remains mostly anonymous except phone verification)
  - Storage (job photos)
  - Realtime (availability + request status streams)

Location:
- PostGIS (in Supabase Postgres)
  - store request lat/lng
  - provider service area (radius-based first)
  - fast “within radius” queries

Logic:
- Supabase Edge Functions
  - request dispatch
  - provider scoring updates
  - resend logic entrypoint (if using cron)

## 11.7 Phone verification + messaging
Recommended:
- Twilio Verify (OTP)
- Twilio Messaging (optional)
  - “Request sent”
  - “No reply yet — re-send?”

(Alternate providers can be swapped later; start with Twilio for reliability.)

## 11.8 Payments
- Stripe
  - charge providers on “contact action”
  - optional credit packs (one-off)
  - subscriptions later (priority access / included contacts)
- Stripe Connect (later)
  - only when adding bookings/payments between customers and providers

## 11.9 Timers, queues, and reliability
Start simple:
- Vercel Cron
  - checks for requests hitting 10 minutes with no provider contact
  - marks “eligible_to_resend = true” or triggers resend automatically (product choice)

Upgrade path:
- Upstash Redis
  - rate limiting
  - dedupe keys
- QStash
  - delayed jobs (exact “10 minute” follow-up scheduling)

## 11.10 Analytics and observability
- PostHog
  - funnel: service → time → sent → contacted → sorted
  - response time distribution
  - resend rate
- Sentry
  - mobile crash reporting
  - web performance monitoring
- Internal admin metrics (basic page)
  - % answered under 10 mins by service/location
  - provider leaderboard (response/acceptance)
  - refund rate

---

## 12) Data model (proposed tables)
### Reference tables
- services: id, slug, name, is_active
- nz_localities: linz_id, name, territorial_authority, lat, lng (NZ suburb/locality centroids)

### Users
- customers: id, phone, created_at
- providers: id, business_name, phone, email, status, created_at

### Provider capabilities
- provider_services: provider_id, service_id
- provider_areas:
  - provider_id
  - center_lat, center_lng
  - radius_km
- provider_availability: provider_id, is_available, updated_at, last_seen_at

### Requests
- requests:
  - id, customer_id, service_id
  - time_need (now/today/week)
  - suburb_text, lat, lng
  - details, photo_url
  - status (draft/sent/contacted/cancelled/sorted/expired)
  - sent_at, created_at, expires_at

### Dispatching
- request_dispatches:
  - id, request_id, provider_id
  - batch_number (1,2,3...)
  - dispatched_at, viewed_at
  - state (sent/viewed/contacted/passed/expired)

### Provider actions (billing trigger)
- provider_actions:
  - id, request_id, provider_id
  - action_type (call/text/email)
  - occurred_at
  - charge_status (pending/charged/failed/refunded)

### Scoring/metrics
- provider_metrics_daily:
  - provider_id, date
  - sent_count, viewed_count, contacted_count
  - avg_response_seconds
  - pass_count, refund_count

### Billing
- transactions:
  - id, provider_id
  - type (charge/credit)
  - amount, currency
  - request_id, provider_action_id
  - created_at

---

## 13) Matching algorithm (MVP)
Input: request (service_id, lat/lng, time_need)

Steps:
1) Filter providers:
   - offers service
   - availability ON
   - within service area
   - not throttled
2) Rank providers:
   - fastest response time
   - highest contact rate
   - lowest refund rate
   - fairness rotation
3) Select up to 3 (default: 3, but send to whoever is available)
   - If 3+ available → send to 3
   - If 2 available → send to 2
   - If 1 available → send to 1
   - If 0 available → show "No pros available right now"
4) Create dispatch rows for batch 1
5) Notify providers (push; SMS optional)

Re-send at 10 mins:
- if no provider_actions for request, unlock/trigger batch 2:
  - pick next best 3 providers not used yet
  - create new dispatch rows

Hard rule:
- no provider gets the same request twice across batches

### Contact event definitions
Use three separate events:
- **Viewed**: provider opened the lead card
- **Contact attempt**: provider tapped Call/Text (billing trigger)
- **Confirmed contact**: customer confirms they were contacted (optional later)

For MVP, system treats **Contact attempt** as "contacted".

Because it's measurable and immediate.

---

## 14) Provider reliability rules
- Only send leads to “Available now” providers
- Penalise:
  - not opening leads quickly
  - opening but not contacting within 10 mins
- Reward:
  - consistent fast contact
  - high acceptance
  - low refund rate

---

## 15) Anti-spam and lead quality (MVP)
- Customer phone OTP verification
- Basic dedupe:
  - same phone + same service + same suburb within X minutes = same request
- Photo encouraged for:
  - rubbish removal
  - moving
  - cleaning

Provider credits (trust):
- credit for invalid contact details
- credit for clear spam
- credit if system sends outside service area

---

## 16) API / Edge functions (proposed)
- POST /api/request/create (draft)
- POST /api/request/verify-phone
- POST /api/request/send (dispatch batch 1)
- POST /api/request/resend (dispatch batch 2+)
- POST /api/provider/availability (toggle)
- POST /api/provider/action (call/text → triggers billing)
- GET  /api/request/:id (status, resend eligibility)

---

## 17) Build phases
### Phase 1 — MVP launch (web + app)
- Web:
  - 50 SEO pages live (ISR + sitemaps)
  - 3-screen request flow
- Mobile:
  - same 3-screen flow
  - status screens
- Backend:
  - provider availability toggle
  - match and send to up to 3 providers (dynamic based on availability)
  - 10-minute resend eligibility
  - provider contact actions logged
  - Stripe charging on contact

### Launch gate (provider supply)
Your product is only as good as response time.

Launch gate criteria:
- Only open a service/location page if:
  - you have enough available providers to support it
  - you can consistently get responses under 10 minutes

You can still create SEO pages, but you may want them to funnel to:
- waitlist for unsupported areas
- or "Try today/this week" fallback

Rule: never open a location publicly until you can hit the 10-minute promise most of the time.

### Phase 2 — Supply growth + performance
- provider scoring and ranking
- better refund automation
- better dedupe/fraud rules
- subscriptions / credit packs

### Phase 3 — Marketplace layer
- provider profiles and reviews
- direct hire browsing
- bookings and payments (Stripe Connect)
- identity checks for trust-heavy categories (childcare)

---

## 18) Acceptance criteria (MVP)
Customer:
- can submit request in under 60 seconds
- sees “Sent to up to 3 available pros”
- can re-send at 10 minutes
- can edit or cancel

Provider:
- can toggle availability
- receives leads only when available
- can call/text in one tap
- is charged only on contact action

System:
- dispatches up to 3 providers per batch (sends to whoever is available: 3, 2, 1, or 0)
- no provider receives the same request twice
- tracks response metrics (viewed, contact attempt, confirmed contact)
- SEO pages are indexable with sitemaps

---

## 19) Provider onboarding pitch (8 lines)
Get local jobs sent to you in real time.
We only send leads when you’re marked as available.
Each request goes to just 3 pros, so you’re not fighting a crowd.
You choose whether to contact the customer.
You pay only when you tap to call or text.
Fast replies win you more leads.
Bad leads get credited back under clear rules.
Join in minutes and start receiving requests today.
