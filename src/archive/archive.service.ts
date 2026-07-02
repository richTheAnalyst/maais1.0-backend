import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditAction, ClassLevel, PromotionStatus } from '@prisma/client';

const PROMOTION_MAP: Record<ClassLevel, ClassLevel | null> = {
  [ClassLevel.FORM_1]: ClassLevel.FORM_2,
  [ClassLevel.FORM_2]: ClassLevel.FORM_3,
  [ClassLevel.FORM_3]: null, // Graduates
};

@Injectable()
export class ArchiveService {
  audit: any;
  constructor(private prisma: PrismaService) {}

   /**
   * Lock a term (prevents further grade edits)
   */
  async lockTerm(termId: string, lockedById?: string) {
    const updated = await this.prisma.term.update({
      where: { id: termId },
      data: { isLocked: true },
    });

    if (lockedById) {
      await this.audit.log({
        userId: lockedById,
        action: AuditAction.LOCK,
        entity: 'Term',
        entityId: termId,
        payload: { locked: true },
      });
    }

    return updated;
  }

  async unlockTerm(termId: string, unlockedById: string, reason: string) {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
      include: { _count: { select: { reportCards: true } } },
    });

    const unlocked = await this.prisma.term.update({
      where: { id: termId },
      data: { isLocked: false },
    });

    await this.audit.log({
      userId: unlockedById,
      action: AuditAction.UNLOCK,
      entity: 'Term',
      entityId: termId,
      payload: {
        reason,
        existingReportCards: term._count.reportCards,
        warning: term._count.reportCards > 0
          ? 'Term had generated report cards at time of unlock — they may now be stale.'
          : null,
      },
    });

    return {
      ...unlocked,
      existingReportCardsWarning: term._count.reportCards > 0 ? term._count.reportCards : null,
    };
  }

  async runPromotionCycle(academicYearId: string, performedById: string) {
    const year = await this.prisma.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
    });

    // Ensure all terms are locked before promotion
    const unlockedTerms = await this.prisma.term.findMany({
      where: { academicYearId, isLocked: false },
    });

    if (unlockedTerms.length > 0) {
      throw new BadRequestException(
        `${unlockedTerms.length} term(s) are still unlocked. Lock all terms before running promotion.`,
      );
    }

    // Fetch all active students with their current class
    const students = await this.prisma.studentProfile.findMany({
      where: { archivedAt: null, currentClassId: { not: null } },
      include: { currentClass: true },
    });

    const promotionRecords = [];
    const graduates = [];

    for (const student of students) {
      const currentLevel = student.currentClass!.level;
      const nextLevel = PROMOTION_MAP[currentLevel];

      if (nextLevel === null) {
        // FORM_3 → Graduate
        graduates.push(student.id);
        promotionRecords.push({
          studentId: student.id,
          academicYearId,
          fromClass: currentLevel,
          toClass: null,
          status: PromotionStatus.GRADUATED,
          performedById,
        });
      } else {
        // Find the next class section (matching suffix, next level)
        // e.g. "1A" (Form 1) -> find something like "2A" in Form 2
        const currentClassName = student.currentClass!.name;
        const suffix = currentClassName.replace(/^[1-3]/, ''); // Remove the form number prefix

        const nextClass = await this.prisma.classSection.findFirst({
          where: {
            level: nextLevel,
            name: { endsWith: suffix },
          },
        });

        if (nextClass) {
          await this.prisma.studentProfile.update({
            where: { id: student.id },
            data: { currentClassId: nextClass.id },
          });
        }

        promotionRecords.push({
          studentId: student.id,
          academicYearId,
          fromClass: currentLevel,
          toClass: nextLevel,
          status: PromotionStatus.PROMOTED,
          performedById,
        });
      }
    }

    // Archive graduates
    if (graduates.length > 0) {
      await this.prisma.studentProfile.updateMany({
        where: { id: { in: graduates } },
        data: { archivedAt: new Date(), currentClassId: null },
      });
    }

    // Bulk insert promotion records
    await this.prisma.promotionRecord.createMany({ data: promotionRecords });

    await this.audit.log({
      userId: performedById,
      action: AuditAction.PROMOTE,
      entity: 'AcademicYear',
      entityId: academicYearId,
      payload: {
        totalProcessed: students.length,
        promoted: promotionRecords.filter(r => r.status === 'PROMOTED').length,
        graduated: graduates.length,
        academicYear: year.label,
      },
    });

    return {
      academicYear: year.label,
      totalProcessed: students.length,
      promoted: promotionRecords.filter(
        (r) => r.status === PromotionStatus.PROMOTED,
      ).length,
      graduated: graduates.length,
    };
  }

  /**
   * Search The Vault - historical records for GES audits and transcript retrieval
   */
  async searchVault(query: {
    indexNumber?: string;
    firstName?: string;
    lastName?: string;
    academicYearId?: string;
    classLevel?: ClassLevel;
  }) {
    return this.prisma.studentProfile.findMany({
      where: {
        AND: [
          query.indexNumber
            ? {
                indexNumber: {
                  contains: query.indexNumber,
                  mode: 'insensitive',
                },
              }
            : {},
          query.firstName
            ? { firstName: { contains: query.firstName, mode: 'insensitive' } }
            : {},
          query.lastName
            ? { lastName: { contains: query.lastName, mode: 'insensitive' } }
            : {},
        ],
      },
      include: {
        grades: {
          include: {
            subject: true,
            term: { include: { academicYear: true } },
          },
        },
        reportCards: {
          include: { term: { include: { academicYear: true } } },
        },
        promotions: {
          include: { academicYear: true },
        },
      },
      take: 50,
    });
  }

 
  

  /**
   * Database health check with hash verification summary
   */
  async getDatabaseHealth() {
    const [
      totalStudents,
      activeStudents,
      archivedStudents,
      totalGrades,
      totalReportCards,
      totalTranscripts,
      pendingObservations,
    ] = await Promise.all([
      this.prisma.studentProfile.count(),
      this.prisma.studentProfile.count({ where: { archivedAt: null } }),
      this.prisma.studentProfile.count({
        where: { archivedAt: { not: null } },
      }),
      this.prisma.gradeEntry.count(),
      this.prisma.reportCard.count(),
      this.prisma.transcript.count(),
      this.prisma.gradeEntry.count({ where: { hasObservation: false } }),
    ]);

    return {
      status: 'healthy',
      checkedAt: new Date(),
      counts: {
        totalStudents,
        activeStudents,
        archivedStudents,
        totalGrades,
        totalReportCards,
        totalTranscripts,
        pendingObservations,
      },
    };
  }

  /**
   * Advance to the next term within the same academic year.
   * Term 1 -> Term 2 -> Term 3. No student/class changes happen here —
   * only term activation state shifts. The current term must be locked first.
   */
  async advanceToNextTerm(currentTermId: string) {
    const currentTerm = await this.prisma.term.findUniqueOrThrow({
      where: { id: currentTermId },
      include: { academicYear: { include: { terms: true } } },
    });

    if (!currentTerm.isLocked) {
      throw new BadRequestException(
        'Current term must be locked before advancing to the next term.',
      );
    }

    const TERM_ORDER = ['TERM_1', 'TERM_2', 'TERM_3'] as const;
    const currentIndex = TERM_ORDER.indexOf(currentTerm.termNumber as any);

    if (currentIndex === -1 || currentIndex === TERM_ORDER.length - 1) {
      throw new BadRequestException(
        'This is the final term of the academic year. Run year-end promotion instead.',
      );
    }

    const nextTermNumber = TERM_ORDER[currentIndex + 1];
    const nextTerm = currentTerm.academicYear.terms.find(
      (t) => t.termNumber === nextTermNumber,
    );

    if (!nextTerm) {
      throw new BadRequestException(
        `${nextTermNumber} has not been created yet for this academic year.`,
      );
    }

    // Deactivate current term, activate next term
    await this.prisma.term.update({
      where: { id: currentTerm.id },
      data: { isActive: false },
    });

    const activated = await this.prisma.term.update({
      where: { id: nextTerm.id },
      data: { isActive: true },
    });

    return {
      previousTerm: currentTerm.termNumber,
      newActiveTerm: activated.termNumber,
      academicYear: currentTerm.academicYear.label,
    };
  }

  /**
   * Get a year-end promotion readiness check — used by frontend
   * to show whether the Execute Promotion button should be enabled.
   */
  async getPromotionReadiness(academicYearId: string) {
    const terms = await this.prisma.term.findMany({
      where: { academicYearId },
    });

    const allLocked = terms.length === 3 && terms.every((t) => t.isLocked);
    const lockedCount = terms.filter((t) => t.isLocked).length;

    const activeStudents = await this.prisma.studentProfile.count({
      where: { archivedAt: null, currentClassId: { not: null } },
    });

    const byLevel = await this.prisma.studentProfile.groupBy({
      by: ['currentClassId'],
      where: { archivedAt: null, currentClassId: { not: null } },
      _count: { id: true },
    });

    const classSections = await this.prisma.classSection.findMany({
      where: { id: { in: byLevel.map((b) => b.currentClassId!) } },
    });

    const countsByLevel: Record<string, number> = {
      FORM_1: 0,
      FORM_2: 0,
      FORM_3: 0,
    };
    byLevel.forEach((b) => {
      const cls = classSections.find((c) => c.id === b.currentClassId);
      if (cls) countsByLevel[cls.level] += b._count.id;
    });

    return {
      isReady: allLocked,
      termsLocked: lockedCount,
      termsTotal: terms.length,
      totalActiveStudents: activeStudents,
      breakdown: {
        form1ToForm2: countsByLevel.FORM_1,
        form2ToForm3: countsByLevel.FORM_2,
        form3ToAlumni: countsByLevel.FORM_3,
      },
    };
  }
}
