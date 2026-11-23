# EventSphere — Push Notifications milestone

Adds browser push subscription management, a server-side delivery queue, VAPID configuration, and service-worker notification display/click handling.

Apply `supabase/push_notifications.sql` after `supabase/notifications_analytics.sql`. Configure VAPID environment variables and schedule `/api/cron/push` with the `CRON_SECRET` authorization header.

Push delivery is opt-in and best-effort. It does not replace transactional email and does not make ticket purchasing/check-in available offline.
