import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export async function GET() {
  try {
    let config = await prisma.gymConfig.findFirst();
    if (!config) {
      config = await prisma.gymConfig.create({ data: {} });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let config = await prisma.gymConfig.findFirst();
    
    const updateData: any = {
      monthlyPrice: body.monthlyPrice !== undefined ? Number(body.monthlyPrice) : undefined,
      quarterlyPrice: body.quarterlyPrice !== undefined ? Number(body.quarterlyPrice) : undefined,
      annualPrice: body.annualPrice !== undefined ? Number(body.annualPrice) : undefined,
    };
    
    if (body.customPlans !== undefined) {
      updateData.customPlans = JSON.stringify(body.customPlans);
    }

    if (!config) {
      config = await prisma.gymConfig.create({ data: updateData });
    } else {
      config = await prisma.gymConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
