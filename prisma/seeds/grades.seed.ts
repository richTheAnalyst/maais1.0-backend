/* import { PrismaClient } from '@prisma/client';

export async function seedGrades(prisma: PrismaClient, students: any[], subjects: any[], termId: string) {
  const grades = [];

  for (const student of students) {
    for (const subject of subjects) {
      const classScore = Math.floor(Math.random() * 20) + 10; // 10-30
      const examScore = Math.floor(Math.random() * 40) + 30; // 30-70
      const totalScore = classScore + examScore;

      // Determine grade based on totalScore
      let grade = 'F9';
      if (totalScore >= 80) grade = 'A1';
      else if (totalScore >= 70) grade = 'B2';
      else if (totalScore >= 65) grade = 'B3';
      else if (totalScore >= 60) grade = 'C4';
      else if (totalScore >= 55) grade = 'C5';
      else if (totalScore >= 50) grade = 'C6';
      else if (totalScore >= 45) grade = 'D7';
      else if (totalScore >= 40) grade = 'E8';

      const entry = await prisma.gradeEntry.upsert({
        where: {
          studentId_subjectId_termId: {
            studentId: student.id,
            subjectId: subject.id,
            termId,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          subjectId: subject.id,
          termId,
          classScore,
          examScore,
          totalScore,
          grade,
          isApproved: true,
          isLocked: true,
        },
      });
      grades.push(entry);
    }
  }

  console.log(`✅ ${grades.length} Grade Entries seeded`);
  return grades;
}
 */
import { PrismaClient } from '@prisma/client';

export async function seedGrades(
  prisma: PrismaClient,
  students: any[],
  subjects: any[],
  termId: string
) {
  const grades = [];

  console.log('Students:', students.length);
  console.log('Subjects:', subjects.length);
  console.log('Term ID:', termId);

  for (const student of students) {
    for (const subject of subjects) {
      try {
        const classScore = Math.floor(Math.random() * 20) + 10;
        const examScore = Math.floor(Math.random() * 40) + 30;
        const totalScore = classScore + examScore;

        let grade = 'F9';
        if (totalScore >= 80) grade = 'A1';
        else if (totalScore >= 70) grade = 'B2';
        else if (totalScore >= 65) grade = 'B3';
        else if (totalScore >= 60) grade = 'C4';
        else if (totalScore >= 55) grade = 'C5';
        else if (totalScore >= 50) grade = 'C6';
        else if (totalScore >= 45) grade = 'D7';
        else if (totalScore >= 40) grade = 'E8';

        const entry = await prisma.gradeEntry.upsert({
          where: {
            studentId_subjectId_termId: {
              studentId: student.id,
              subjectId: subject.id,
              termId,
            },
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId: subject.id,
            termId,
            classScore,
            examScore,
            totalScore,
            grade,
            isApproved: true,
            isLocked: true,
          },
        });

        grades.push(entry);
      } catch (error) {
        console.error('FAILED');
        console.error('Student:', student);
        console.error('Subject:', subject);
        console.error('Term:', termId);
        console.error(error);

        throw error;
      }
    }
  }

  console.log(`✅ ${grades.length} Grade Entries seeded`);
  return grades;
}