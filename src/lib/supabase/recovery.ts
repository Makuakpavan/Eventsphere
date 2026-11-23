export const RECOVERY_COOKIE_NAME = "eventsphere-password-recovery";
export const RECOVERY_WINDOW_SECONDS = 60 * 60;

export function isRecentRecoveryTimestamp(timestamp?: string): timestamp is string {
  if (!timestamp) return false;

  const elapsed = Date.now() - Date.parse(timestamp);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= RECOVERY_WINDOW_SECONDS * 1000;
}
