import { PrismaClient, NotificationChannel } from '@prisma/client';

export async function seedNotifications(prisma: PrismaClient, students: any[]) {
  const notifications = [];

  for (const student of students) {
    // Notification 1
    const n1 = await prisma.notification.create({
      data: {
        studentId: student.id,
        title: 'Mid-term Results Released',
        body: 'Your mid-term results are now available for viewing on the portal.',
        channel: NotificationChannel.APP,
        isRead: true,
      },
    });
    notifications.push(n1);

    // Notification 2
    const n2 = await prisma.notification.create({
      data: {
        studentId: student.id,
        title: 'Upcoming Parent-Teacher Meeting',
        body: 'A PTA meeting is scheduled for next Friday at 2:00 PM.',
        channel: NotificationChannel.EMAIL,
        isRead: false,
      },
    });
    notifications.push(n2);
  }

  console.log(`✅ ${notifications.length} Notifications seeded`);
  return notifications;
}
