import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Send welcome message to new member
 */
export async function sendWelcomeMessage(
  memberId: number,
  memberName: string,
  memberFirstName: string,
  phone: string,
  plan: string | null,
  gymName: string = "Gravity Fitness"
): Promise<{ success: boolean; message: string }> {
  // Use first name for personalization
  const displayName = memberFirstName || memberName.split(' ')[0];
  
  // Get gym config for pricing
  const config = await prisma.gymConfig.findFirst();
  
  // Get plan details with actual pricing from config
  let planText = "";
  if (plan === "MONTHLY") {
    const price = config?.monthlyPrice || 1500;
    planText = `Monthly Plan (₹${price.toLocaleString()}/month)`;
  } else if (plan === "QUARTERLY") {
    const price = config?.quarterlyPrice || 4000;
    planText = `Quarterly Plan (₹${price.toLocaleString()} for 3 months)`;
  } else if (plan === "ANNUAL") {
    const price = config?.annualPrice || 10000;
    planText = `Annual Plan (₹${price.toLocaleString()} for 12 months)`;
  } else if (plan) {
    planText = `${plan} Plan`;
  } else {
    planText = "Custom Plan";
  }
  
  // Get gym hours and location from config
  const gymHours = config?.hours || "5:00 AM – 11:00 PM (Daily)";
  const gymLocation = config?.location || "123 Fitness St, Downtown";
  const gymContact = config?.contact || "+91 98765 43210";
  
  // Create welcome message
  const welcomeMessage = `🔥 *WELCOME TO ${gymName.toUpperCase()}!* 💪

Hey ${displayName}! 

We're pumped to have you join our fitness family! 🏋️‍♂️

*Your Membership:*
${planText}

*What's Next?*
✅ Visit us during gym hours
✅ Bring your ID for verification
✅ Get your access card
✅ Start crushing your goals!

*Gym Hours:*
🕐 ${gymHours}

*Location:*
📍 ${gymLocation}

*Need Help?*
📞 ${gymContact}
Just reply to this message anytime!

Let's get you STRONG! 💯🔥

*Team ${gymName}*`;

  try {
    // Format phone number for WhatsApp (add country code if needed)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Queue welcome message for WhatsApp bot
    await prisma.botCommand.create({
      data: {
        command: "SEND_MESSAGE",
        payload: JSON.stringify({ phone: formattedPhone, text: welcomeMessage }),
        status: "PENDING",
      },
    });
    
    console.log(`✅ Welcome message queued for ${displayName} (${formattedPhone})`);

    // Queue activation instruction message (sent after welcome message)
    const activationMessage = `📱 *IMPORTANT - ACTIVATE YOUR BOT* 📱

Hi ${displayName}! 👋

To activate our WhatsApp bot and receive:
✅ Birthday wishes
✅ Fee reminders
✅ Gym updates
✅ Quick replies to your queries

*Please send "Hi" or "Hello" to this number now!*

This will activate the bot for your number. 🤖

Type: *Hi*

Thank you! 💪`;

    // Queue activation message with a slight delay (will be sent after welcome message)
    await prisma.botCommand.create({
      data: {
        command: "SEND_MESSAGE",
        payload: JSON.stringify({ phone: formattedPhone, text: activationMessage }),
        status: "PENDING",
      },
    });
    
    console.log(`✅ Activation message queued for ${displayName} (${formattedPhone})`);

    // Log both messages
    await prisma.botMessageLog.create({
      data: {
        phone,
        direction: "OUTBOUND",
        type: "AUTO_REPLY",
        text: welcomeMessage,
      },
    });

    await prisma.botMessageLog.create({
      data: {
        phone,
        direction: "OUTBOUND",
        type: "AUTO_REPLY",
        text: activationMessage,
      },
    });

    return {
      success: true,
      message: `Welcome and activation messages sent to ${displayName}`,
    };
  } catch (error: any) {
    console.error(`❌ Error sending welcome message to ${displayName}:`, error);
    return {
      success: false,
      message: error.message || "Failed to send welcome message",
    };
  }
}
