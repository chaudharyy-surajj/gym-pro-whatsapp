import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await prisma.botStatus.findFirst({
        where: { id: 1 }
    });
    
    const logs = await prisma.botMessageLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" }
    });

    const stats = {
        messagesSent: await prisma.botMessageLog.count({ where: { direction: "OUTBOUND" } }),
        autoReplies: await prisma.botMessageLog.count({ where: { type: "AUTO_REPLY" } }),
        triggersRun: await prisma.botMessageLog.count({ where: { type: { not: "AUTO_REPLY" } } })
    };

    return NextResponse.json({ 
        status: status?.status || "OFFLINE", 
        qr: status?.qr || null,
        logs,
        stats
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bot status" }, { status: 500 });
  }
}
