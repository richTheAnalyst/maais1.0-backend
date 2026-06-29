import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class InterventionsService {
  constructor(private prisma: PrismaService) {}

  async getStudentInterventions(studentId: string) {
    return this.prisma.interventionAlert.findMany({
      where: {
        studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  private async calculateAverage(
    studentId: string,
    termId: string,
  ): Promise<number | null> {
    // Use a raw query to avoid relying on a generated `enrollment` property on PrismaService
    const result: { avg: number | null }[] = await this.prisma.$queryRaw`
      SELECT AVG(CAST(grade AS DOUBLE PRECISION)) AS avg
      FROM "Enrollment"
      WHERE "studentId" = ${studentId} AND "termId" = ${termId}
    `;
    return result?.[0]?.avg ?? null;
  }

  //15 percent drop detection
  async checkPerformanceDrop(
  studentId: string,
  currentTermId: string,
  previousTermId: string,
) {
  const previous =
    await this.calculateAverage(
      studentId,
      previousTermId,
    );

  const current =
    await this.calculateAverage(
      studentId,
      currentTermId,
    );

  if (!previous || !current) {
    return;
  }

  const drop =
    ((previous - current) / previous) * 100;

  if (drop >= 15) {
    await this.prisma.interventionAlert.create({
      data: {
        studentId,
        previousAverage: previous,
        currentAverage: current,
        dropPercentage: drop,
        status: 'ACTIVE',
      },
    });
  }
}
}
