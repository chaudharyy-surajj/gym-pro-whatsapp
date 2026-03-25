import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get birthday wish logs
 * GET /api/birthday-logs
 */
export async function GET() {
  try {
    const logs = await prisma.botMessageLog.findMany({
      where: {
        type: "BIRTHDAY",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Also get member birthday status
    const members = await prisma.member.findMany({
      where: {
        birthday: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        birthday: true,
        lastBirthdayWish: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check which members have birthdays today
    const today = new Date();
    const membersWithStatus = members.map((member) => {
      const birthday = new Date(member.birthday!);
      const isBirthdayToday =
        birthday.getDate() === today.getDate() &&
        birthday.getMonth() === today.getMonth();

      return {
        ...member,
        isBirthdayToday,
      };
    });

    return NextResponse.json({
      logs,
      members: membersWithStatus,
      todaysBirthdays: membersWithStatus.filter((m) => m.isBirthdayToday),
    });
  } catch (error: any) {
    console.error("❌ Error fetching birthday logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch birthday logs" },
      { status: 500 }
    );
  }
}
