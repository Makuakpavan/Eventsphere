import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to enable notifications." }, { status: 401 });
  }

  let payload: PushSubscriptionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid subscription payload." }, { status: 400 });
  }

  if (typeof payload.endpoint !== "string" || !payload.endpoint.startsWith("https://") ||
      typeof payload.keys?.p256dh !== "string" || typeof payload.keys?.auth !== "string") {
    return NextResponse.json({ error: "A valid browser push subscription is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: payload.endpoint,
    subscription: payload,
    updated_at: new Date().toISOString()
  }, { onConflict: "endpoint" });

  if (error) {
    console.error("Unable to save push subscription:", error.message);
    return NextResponse.json({ error: "Unable to save notification preferences." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to manage notifications." }, { status: 401 });
  }

  let endpoint: string;
  try {
    const body = await request.json();
    endpoint = body.endpoint;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "A valid subscription endpoint is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions")
    .delete().eq("endpoint", endpoint).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to remove notification preference." }, { status: 500 });
  return NextResponse.json({ success: true });
}
