import { PrismaClient, InterventionStatus } from '@prisma/client';

export async function seedInterventions(prisma: PrismaClient, students: any[]) {
  const alerts = [];
  const statuses = [InterventionStatus.ACTIVE, InterventionStatus.IN_PROGRESS, InterventionStatus.RESOLVED];

  for (let i = 0; i < 10; i++) {
    const student = students[i];
    const alert = await prisma.interventionAlert.create({
      data: {
        studentId: student.id,
        previousAverage: 75,
        currentAverage: 65,
        dropPercentage: 13.33,
        status: statuses[i % 3],
        notes: 'Significant drop in mathematics and science scores.',
      },
    });
    alerts.push(alert);
  }

  console.log(`✅ ${alerts.length} Intervention Alerts seeded`);
  return alerts;
}
