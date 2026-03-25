import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeStatus } from "@/lib/memberStatus";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Inject computed effective status into each member
    const result = members.map((m) => ({
      ...m,
      status: computeStatus(m),
    }));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName, lastName, gender, photo,
      phone, email, address,
      emergencyContact, emergencyPhone,
      plan, status, joinDate, membershipEnd, feeDueDate,
      birthday, amountPaid, notes, cardNumber,
    } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ") || phone;

    const member = await prisma.member.create({
      data: {
        name: fullName,
        firstName: firstName || null,
        lastName: lastName || null,
        gender: gender || null,
        photo: photo || null,
        phone,
        email: email || null,
        address: address || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        plan: plan || null,
        status: status || "ACTIVE",
        joinDate: joinDate ? new Date(joinDate) : null,
        membershipEnd: membershipEnd ? new Date(membershipEnd) : null,
        feeDueDate: feeDueDate ? new Date(feeDueDate) : null,
        birthday: birthday ? new Date(birthday) : null,
        amountPaid: amountPaid ? parseFloat(amountPaid) : null,
        notes: notes || null,
        cardNumber: cardNumber || null,
        payments: amountPaid && parseFloat(amountPaid) > 0 ? {
          create: {
            amount: parseFloat(amountPaid),
            type: "ADMISSION",
          }
        } : undefined,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
