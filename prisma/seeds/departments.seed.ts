import { PrismaClient } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient) {
  const departments = [
    { name: 'General Studies', code: 'GEN' },
    { name: 'Science', code: 'SCI' },
    { name: 'Business', code: 'BUS' },
    { name: 'Vocational & Technical', code: 'VTG' },
    { name: 'General Arts', code: 'ART' },
  ];

  const results = [];
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    results.push(d);
  }
  console.log(`✅ ${results.length} Departments seeded`);
  return results;
}
