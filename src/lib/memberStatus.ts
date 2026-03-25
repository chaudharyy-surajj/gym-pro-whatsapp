/**
 * Computes the effective displayed status for a member.
 *
 * Rules (in priority order):
 *   1. FROZEN  → always stays FROZEN (manual override)
 *   2. membershipEnd in the past → DUE (auto)
 *   3. Otherwise → ACTIVE
 */
export function computeStatus(member: {
  status: string;
  membershipEnd: Date | string | null;
}): string {
  if (member.status === "FROZEN") return "FROZEN";
  if (!member.membershipEnd) return "ACTIVE";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(member.membershipEnd);
  return end < today ? "DUE" : "ACTIVE";
}

/**
 * Calculates a new membershipEnd date from a start date and plan type.
 * Returns null if plan is unknown.
 */
export function calcEndDate(
  from: Date | string,
  plan: string | null
): Date | null {
  const durations: Record<string, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    ANNUAL: 12,
  };
  const months = plan ? durations[plan] : null;
  if (!months) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1); // inclusive last day
  return d;
}
