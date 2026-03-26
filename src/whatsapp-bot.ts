import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { format, addDays, differenceInDays } from "date-fns";
import path from "path";
import fs from "fs";
import { checkAllBirthdays } from "./lib/birthdayService";
import { sendGoodMorningToAll } from "./lib/goodMorningService";

const prisma = new PrismaClient();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

async function updateStatus(status: string, qr?: string) {
  try {
    await prisma.botStatus.upsert({
      where: { id: 1 },
      update: { status, qr: qr || null, updatedAt: new Date() },
      create: { id: 1, status, qr: qr || null },
    });
    console.log(`📊 Bot status updated: ${status}`);
  } catch (err) {
    console.error("❌ Error updating status:", err);
  }
}

async function getMemberNameByPhone(phone: string): Promise<string | null> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const members = await prisma.member.findMany();
    
    // Find member by matching phone number (handles different formats)
    const member = members.find(m => {
      const memberPhone = m.phone.replace(/\D/g, '');
      return memberPhone.length > 5 && (
        cleanPhone.includes(memberPhone) || 
        memberPhone.includes(cleanPhone) ||
        cleanPhone.endsWith(memberPhone) ||
        memberPhone.endsWith(cleanPhone)
      );
    });
    
    return member ? member.name : null;
  } catch (err) {
    console.error("❌ Error looking up member name:", err);
    return null;
  }
}

async function upsertChat(phone: string, lastMessage: string, name?: string) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If no name provided, try to look up member name
    let chatName = name;
    if (!chatName) {
      const memberName = await getMemberNameByPhone(cleanPhone);
      chatName = memberName || undefined;
    }
    
    await prisma.chat.upsert({
      where: { phone: cleanPhone },
      update: { 
        lastMessage, 
        updatedAt: new Date(),
        ...(chatName && { name: chatName }) // Update name if found
      },
      create: { phone: cleanPhone, name: chatName, lastMessage },
    });
  } catch (err) {
    console.error("❌ Error upserting chat:", err);
  }
}

async function saveChatMsg(phone: string, text: string, direction: "INBOUND" | "OUTBOUND") {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    let chat = await prisma.chat.findUnique({ where: { phone: cleanPhone } });
    
    // Create chat if it doesn't exist (important for outbound messages to new contacts)
    if (!chat) {
      // Look up member name
      const memberName = await getMemberNameByPhone(cleanPhone);
      
      chat = await prisma.chat.create({
        data: {
          phone: cleanPhone,
          name: memberName,
          lastMessage: text,
          unreadCount: 0
        }
      });
    } else {
      // Update existing chat and add name if missing
      const updateData: any = { 
        lastMessage: text,
        updatedAt: new Date()
      };
      
      // If chat doesn't have a name, try to look it up
      if (!chat.name) {
        const memberName = await getMemberNameByPhone(cleanPhone);
        if (memberName) {
          updateData.name = memberName;
        }
      }
      
      await prisma.chat.update({
        where: { id: chat.id },
        data: updateData
      });
    }

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        phone: cleanPhone,
        text,
        direction,
      }
    });

    // Update unread count if inbound
    if (direction === "INBOUND") {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { unreadCount: { increment: 1 } }
      });
    }
  } catch (err) {
    console.error("❌ Error saving message:", err);
  }
}

client.on('qr', async (qr) => {
  console.log('📱 QR Code generated! Scan with WhatsApp to connect.');
  console.log('🌐 Or check your website dashboard to scan the QR code.');
  qrcode.generate(qr, { small: true });
  await updateStatus("AWAITING_SCAN", qr);
});

client.on('ready', async () => {
  console.log('✅ GymPro WhatsApp Bot is ONLINE!');
  await updateStatus("CONNECTED", "");
  startAutomations();
  startCommandListener();
  
  // Sync last few chats
  try {
    const chats = await client.getChats();
    for (const c of chats.slice(0, 10)) {
       const phone = c.id.user;
       const lastMsg = c.lastMessage?.body || "";
       await upsertChat(phone, lastMsg, c.name);
    }
  } catch (e) {}
});

client.on('message', async (msg) => {
  const text = msg.body;
  const contact = await msg.getContact();
  const phone = contact.number;

  // Save to Chat & Message table
  await upsertChat(phone, text, contact.name || contact.pushname);
  await saveChatMsg(phone, text, "INBOUND");

  // ✅ IMPORTANT: Fetch fresh config for EVERY message
  // This ensures pricing and gym info are always up-to-date
  // No bot restart needed when admin changes settings!
  const config = await prisma.gymConfig.findFirst();
  const gymName = config?.name || "Gravity Fitness";

  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('hi') || lowerText.includes('hello')) {
    const welcome = config?.welcomeMessage?.replace("{GYM_NAME}", gymName) 
      || `👋 Hello! Welcome to *${gymName}* Bot. How can we help you today?\n\n- Type *Plans* to see pricing\n- Type *Status* to check your membership\n- Type *Info* for gym location & hours`;
    await msg.reply(welcome);
    await saveChatMsg(phone, welcome, "OUTBOUND");
  } 
  else if (lowerText.includes('plans') || lowerText.includes('plan') || lowerText.includes('price') || lowerText.includes('pricing')) {
    // ✅ FULLY DYNAMIC: Fetch all pricing and info from database
    // Admin can update via Settings page - no code changes needed!
    
    // Check if custom plans description exists in config
    if (config?.plansDescription) {
      // Use custom description from Settings page
      await msg.reply(config.plansDescription);
      await saveChatMsg(phone, config.plansDescription, "OUTBOUND");
    } else {
      // Build dynamic message from database values
      const monthly = config?.monthlyPrice;
      const quarterly = config?.quarterlyPrice;
      const annual = config?.annualPrice;
      const location = config?.location;
      const hours = config?.hours;
      const contact = config?.contact;
      const name = config?.name || gymName;
      
      const plansMessage = `💪 *${name.toUpperCase()} MEMBERSHIP PLANS* 🏋️

Choose the plan that fits your fitness goals:

━━━━━━━━━━━━━━━━━━━━━━
${monthly ? `
🔥 *MONTHLY PLAN*
💰 ₹${monthly.toLocaleString()}/month
✅ Full gym access
✅ All equipment included
✅ Flexible commitment

━━━━━━━━━━━━━━━━━━━━━━` : ''}
${quarterly ? `
💎 *QUARTERLY PLAN* (3 Months)
💰 ₹${quarterly.toLocaleString()} total
✅ Save more with longer commitment
✅ Better value than monthly
✅ Stay consistent, see results

━━━━━━━━━━━━━━━━━━━━━━` : ''}
${annual ? `
🏆 *ANNUAL PLAN* (12 Months)
💰 ₹${annual.toLocaleString()} total
✅ BEST VALUE - Maximum savings!
✅ Personal training sessions included
✅ Priority support
✅ Commit to your transformation

━━━━━━━━━━━━━━━━━━━━━━` : ''}
${location ? `
📍 *Visit Us:*
${location}` : ''}
${hours ? `

🕐 *Gym Hours:*
${hours}` : ''}
${contact ? `

📞 *Contact:*
${contact}` : ''}

💬 Reply with your choice or visit us to get started! 🚀`;
      
      await msg.reply(plansMessage);
      await saveChatMsg(phone, plansMessage, "OUTBOUND");
    }
  }
  else if (lowerText.includes('info')) {
    const infoText = `📍 *Address:* ${config?.location || "Gravity Fitness Gym, Rajbala Enclave"}\n🕒 *Hours:* ${config?.hours || "Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM"}\n📞 *Contact:* ${config?.contact || "9084306122"}`;
    await msg.reply(infoText);
    await saveChatMsg(phone, infoText, "OUTBOUND");
  }
  else if (lowerText.includes('pay') || lowerText.includes('renew') || lowerText.includes('fee')) {
    const qrPath = path.join(process.cwd(), 'public', 'payment_qr.png');
    if (fs.existsSync(qrPath)) {
      const media = MessageMedia.fromFilePath(qrPath);
      const caption = `🙏 Thank you for choosing *${gymName}*!\n\nScan this QR code to pay your gym fees. Once done, please send a screenshot of the payment for verification!`;
      await client.sendMessage(msg.from, media, { caption });
      await saveChatMsg(phone, "[Image: Payment QR]", "OUTBOUND");
    } else {
      const fallback = `💳 *To Renew:* You can pay your fees at the gym reception or via UPI to our registered number. We are currently setting up the digital QR in the bot - please check back soon or ask at the desk!`;
      await msg.reply(fallback);
      await saveChatMsg(phone, fallback, "OUTBOUND");
    }
  }
  else if (lowerText.includes('status')) {
    const members = await prisma.member.findMany();
    const cleanPhone = phone.replace(/\D/g, '');
    const member = members.find(m => {
       const mClean = m.phone.replace(/\D/g, '');
       return mClean.length > 5 && (cleanPhone.includes(mClean) || mClean.includes(cleanPhone));
    });

    if (member) {
      const due = member.feeDueDate ? format(new Date(member.feeDueDate), 'PPP') : 'N/A';
      const statusText = `👤 *Member Name:* ${member.name}\n📅 *Next Renewal Due:* ${due}\n✅ *Status:* ${member.status}`;
      await msg.reply(statusText);
      await saveChatMsg(phone, statusText, "OUTBOUND");
    } else {
      const notFoundText = `❌ We couldn't find a membership linked to this number. Please contact the front desk if you believe this is an error.`;
      await msg.reply(notFoundText);
      await saveChatMsg(phone, notFoundText, "OUTBOUND");
    }
  }

  // Log message to DB for legacy tracking
  try {
     await prisma.botMessageLog.create({
        data: {
           phone,
           direction: "INBOUND",
           type: "AUTO_REPLY",
           text: msg.body
        }
     });
  } catch (e) {}
});

function startCommandListener() {
  console.log("👂 Listening for dashboard commands...");
  setInterval(async () => {
    try {
      const commands = await prisma.botCommand.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" }
      });

      for (const cmd of commands) {
        console.log(`🛠️ Processing command: ${cmd.command}`);
        await prisma.botCommand.update({ where: { id: cmd.id }, data: { status: "PROCESSING" } });

        try {
          const payload = JSON.parse(cmd.payload);
          if (cmd.command === "SEND_MESSAGE") {
            const { phone, text } = payload;
            
            // Clean and format phone number
            let cleanPhone = phone.replace(/\D/g, '');
            
            // Ensure country code
            if (cleanPhone.length === 10) {
              cleanPhone = '91' + cleanPhone; // Add India country code
            }
            
            console.log(`📡 Attempting to send to: ${cleanPhone}`);
            
            // Try to get the proper WhatsApp ID
            let to = `${cleanPhone}@c.us`;
            
            try {
              // Check if number is registered on WhatsApp
              const numberId = await client.getNumberId(cleanPhone);
              if (numberId) {
                to = numberId._serialized;
                console.log(`✅ Number verified on WhatsApp: ${to}`);
              } else {
                console.warn(`⚠️ Number ${cleanPhone} not found on WhatsApp, trying anyway...`);
              }
            } catch (e) {
              console.warn(`⚠️ Could not verify number ${cleanPhone}, using default format`);
            }

            console.log(`📤 Sending message to ${to}...`);
            await client.sendMessage(to, text);
            console.log(`✅ Message sent successfully to ${cleanPhone}`);
            
            // Always upsert chat so it shows in dashboard
            await upsertChat(cleanPhone, text);
            await saveChatMsg(cleanPhone, text, "OUTBOUND");
          }
          await prisma.botCommand.update({ where: { id: cmd.id }, data: { status: "DONE" } });
        } catch (err: any) {
          console.error("❌ Command Error:", err);
          await prisma.botCommand.update({ where: { id: cmd.id }, data: { status: "ERROR", error: err.message } });
        }
      }
    } catch (e) {}
  }, 3000);
}

function startAutomations() {
  // Good Morning Messages - Daily at 5:00 AM
  cron.schedule('0 5 * * *', async () => {
    console.log('🌅 Running good morning automation at 5:00 AM...');
    try {
      await sendGoodMorningToAll("WHATSAPP");
      console.log('✅ Good morning messages sent successfully!');
    } catch (error) {
      console.error('❌ Error sending good morning messages:', error);
    }
  });

  // Birthday Wishes & Other Automations - Daily at 12:00 AM (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('🚀 Running daily automations at midnight...');
    const today = new Date();
    const members = await prisma.member.findMany();
    
    // ✅ IMPORTANT: Fetch fresh config for automations
    // This ensures pricing and gym info are always up-to-date
    const config = await prisma.gymConfig.findFirst();
    const gymName = config?.name || "Gravity Fitness";

    // 1. Birthday wishes - Use centralized service
    if (config?.birthdayEnabled !== false) {
      console.log('🎂 Checking birthdays...');
      await checkAllBirthdays("WHATSAPP");
    }

    // 2. Renewal Reminders
    if (config?.feeReminderEnabled !== false) {
      for (const member of members) {
        if (!member.feeDueDate) continue;
        
        const phoneClean = member.phone.replace(/\D/g, '');
        if (phoneClean.length < 10) continue;

        const daysAhead = config?.feeReminderDaysAhead ?? 3;
        const targetDate = addDays(today, daysAhead);
        const dueDate = new Date(member.feeDueDate);
        
        if (dueDate.toDateString() === targetDate.toDateString()) {
          const remText = `📢 Hi ${member.name}, a friendly reminder that your gym membership renewal is coming up in ${daysAhead} days (${format(dueDate, 'PPP')}). Stay consistent! 💪`;
          
          try {
            // Use getNumberId for better reliability
            const numberId = await client.getNumberId(phoneClean);
            const toId = numberId ? numberId._serialized : (phoneClean.length === 10 ? `91${phoneClean}@c.us` : `${phoneClean}@c.us`);
            
            await client.sendMessage(toId, remText);
            await saveChatMsg(phoneClean, remText, "OUTBOUND");
            console.log(`✅ Renewal reminder sent to ${member.name}`);
          } catch (e) {
            console.error(`❌ Error sending renewal reminder to ${member.name}:`, e);
          }
        }
      }
    }

    // 3. Absence Nudges (Inactive members)
    if (config?.absenceEnabled !== false) {
      for (const member of members) {
        if (!member.lastAttendance) continue;
        
        const phoneClean = member.phone.replace(/\D/g, '');
        if (phoneClean.length < 10) continue;

        const daysIdle = differenceInDays(today, new Date(member.lastAttendance));
        if (daysIdle === (config?.absenceDays ?? 5)) {
          const nMsg = `💪 Hi ${member.name}, we missed you at *${gymName}*! It's been ${daysIdle} days since your last workout. Don't break the streak - see you tomorrow? 🔥`;
          
          try {
            // Use getNumberId for better reliability
            const numberId = await client.getNumberId(phoneClean);
            const toId = numberId ? numberId._serialized : (phoneClean.length === 10 ? `91${phoneClean}@c.us` : `${phoneClean}@c.us`);
            
            await client.sendMessage(toId, nMsg);
            await saveChatMsg(phoneClean, nMsg, "OUTBOUND");
            console.log(`✅ Absence nudge sent to ${member.name}`);
          } catch (e) {
            console.error(`❌ Error sending absence nudge to ${member.name}:`, e);
          }
        }
      }
    }
  });
}

client.initialize();
