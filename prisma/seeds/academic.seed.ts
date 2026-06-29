import { PrismaClient, ClassLevel, TermNumber } from '@prisma/client';

export async function seedAcademic(prisma: PrismaClient) {
  // Academic Year
  const year = await prisma.academicYear.upsert({
    where: { label: '2024/2025' },
    update: {},
    create: {
      label: '2024/2025',
      startDate: new Date('2024-09-02'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });

  // Terms
  const termsData = [
    { termNumber: TermNumber.TERM_1, startDate: new Date('2024-09-02'), endDate: new Date('2024-12-20') },
    { termNumber: TermNumber.TERM_2, startDate: new Date('2025-01-13'), endDate: new Date('2025-04-11') },
    { termNumber: TermNumber.TERM_3, startDate: new Date('2025-05-05'), endDate: new Date('2025-07-25') },
  ];

  const terms = [];
  for (const t of termsData) {
    const term = await prisma.term.upsert({
      where: { academicYearId_termNumber: { academicYearId: year.id, termNumber: t.termNumber } },
      update: {},
      create: { academicYearId: year.id, ...t, isActive: t.termNumber === TermNumber.TERM_1 },
    });
    terms.push(term);
  }

  // Class Sections
  const classSectionsData = [
    { name: '1A', level: ClassLevel.FORM_1 },
    { name: '1B', level: ClassLevel.FORM_1 },
    { name: '2A', level: ClassLevel.FORM_2 },
    { name: '2B', level: ClassLevel.FORM_2 },
    { name: '3A', level: ClassLevel.FORM_3 },
    { name: '3B', level: ClassLevel.FORM_3 },
  ];

  const classes = [];
  for (const c of classSectionsData) {
    const cls = await prisma.classSection.upsert({
      where: { name_level: { name: c.name, level: c.level } },
      update: {},
      create: c,
    });
    classes.push(cls);
  }

  console.log('✅ Academic Year, Terms, and Class Sections seeded');
  return { year, terms, classes };
}
