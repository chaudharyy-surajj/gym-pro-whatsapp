import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, category, date } = body;

    if (!name || !amount) {
      return NextResponse.json({ error: "Name and amount are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        amount: parseFloat(amount),
        category: category || null,
        date: date ? new Date(date) : new Date(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
