import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function AdminAuditPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:p}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(p?.role!=="admin")redirect("/account");
 const admin=createAdminClient();const {data:rows,error}=await admin.from("admin_audit_logs").select("id,actor_id,action,target_type,target_id,details,created_at").order("created_at",{ascending:false}).limit(200);
 return <main className="min-h-screen bg-[#fffdf9] px-5 py-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-sm font-bold text-[#6d35e8]">← Admin dashboard</Link><h1 className="mt-5 text-3xl font-black">Audit logs</h1><p className="mt-2 text-sm text-[#777180]">A record of administrative role changes and event moderation actions.</p>{error&&<p className="mt-5 text-sm text-rose-700">{error.message}</p>}
 <div className="mt-7 overflow-x-auto rounded-2xl border border-[#eee9f2] bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#faf8fc] text-xs uppercase text-[#777180]"><tr><th className="p-4">Time</th><th className="p-4">Administrator</th><th className="p-4">Action</th><th className="p-4">Target</th><th className="p-4">Details</th></tr></thead><tbody className="divide-y divide-[#f0edf3]">{(rows??[]).map(r=><tr key={r.id}><td className="p-4">{new Date(r.created_at).toLocaleString()}</td><td className="p-4 font-mono text-xs">{r.actor_id?.slice(0,8)??"System"}</td><td className="p-4 font-bold">{r.action}</td><td className="p-4">{r.target_type} · {r.target_id?.slice(0,8)}</td><td className="p-4 font-mono text-xs">{JSON.stringify(r.details)}</td></tr>)}</tbody></table></div></div></main>;
}
