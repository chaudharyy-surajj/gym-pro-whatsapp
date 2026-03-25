import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calcEndDate } from "@/lib/memberStatus";

const prisma = new PrismaClient();

/**
 * POST /api/members/[id]/renew
 *
 * The ONLY route that records a Payment (income event) for an existing member.
 * Call this when:
 *   - Renewing an existing membership (same plan)
 *   - Upgrading / downgrading to a different plan
 *
 * Body: { plan: string, amount: number, startDate?: string (ISO date) }
 *
 * Logic:
 *   1. Resolve start date — defaults to today, or the day after membershipEnd
 *      if the current membership hasn't expired yet (no gap in coverage).
 *   2. Compute new membershipEnd from start + plan duration.
 *   3. Update member fields.
 *   4. Insert exactly ONE Payment record so the dashboard income stays correct.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { plan, amount, startDate } = body;

    if (!plan) {
      return NextResponse.json({ error: "plan is required" }, { status: 400 });
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // ── Resolve start date ────────────────────────────────────────────
    let resolvedStart: Date;

    if (startDate) {
      // Caller explicitly provided a start date — respect it.
      resolvedStart = new Date(startDate);
    } else if (member.membershipEnd) {
      const end = new Date(member.membershipEnd);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (end >= today) {
        // Membership is still active → continue from the day after it ends.
        resolvedStart = new Date(end);
        resolvedStart.setDate(resolvedStart.getDate() + 1);
      } else {
        // Membership already expired → start fresh from today.
        resolvedStart = today;
      }
    } else {
      // No existing end date → start from today.
      resolvedStart = new Date();
      resolvedStart.setHours(0, 0, 0, 0);
    }

    // ── Compute new end date ──────────────────────────────────────────
    const newMembershipEnd = calcEndDate(resolvedStart, plan);

    // ── Persist ───────────────────────────────────────────────────────
    const updated = await prisma.member.update({
      where: { id },
      data: {
        plan,
        amountPaid: parsedAmount,
        membershipEnd: newMembershipEnd,
        feeDueDate: newMembershipEnd,
        status: "ACTIVE",
        // Record one Payment — this is what the dashboard reads.
        payments: {
          create: {
            amount: parsedAmount,
            type: "RENEWAL",
          },
        },
      },
    });

    return NextResponse.json({ member: updated, membershipEnd: newMembershipEnd });
  } catch (error) {
    console.error("[renew] error:", error);
    return NextResponse.json({ error: "Renewal failed" }, { status: 500 });
  }
}
