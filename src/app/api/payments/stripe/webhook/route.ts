import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const stripe = new Stripe(secret);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret); }
  catch { return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 }); }
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid" || !session.id) return NextResponse.json({ received: true });
  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("id,booking_id,amount_minor,currency,status").eq("provider", "stripe").eq("provider_reference", session.id).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  if (payment.status === "succeeded") return NextResponse.json({ received: true, duplicate: true });
  if (Number(session.amount_total) !== Number(payment.amount_minor) || session.currency?.toUpperCase() !== payment.currency) return NextResponse.json({ error: "Amount or currency mismatch" }, { status: 400 });
  const { data: booking } = await admin.from("bookings").select("id,status,expires_at").eq("id", payment.booking_id).maybeSingle();
  if (!booking || booking.status !== "pending" || new Date(booking.expires_at).getTime() <= Date.now()) {
    await admin.from("payments").update({ status: "review_required", provider_payload: session }).eq("id", payment.id);
    return NextResponse.json({ received: true, reviewRequired: true });
  }
  const { error } = await admin.rpc("confirm_paid_booking", { p_booking_id: payment.booking_id, p_payment_id: payment.id, p_provider_payload: session });
  if (error) return NextResponse.json({ error: "Could not confirm booking" }, { status: 500 });
  return NextResponse.json({ received: true });
}
