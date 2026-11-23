"use client";
import { useState } from "react";
import { ButtonLoader } from "@/components/ui/button-loader";
export function CheckoutButtons({ bookingId, currency }: { bookingId: string; currency: string }) {
  const [busy, setBusy] = useState<"paystack"|"stripe"|null>(null);
  const [error, setError] = useState("");
  async function start(provider: "paystack"|"stripe") {
    setBusy(provider); setError("");
    try {
      const endpoint = provider === "paystack" ? "/api/payments/paystack/initialize" : "/api/payments/stripe/checkout";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start payment");
      const destination = result.authorizationUrl || result.checkoutUrl;
      if (!destination) throw new Error("Payment provider did not return a checkout URL");
      window.location.assign(destination);
    } catch (e) { setError(e instanceof Error ? e.message : "Payment failed to start"); setBusy(null); }
  }
  return <div className="mt-6 space-y-3"><button onClick={() => start("paystack")} disabled={!!busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{busy === "paystack" && <ButtonLoader/>}{busy === "paystack" ? "Preparing secure checkout…" : `Pay with Paystack (${currency})`}</button><button onClick={() => start("stripe")} disabled={!!busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-bold disabled:opacity-60">{busy === "stripe" && <ButtonLoader/>}{busy === "stripe" ? "Preparing secure checkout…" : "Pay with Stripe"}</button>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>;
}
