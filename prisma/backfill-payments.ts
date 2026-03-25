
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany();
  const config = await prisma.gymConfig.findFirst();
  
  const prices: Record<string, number> = {
    MONTHLY: config?.monthlyPrice ?? 1500,
    QUARTERLY: config?.quarterlyPrice ?? 4000,
    ANNUAL: config?.annualPrice ?? 10000,
  };
  
  let customPlans = [];
  try { customPlans = JSON.parse(config?.customPlans || "[]"); } catch(e) {}
  customPlans.forEach((cp: any) => { prices[cp.id] = cp.price; });

  let migratedCount = 0;
  for (const m of members) {
    // Check if this member already has payments
    const paymentCount = await prisma.payment.count({ where: { memberId: m.id } });
    if (paymentCount === 0 && m.plan && m.joinDate) {
      const amount = m.amountPaid || prices[m.plan] || 0;
      if (amount > 0) {
        await prisma.payment.create({
          data: {
            memberId: m.id,
            amount: amount,
            date: m.joinDate,
            type: 'ADMISSION',
          }
        });
        migratedCount++;
        console.log(`Migrated member ${m.name}: ₹${amount}`);
      }
    }
  }
  
  console.log(`Successfully migrated ${migratedCount} members.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
