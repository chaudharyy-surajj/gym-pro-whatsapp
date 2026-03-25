import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calcEndDate } from "@/lib/memberStatus";

const prisma = new PrismaClient();

/**
 * POST /api/members/[id]/action
 * Body: { action: "freeze" | "unfreeze" | "activate" }
 *
 * freeze    → status = FROZEN
 * unfreeze  → status = ACTIVE (membership dates unchanged)
 * activate  → extend membershipEnd from today by plan, status = ACTIVE
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { action } = await req.json();

    if (!["freeze", "unfreeze", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let update: { status: string; membershipEnd?: Date | null; feeDueDate?: Date | null } = { status: "ACTIVE" };

    if (action === "freeze") {
      update = { status: "FROZEN" };
    } else if (action === "unfreeze") {
      update = { status: "ACTIVE" };
    } else if (action === "activate") {
      // Re-activate: extend membership from today
      const today = new Date();
      const newEnd = calcEndDate(today, member.plan);
      update = {
        status: "ACTIVE",
        membershipEnd: newEnd,
        feeDueDate: newEnd,
      };
    }

    const updated = await prisma.member.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
