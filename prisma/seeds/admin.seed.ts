import { PrismaClient, Role, Gender } from '@prisma/client';
import * as argon2 from 'argon2';

export async function seedAdmin(prisma: PrismaClient) {
  const adminPassword = await argon2.hash('Admin@2024!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mandoshts.edu.gh' },
    update: {},
    create: {
      email: 'admin@mandoshts.edu.gh',
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      staffProfile: {
        create: {
          staffId: 'STA-2024-001',
          firstName: 'System',
          lastName: 'Administrator',
          gender: Gender.MALE,
        },
      },
    },
  });
  console.log('✅ Super Admin seeded');
  return admin;
}
