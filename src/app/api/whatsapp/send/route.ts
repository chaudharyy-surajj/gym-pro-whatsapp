import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, text } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: "Phone and text are required" }, { status: 400 });
    }

    const command = await prisma.botCommand.create({
      data: {
        command: "SEND_MESSAGE",
        payload: JSON.stringify({ phone, text }),
        status: "PENDING",
      },
    });

    return NextResponse.json(command);
  } catch (error) {
    return NextResponse.json({ error: "Failed to enqueue message" }, { status: 500 });
  }
}
