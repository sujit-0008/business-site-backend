const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt'); // Assuming you use bcrypt for hashing

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10); // Change 'admin123' to a secure password
  const admin = await prisma.supplier.upsert({
    where: { email: 'admin@yourdomain.com' }, // Unique email for admin
    update: {}, // No update needed if exists
    create: {
      ownerName: 'Site Admin',
      email: 'admin@yourdomain.com',
      phone: '1234567890',
      companyName: 'Admin Company',
      address: 'Admin HQ',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true, // Admin is verified by default
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });
  console.log('Admin user seeded:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });