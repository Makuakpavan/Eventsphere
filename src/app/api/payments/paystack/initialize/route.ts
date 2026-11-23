import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
    const body = await request.json();
    const bookingId = String(body.bookingId || "");
    if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
    const admin = createAdminClient();
    const { data: booking, error } = await admin.from("bookings").select("id,reference,user_id,status,currency,currency_exponent,total_minor,expires_at").eq("id", bookingId).eq("user_id", user.id).maybeSingle();
    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "pending" || new Date(booking.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "This reservation has expired or is no longer payable" }, { status: 409 });
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
    const amount = Number(booking.total_minor);
    if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ error: "This booking has no payable balance or an invalid amount" }, { status: 400 });
    const callbackUrl = new URL(`/payments/return?booking=${encodeURIComponent(booking.id)}`, request.url).toString();
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, amount: String(amount), currency: booking.currency, reference: `${booking.reference}-${crypto.randomUUID().slice(0,8)}`, callback_url: callbackUrl, metadata: { booking_id: booking.id, booking_reference: booking.reference, user_id: user.id } }),
      cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) return NextResponse.json({ error: result.message || "Unable to start payment" }, { status: 502 });
    const { error: saveError } = await admin.from("payments").insert({ booking_id: booking.id, provider: "paystack", provider_reference: result.data.reference, amount_minor: amount, currency: booking.currency, status: "initialized" });
    if (saveError) return NextResponse.json({ error: "Could not record payment attempt" }, { status: 500 });
    return NextResponse.json({ authorizationUrl: result.data.authorization_url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment initialization failed" }, { status: 500 });
  }
}
