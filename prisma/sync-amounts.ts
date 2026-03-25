
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({
    include: { payments: true }
  });
  
  for (const m of members) {
    const totalPaid = m.payments.reduce((acc, p) => acc + p.amount, 0);
    if (m.amountPaid !== totalPaid) {
      await prisma.member.update({
        where: { id: m.id },
        data: { amountPaid: totalPaid }
      });
      console.log(`Updated member ${m.name} amountPaid to ₹${totalPaid}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
