import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !from) return NextResponse.json({ error: "Email provider is not configured" }, { status: 503 });

  const admin = createAdminClient();
  // Queue reminders first; function is safe to run repeatedly because the outbox has a unique constraint.
  await admin.rpc("enqueue_event_reminders");
  const { data: rows, error } = await admin.from("notification_outbox")
    .select("id,user_id,booking_id,event_id,notification_type")
    .in("status", ["pending", "failed"]).lt("attempts", 5)
    .order("created_at", { ascending: true }).limit(30);
  if (error) return NextResponse.json({ error: "Unable to read notification queue" }, { status: 500 });

  let sent = 0; let failed = 0;
  for (const row of rows ?? []) {
    const { data: claimed, error: claimError } = await admin.from("notification_outbox")
      .update({ status: "processing", attempts: 1 }).eq("id", row.id)
      .in("status", ["pending", "failed"]).select("id").maybeSingle();
    if (claimError || !claimed) continue;

    try {
      const [{ data: authUser, error: userError }, eventResult, bookingResult] = await Promise.all([
        admin.auth.admin.getUserById(row.user_id),
        row.event_id ? admin.from("events").select("title,starts_at,venue_name,city,country,slug").eq("id", row.event_id).maybeSingle() : Promise.resolve({ data: null, error: null } as any),
        row.booking_id ? admin.from("bookings").select("reference,total_minor,currency,currency_exponent").eq("id", row.booking_id).maybeSingle() : Promise.resolve({ data: null, error: null } as any)
      ]);
      const email = authUser.user?.email;
      if (userError || !email || !eventResult.data) throw new Error("Recipient or event details unavailable");
      const event = eventResult.data;
      const isReminder = row.notification_type === "event_reminder";
      const subject = isReminder ? `Reminder: ${event.title} is coming up` : `Your EventSphere ticket is confirmed`;
      const booking = bookingResult.data;
      const amount = booking ? new Intl.NumberFormat("en", { style: "currency", currency: booking.currency }).format(Number(booking.total_minor) / 10 ** booking.currency_exponent) : "";
      const heading = isReminder ? "Your event is coming up" : "Your booking is confirmed";
      const message = isReminder
        ? `A reminder that ${event.title} is scheduled for ${new Date(event.starts_at).toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}.`
        : `Your payment has been confirmed for ${event.title}. Booking reference: ${booking?.reference ?? "available in your account"}.`;
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#241b35"><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(message)}</p><p><strong>${escapeHtml(event.venue_name ?? "")}</strong><br>${escapeHtml([event.city,event.country].filter(Boolean).join(", "))}</p>${amount ? `<p>Total paid: <strong>${escapeHtml(amount)}</strong></p>` : ""}<p><a href="${escapeHtml((process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") + "/tickets")}" style="display:inline-block;background:#6d35e8;color:white;padding:12px 20px;border-radius:24px;text-decoration:none">View my tickets</a></p><p>Keep your QR ticket private and show it at the entrance.</p></div>`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email], subject, html, tags: [{ name: "event", value: row.notification_type }] })
      });
      if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
      await admin.from("notification_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      await admin.from("notification_outbox").update({ status: "failed", last_error: message.slice(0, 500) }).eq("id", row.id);
      failed++;
    }
  }
  return NextResponse.json({ processed: sent + failed, sent, failed });
}
