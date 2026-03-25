
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.member.count();
  const withPaid = await prisma.member.count({ where: { amountPaid: { gt: 0 } } });
  const payments = await prisma.payment.count();
  console.log(`Total members: ${count}`);
  console.log(`Members with amountPaid > 0: ${withPaid}`);
  console.log(`Total payments: ${payments}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
