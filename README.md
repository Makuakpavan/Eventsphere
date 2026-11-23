# EventSphere

International event discovery and ticketing platform built with Next.js App Router, TypeScript, Tailwind CSS 4 and Supabase.

## Milestone 3 — Authentication

- Email/password sign-up and sign-in
- Google OAuth entry point
- Email confirmation callback
- Session refresh through the Next.js `proxy.ts`
- Profile creation trigger and attendee/organizer/admin roles
- Protected attendee account and organizer dashboard
- Row Level Security policies and protected role field

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable/anon key.
3. In Supabase SQL Editor, run `supabase/schema.sql`, `supabase/seed.sql`, then `supabase/auth.sql`.
4. In Supabase Authentication → URL Configuration, set your Site URL to your local app URL (for example `http://localhost:3000`) and add `http://localhost:3000/auth/callback` to Redirect URLs. Add your production domain callback before deployment.
5. To enable Google sign-in, configure the Google provider in Supabase Authentication → Providers and add the provider credentials and authorized redirect URI shown by Supabase.
6. Start the app: `npm run dev`.

## Organizer access

New registrations are attendees by default. Organizer access is granted administratively only. After a user registers, verify them and run the following in the Supabase SQL Editor, replacing the UUID:

```sql
update public.profiles set role = 'organizer' where id = '<AUTH_USER_UUID>';
```

Do not expose a service-role key in browser code. Never allow users to choose their own privileged role during sign-up.

## Environment variables

See `.env.example`. Only the Supabase URL and public anon/publishable key are used in the browser. Payment and email provider secrets remain server-side for later milestones.

## Current scope

M1: responsive landing page and event detail UI. M2: Supabase-backed public event catalogue and discovery filters. M3: authentication, profiles and role-protected routes. Event creation, ticket inventory, checkout and payment webhooks are not implemented yet.

## Milestone 4 — Organizer event management

- Organizer/admin event dashboard with status counts
- Create and edit event forms with event details, local event timezone, venue, currency and starting price
- Save events as drafts or submit them for administrator review
- Admin moderation controls to publish or reject submitted events
- Supabase Storage image uploads (5 MB maximum; JPG, PNG and WebP)
- Row Level Security policies for event ownership and organizer/admin permissions

### M4 database setup

After running `supabase/schema.sql`, `supabase/seed.sql` and `supabase/auth.sql`, run `supabase/organizer.sql` in the Supabase SQL Editor. This adds organizer write policies and creates the public `event-images` storage bucket with owner-folder upload restrictions.

To grant a verified user organizer access, run this as a trusted Supabase administrator, replacing the UUID:

```sql
update public.profiles set role = 'organizer' where id = '<AUTH_USER_UUID>';
```

For administrator moderation access, use the `admin` role only for trusted platform administrators. Organizers can create and edit their own events, but submitted events remain pending until an admin publishes them. Do not expose a Supabase service-role key in the browser.

### M4 scope notes

The starting price is catalogue metadata only; actual ticket types, inventory, reservations, checkout, refunds and payment webhooks are later milestones. Event image URLs are public because published event artwork must be viewable by visitors. Image uploads are restricted to the authenticated organizer's UUID folder.

## Milestone 5 — Ticketing and reservations

Run `supabase/ticketing.sql` after `schema.sql`, `auth.sql`, and `organizer.sql`.
Organizers can add ticket types from Organizer Dashboard → Tickets on an event row.
Attendees can select ticket quantities at `/events/<event-slug>/book`; successful reservations appear at `/bookings` and `/bookings/<booking-id>`.

Reservations are pending holds for 15 minutes. The `reserve_event_tickets` PostgreSQL function locks ticket rows and creates the booking and booking items in one transaction, so concurrent requests cannot oversell inventory. Configure Supabase Cron to run `select public.release_expired_ticket_reservations();` every minute to release expired inventory. The function is intentionally not executable by browser roles; configure it as a trusted scheduled database job.

Payments are not collected in Milestone 5. Pending reservations are not confirmed tickets until the payment milestone adds verified payment webhooks and confirmation.


## Milestone 6 — Payments

### Configure provider credentials
Add these server-only values to `.env.local` (never prefix secrets with `NEXT_PUBLIC_`):

```env
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Run `supabase/payments.sql` after the M5 SQL files. The booking detail page now offers Paystack and Stripe checkout.

### Webhook endpoints
- Paystack: `/api/payments/paystack/webhook`
- Stripe: `/api/payments/stripe/webhook`

Configure these HTTPS endpoints in each provider dashboard. For local development, use the provider CLI or a secure webhook forwarder. Paystack webhook signature is validated with HMAC-SHA512 and the transaction is fetched from Paystack before confirmation. Stripe events are verified with Stripe's webhook signature. Both flows validate amount/currency and confirm bookings idempotently through a database function.

### Important operational notes
- Use provider test keys and test cards/accounts first.
- Paystack availability depends on your merchant account and enabled currencies. Stripe availability depends on your business country and Stripe account eligibility.
- A successful provider payment arriving after a reservation expires is marked `review_required`; investigate/refund it manually rather than silently issuing tickets.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`, or webhook secrets to client code.
- Configure HTTPS production webhook URLs before accepting live payments.
- This milestone does not yet issue QR-code tickets or send confirmation emails; those are planned for later milestones.


## Milestone 7 — Digital tickets and admission check-in

1. Run `supabase/tickets.sql` after all previous SQL migrations, including `payments.sql`.
2. Set `NEXT_PUBLIC_SITE_URL` in `.env.local` to your deployed origin (or `http://localhost:3000` locally).
3. Install dependencies with `npm install`.
4. Confirm a booking using a provider's test payment flow. The database trigger issues one digital ticket per booking item quantity when the booking transitions to `confirmed`.
5. Attendees view tickets at `/tickets`.
6. Organizers/admins use `/organizer/check-in` and paste the QR token from a ticket QR URL to validate and consume admission. A ticket can only be checked in once.

QR tokens are private bearer credentials. Never post ticket QR codes publicly. The check-in page currently supports manual token entry; camera-based QR scanning can be added in a later iteration.

Email delivery is not enabled in this milestone because sending transactional email reliably requires a configured provider (for example Resend), verified sender domain, and webhook delivery integration. Do not treat an on-screen ticket as proof that an email was sent.


## Milestone 8 — Email notifications and organizer analytics

### Database
Run `supabase/notifications_analytics.sql` after `supabase/tickets.sql` and the earlier migrations.

### Resend email setup
1. Create a Resend account and verify a sending domain.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in your deployment environment.
3. Set `NEXT_PUBLIC_SITE_URL` to your real application URL.
4. Generate a long random `CRON_SECRET` and store it as an environment variable.

The booking-confirmation outbox row is created automatically when a booking becomes confirmed. Event reminders are queued for attendees with valid tickets approximately 24 hours before the event. The outbox is retryable and capped at five attempts.

### Schedule the notification processor
Call `POST https://YOUR_DOMAIN/api/cron/notifications` hourly with header `Authorization: Bearer YOUR_CRON_SECRET`. Use a trusted scheduler such as Vercel Cron or Supabase Cron with a secure secret. Never expose the cron secret in client-side code. The route processes up to 30 queued emails per run.

### Organizer analytics
Visit `/organizer/analytics` or use the View analytics link on the organizer dashboard. Metrics include issued tickets, check-ins, and confirmed booking revenue. Revenue is displayed as one total only when all events share the same currency; otherwise the summary reports the number of currencies and the event rows show each event's currency separately.

### Important
Email sending requires a verified sender domain and valid Resend credentials. The project does not claim emails were delivered until Resend accepts the send request. Monitor the notification outbox for failed attempts. The ZIP was packaged and integrity-checked; dependency installation, TypeScript checking, and production build have not been run here.


## Milestone 9 — Admin dashboard and platform management

### Database migration
Run `supabase/admin.sql` after the previous SQL migrations. Promote the first trusted administrator manually in the Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where id = 'YOUR_VERIFIED_USER_UUID';
```
Do not expose the service-role key in browser code. Keep it only in server-side environment variables.

### Admin routes
- `/admin` — platform overview
- `/admin/users` — inspect the first 100 users and change roles
- `/admin/events` — publish, reject or cancel events
- `/admin/payments` — inspect the latest 200 payment records
- `/admin/audit-logs` — inspect the latest 200 admin actions

Role changes and event moderation are recorded in `admin_audit_logs`. Admin pages verify the authenticated user's profile role before using the server-only Supabase admin client.

### Operational notes
The user list and payment list are intentionally paginated to a bounded first 100/200 rows in this milestone. Add cursor pagination and search before production scale. This is an operational admin console, not a substitute for support tooling, fraud review procedures, or legal/compliance controls.

The ZIP is packaged and integrity-checked. Dependency installation, TypeScript checking and production build have not been run in this environment.


## Progressive Web App (PWA)

EventSphere includes an installable PWA foundation:

- Web app manifest with standalone display mode, brand theme, and app icons.
- Android/desktop install prompt where the browser supports `beforeinstallprompt`.
- iOS home-screen metadata and Apple touch icon (iOS users can use Share → Add to Home Screen in Safari).
- Service worker registration in production only.
- Offline fallback page and a small cache for the app shell and public navigation pages.
- Offline status indicator and a prompt to refresh when a new service-worker version is installed.

### PWA behaviour and security boundaries

The service worker deliberately does **not** cache API responses or authenticated areas such as accounts, organizer/admin dashboards, bookings, tickets, login, registration, and payment routes. These pages need a live connection and must not be stored in a shared browser cache. Public pages are cached after a successful visit and can be shown again while offline; the first visit to a page still needs internet. This is a basic offline experience, not full offline ticket purchasing or offline QR check-in.

Service workers require HTTPS in production (localhost is allowed for local development). Deploy to an HTTPS origin, then test installability and offline behaviour in Chrome DevTools → Application. On iPhone/iPad, open the site in Safari and use Share → Add to Home Screen. Browser install UI differs by platform, so the custom install button appears only when the browser exposes the install prompt event.

After changing `public/sw.js`, increment the `VERSION` constant to force a fresh cache namespace. Run `npm run build` and test on real mobile devices before launch. This archive has been packaged and integrity-checked; dependency installation, type checking, production build, Lighthouse PWA audit, and device testing have not been run here.


## Push notifications

EventSphere supports opt-in browser push notifications for booking confirmations and event reminders.

### Setup

1. Run `npm install` to install `web-push` and its TypeScript definitions.
2. Generate VAPID keys with `npx web-push generate-vapid-keys`.
3. Configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env.local` and the deployment environment. The private key is server-only and must never use a `NEXT_PUBLIC_` prefix.
4. Run `supabase/push_notifications.sql` in Supabase after `notifications_analytics.sql`.
5. Schedule `GET /api/cron/push` hourly with `Authorization: Bearer <CRON_SECRET>`. The existing email worker remains separate at `/api/cron/notifications`.

Users must be signed in and explicitly tap **Enable notifications**. Each device/browser has its own subscription. The same control lets users turn notifications off. iOS/iPadOS web push requires the site to be added to the Home Screen and a supported OS version. Push delivery is best-effort and depends on browser support, permission settings, network and platform push services.

Push messages are queued when the existing notification outbox receives a booking confirmation or event reminder. Existing queued email rows are not backfilled. This milestone does not yet provide notification categories, a notification history page, or offline booking/check-in.

Push subscriptions and delivery queues have no client RLS policies. Subscription APIs verify the Supabase session; deletion is scoped to the signed-in user. Expired endpoints (HTTP 404/410) are removed automatically. Keep VAPID private and Supabase service-role keys server-side.

The archive has been packaged and ZIP-integrity checked. Dependency installation, TypeScript checks, production build, real push delivery and cross-device testing have not been run here.


## EVENTSPHERE M12 — FORGOT PASSWORD & PASSWORD RESET

The password recovery flow uses Supabase Auth's recovery email and the existing SSR callback/client architecture. A recovery code is exchanged server-side; the reset form and password update endpoint both require a fresh authenticated recovery session. Reset links are single-use and time-limited by Supabase. Passwords are never stored in application tables. After a successful change, EventSphere requests that Supabase sign out the user's other sessions.

### Supabase Auth configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to `http://localhost:3000` for local work, and to the canonical HTTPS origin of the deployed app in production.
- Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
- Add `https://YOUR_PRODUCTION_DOMAIN/auth/callback` to **Redirect URLs** (replace with the exact production hostname). Add any preview domains explicitly if those deployments need recovery.
- Set `NEXT_PUBLIC_SITE_URL` to the same canonical origin in each local/deployment environment. Do not use wildcard redirect URLs in production.

In Authentication → Providers → Email, enable email/password auth, configure the password policy to require at least 8 characters, and set a short recovery/OTP expiry appropriate for your support requirements (for example, 1 hour). Supabase's rate limits for recovery email requests should remain enabled.

In Authentication → Email Templates → **Reset Password**, set the subject to **Reset your EventSphere password** and use this branded HTML. The `ConfirmationURL` is Supabase's generated, single-use verification link and will return to the callback URL above:

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;padding:32px;color:#171329;border:1px solid #eeeaf2;border-radius:20px">
  <div style="margin-bottom:28px">
    <img src="{{ .SiteURL }}/eventsphere-logo.svg" alt="EventSphere" width="160" style="display:block;height:auto">
  </div>
  <h1 style="font-size:26px;margin:0 0 16px">Reset your EventSphere password</h1>
  <p style="font-size:15px;line-height:1.6;color:#51465f">We received a request to reset the password for your EventSphere account. Use the button below to choose a new password.</p>
  <p style="margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6D35E8;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Reset Password</a>
  </p>
  <p style="font-size:13px;line-height:1.6;color:#716d7c">This secure link expires after the period configured in Supabase Auth and can only be used once. If you did not request a password reset, you can ignore this email; your password will not change.</p>
  <p style="font-size:12px;color:#9891a2">EventSphere · Discover, connect, experience.</p>
</div>
```

For production delivery, configure a custom SMTP provider in Supabase Dashboard → Project Settings → Authentication → SMTP Settings. Verify the sender domain with that provider, use a recognizable EventSphere sender address, and check its SPF/DKIM/DMARC guidance. Supabase's built-in mail service is intended for testing and may have low sending limits. SMTP credentials belong only in Supabase's protected dashboard settings, not in this app's public environment variables. No app-specific SMTP environment variables are required.

### Local end-to-end testing

1. Copy `.env.example` to `.env.local`; provide the Supabase project URL, publishable/anon key, and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
2. Apply the Site URL, redirect URL, email provider, and reset email template configuration above to the Supabase project used for local testing.
3. Start `npm run dev`, then use `/forgot-password` with a registered account. Check the configured inbox and spam folder.
4. Open the received link in the same browser session. It should exchange the recovery code and open `/reset-password`. Direct visits without a fresh recovery session, expired links, and reused links should not permit a password update.
5. Test malformed email, an unregistered email (same generic confirmation), mismatched passwords, and passwords that fail the displayed strength requirements. Complete a valid reset, then sign in at `/login` using the new password.
6. Confirm normal registration and login still work. Supabase's dashboard logs can help diagnose delivery/configuration failures; do not log recovery URLs, tokens, sessions, or passwords.

For deployment, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS app origin and add the exact production callback URL in Supabase Redirect URLs. Use production SMTP with a verified sender/domain and ensure the published logo is reachable at `https://YOUR_PRODUCTION_DOMAIN/eventsphere-logo.svg`.
