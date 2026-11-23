import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeUserRoleAction } from "../actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export default async function AdminUsersPage({searchParams}:{searchParams:Promise<{error?:string;updated?:string}>}) {
 const params=await searchParams; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle(); if(profile?.role!=="admin") redirect("/account");
 const admin=createAdminClient(); const {data:authData,error}=await admin.auth.admin.listUsers({page:1,perPage:100});
 const ids=(authData?.users??[]).map(u=>u.id); const {data:profiles}=ids.length?await admin.from("profiles").select("id,full_name,role,created_at").in("id",ids):{data:[] as any[]};
 const profileMap=new Map((profiles??[]).map(p=>[p.id,p]));
 return <main className="min-h-screen bg-[#fffdf9] px-5 py-10"><div className="mx-auto max-w-6xl"><Back/><h1 className="mt-5 text-3xl font-black">User management</h1><p className="mt-2 text-sm text-[#777180]">Review accounts and assign attendee, organizer or administrator roles.</p>
 {params.updated&&<Notice>Account role updated.</Notice>}{params.error&&<ErrorBox>{params.error}</ErrorBox>}{error&&<ErrorBox>{error.message}</ErrorBox>}
 <div className="mt-7 overflow-x-auto rounded-2xl border border-[#eee9f2] bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#faf8fc] text-xs uppercase text-[#777180]"><tr><th className="p-4">User</th><th className="p-4">Joined</th><th className="p-4">Current role</th><th className="p-4">Change role</th></tr></thead><tbody className="divide-y divide-[#f0edf3]">{(authData?.users??[]).map(u=>{const p=profileMap.get(u.id);return <tr key={u.id}><td className="p-4"><p className="font-bold">{p?.full_name||"Unnamed user"}</p><p className="text-xs text-[#777180]">{u.email}</p></td><td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td><td className="p-4 capitalize">{p?.role??"unknown"}</td><td className="p-4"><form action={changeUserRoleAction} className="flex gap-2"><input type="hidden" name="user_id" value={u.id}/><select name="role" defaultValue={p?.role??"attendee"} className="rounded-lg border border-[#e9e4ef] px-2 py-2"><option value="attendee">Attendee</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select><PendingSubmitButton pendingText="Saving..." className="inline-flex min-w-20 items-center justify-center gap-2 rounded-lg bg-[#6d35e8] px-3 py-2 text-xs font-bold text-white">Save</PendingSubmitButton></form></td></tr>})}</tbody></table></div>
 <p className="mt-3 text-xs text-[#777180]">Showing the first 100 accounts. Role changes are recorded in the audit log.</p></div></main>;
}
function Back(){return <Link href="/admin" className="text-sm font-bold text-[#6d35e8]">← Admin dashboard</Link>}
function Notice({children}:{children:React.ReactNode}){return <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{children}</p>}
function ErrorBox({children}:{children:React.ReactNode}){return <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{children}</p>}
