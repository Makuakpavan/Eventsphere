"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { ButtonLoader } from "@/components/ui/button-loader";
import { createClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = new URL(
        "/auth/callback?next=%2Freset-password",
        siteUrl
      ).toString();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo }
      );

      if (authError) {
        setError("We couldn't process your request right now. Please try again later.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We couldn't process your request right now. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fffdf9] px-5 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-black/[0.07] bg-white p-7 shadow-2xl shadow-[#33205d]/[0.07] sm:p-10">
        <Link href="/" aria-label="EventSphere home">
          <Image
            src="/eventsphere-logo.svg"
            alt="EventSphere"
            width={200}
            height={70}
            priority
            className="h-auto w-[150px]"
          />
        </Link>

        {submitted ? (
          <div className="mt-8" role="status" aria-live="polite">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#f2ebff] text-[#6d35e8]">
              <MailCheck aria-hidden="true" size={25} />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-[-1.2px] text-[#171329]">
              Check your inbox
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#777180]">
              If an account exists for that email, you&apos;ll receive a password reset link shortly. Check your spam folder too.
            </p>
            <Link
              href="/login"
              className="mt-7 flex w-full items-center justify-center rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#5927cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d35e8]"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-3xl font-black tracking-[-1.2px] text-[#171329]">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#777180]">
              Enter the email address you registered with and we&apos;ll send you a password reset link.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label htmlFor="reset-email" className="block text-sm font-bold text-[#373241]">
                Email address
                <input
                  id="reset-email"
                  required
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "reset-email-error" : undefined}
                  className="mt-2 w-full rounded-2xl border border-[#e8e5ed] px-4 py-3.5 font-normal outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10"
                  placeholder="you@example.com"
                />
              </label>
              {error && (
                <p id="reset-email-error" role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5927cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d35e8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <ButtonLoader />}
                {busy ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
            <Link
              href="/login"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#6d35e8] underline-offset-4 hover:underline"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Back to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
