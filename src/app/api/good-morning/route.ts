import { NextRequest, NextResponse } from "next/server";
import { sendGoodMorningToAll } from "@/lib/goodMorningService";

/**
 * Manual Good Morning Message Trigger
 * 
 * GET /api/good-morning - Send to all active members
 * GET /api/good-morning?method=CONSOLE - Test with console output
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const methodParam = searchParams.get("method") as "CONSOLE" | "WHATSAPP" | null;
    const method = methodParam || "WHATSAPP";

    console.log(`\n🌅 Manual good morning trigger - Method: ${method}\n`);

    const result = await sendGoodMorningToAll(method);

    return NextResponse.json({
      success: true,
      ...result,
      method,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Good morning API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to send good morning messages" 
      },
      { status: 500 }
    );
  }
}
