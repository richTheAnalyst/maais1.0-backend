import { PrismaClient, SubjectType } from '@prisma/client';

export async function seedSubjects(prisma: PrismaClient, deptMap: Record<string, string>) {
  const coreSubjects = [
    { name: 'Core Mathematics', code: 'CMATH', type: SubjectType.CORE, deptCode: 'GEN' },
    { name: 'English Language', code: 'ENGL', type: SubjectType.CORE, deptCode: 'GEN' },
    { name: 'Integrated Science', code: 'ISCI', type: SubjectType.CORE, deptCode: 'GEN' },
    { name: 'Social Studies', code: 'SOCI', type: SubjectType.CORE, deptCode: 'GEN' },
    { name: 'ICT', code: 'ICT', type: SubjectType.CORE, deptCode: 'VTG' },
  ];

  const electiveSubjects = [
    { name: 'Elective Mathematics', code: 'EMATH', type: SubjectType.ELECTIVE, deptCode: 'SCI' },
    { name: 'Physics', code: 'PHY', type: SubjectType.ELECTIVE, deptCode: 'SCI' },
    { name: 'Chemistry', code: 'CHEM', type: SubjectType.ELECTIVE, deptCode: 'SCI' },
    { name: 'Biology', code: 'BIO', type: SubjectType.ELECTIVE, deptCode: 'SCI' },
    { name: 'Economics', code: 'ECON', type: SubjectType.ELECTIVE, deptCode: 'BUS' },
    { name: 'Accounting', code: 'ACCT', type: SubjectType.ELECTIVE, deptCode: 'BUS' },
    { name: 'Business Management', code: 'BMGMT', type: SubjectType.ELECTIVE, deptCode: 'BUS' },
    { name: 'Literature in English', code: 'LIT', type: SubjectType.ELECTIVE, deptCode: 'ART' },
    { name: 'Government', code: 'GOVT', type: SubjectType.ELECTIVE, deptCode: 'ART' },
  ];

  const results = [];
  for (const s of [...coreSubjects, ...electiveSubjects]) {
    const sub = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: {
        name: s.name,
        code: s.code,
        type: s.type,
        departmentId: deptMap[s.deptCode],
      },
    });
    results.push(sub);
  }
  console.log(`✅ ${results.length} Subjects seeded`);
  return results;
}
