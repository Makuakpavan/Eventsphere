import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isRecentRecoveryTimestamp,
  RECOVERY_COOKIE_NAME,
  RECOVERY_WINDOW_SECONDS
} from "@/lib/supabase/recovery";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext === "/reset-password" ? "/reset-password" : "/account";

  if (!code) {
    const destination = next === "/reset-password"
      ? "/reset-password?error=invalid_recovery_link"
      : "/login?error=auth_callback_failed";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    const destination = next === "/reset-password"
      ? "/reset-password?error=invalid_recovery_link"
      : "/login?error=auth_callback_failed";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (next === "/reset-password") {
    const recoverySentAt = data.user.recovery_sent_at;
    if (!isRecentRecoveryTimestamp(recoverySentAt)) {
      return NextResponse.redirect(
        new URL("/reset-password?error=invalid_recovery_link", request.url)
      );
    }

    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(RECOVERY_COOKIE_NAME, recoverySentAt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: RECOVERY_WINDOW_SECONDS
    });
    return response;
  }

  return NextResponse.redirect(new URL(next, request.url));
}
