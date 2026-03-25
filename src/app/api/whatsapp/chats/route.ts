import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
