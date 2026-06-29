import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import "dotenv/config";
import * as seeds from './seeds';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter
});

async function main() {
  console.log('🌱 Starting full MAAIS database seed...\n');

  // 1. Admin
  const admin = await seeds.seedAdmin(prisma);

  // 2. Departments
  const departments = await seeds.seedDepartments(prisma);
  const deptMap = Object.fromEntries(departments.map((d) => [d.code, d.id]));

  // 3. Subjects
  const subjects = await seeds.seedSubjects(prisma, deptMap);

  // 4. Academic (Year, Terms, Classes)
  const { year, terms, classes } = await seeds.seedAcademic(prisma);
  const currentTerm = terms[0]; // Term 1

  // 5. Grading
  await seeds.seedGrading(prisma);

  // 6. Staff (Teachers)
  const teachers = await seeds.seedStaff(prisma, departments, classes);

  // 7. Students
  const students = await seeds.seedStudents(prisma, classes, departments);

  // 8. Parents
  await seeds.seedParents(prisma, students);

  // 9. Teaching Assignments
  await seeds.seedAssignments(prisma, teachers, subjects, classes, year.id);

  // 10. Grades (Current Term)
  await seeds.seedGrades(prisma, students, subjects, currentTerm.id);

  // 11. Attendance (All Terms)
  await seeds.seedAttendance(prisma, students, terms);

  // 12. Reports (Current Term)
  await seeds.seedReports(prisma, students, currentTerm.id);

  // 13. Behavior & Traits (Current Term)
  await seeds.seedBehavior(prisma, students, currentTerm.id);

  // 14. Interventions
  await seeds.seedInterventions(prisma, students);

  // 15. Notifications
  await seeds.seedNotifications(prisma, students);

  // 16. Timetable
  await seeds.seedTimetable(prisma, classes, subjects, teachers);

  // 17. Audit Logs
  await seeds.seedAudit(prisma, admin.id);

  console.log('\n🎉 Full seed complete!');
  console.log('   Admin login: admin@mandoshts.edu.gh / Admin@2024!');
}

/* sync function main() {
  console.log('🌱 Seeding timetable only...\n');

  const classes = await prisma.classSection.findMany();
  const subjects = await prisma.subject.findMany();
  const teachers = await prisma.staffProfile.findMany();

  await seeds.seedTimetable(
    prisma,
    classes,
    subjects,
    teachers,
  );

  console.log('✅ Timetable seeded');
} */

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
