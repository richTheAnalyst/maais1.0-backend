import { PrismaClient } from '@prisma/client';

export async function seedAttendance(prisma: PrismaClient, students: any[], terms: any[]) {
  const attendance = [];

  for (const student of students) {
    for (const term of terms) {
      const totalDays = 60;
      const daysAbsent = Math.floor(Math.random() * 5);
      const daysPresent = totalDays - daysAbsent;

      const record = await prisma.attendanceRecord.upsert({
        where: {
          studentId_termId: {
            studentId: student.id,
            termId: term.id,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          termId: term.id,
          totalDays,
          daysPresent,
          daysAbsent,
        },
      });
      attendance.push(record);
    }
  }

  console.log(`✅ ${attendance.length} Attendance Records seeded`);
  return attendance;
}
