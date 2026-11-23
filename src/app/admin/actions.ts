"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/account");
  return { user, supabase };
}

async function audit(actorId: string, action: string, targetType: string, targetId: string, details: Record<string, unknown> = {}) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit_logs").insert({
    actor_id: actorId, action, target_type: targetType, target_id: targetId, details
  });
  if (error) throw new Error("Action completed but audit logging failed. Contact platform support.");
}

export async function changeUserRoleAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const targetId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(targetId) || !["attendee", "organizer", "admin"].includes(role)) {
    redirect("/admin/users?error=Invalid+user+or+role");
  }
  const { data: before } = await supabase.from("profiles").select("role").eq("id", targetId).maybeSingle();
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: targetId, p_role: role });
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  await audit(user.id, "user.role_changed", "profile", targetId, { from: before?.role ?? null, to: role });
  revalidatePath("/admin"); revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function moderateAdminEventAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const id = String(formData.get("event_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["published", "rejected", "cancelled"].includes(status)) {
    redirect("/admin/events?error=Invalid+moderation+request");
  }
  const { data: before } = await supabase.from("events").select("status").eq("id", id).maybeSingle();
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) redirect(`/admin/events?error=${encodeURIComponent(error.message)}`);
  await audit(user.id, "event.status_changed", "event", id, { from: before?.status ?? null, to: status });
  revalidatePath("/admin"); revalidatePath("/admin/events"); revalidatePath("/events");
  redirect("/admin/events?updated=1");
}
