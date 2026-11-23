import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    const { bookingId } = await request.json();
    const admin = createAdminClient();
    const { data: booking } = await admin.from("bookings").select("id,reference,user_id,status,currency,total_minor,expires_at").eq("id", String(bookingId)).eq("user_id", user.id).maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "pending" || new Date(booking.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "Reservation expired or no longer payable" }, { status: 409 });
    if (Number(booking.total_minor) <= 0) return NextResponse.json({ error: "This booking has no payable balance" }, { status: 400 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({ mode: "payment", customer_email: user.email, client_reference_id: booking.id, metadata: { booking_id: booking.id }, line_items: [{ quantity: 1, price_data: { currency: booking.currency.toLowerCase(), unit_amount: Number(booking.total_minor), product_data: { name: `EventSphere booking ${booking.reference}` } } }], success_url: new URL(`/payments/return?booking=${booking.id}&provider=stripe`, request.url).toString(), cancel_url: new URL(`/bookings/${booking.id}`, request.url).toString() });
    await admin.from("payments").insert({ booking_id: booking.id, provider: "stripe", provider_reference: session.id, amount_minor: Number(booking.total_minor), currency: booking.currency, status: "initialized" });
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Stripe checkout" }, { status: 500 }); }
}
