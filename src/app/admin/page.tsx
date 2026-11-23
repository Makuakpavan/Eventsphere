import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login?next=/admin");
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin") redirect("/account");
 const admin=createAdminClient();
 const [{count:users},{count:events},{count:published},{count:payments},{data:recent}] = await Promise.all([
  admin.from("profiles").select("*",{count:"exact",head:true}),
  admin.from("events").select("*",{count:"exact",head:true}),
  admin.from("events").select("*",{count:"exact",head:true}).eq("status","published"),
  admin.from("payments").select("*",{count:"exact",head:true}),
  admin.from("admin_audit_logs").select("action,target_type,target_id,created_at").order("created_at",{ascending:false}).limit(8)
 ]);
 return <main className="min-h-screen bg-[#fffdf9] px-5 py-10"><div className="mx-auto max-w-6xl">
  <p className="text-xs font-black uppercase tracking-[.2em] text-[#8a8294]">Platform control centre</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Admin dashboard</h1><p className="mt-2 text-sm text-[#777180]">Manage EventSphere users, events, payments and platform activity.</p>
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Registered users" value={users??0}/><Stat label="Total events" value={events??0}/><Stat label="Published events" value={published??0}/><Stat label="Payment records" value={payments??0}/></div>
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Users","/admin/users","Manage roles and accounts"],["Event moderation","/admin/events","Review and moderate listings"],["Payments","/admin/payments","Inspect payment records"],["Audit logs","/admin/audit-logs","Review administrator actions"]].map(([title,href,desc])=><Link key={href} href={href} className="rounded-2xl border border-[#eee9f2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"><h2 className="font-black">{title}</h2><p className="mt-2 text-sm text-[#777180]">{desc}</p><p className="mt-4 text-sm font-bold text-[#6d35e8]">Open section →</p></Link>)}</div>
  <section className="mt-10 rounded-2xl border border-[#eee9f2] bg-white p-5"><h2 className="font-black">Recent admin activity</h2>{recent?.length?<div className="mt-4 divide-y divide-[#f0edf3]">{recent.map((row:any,i)=><div key={i} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-semibold">{row.action} · {row.target_type} {row.target_id?.slice(0,8)}</span><span className="text-[#777180]">{new Date(row.created_at).toLocaleString()}</span></div>)}</div>:<p className="mt-3 text-sm text-[#777180]">No recorded admin activity yet.</p>}</section>
 </div></main>;
}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-[#eee9f2] bg-white p-5"><p className="text-sm text-[#777180]">{label}</p><p className="mt-2 text-2xl font-black">{value.toLocaleString()}</p></div>}
