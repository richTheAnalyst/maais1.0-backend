import { PrismaClient, GradeRemark } from '@prisma/client';

export async function seedGrading(prisma: PrismaClient) {
  const scheme = await prisma.gradingScheme.upsert({
    where: { name: 'Standard WAEC GH' },
    update: {},
    create: {
      name: 'Standard WAEC GH',
      isDefault: true,
      boundaries: {
        create: [
          { grade: 'A1', minScore: 80, maxScore: 100, remark: GradeRemark.EXCELLENT, smartRemarks: ['Exceptional performance', 'Keep it up'] },
          { grade: 'B2', minScore: 70, maxScore: 79.99, remark: GradeRemark.VERY_GOOD, smartRemarks: ['Very good work', 'Strong understanding'] },
          { grade: 'B3', minScore: 65, maxScore: 69.99, remark: GradeRemark.GOOD, smartRemarks: ['Good performance', 'Can improve further'] },
          { grade: 'C4', minScore: 60, maxScore: 64.99, remark: GradeRemark.CREDIT, smartRemarks: ['Credit pass', 'Needs more effort'] },
          { grade: 'C5', minScore: 55, maxScore: 59.99, remark: GradeRemark.CREDIT, smartRemarks: ['Average performance', 'Focus on weak areas'] },
          { grade: 'C6', minScore: 50, maxScore: 54.99, remark: GradeRemark.CREDIT, smartRemarks: ['Fair performance', 'More practice needed'] },
          { grade: 'D7', minScore: 45, maxScore: 49.99, remark: GradeRemark.PASS, smartRemarks: ['Pass', 'Significant improvement required'] },
          { grade: 'E8', minScore: 40, maxScore: 44.99, remark: GradeRemark.WEAK_PASS, smartRemarks: ['Weak pass', 'At risk of failure'] },
          { grade: 'F9', minScore: 0, maxScore: 39.99, remark: GradeRemark.FAILURE, smartRemarks: ['Failed', 'Urgent intervention needed'] },
        ],
      },
    },
  });

  console.log('✅ Grading Scheme seeded');
  return scheme;
}
