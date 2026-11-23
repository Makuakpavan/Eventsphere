"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ButtonLoader } from "@/components/ui/button-loader";

export default function CheckInPage() {
  const [token,setToken]=useState(""); const [result,setResult]=useState<any>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError("");setResult(null);
    try {const supabase=createClient(); const {data,error}=await supabase.rpc("check_in_ticket",{p_qr_token:token.trim()});
      if(error)setError(error.message);else setResult(data?.[0]??null);
    } catch (requestError) {setError(requestError instanceof Error?requestError.message:"Unable to check in this ticket.");}
    finally {setBusy(false);}
  }
  return <main className="min-h-screen bg-[#fffdf9] px-5 py-12"><div className="mx-auto max-w-xl rounded-3xl border border-black/5 bg-white p-7 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-[#8b8298]">Event operations</p><h1 className="mt-2 text-3xl font-black">Ticket check-in</h1><p className="mt-2 text-sm text-[#777180]">Enter the QR token from a ticket URL. Only the event&apos;s organizer or an admin can validate admission.</p><form onSubmit={submit} className="mt-6 space-y-3"><label className="block text-sm font-bold">QR token<input value={token} onChange={e=>setToken(e.target.value)} required className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-mono text-sm" placeholder="Paste scanned QR token"/></label><button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6d35e8] px-5 py-3 font-bold text-white disabled:opacity-50">{busy&&<ButtonLoader/>}{busy?"Checking…":"Validate and check in"}</button></form>
    {error&&<p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
    {result&&<div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800"><p className="font-black">Check-in successful</p><p className="mt-1 text-sm">{result.event_title} · {result.ticket_type_name}</p><p className="mt-1 font-mono text-sm">{result.ticket_code}</p></div>}
  </div></main>;
}
