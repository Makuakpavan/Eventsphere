import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  isRecentRecoveryTimestamp,
  RECOVERY_COOKIE_NAME
} from "@/lib/supabase/recovery";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset your password"
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, cookieStore, supabase] = await Promise.all([
    searchParams,
    cookies(),
    createClient()
  ]);
  const recoveryTimestamp = cookieStore.get(RECOVERY_COOKIE_NAME)?.value;
  const { data: { user } } = await supabase.auth.getUser();
  const hasRecoverySession = Boolean(
    user &&
    recoveryTimestamp &&
    user.recovery_sent_at === recoveryTimestamp &&
    isRecentRecoveryTimestamp(recoveryTimestamp)
  );

  return (
    <ResetPasswordForm
      canReset={hasRecoverySession}
      invalidLink={error === "invalid_recovery_link"}
    />
  );
}
