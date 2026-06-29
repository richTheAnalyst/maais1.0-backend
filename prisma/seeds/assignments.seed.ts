import { PrismaClient } from '@prisma/client';

export async function seedAssignments(prisma: PrismaClient, teachers: any[], subjects: any[], classes: any[], yearId: string) {
  const assignments = [];

  // Assign teachers to subjects and classes
  // To keep it simple, we'll rotate through teachers
  let teacherIndex = 0;

  for (const cls of classes) {
    for (const sub of subjects) {
      const teacher = teachers[teacherIndex % teachers.length];
      
      const assignment = await prisma.teachingAssignment.upsert({
        where: {
          teacherId_subjectId_classSectionId_academicYearId: {
            teacherId: teacher.id,
            subjectId: sub.id,
            classSectionId: cls.id,
            academicYearId: yearId,
          },
        },
        update: {},
        create: {
          teacherId: teacher.id,
          subjectId: sub.id,
          classSectionId: cls.id,
          academicYearId: yearId,
        },
      });
      assignments.push(assignment);
      teacherIndex++;
    }
  }

  console.log(`✅ ${assignments.length} Teaching Assignments seeded`);
  return assignments;
}
