import { NextRequest, NextResponse } from "next/server";
import { checkAllBirthdays, checkMemberBirthday } from "@/lib/birthdayService";

/**
 * Manual Birthday Check API
 * 
 * GET /api/birthday-check - Check all members
 * GET /api/birthday-check?memberId=123 - Check specific member
 * GET /api/birthday-check?method=WHATSAPP - Use WhatsApp instead of console
 * GET /api/birthday-check?testDate=2024-03-15 - Override today's date for testing
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract parameters
    const memberIdParam = searchParams.get("memberId");
    const methodParam = searchParams.get("method") as "CONSOLE" | "WHATSAPP" | "EMAIL" | "SMS" | null;
    const testDateParam = searchParams.get("testDate");
    
    const method = methodParam || "CONSOLE";
    const referenceDate = testDateParam ? new Date(testDateParam) : new Date();

    // Validate test date if provided
    if (testDateParam && isNaN(referenceDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid testDate format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Check specific member
    if (memberIdParam) {
      const memberId = parseInt(memberIdParam);
      if (isNaN(memberId)) {
        return NextResponse.json(
          { error: "Invalid memberId" },
          { status: 400 }
        );
      }

      const result = await checkMemberBirthday(memberId, method, referenceDate);
      return NextResponse.json({
        memberId,
        ...result,
        referenceDate: referenceDate.toISOString(),
      });
    }

    // Check all members
    const result = await checkAllBirthdays(method, referenceDate);
    return NextResponse.json({
      ...result,
      referenceDate: referenceDate.toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Birthday check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check birthdays" },
      { status: 500 }
    );
  }
}
