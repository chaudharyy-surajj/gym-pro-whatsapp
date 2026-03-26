const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const config = await prisma.gymConfig.create({
      data: {
        id: 1,
        name: 'Gravity Fitness Unisex Gym',
        location: 'Gravity Fitness Gym, Rajbala Enclave',
        hours: 'Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM',
        contact: '9084306122',
        monthlyPrice: 1500,
        quarterlyPrice: 4000,
        annualPrice: 10000
      }
    });
    console.log('✅ Gym config created successfully!');
    console.log(config);
  } catch (error) {
    console.error('❌ Error creating gym config:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
