"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ButtonLoader } from "@/components/ui/button-loader";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`
          }
        });
        if (authError) setError(authError.message);
        else if (!data.session) setMessage("Check your email for the confirmation link. Once confirmed, you can sign in.");
        else router.push("/account");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) setError(authError.message);
        else router.push(searchParams.get("next") || "/account");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to complete authentication. Please try again.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  async function googleSignIn() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` }
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to start Google sign-in.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fffdf9] px-5 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-black/[0.07] bg-white p-7 shadow-2xl shadow-[#33205d]/[0.07] sm:p-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="EventSphere home">
            <Image src="/eventsphere-logo.svg" alt="EventSphere" width={200} height={70} priority className="h-auto w-[150px]" />
          </Link>
          <Link href="/" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#6d35e8]"><ArrowLeft size={16}/> Back home</Link>
        </div>
        <h1 className="mt-8 text-3xl font-black tracking-[-1.2px]">{isRegister ? "Your next experience starts here." : "Welcome back."}</h1>
        <p className="mt-2 text-sm leading-6 text-[#777180]">{isRegister ? "Create an account to save events and manage your tickets." : "Sign in to continue discovering experiences."}</p>
        <button type="button" onClick={googleSignIn} disabled={busy} className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-[#e8e5ed] px-5 py-3.5 text-sm font-bold transition hover:bg-[#faf9fc] disabled:opacity-60">
          {busy ? <ButtonLoader className="text-[#6d35e8]" /> : <GoogleMark/>} Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs font-semibold text-[#a09ba8]"><span className="h-px flex-1 bg-[#eeeaf2]"/> OR WITH EMAIL <span className="h-px flex-1 bg-[#eeeaf2]"/></div>
        <form onSubmit={submit} className="space-y-4">
          {isRegister && <label className="block text-sm font-bold text-[#373241]">Full name<input required minLength={2} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#e8e5ed] px-4 py-3.5 font-normal outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10" placeholder="Your name"/></label>}
          <label className="block text-sm font-bold text-[#373241]">Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#e8e5ed] px-4 py-3.5 font-normal outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10" placeholder="you@example.com"/></label>
          <label className="block text-sm font-bold text-[#373241]">Password<input required type="password" minLength={6} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#e8e5ed] px-4 py-3.5 font-normal outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10" placeholder="At least 6 characters"/></label>
          {!isRegister && <div className="-mt-2 text-right"><Link href="/forgot-password" className="text-sm font-bold text-[#6d35e8] underline-offset-4 hover:underline">Forgot password?</Link></div>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5927cb] disabled:opacity-60">
            {busy && <ButtonLoader/>}{busy ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create account" : "Log in")}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-[#777180]">{isRegister ? "Already have an account?" : "New to EventSphere?"} <Link className="font-extrabold text-[#6d35e8]" href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.74 7.18l7.66 5.94c4.47-4.13 7.15-10.2 7.15-17.59Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.86l-7.66-5.94c-2.13 1.43-4.86 2.28-8.25 2.28-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}
