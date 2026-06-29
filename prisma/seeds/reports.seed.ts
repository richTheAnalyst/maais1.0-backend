import { PrismaClient, DocumentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function seedReports(prisma: PrismaClient, students: any[], termId: string) {
  const reports = [];

  for (const student of students) {
    const report = await prisma.reportCard.upsert({
      where: {
        studentId_termId: {
          studentId: student.id,
          termId,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        termId,
        documentType: DocumentType.REPORT_CARD,
        systemHash: uuidv4(),
        totalScore: 500 + Math.random() * 200,
        averageScore: 60 + Math.random() * 30,
        classPosition: Math.floor(Math.random() * 30) + 1,
        classSize: 30,
        conductGrade: 'EXCELLENT',
        headmasterRemarks: 'A very promising student. Keep up the good work.',
        classTeacherRemarks: 'Diligent and focused in class.',
        releasedAt: new Date(),
      },
    });
    reports.push(report);
  }

  console.log(`✅ ${reports.length} Report Cards seeded`);
  return reports;
}
