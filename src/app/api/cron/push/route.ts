import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QueueRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url: string;
  attempts: number;
};

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error("Web Push VAPID configuration is incomplete.");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function processQueue(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    configureWebPush();
  } catch {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin.from("push_outbox")
    .select("id,user_id,title,body,url,attempts")
    .in("status", ["pending", "failed"]).lt("attempts", 5)
    .order("created_at", { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: "Unable to read push queue." }, { status: 500 });

  let delivered = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of (rows ?? []) as QueueRow[]) {
    const { data: claimed, error: claimError } = await admin.from("push_outbox")
      .update({ status: "processing", attempts: row.attempts + 1 })
      .eq("id", row.id).in("status", ["pending", "failed"]).select("id").maybeSingle();
    if (claimError || !claimed) continue;

    const { data: subscriptions, error: subscriptionError } = await admin.from("push_subscriptions")
      .select("id,subscription").eq("user_id", row.user_id);
    if (subscriptionError) {
      await admin.from("push_outbox").update({ status: "failed", last_error: "Unable to read recipient subscriptions." }).eq("id", row.id);
      failed++;
      continue;
    }
    if (!subscriptions?.length) {
      await admin.from("push_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      skipped++;
      continue;
    }

    const payload = JSON.stringify({
      title: row.title, body: row.body, url: row.url || "/tickets", tag: `eventsphere-${row.id}`
    });
    let anySuccess = false;
    let anyFailure = false;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription.subscription as webpush.PushSubscription, payload, {
          TTL: 86400, urgency: "normal"
        });
        anySuccess = true;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        } else {
          anyFailure = true;
        }
      }
    }

    if (anySuccess) {
      await admin.from("push_outbox").update({
        status: "sent", sent_at: new Date().toISOString(),
        last_error: anyFailure ? "Some device deliveries failed." : null
      }).eq("id", row.id);
      delivered++;
    } else if (anyFailure) {
      await admin.from("push_outbox").update({
        status: "failed", last_error: "Push delivery failed for all active subscriptions."
      }).eq("id", row.id);
      failed++;
    } else {
      await admin.from("push_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      skipped++;
    }
  }
  return NextResponse.json({ processed: delivered + failed + skipped, delivered, failed, skipped });
}

export async function GET(request: Request) { return processQueue(request); }
export async function POST(request: Request) { return processQueue(request); }
