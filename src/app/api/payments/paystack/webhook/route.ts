import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
  const raw = await request.text();
  const supplied = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  if (event.event !== "charge.success") return NextResponse.json({ received: true });
  const reference = String(event.data?.reference || "");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  try {
    // Never trust the webhook payload alone: fetch the transaction from Paystack.
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" });
    const verified = await verifyResponse.json();
    if (!verifyResponse.ok || !verified.status || verified.data?.status !== "success" || verified.data?.reference !== reference) return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
    const admin = createAdminClient();
    const { data: payment, error } = await admin.from("payments").select("id,booking_id,amount_minor,currency,status").eq("provider", "paystack").eq("provider_reference", reference).maybeSingle();
    if (error || !payment) return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    if (Number(verified.data.amount) !== Number(payment.amount_minor) || verified.data.currency !== payment.currency) return NextResponse.json({ error: "Payment amount or currency mismatch" }, { status: 400 });
    if (payment.status === "succeeded") return NextResponse.json({ received: true, duplicate: true });
    const { data: booking } = await admin.from("bookings").select("id,status,expires_at").eq("id", payment.booking_id).maybeSingle();
    if (!booking || booking.status !== "pending" || new Date(booking.expires_at).getTime() <= Date.now()) {
      await admin.from("payments").update({ status: "review_required", provider_payload: verified.data }).eq("id", payment.id);
      return NextResponse.json({ received: true, reviewRequired: true });
    }
    const { error: bookingError } = await admin.rpc("confirm_paid_booking", { p_booking_id: payment.booking_id, p_payment_id: payment.id, p_provider_payload: verified.data });
    if (bookingError) return NextResponse.json({ error: "Could not confirm booking" }, { status: 500 });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
