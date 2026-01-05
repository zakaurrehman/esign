import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create super admin if doesn't exist
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'management@hiredbillingsupport.com' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Super_admin123', 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: 'management@hiredbillingsupport.com',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('Super admin created:', superAdmin.email);
  } else {
    console.log('Super admin already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
