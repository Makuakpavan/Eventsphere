import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  isRecentRecoveryTimestamp,
  RECOVERY_COOKIE_NAME
} from "@/lib/supabase/recovery";

const PASSWORD_MIN_LENGTH = 8;

function isStrongPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    !isStrongPassword(body.password)
  ) {
    return NextResponse.json({ error: "Password does not meet the requirements." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const recoveryTimestamp = cookieStore.get(RECOVERY_COOKIE_NAME)?.value;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (
    !user ||
    !recoveryTimestamp ||
    user.recovery_sent_at !== recoveryTimestamp ||
    !isRecentRecoveryTimestamp(recoveryTimestamp)
  ) {
    return NextResponse.json(
      { error: "A valid, recent password recovery session is required." },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password: body.password });
  if (error) {
    return NextResponse.json(
      { error: "Unable to update the password. Request a new reset link and try again." },
      { status: 400 }
    );
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  await supabase.auth.signOut({ scope: "local" });
  cookieStore.set(RECOVERY_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return NextResponse.json({
    success: true,
    otherSessionsSignedOut: !signOutError
  });
}
