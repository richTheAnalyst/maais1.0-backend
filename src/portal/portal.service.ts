import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  async getPortalData(studentId: string) {
    const latestReport = await this.prisma.reportCard.findFirst({
      where: { studentId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
    });

    const notifications = await this.prisma.notification.findMany({
      where: { studentId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const grades = await this.prisma.gradeEntry.findMany({
      where: { studentId },
      include: {
        subject: true,
      },
    });

    const interventions = await this.prisma.interventionAlert.findMany({
      where: {
        studentId,
        status: {
          in: ['ACTIVE', 'IN_PROGRESS'],
        },
      },
    });

    const attendancePercentage = this.calculateAttendance(attendance);

    return {
      cgpa: latestReport?.averageScore ?? 0,

      classRank: latestReport?.classPosition,

      approvalStatus: latestReport?.releasedAt ? 'APPROVED' : 'PENDING',

      attendancePercentage,

      recentResults: grades,

      notifications,

      activeInterventions: interventions,
    };
  }

  private calculateAttendance(records: any[]) {
    const present = records.reduce((sum, r) => sum + r.daysPresent, 0);

    const total = records.reduce((sum, r) => sum + r.totalDays, 0);

    if (!total) return 0;

    return Number(((present / total) * 100).toFixed(2));
  }
}
