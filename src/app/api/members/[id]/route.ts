import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const {
      firstName, lastName, gender, photo,
      phone, email, address,
      emergencyContact, emergencyPhone,
      plan, status, joinDate, membershipEnd, feeDueDate,
      birthday, amountPaid, notes, cardNumber,
    } = body;

    const fullName = [firstName, lastName].filter(Boolean).join(" ") || phone;

    const member = await prisma.member.update({
      where: { id },
      data: {
        name: fullName,
        firstName: firstName || null,
        lastName: lastName || null,
        gender: gender || null,
        photo: photo ?? undefined,
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
            type: "RENEWAL",
          }
        } : undefined,
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
