import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Migrating existing members to payments...");
  const members = await prisma.member.findMany({
    where: {
      amountPaid: { gt: 0 },
      payments: { none: {} },
    },
  });

  console.log(`Found ${members.length} members to migrate.`);

  for (const member of members) {
    await prisma.payment.create({
      data: {
        memberId: member.id,
        amount: member.amountPaid!,
        date: member.joinDate || member.createdAt,
        type: "ADMISSION",
      },
    });
  }

  console.log("Migration complete.");
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
