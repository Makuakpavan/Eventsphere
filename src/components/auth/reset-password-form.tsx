"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ButtonLoader } from "@/components/ui/button-loader";

const PASSWORD_MIN_LENGTH = 8;

function passwordError(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one uppercase letter, one lowercase letter, and one number.";
  }
  return "";
}

export function ResetPasswordForm({
  canReset,
  invalidLink
}: {
  canReset: boolean;
  invalidLink: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const validationError = passwordError(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result: { success?: boolean; otherSessionsSignedOut?: boolean } =
        await response.json();

      if (!response.ok || !result.success) {
        setError("This reset link may have expired. Request a new link and try again.");
        return;
      }

      setUpdated(true);
      if (result.otherSessionsSignedOut === false) {
        setError("Your password was changed, but other sessions could not be signed out. Sign in and review your account security.");
      }
    } catch {
      setError("We couldn't update your password right now. Please try again.");
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

        {updated ? (
          <div className="mt-8" role="status" aria-live="polite">
            <h1 className="text-3xl font-black tracking-[-1.2px] text-[#171329]">
              Password updated
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#777180]">
              Your EventSphere password has been changed. You can now sign in with your new password.
            </p>
            {error && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
            <Link
              href="/login"
              className="mt-7 flex w-full items-center justify-center rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#5927cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d35e8]"
            >
              Go to login
            </Link>
          </div>
        ) : !canReset ? (
          <div className="mt-8">
            <h1 className="text-3xl font-black tracking-[-1.2px] text-[#171329]">
              {invalidLink ? "This reset link is invalid or expired" : "Reset link required"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#777180]">
              {invalidLink
                ? "Password reset links are single-use and time-limited. Request a new link to continue."
                : "Open the password reset link sent to your email before choosing a new password."}
            </p>
            <Link
              href="/forgot-password"
              className="mt-7 flex w-full items-center justify-center rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#5927cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d35e8]"
            >
              Request a new reset link
            </Link>
            <Link href="/login" className="mt-5 block text-center text-sm font-bold text-[#6d35e8] underline-offset-4 hover:underline">
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-3xl font-black tracking-[-1.2px] text-[#171329]">
              Choose a new password
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#777180]">
              Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <PasswordInput
                id="new-password"
                label="New password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((visible) => !visible)}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
              />
              {error && (
                <p
                  role={updated ? "status" : "alert"}
                  className={`rounded-xl p-3 text-sm ${updated ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5927cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d35e8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <ButtonLoader />}
                {busy ? "Updating password..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-[#373241]">
        {label}
      </label>
      <span className="relative mt-2 block">
        <input
          id={id}
          required
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-[#e8e5ed] px-4 py-3.5 pr-12 font-normal outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10"
          placeholder="At least 8 characters"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-2xl text-[#777180] hover:text-[#6d35e8] focus-visible:outline-2 focus-visible:outline-[#6d35e8]"
        >
          {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
        </button>
      </span>
    </div>
  );
}
