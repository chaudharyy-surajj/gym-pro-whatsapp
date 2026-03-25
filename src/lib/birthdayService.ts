import { PrismaClient } from "@prisma/client";
import { format, isSameDay } from "date-fns";

const prisma = new PrismaClient();

/**
 * Check if a given date's day and month match today's date
 */
export function isBirthdayToday(birthday: Date | null, referenceDate: Date = new Date()): boolean {
  if (!birthday) return false;
  
  const birthdayDate = new Date(birthday);
  return (
    birthdayDate.getDate() === referenceDate.getDate() &&
    birthdayDate.getMonth() === referenceDate.getMonth()
  );
}

/**
 * Check if birthday wish was already sent today
 */
export function wasWishSentToday(lastWishDate: Date | null, referenceDate: Date = new Date()): boolean {
  if (!lastWishDate) return false;
  return isSameDay(new Date(lastWishDate), referenceDate);
}

/**
 * Send birthday wish via console (can be extended to WhatsApp/Email/SMS)
 */
export async function sendBirthdayWish(
  memberId: number,
  memberName: string,
  memberFirstName: string,
  phone: string,
  method: "CONSOLE" | "WHATSAPP" | "EMAIL" | "SMS" = "CONSOLE",
  gymName: string = "Gravity Fitness"
): Promise<{ success: boolean; message: string; method: string }> {
  // Use first name for personalization
  const displayName = memberFirstName || memberName;
  
  const birthdayMessage = `🎉🎂 *Happy Birthday ${displayName}!* 🎂🎉

Wishing you a day filled with joy, laughter, and all the things that make you smile! 😊

On this special day, we want you to know how much we appreciate having you as part of the *${gymName}* family. Your dedication and hard work inspire us every day! 💪✨

May this year bring you:
✨ Good health and strength
🎯 Achievement of all your fitness goals
💫 Endless happiness and success
🌟 Memorable moments with loved ones

Here's to another year of crushing your goals and being absolutely amazing! 🏆

Enjoy your special day to the fullest! 🎈🎁

With warm wishes,
*Team ${gymName}* ❤️`;

  try {
    switch (method) {
      case "CONSOLE":
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🎉 BIRTHDAY WISH SENT`);
        console.log(`${"=".repeat(60)}`);
        console.log(`📱 To: ${phone}`);
        console.log(`👤 Name: ${memberName}`);
        console.log(`💬 Message: ${birthdayMessage}`);
        console.log(`${"=".repeat(60)}\n`);
        break;

      case "WHATSAPP":
        // Queue message for WhatsApp bot
        console.log(`📤 Queuing birthday WhatsApp for ${memberName} (${phone})...`);
        
        // Format phone number for WhatsApp (add country code if needed)
        let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone; // Add India country code
        }
        
        await prisma.botCommand.create({
          data: {
            command: "SEND_MESSAGE",
            payload: JSON.stringify({ phone: formattedPhone, text: birthdayMessage }),
            status: "PENDING",
          },
        });
        console.log(`✅ Birthday WhatsApp queued for ${memberName} (${formattedPhone})`);
        console.log(`💡 Make sure WhatsApp bot is running: npm run bot`);
        break;

      case "EMAIL":
        // TODO: Implement email sending (e.g., using nodemailer, SendGrid, etc.)
        console.log(`📧 [EMAIL NOT IMPLEMENTED] Would send to: ${memberName}`);
        break;

      case "SMS":
        // TODO: Implement SMS sending (e.g., using Twilio, AWS SNS, etc.)
        console.log(`📱 [SMS NOT IMPLEMENTED] Would send to: ${phone}`);
        break;
    }

    // Update lastBirthdayWish in database
    await prisma.member.update({
      where: { id: memberId },
      data: { lastBirthdayWish: new Date() },
    });

    // Log the birthday wish
    await prisma.botMessageLog.create({
      data: {
        phone,
        direction: "OUTBOUND",
        type: "BIRTHDAY",
        text: birthdayMessage,
      },
    });

    return {
      success: true,
      message: `Birthday wish sent to ${memberName} via ${method}`,
      method,
    };
  } catch (error: any) {
    console.error(`❌ Error sending birthday wish to ${memberName}:`, error);
    return {
      success: false,
      message: error.message || "Failed to send birthday wish",
      method,
    };
  }
}

/**
 * Check and send birthday wishes for a specific member
 */
export async function checkMemberBirthday(
  memberId: number,
  method: "CONSOLE" | "WHATSAPP" | "EMAIL" | "SMS" = "CONSOLE",
  referenceDate: Date = new Date()
): Promise<{ sent: boolean; reason: string }> {
  const member = await prisma.member.findUnique({ where: { id: memberId } });

  if (!member) {
    return { sent: false, reason: "Member not found" };
  }

  if (!member.birthday) {
    return { sent: false, reason: "No birthday set for this member" };
  }

  if (!isBirthdayToday(member.birthday, referenceDate)) {
    return { sent: false, reason: "Birthday is not today" };
  }

  if (wasWishSentToday(member.lastBirthdayWish, referenceDate)) {
    return { sent: false, reason: "Birthday wish already sent today" };
  }

  // Send the wish
  const result = await sendBirthdayWish(
    member.id,
    member.name,
    member.firstName || member.name.split(' ')[0], // Use firstName or extract from full name
    member.phone,
    method
  );

  return {
    sent: result.success,
    reason: result.message,
  };
}

/**
 * Check and send birthday wishes for all members
 */
export async function checkAllBirthdays(
  method: "CONSOLE" | "WHATSAPP" | "EMAIL" | "SMS" = "CONSOLE",
  referenceDate: Date = new Date()
): Promise<{
  total: number;
  sent: number;
  skipped: number;
  results: Array<{ memberId: number; name: string; sent: boolean; reason: string }>;
}> {
  const config = await prisma.gymConfig.findFirst();
  
  // Check if birthday feature is enabled
  if (config?.birthdayEnabled === false) {
    console.log("⚠️ Birthday wishes are disabled in settings");
    return { total: 0, sent: 0, skipped: 0, results: [] };
  }

  const members = await prisma.member.findMany({
    where: {
      birthday: { not: null },
    },
  });

  const results = [];
  let sentCount = 0;
  let skippedCount = 0;

  console.log(`\n🎂 Checking birthdays for ${members.length} members (Reference Date: ${format(referenceDate, "PPP")})...\n`);

  for (const member of members) {
    const result = await checkMemberBirthday(member.id, method, referenceDate);
    
    results.push({
      memberId: member.id,
      name: member.name,
      sent: result.sent,
      reason: result.reason,
    });

    if (result.sent) {
      sentCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Birthday check complete: ${sentCount} sent, ${skippedCount} skipped\n`);

  return {
    total: members.length,
    sent: sentCount,
    skipped: skippedCount,
    results,
  };
}
