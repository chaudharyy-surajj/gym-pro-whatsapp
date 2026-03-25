import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { getDailyQuote } from "./motivationalQuotes";

const prisma = new PrismaClient();

/**
 * Send good morning message with motivational quote
 */
export async function sendGoodMorningMessage(
  memberId: number,
  memberName: string,
  memberFirstName: string,
  phone: string,
  method: "CONSOLE" | "WHATSAPP" = "WHATSAPP",
  gymName: string = "Gravity Fitness"
): Promise<{ success: boolean; message: string }> {
  // Use first name for personalization
  const displayName = memberFirstName || memberName.split(' ')[0];
  
  // Get today's motivational quote
  const quote = getDailyQuote();
  
  // Create aggressive good morning message
  const goodMorningMessage = `🔥 *RISE AND GRIND ${displayName.toUpperCase()}!* 💪

Another day, another opportunity to dominate! 

${quote}

Time to hit the gym and destroy those weights! No excuses, no mercy! 

LET'S GO! 🏋️‍♂️⚡

*${gymName}*`;

  try {
    switch (method) {
      case "CONSOLE":
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🌅 GOOD MORNING MESSAGE SENT`);
        console.log(`${"=".repeat(60)}`);
        console.log(`📱 To: ${phone}`);
        console.log(`👤 Name: ${displayName}`);
        console.log(`💬 Message:\n${goodMorningMessage}`);
        console.log(`${"=".repeat(60)}\n`);
        break;

      case "WHATSAPP":
        // Format phone number for WhatsApp (add country code if needed)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
        
        // Queue message for WhatsApp bot
        await prisma.botCommand.create({
          data: {
            command: "SEND_MESSAGE",
            payload: JSON.stringify({ phone: formattedPhone, text: goodMorningMessage }),
            status: "PENDING",
          },
        });
        console.log(`✅ Good morning message queued for ${displayName} (${formattedPhone})`);
        break;
    }

    // Log the message
    await prisma.botMessageLog.create({
      data: {
        phone,
        direction: "OUTBOUND",
        type: "AUTO_REPLY", // You can create a new type "GOOD_MORNING" if needed
        text: goodMorningMessage,
      },
    });

    return {
      success: true,
      message: `Good morning message sent to ${displayName}`,
    };
  } catch (error: any) {
    console.error(`❌ Error sending good morning message to ${displayName}:`, error);
    return {
      success: false,
      message: error.message || "Failed to send good morning message",
    };
  }
}

/**
 * Send good morning messages to all active members
 */
export async function sendGoodMorningToAll(
  method: "CONSOLE" | "WHATSAPP" = "WHATSAPP"
): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ memberId: number; name: string; success: boolean; message: string }>;
}> {
  const config = await prisma.gymConfig.findFirst();
  const gymName = config?.name || "Gravity Fitness";

  // Get all active members
  const members = await prisma.member.findMany({
    where: {
      status: "ACTIVE", // Only send to active members
    },
  });

  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  console.log(`\n🌅 Sending good morning messages to ${members.length} active members...\n`);

  for (const member of members) {
    try {
      const result = await sendGoodMorningMessage(
        member.id,
        member.name,
        member.firstName || member.name.split(' ')[0],
        member.phone,
        method,
        gymName
      );

      results.push({
        memberId: member.id,
        name: member.name,
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    } catch (error: any) {
      console.error(`❌ Error sending to ${member.name}:`, error);
      results.push({
        memberId: member.id,
        name: member.name,
        success: false,
        message: error.message || "Unknown error",
      });
      failedCount++;
    }
  }

  console.log(`\n✅ Good morning messages complete: ${sentCount} sent, ${failedCount} failed\n`);

  return {
    total: members.length,
    sent: sentCount,
    failed: failedCount,
    results,
  };
}
