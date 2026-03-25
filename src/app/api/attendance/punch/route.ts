import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardNumber } = body;

    if (!cardNumber) {
      return NextResponse.json({ error: "Card number is required" }, { status: 400 });
    }

    // Find member by card number
    const member = await prisma.member.findUnique({
      where: { cardNumber },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Create attendance log
    const attendance = await prisma.attendance.create({
      data: {
        memberId: member.id,
        method: "BIOMETRIC",
      },
    });

    // Update lastAttendance in member
    await prisma.member.update({
      where: { id: member.id },
      data: { lastAttendance: new Date() },
    });

    return NextResponse.json({ 
      success: true, 
      memberName: member.name,
      timestamp: attendance.timestamp 
    }, { status: 201 });
  } catch (error) {
    console.error("Attendance punch error:", error);
    return NextResponse.json({ error: "Failed to log attendance" }, { status: 500 });
  }
}
