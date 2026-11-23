import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function AdminPaymentsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:p}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(p?.role!=="admin")redirect("/account");
 const admin=createAdminClient();const {data:rows,error}=await admin.from("payments").select("id,provider,provider_reference,amount_minor,currency,status,booking_id,created_at").order("created_at",{ascending:false}).limit(200);
 return <main className="min-h-screen bg-[#fffdf9] px-5 py-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-sm font-bold text-[#6d35e8]">← Admin dashboard</Link><h1 className="mt-5 text-3xl font-black">Payment monitoring</h1><p className="mt-2 text-sm text-[#777180]">Recent payment attempts and verification outcomes. Provider payloads and secret credentials are not displayed.</p>{error&&<p className="mt-5 text-sm text-rose-700">{error.message}</p>}
 <div className="mt-7 overflow-x-auto rounded-2xl border border-[#eee9f2] bg-white"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[#faf8fc] text-xs uppercase text-[#777180]"><tr>{["Date","Provider","Reference","Amount","Status","Booking"].map(x=><th key={x} className="p-4">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#f0edf3]">{(rows??[]).map(r=><tr key={r.id}><td className="p-4">{new Date(r.created_at).toLocaleString()}</td><td className="p-4 capitalize">{r.provider}</td><td className="p-4 font-mono text-xs">{r.provider_reference}</td><td className="p-4 font-bold">{new Intl.NumberFormat("en",{style:"currency",currency:r.currency}).format(Number(r.amount_minor)/100)}</td><td className="p-4 capitalize">{r.status}</td><td className="p-4 font-mono text-xs">{r.booking_id.slice(0,8)}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-[#777180]">Showing the latest 200 payment records.</p></div></main>;
}
