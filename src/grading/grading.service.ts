import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GradeRemark, Role } from '@prisma/client';

// GH SHS Standard WAEC grading
const GRADE_BOUNDARIES = [
  {
    grade: 'A1',
    min: 80,
    max: 100,
    remark: GradeRemark.EXCELLENT,
    smartRemarks: [
      'Outstanding performance',
      'Exceptional academic achievement',
      'An excellent student — keep it up!',
    ],
  },
  {
    grade: 'B2',
    min: 70,
    max: 79,
    remark: GradeRemark.VERY_GOOD,
    smartRemarks: [
      'Very good performance',
      'Great effort shown',
      'Well done — aim for the top!',
    ],
  },
  {
    grade: 'B3',
    min: 65,
    max: 69,
    remark: GradeRemark.GOOD,
    smartRemarks: [
      'Good performance',
      'Commendable effort',
      'Keep pushing for excellence',
    ],
  },
  {
    grade: 'C4',
    min: 60,
    max: 64,
    remark: GradeRemark.CREDIT,
    smartRemarks: [
      'Credit performance',
      'Good but can do better',
      'Consistent effort required',
    ],
  },
  {
    grade: 'C5',
    min: 55,
    max: 59,
    remark: GradeRemark.PASS,
    smartRemarks: [
      'Can do better with more effort',
      'More dedication needed',
      'Revise frequently',
    ],
  },
  {
    grade: 'C6',
    min: 50,
    max: 54,
    remark: GradeRemark.PASS,
    smartRemarks: [
      'Satisfactory — more work needed',
      'Pay closer attention in class',
    ],
  },
  {
    grade: 'D7',
    min: 45,
    max: 49,
    remark: GradeRemark.WEAK_PASS,
    smartRemarks: [
      'Weak performance — please seek help',
      'Extra classes recommended',
    ],
  },
  {
    grade: 'E8',
    min: 40,
    max: 44,
    remark: GradeRemark.WEAK_PASS,
    smartRemarks: [
      'Very weak — urgent improvement needed',
      'Must attend remedial sessions',
    ],
  },
  {
    grade: 'F9',
    min: 0,
    max: 39,
    remark: GradeRemark.FAILURE,
    smartRemarks: [
      'Failed — must repeat this subject',
      'Serious academic counselling required',
    ],
  },
];

export interface UpsertGradeDto {
  studentId: string;
  subjectId: string;
  termId: string;
  classScore?: number;
  examScore?: number;
  remark?: string;
  hasObservation?: boolean;
  observationText?: string;
}

export interface CorrectGradeDto {
  gradeEntryId: string;
  fieldChanged: 'classScore' | 'examScore' | 'remark';
  newValue: string;
  reason: string;
}

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute grade from total score using GH WAEC boundaries
   */
  computeGrade(classScore: number, examScore: number) {
    const total = Math.round(classScore + examScore);
    const boundary =
      GRADE_BOUNDARIES.find((b) => total >= b.min && total <= b.max) ||
      GRADE_BOUNDARIES[GRADE_BOUNDARIES.length - 1]; // Fallback to F9

    // Edge case for scores > 100
    if (total > 100) {
      return {
        totalScore: total,
        grade: GRADE_BOUNDARIES[0].grade,
        remark: GRADE_BOUNDARIES[0].remark,
        smartRemarks: GRADE_BOUNDARIES[0].smartRemarks,
      };
    }

    return {
      totalScore: total,
      grade: boundary.grade,
      remark: boundary.remark,
      smartRemarks: boundary.smartRemarks,
    };
  }

  /**
   * Get smart remarks pool for a given grade
   */
  getSmartRemarks(grade: string): string[] {
    return GRADE_BOUNDARIES.find((b) => b.grade === grade)?.smartRemarks ?? [];
  }

  /**
   * Upsert a grade entry (teacher submitting scores)
   */
  async upsertGrade(dto: UpsertGradeDto, submittedById: string) {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: dto.termId },
    });

    if (term.isLocked) {
      throw new ForbiddenException(
        'Term is locked. Grades cannot be modified.',
      );
    }

    let totalScore: number | undefined;
    let grade: string | undefined;

    if (dto.classScore !== undefined && dto.examScore !== undefined) {
      const computed = this.computeGrade(dto.classScore, dto.examScore);
      totalScore = computed.totalScore;
      grade = computed.grade;
    }

    const entry = await this.prisma.gradeEntry.upsert({
      where: {
        studentId_subjectId_termId: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          termId: dto.termId,
        },
      },
      create: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        termId: dto.termId,
        classScore: dto.classScore,
        examScore: dto.examScore,
        totalScore,
        grade,
        remark: dto.remark,
        hasObservation: dto.hasObservation ?? false,
        observationText: dto.observationText,
        submittedById,
        submittedAt: new Date(),
        isApproved: false, // Must be approved by HOD
      },
      update: {
        classScore: dto.classScore,
        examScore: dto.examScore,
        totalScore,
        grade,
        remark: dto.remark,
        hasObservation: dto.hasObservation,
        observationText: dto.observationText,
        submittedById,
        submittedAt: new Date(),
        isApproved: false, // Reset approval on update
      },
      include: { student: true, subject: true },
    });

    return entry;
  }

  /**
   * HOD approves a grade entry
   */
  async approveGrade(
    gradeEntryId: string,
    approvedById: string,
    userRole: Role,
  ) {
    if (
      userRole !== Role.HOD &&
      userRole !== Role.HEADMASTER &&
      userRole !== Role.SUPER_ADMIN &&
      userRole !== Role.TEACHER
    ) {
      throw new ForbiddenException(
        'Only HODs or above can approve grade entries',
      );
    }

    return this.prisma.gradeEntry.update({
      where: { id: gradeEntryId },
      data: { isApproved: true, approvedById, approvedAt: new Date() },
    });
  }

  /**
   * Bulk approve grades for a class/subject
   */
  async bulkApproveGrades(ids: string[], approvedById: string, userRole: Role) {
    if (
      userRole !== Role.HOD &&
      userRole !== Role.HEADMASTER &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only HODs or above can approve grade entries',
      );
    }

    return this.prisma.gradeEntry.updateMany({
      where: { id: { in: ids } },
      data: { isApproved: true, approvedById, approvedAt: new Date() },
    });
  }

  /**
   * Get class performance summary for a term (HOD view)
   */
  async getClassPerformanceSummary(classId: string, termId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { currentClassId: classId },
      include: {
        grades: {
          where: { termId },
          include: { subject: true },
        },
      },
    });

    return students.map((s) => {
      const totalGrades = s.grades.length;
      const approvedGrades = s.grades.filter((g) => g.isApproved).length;
      const lockedGrades = s.grades.filter((g) => g.isLocked).length;
      const progress =
        totalGrades > 0 ? (approvedGrades / totalGrades) * 100 : 0;

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        indexNumber: s.indexNumber,
        progress,
        isFullyApproved: totalGrades > 0 && totalGrades === approvedGrades,
        isFullyLocked: totalGrades > 0 && totalGrades === lockedGrades,
        hasAnyLocked: lockedGrades > 0,
        gradesCount: totalGrades,
        gradeEntryIds: s.grades.map((g) => g.id),
      };
    });
  }

  /**
   * HOD locks a grade entry to prevent further editing
   */
  async lockGrade(gradeEntryId: string, lockedById: string, userRole: Role) {
    if (
      userRole !== Role.HOD &&
      userRole !== Role.HEADMASTER &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only HODs or above can lock grade entries');
    }

    return this.prisma.gradeEntry.update({
      where: { id: gradeEntryId },
      data: { isLocked: true, lockedById, lockedAt: new Date() },
    });
  }

  /**
   * Record a grade correction with reason (audit trail)
   */
  async correctGrade(dto: CorrectGradeDto, changedById: string) {
    const entry = await this.prisma.gradeEntry.findUniqueOrThrow({
      where: { id: dto.gradeEntryId },
    });

    if (entry.isLocked) {
      throw new ForbiddenException('Grade is locked. Contact HOD to unlock.');
    }

    const oldValue = String(
      entry[dto.fieldChanged as keyof typeof entry] ?? '',
    );

    // Record the correction
    await this.prisma.gradeCorrection.create({
      data: {
        gradeEntryId: dto.gradeEntryId,
        changedById,
        fieldChanged: dto.fieldChanged,
        oldValue,
        newValue: dto.newValue,
        reason: dto.reason,
      },
    });

    // Apply correction
    const updateData: Record<string, any> = {
      [dto.fieldChanged]:
        dto.fieldChanged === 'remark' ? dto.newValue : parseFloat(dto.newValue),
    };

    // Recompute total/grade if score changed
    if (dto.fieldChanged === 'classScore' || dto.fieldChanged === 'examScore') {
      const cs =
        dto.fieldChanged === 'classScore'
          ? parseFloat(dto.newValue)
          : (entry.classScore ?? 0);
      const es =
        dto.fieldChanged === 'examScore'
          ? parseFloat(dto.newValue)
          : (entry.examScore ?? 0);
      const computed = this.computeGrade(cs, es);
      updateData.totalScore = computed.totalScore;
      updateData.grade = computed.grade;
    }

    return this.prisma.gradeEntry.update({
      where: { id: dto.gradeEntryId },
      data: updateData,
    });
  }

  /**
   * Get missing observations tray - students with scores but no observation
   */
  async getMissingObservationsTray(termId: string) {
    return this.prisma.gradeEntry.findMany({
      where: {
        termId,
        hasObservation: false,
        OR: [{ classScore: { not: null } }, { examScore: { not: null } }],
      },
      include: {
        student: {
          select: { indexNumber: true, firstName: true, lastName: true },
        },
        subject: { select: { name: true, code: true } },
      },
      orderBy: { student: { lastName: 'asc' } },
    });
  }

  /**
   * Get all grades for a student in a term
   */
  async getStudentTermGrades(
    studentId: string,
    termId: string,
    userRole?: Role,
  ) {
    const where: any = { studentId, termId };

    // Students only see approved grades
    if (userRole === Role.STUDENT) {
      where.isApproved = true;
    }

    return this.prisma.gradeEntry.findMany({
      where,
      include: { subject: true, corrections: true },
      orderBy: { subject: { name: 'asc' } },
    });
  }

  /**
   * Bulk grade entry for a class
   */
  async bulkUpsertGrades(entries: UpsertGradeDto[], submittedById: string) {
    const results = await Promise.all(
      entries.map((e) => this.upsertGrade(e, submittedById)),
    );

    // After bulk upsert, recompute positions for this class/subject/term
    if (entries.length > 0) {
      const { subjectId, termId } = entries[0];
      // Note: This assumes all entries in bulk are for same subject/term
      // which is usually the case for a teacher's markbook.
      await this.computeSubjectPositions(subjectId, termId);
    }

    return results;
  }

  /**
   * Compute subject positions for all students in a subject/term
   */
  async computeSubjectPositions(subjectId: string, termId: string) {
    const entries = await this.prisma.gradeEntry.findMany({
      where: { subjectId, termId, totalScore: { not: null } },
      orderBy: { totalScore: 'desc' },
    });

    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (i > 0 && entry.totalScore === entries[i - 1].totalScore) {
        // Tie
      } else {
        currentRank = i + 1;
      }

      await this.prisma.gradeEntry.update({
        where: { id: entry.id },
        data: { position: currentRank },
      });
    }
  }

  //grade boundaries (is readonly)
  getBoundaries() {
    return GRADE_BOUNDARIES.map((b, i) => ({
      id: String(i + 1),
      grade: b.grade,
      min: b.min,
      max: b.max,
      remark: b.remark,
      smartRemarks: b.smartRemarks,
    }));
  }
  /**
   * HOD unlocks a grade entry to allow editing again
   */
  async unlockGrade(
    gradeEntryId: string,
    unlockedById: string,
    userRole: Role,
  ) {
    if (
      userRole !== Role.HOD &&
      userRole !== Role.HEADMASTER &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only HODs or above can unlock grade entries',
      );
    }

    return this.prisma.gradeEntry.update({
      where: { id: gradeEntryId },
      data: { isLocked: false, lockedById: null, lockedAt: null },
    });
  }

  /**
   * Bulk unlock grades for a class/subject
   */
  async bulkUnlockGrades(ids: string[], unlockedById: string, userRole: Role) {
    if (
      userRole !== Role.HOD &&
      userRole !== Role.HEADMASTER &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only HODs or above can unlock grade entries',
      );
    }

    return this.prisma.gradeEntry.updateMany({
      where: { id: { in: ids } },
      data: { isLocked: false, lockedById: null, lockedAt: null },
    });
  }

  //top scoring student
  /**
   * Get top performing students in a department for a term
   */
  async getTopStudentsByDepartment(
    departmentId: string,
    termId: string,
    limit = 10,
  ) {
    const students = await this.prisma.studentProfile.findMany({
      where: { departmentId },
      include: {
        grades: {
          where: { termId, totalScore: { not: null } },
        },
        currentClass: { select: { name: true, level: true } },
      },
    });

    const ranked = students
      .map((s) => {
        const scores = s.grades.map((g) => g.totalScore!).filter(Boolean);
        const avg =
          scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          indexNumber: s.indexNumber,
          currentClass: s.currentClass,
          averageScore: avg,
          subjectsGraded: scores.length,
        };
      })
      .filter((s) => s.subjectsGraded > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit);

    return ranked;
  }

  /**
   * Get department-wide grade distribution (for charts)
   */
  async getDepartmentGradeDistribution(departmentId: string, termId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { departmentId },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);

    const grades = await this.prisma.gradeEntry.findMany({
      where: { subjectId: { in: subjectIds }, termId, grade: { not: null } },
      select: { grade: true },
    });

    const distribution: Record<string, number> = {
      A1: 0,
      B2: 0,
      B3: 0,
      C4: 0,
      C5: 0,
      C6: 0,
      D7: 0,
      E8: 0,
      F9: 0,
    };
    grades.forEach((g) => {
      if (g.grade && distribution[g.grade] !== undefined) {
        distribution[g.grade]++;
      }
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
    }));
  }

  /**
 * Filtered subject performance breakdown — supports filtering by
 * class section, department, and subject type (Core/Elective).
 */
async getSubjectPerformanceFiltered(filters: {
  classId?: string;
  departmentId?: string;
  subjectType?: 'CORE' | 'ELECTIVE';
}) {
  const gradeWhere: any = {};

  if (filters.classId) {
    gradeWhere.student = { currentClassId: filters.classId };
  }

  const subjectWhere: any = {};
  if (filters.departmentId) subjectWhere.departmentId = filters.departmentId;
  if (filters.subjectType) subjectWhere.type = filters.subjectType;

  if (Object.keys(subjectWhere).length > 0) {
    gradeWhere.subject = subjectWhere;
  }

  const grades = await this.prisma.gradeEntry.findMany({
    where: { ...gradeWhere, totalScore: { not: null } },
    include: {
      subject: { select: { id: true, name: true, code: true, type: true, departmentId: true, department: { select: { name: true } } } },
    },
  });

  const bySubject = new Map<string, { name: string; code: string; type: string; departmentName: string | null; scores: number[] }>();

  grades.forEach((g) => {
    const key = g.subjectId;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        name: g.subject.name,
        code: g.subject.code,
        type: g.subject.type,
        departmentName: g.subject.department?.name ?? null,
        scores: [],
      });
    }
    bySubject.get(key)!.scores.push(g.totalScore!);
  });

  const result = Array.from(bySubject.entries()).map(([subjectId, data]) => ({
    subjectId,
    subjectName: data.name,
    subjectCode: data.code,
    type: data.type,
    departmentName: data.departmentName,
    averageScore: (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(2),
    studentCount: data.scores.length,
  }));

  result.sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore));

  const coreScores = result.filter(r => r.type === 'CORE');
  const electiveScores = result.filter(r => r.type === 'ELECTIVE');

  const avgOf = (arr: typeof result) =>
    arr.length > 0
      ? (arr.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / arr.length).toFixed(2)
      : null;

  return {
    subjects: result,
    summary: {
      coreAverage: avgOf(coreScores),
      electiveAverage: avgOf(electiveScores),
      coreSubjectCount: coreScores.length,
      electiveSubjectCount: electiveScores.length,
    },
  };
}
}
