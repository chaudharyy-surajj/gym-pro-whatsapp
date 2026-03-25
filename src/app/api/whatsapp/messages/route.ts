import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { phone },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Reset unread count for this chat
    await prisma.chat.update({
      where: { phone },
      data: { unreadCount: 0 }
    }).catch(() => {});

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
