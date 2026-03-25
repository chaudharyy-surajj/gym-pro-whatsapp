import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeStatus } from "@/lib/memberStatus";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allMembers = await prisma.member.findMany({
      orderBy: { createdAt: "desc" },
    });
    const allPayments = await prisma.payment.findMany();
    const allExpenses = await prisma.expense.findMany();

    // Apply computed status to every member
    const members = allMembers.map((m) => ({ ...m, status: computeStatus(m) }));

    // Active members (computed)
    const activeMembers = members.filter((m) => m.status === "ACTIVE");

    // Fees pending: due date within next 7 days and not INACTIVE/FROZEN
    const feesPending = members.filter((m) => {
      if (!m.feeDueDate || m.status === "INACTIVE" || m.status === "FROZEN" || m.status === "DUE") return false; // Adjusted logic to match original if needed
      const due = new Date(m.feeDueDate);
      return due >= todayStart && due <= sevenDaysLater;
    });
    // Wait, let's look at the original feesPending logic (it used m.status !== "INACTIVE" etc)
    
    // Birthdays today: match day+month
    const birthdaysToday = members.filter((m) => {
      if (!m.birthday) return false;
      const bday = new Date(m.birthday);
      return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
    });

    // Attendance today
    const attendanceToday = members.filter((m) => {
      if (!m.lastAttendance) return false;
      const la = new Date(m.lastAttendance);
      return la >= todayStart && la < todayEnd;
    });

    const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Chart data for last 7 months
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleString("default", { month: "short" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthRevenue = allPayments
        .filter(p => new Date(p.date) >= monthStart && new Date(p.date) <= monthEnd)
        .reduce((acc, p) => acc + p.amount, 0);

      chartData.push({ month: monthLabel, revenue: monthRevenue });
    }

    return NextResponse.json({
      totalMembers:    activeMembers.length,
      feesPending:     feesPending.length,
      birthdaysToday:  birthdaysToday.length,
      attendanceToday: attendanceToday.length,
      totalRevenue,
      totalExpenses,
      netRevenue: totalRevenue - totalExpenses,
      chartData,
      activeMembersList: activeMembers.map((m) => ({
        id: m.id, name: m.name, phone: m.phone, plan: m.plan, status: m.status, membershipEnd: m.membershipEnd,
      })),
      feesPendingList: feesPending.map((m) => ({
        id: m.id, name: m.name, phone: m.phone, plan: m.plan, feeDueDate: m.feeDueDate, amountPaid: m.amountPaid,
      })),
      birthdaysList: birthdaysToday.map((m) => ({
        id: m.id, name: m.name, phone: m.phone, plan: m.plan, birthday: m.birthday,
      })),
      attendanceList: attendanceToday.map((m) => ({
        id: m.id, name: m.name, phone: m.phone, plan: m.plan, lastAttendance: m.lastAttendance,
      })),
      recentActivity: allMembers.slice(0, 10).map((m) => ({
        id: m.id,
        name: m.name,
        type: "Joined",
        time: m.joinDate ? m.joinDate.toISOString() : null,
        amount: m.amountPaid ? String(m.amountPaid) : null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
