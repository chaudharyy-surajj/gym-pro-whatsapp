
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany();
  const payments = await prisma.payment.findMany();
  
  const sumAmountPaid = members.reduce((acc, m) => acc + (m.amountPaid || 0), 0);
  const sumPayments = payments.reduce((acc, p) => acc + p.amount, 0);
  
  console.log(`Members count: ${members.length}`);
  console.log(`Sum of members.amountPaid: ${sumAmountPaid}`);
  console.log(`Sum of payments: ${sumPayments}`);
  
  members.forEach(m => {
    console.log(`Member: ${m.name}, Plan: ${m.plan}, amountPaid: ${m.amountPaid}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
