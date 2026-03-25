import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeStatus } from "@/lib/memberStatus";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const now = new Date();

    // Default: last 7 days
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const from = fromParam
      ? new Date(fromParam + "T00:00:00")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const to = toParam
      ? new Date(toParam + "T23:59:59.999")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch all data in range
    const [expenses, members, payments, attendance] = await Promise.all([
      prisma.expense.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: "desc" },
      }),
      prisma.member.findMany({
        where: { joinDate: { gte: from, lte: to } },
        orderBy: { joinDate: "desc" },
      }),
      prisma.payment.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: "desc" },
        include: { member: { select: { name: true, phone: true } } },
      }),
      prisma.attendance.findMany({
        where: { timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "desc" },
        include: { member: { select: { name: true, phone: true, plan: true } } },
      }),
    ]);

    // Helper function to convert date to YYYY-MM-DD string
    const toDateKey = (d: Date): string => {
      return d.toISOString().split("T")[0];
    };

    // Collect all unique dates
    const dateSet = new Set<string>();
    expenses.forEach((e) => dateSet.add(toDateKey(new Date(e.date))));
    members.forEach((m) => m.joinDate && dateSet.add(toDateKey(new Date(m.joinDate))));
    payments.forEach((p) => dateSet.add(toDateKey(new Date(p.date))));
    attendance.forEach((a) => dateSet.add(toDateKey(new Date(a.timestamp))));

    // Also add all dates in range that have no activity (for a continuous timeline)
    const cursor = new Date(from);
    while (cursor <= to) {
      dateSet.add(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a)); // newest first

    const days = sortedDates.map((dateKey) => {
      const dayExpenses = expenses.filter((e) => toDateKey(new Date(e.date)) === dateKey);
      const dayMembers = members
        .filter((m) => m.joinDate && toDateKey(new Date(m.joinDate)) === dateKey)
        .map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          plan: m.plan,
          amountPaid: m.amountPaid,
          status: computeStatus(m),
        }));
      const dayPayments = payments
        .filter((p) => toDateKey(new Date(p.date)) === dateKey)
        .map((p) => ({
          id: p.id,
          memberName: p.member?.name || "Unknown",
          memberPhone: p.member?.phone || "",
          amount: p.amount,
          type: p.type,
        }));
      const dayAttendance = attendance
        .filter((a) => toDateKey(new Date(a.timestamp)) === dateKey)
        .map((a) => ({
          id: a.id,
          name: a.member?.name || "Unknown",
          phone: a.member?.phone || "",
          plan: a.member?.plan || null,
          time: a.timestamp,
          method: a.method,
        }));

      const totalExpense = dayExpenses.reduce((s, e) => s + e.amount, 0);
      const totalIncome = dayPayments.reduce((s, p) => s + p.amount, 0);

      return {
        date: dateKey,
        expenses: dayExpenses.map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          amount: e.amount,
        })),
        newMembers: dayMembers,
        payments: dayPayments,
        attendance: dayAttendance,
        totalExpense,
        totalIncome,
        attendanceCount: dayAttendance.length,
        newMemberCount: dayMembers.length,
      };
    });

    const summary = {
      totalExpense: days.reduce((s, d) => s + d.totalExpense, 0),
      totalIncome: days.reduce((s, d) => s + d.totalIncome, 0),
      netRevenue: days.reduce((s, d) => s + d.totalIncome - d.totalExpense, 0),
      totalNewMembers: days.reduce((s, d) => s + d.newMemberCount, 0),
      totalAttendance: days.reduce((s, d) => s + d.attendanceCount, 0),
    };

    return NextResponse.json({ days, summary });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
