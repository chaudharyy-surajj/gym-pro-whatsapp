import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeStatus, calcEndDate } from "@/lib/memberStatus";
import { checkMemberBirthday } from "@/lib/birthdayService";
import { sendWelcomeMessage } from "@/lib/welcomeMessageService";

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

    // ── Auto-date resolution ──────────────────────────────────────────
    // If the user didn't supply a join date, default to today.
    const resolvedJoinDate = joinDate ? new Date(joinDate) : new Date();

    // If membershipEnd wasn't explicitly provided, compute it from plan.
    const resolvedMembershipEnd = membershipEnd
      ? new Date(membershipEnd)
      : calcEndDate(resolvedJoinDate, plan ?? null);

    // feeDueDate falls back to membershipEnd when absent.
    const resolvedFeeDueDate = feeDueDate
      ? new Date(feeDueDate)
      : resolvedMembershipEnd;
    // ─────────────────────────────────────────────────────────────────

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
        joinDate: resolvedJoinDate,
        membershipEnd: resolvedMembershipEnd,
        feeDueDate: resolvedFeeDueDate,
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

    // ── REAL-TIME BIRTHDAY CHECK ──────────────────────────────────────
    // If the member's birthday is today, send birthday wish immediately
    let birthdayWishSent = false;
    let birthdayWishMessage = "";
    
    if (birthday) {
      try {
        const birthdayResult = await checkMemberBirthday(member.id, "WHATSAPP");
        birthdayWishSent = birthdayResult.sent;
        birthdayWishMessage = birthdayResult.reason;
        
        if (birthdayResult.sent) {
          console.log(`🎂 Birthday wish sent immediately for new member: ${fullName}`);
        } else {
          console.log(`ℹ️ Birthday wish not sent: ${birthdayResult.reason}`);
        }
      } catch (error) {
        console.error("⚠️ Failed to check birthday for new member:", error);
        // Don't fail member creation if birthday check fails
      }
    }
    // ─────────────────────────────────────────────────────────────────

    // ── WELCOME MESSAGE ───────────────────────────────────────────────
    // Send welcome message to new member
    try {
      const welcomeResult = await sendWelcomeMessage(
        member.id,
        fullName,
        firstName || fullName.split(' ')[0],
        member.phone,
        plan,
        "Gravity Fitness"
      );
      
      if (welcomeResult.success) {
        console.log(`👋 Welcome message sent to new member: ${fullName}`);
      }
    } catch (error) {
      console.error("⚠️ Failed to send welcome message:", error);
      // Don't fail member creation if welcome message fails
    }
    // ─────────────────────────────────────────────────────────────────

    return NextResponse.json({
      ...member,
      birthdayWishSent,
      birthdayWishMessage: birthdayWishMessage || undefined
    }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
