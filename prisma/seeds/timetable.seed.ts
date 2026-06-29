import { PrismaClient, DayOfWeek } from '@prisma/client';

export async function seedTimetable(prisma: PrismaClient, classes: any[], subjects: any[], teachers: any[]) {
  const entries = [];
  const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

  for (let i = 0; i < 30; i++) {
    const cls = classes[i % classes.length];
    const sub = subjects[i % subjects.length];
    const teacher = teachers[i % teachers.length];
    const day = days[i % days.length];

    const entry = await prisma.timetableEntry.create({
      data: {
        classId: cls.id,
        subjectId: sub.id,
        teacherId: teacher.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '09:30',
        room: `Room ${Math.floor(Math.random() * 10) + 1}`,
      },
    });
    entries.push(entry);
  }

  console.log(`✅ ${entries.length} Timetable Entries seeded`);
  return entries;
}
