import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { format, isSameDay, addDays, differenceInDays } from "date-fns";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

async function updateStatus(status: string, qr?: string) {
  try {
    await prisma.botStatus.upsert({
      where: { id: 1 },
      update: { status, qr: qr || null, updatedAt: new Date() },
      create: { id: 1, status, qr: qr || null },
    });
  } catch (err) {
    console.error("❌ Error updating status:", err);
  }
}

client.on('qr', async (qr) => {
  console.log('--- SCAN THE QR CODE BELOW TO CONNECT YOUR WHATSAPP ---');
  qrcode.generate(qr, { small: true });
  await updateStatus("AWAITING_SCAN", qr);
});

client.on('ready', async () => {
  console.log('✅ GymPro WhatsApp Bot is ONLINE!');
  await updateStatus("CONNECTED", "");
  startAutomations();
});

client.on('authenticated', () => {
  console.log('🔓 Authenticated successfully');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication Failure:', msg);
});

client.on('disconnected', async (reason) => {
  console.log('🔌 Disconnected! Reason:', reason);
  await updateStatus("OFFLINE", "");
});

client.on('message', async (msg) => {
  const text = msg.body.toLowerCase();
  const contact = await msg.getContact();
  const phone = contact.number;

  const config = await prisma.gymConfig.findFirst();
  const gymName = config?.name || "Gravity Fitness";

  console.log(`📩 Message from ${phone}: ${text}`);

  if (text.includes('hi') || text.includes('hello')) {
    const welcome = config?.welcomeMessage?.replace("{GYM_NAME}", gymName) 
      || `👋 Hello! Welcome to *${gymName}* Bot. How can we help you today?\n\n- Type *Plans* to see pricing\n- Type *Status* to check your membership\n- Type *Info* for gym location & hours`;
    await msg.reply(welcome);
  } 
  else if (text.includes('plans')) {
    let plansText = `🏋️ *Our Gym Plans:*\n\n${config?.plansDescription || "1. Monthly: ₹999\n2. Quarterly: ₹2699\n3. Annual: ₹9999"}`;
    await msg.reply(plansText);
  }
  else if (text.includes('info')) {
    await msg.reply(`📍 *Address:* ${config?.location || "123 Fitness St, Downtown"}\n🕒 *Hours:* ${config?.hours || "5:00 AM - 11:00 PM (Daily)"}\n📞 *Contact:* ${config?.contact || "+91 98765 43210"}`);
  }
  else if (text.includes('pay') || text.includes('renew') || text.includes('fee')) {
    const qrPath = path.join(process.cwd(), 'public', 'payment_qr.png');
    
    if (fs.existsSync(qrPath)) {
      const media = MessageMedia.fromFilePath(qrPath);
      await client.sendMessage(msg.from, media, { caption: `🙏 Thank you for choosing *${gymName}*!\n\nScan this QR code to pay your gym fees. Once done, please send a screenshot of the payment for verification!` });
    } else {
      await msg.reply(`💳 *To Renew:* You can pay your fees at the gym reception or via UPI to our registered number. We are currently setting up the digital QR in the bot - please check back soon or ask at the desk!`);
    }
  }
  else if (text.includes('status')) {
    const members = await prisma.member.findMany();
    const cleanPhone = phone.replace(/\D/g, '');
    const member = members.find(m => {
       const mClean = m.phone.replace(/\D/g, '');
       return mClean.length > 5 && (cleanPhone.includes(mClean) || mClean.includes(cleanPhone));
    });

    if (member) {
      const due = member.feeDueDate ? format(new Date(member.feeDueDate), 'PPP') : 'N/A';
      await msg.reply(`👤 *Member Name:* ${member.name}\n📅 *Next Renewal Due:* ${due}\n✅ *Status:* ${member.status}`);
    } else {
      await msg.reply(`❌ We couldn't find a membership linked to this number. Please contact the front desk if you believe this is an error.`);
    }
  }

  // Log message to DB
  try {
     // NOTE: botMessageLog model is missing in schema.prisma, omitting to avoid crash
     /*
     await prisma.botMessageLog.create({
        data: {
           phone,
           direction: "INBOUND",
           type: "AUTO_REPLY",
           text: msg.body
        }
     });
     */
  } catch (e) {}
});

function startAutomations() {
  cron.schedule('0 9 * * *', async () => {
    console.log('🚀 Running daily automations...');
    const today = new Date();
    const members = await prisma.member.findMany();
    const config = await prisma.gymConfig.findFirst();
    const gymName = config?.name || "Gravity Fitness";

    for (const member of members) {
      const phoneClean = member.phone.replace(/\D/g, '');
      if (phoneClean.length < 10) continue;
      const toId = phoneClean.length === 10 ? `91${phoneClean}@c.us` : `${phoneClean}@c.us`;

      // 1. Birthday wishes
      if (config?.birthdayEnabled !== false && member.birthday && isSameDay(member.birthday, today)) {
        await client.sendMessage(toId, `🎂 Happy Birthday *${member.name}*! Have an amazing day from your family at ${gymName}! 🎉`);
      }

      // 2. Renewal Reminders
      if (config?.feeReminderEnabled !== false && member.feeDueDate) {
         const daysAhead = config?.feeReminderDaysAhead ?? 3;
         const targetDate = addDays(today, daysAhead);
         if (isSameDay(member.feeDueDate, targetDate)) {
           await client.sendMessage(toId, `📢 Hi ${member.name}, a friendly reminder that your gym membership renewal is coming up in ${daysAhead} days (${format(member.feeDueDate, 'PPP')}). Stay consistent! 💪`);
         }
      }

      // 3. Absence Nudges (Inactive members)
      if (config?.absenceEnabled !== false && member.lastAttendance) {
         const daysIdle = differenceInDays(today, new Date(member.lastAttendance));
         if (daysIdle === (config?.absenceDays ?? 5)) {
            await client.sendMessage(toId, `💪 Hi ${member.name}, we missed you at *${gymName}*! It's been ${daysIdle} days since your last workout. Don't break the streak - see you tomorrow? 🔥`);
         }
      }
    }
  });
}

client.initialize();
