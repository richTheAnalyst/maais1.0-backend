import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TermNumber, ClassLevel, SubjectType, Role, AuditAction } from '@prisma/client';

@Injectable()
export class AcademicArchitectService {
  constructor(private prisma: PrismaService) {}

  // ─── Academic Years ───────────────────────────────────

  async createAcademicYear(label: string, startDate: Date, endDate: Date) {
    return this.prisma.academicYear.create({
      data: { label, startDate, endDate },
    });
  }

  async setActiveYear(yearId: string) {
    await this.prisma.academicYear.updateMany({ data: { isActive: false } });
    return this.prisma.academicYear.update({
      where: { id: yearId },
      data: { isActive: true },
    });
  }

  async getActiveYear() {
    return this.prisma.academicYear.findFirst({
      where: { isActive: true },
      include: { terms: { orderBy: { termNumber: 'asc' } } },
    });
  }

  // ─── Terms ────────────────────────────────────────────

  async createTerm(
    academicYearId: string,
    termNumber: TermNumber,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.term.create({
      data: { academicYearId, termNumber, startDate, endDate },
    });
  }

  async setActiveTerm(termId: string) {
    // Deactivate current active term in same year first
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
    });
    await this.prisma.term.updateMany({
      where: { academicYearId: term.academicYearId },
      data: { isActive: false },
    });
    return this.prisma.term.update({
      where: { id: termId },
      data: { isActive: true },
    });
  }

  // ─── Departments ──────────────────────────────────────

 async createDepartment(name: string, code: string, description?: string, createdById?: string) {
  const created = await this.prisma.department.create({ data: { name, code, description } });

  if (createdById) {
    await this.prisma.auditLog.create({
      data: {
        userId: createdById,
        action: AuditAction.CREATE,
        entity: 'Department',
        entityId: created.id,
        payload: { name, code, description },
      },
    });
  }

  return created;
}

  async deleteDepartment(id: string) {
    // Check if department exists
    /*  const department = await this.prisma.department.findUnique({
    where: { id },
  }); */

    await this.prisma.department.delete({
      where: { id },
    });

    return {
      message: 'Department deleted successfully',
    };
  }

  async getAllDepartments() {
    return this.prisma.department.findMany({
      include: { subjects: true, _count: { select: { staff: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Subjects ─────────────────────────────────────────

  async createSubject(dto: {
    name: string;
    code: string;
    type: SubjectType;
    departmentId?: string;
    description?: string;
  }) {
    return this.prisma.subject.create({ data: dto });
  }

  async deleteSubject(dto: {
    id: string;
    name: string;
    code: string;
    type: SubjectType;
    departmentId?: string;
    description?: string;
  }) {
    const { id } = dto;
    return this.prisma.$transaction(async (tx) => {
      // Delete grade entries
      await tx.gradeEntry.deleteMany({
        where: {
          subjectId: id,
        },
      });

      // Delete teaching assignments
      await tx.teachingAssignment.deleteMany({
        where: {
          subjectId: id,
        },
      });

      // Delete timetable entries
      await tx.timetableEntry.deleteMany({
        where: {
          subjectId: id,
        },
      });

      // Finally delete the subject
      return tx.subject.delete({
        where: { id },
      });
    });
  }

  async getAllSubjects() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Class Sections ───────────────────────────────────

  async createClassSection(name: string, level: ClassLevel, capacity?: number) {
    return this.prisma.classSection.create({ data: { name, level, capacity } });
  }

  async getAllClassSections() {
    return this.prisma.classSection.findMany({
      include: {
        classTeacher: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async deleteClassSection(id: string) {
    const classSection = await this.prisma.classSection.findUnique({
      where: { id },
      include: {
        students: true,
        teachingAssignments: true,
        timetableEntries: true,
      },
    });

    /* if (
    classSection.students.length > 0 ||
    classSection.teachingAssignments.length > 0 ||
    classSection.timetableEntries.length > 0
  ) {
    throw new BadRequestException(
      'Cannot delete a class section because it is currently assigned to students, teachers, or timetable entries.',
    );
  } */

    await this.prisma.studentProfile.updateMany({
      where: { currentClassId: id },
      data: { currentClassId: null },
    });

    await this.prisma.classSection.update({
      where: { id },
      data: {
        classTeacherId: null,
      },
    });

    await this.prisma.teachingAssignment.deleteMany({
      where: { classSectionId: id },
    });

    await this.prisma.timetableEntry.deleteMany({
      where: { classId: id },
    });

    await this.prisma.classSection.delete({
      where: { id },
    });
    return {
      message: 'Class section deleted successfully',
    };
  }

  async assignClassTeacher(classSectionId: string, staffId: string) {
    return this.prisma.classSection.update({
      where: { id: classSectionId },
      data: { classTeacherId: staffId },
    });
  }

  // ─── Teaching Assignments ─────────────────────────────

  async assignTeacher(dto: {
    teacherId: string;
    subjectId: string;
    classSectionId: string;
    academicYearId: string;
  }) {
    return this.prisma.teachingAssignment.create({ data: dto });
  }

  async getTeacherAssignments(teacherId: string) {
    return this.prisma.teachingAssignment.findMany({
      where: { teacherId },
      include: { subject: true, classSection: true },
    });
  }

  // ─── Teaching Assignments: full CRUD ──────────────────

  async getAllAssignments() {
    return this.prisma.teachingAssignment.findMany({
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, staffId: true },
        },
        subject: true,
        classSection: true,
      },
      orderBy: { teacher: { lastName: 'asc' } },
    });
  }

  async deleteAssignment(assignmentId: string, deletedById?: string) {
    const assignment = await this.prisma.teachingAssignment.delete({
      where: { id: assignmentId },
      include: { subject: true, classSection: true, teacher: true },
    });

    if (deletedById) {
      await this.prisma.auditLog.create({
        data: {
          userId: deletedById,
          action: AuditAction.DELETE,
          entity: 'TeachingAssignment',
          entityId: assignmentId,
          payload: {
            subjectName: assignment.subject.name,
            className: assignment.classSection.name,
            teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
          },
        },
      });
    }

    return assignment;
  }

  // ─── Staff role & department management ───────────────

  async updateStaffRole(staffUserId: string, role: Role, changedById?: string) {
    const updated = await this.prisma.user.update({
      where: { id: staffUserId },
      data: { role },
    });

    if (changedById) {
      await this.prisma.auditLog.create({
        data: {
          userId: changedById,
          action: AuditAction.UPDATE,
          entity: 'User',
          entityId: staffUserId,
          payload: { newRole: role },
        },
      });
    }

    return updated;
  }

  async updateStaffDepartment(staffId: string, departmentId: string | null, changedById?: string) {
    const updated = await this.prisma.staffProfile.update({
      where: { id: staffId },
      data: { departmentId },
    });

    if (changedById) {
      await this.prisma.auditLog.create({
        data: {
          userId: changedById,
          action: AuditAction.UPDATE,
          entity: 'StaffProfile',
          entityId: staffId,
          payload: { departmentId },
        },
      });
    }

    return updated;
  }

  // ─── Term unlock (with audit trail) ────────────────────

  async unlockTerm(termId: string, unlockedById: string, reason: string) {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
      include: {
        _count: { select: { reportCards: true } },
      },
    });

    const unlocked = await this.prisma.term.update({
      where: { id: termId },
      data: { isLocked: false },
    });

    // Log this as an audit event since it's a sensitive reversal
    await this.prisma.auditLog.create({
      data: {
        userId: unlockedById,
        action: 'UNLOCK',
        entity: 'Term',
        entityId: termId,
        payload: {
          reason,
          existingReportCards: term._count.reportCards,
          warning:
            term._count.reportCards > 0
              ? 'Term had generated report cards at time of unlock — they may now be stale if grades change.'
              : null,
        },
      },
    });

    return {
      ...unlocked,
      existingReportCardsWarning:
        term._count.reportCards > 0 ? term._count.reportCards : null,
    };
  }

  /**
   * Get a department with its full staff roster, broken into HODs and teachers.
   */
  async getDepartmentRoster(departmentId: string) {
    const department = await this.prisma.department.findUniqueOrThrow({
      where: { id: departmentId },
      include: {
        subjects: { orderBy: { name: 'asc' } },
      },
    });

    const staff = await this.prisma.staffProfile.findMany({
      where: { departmentId },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        teachingAssignments: { include: { subject: true, classSection: true } },
      },
      orderBy: { lastName: 'asc' },
    });

    return {
      department,
      headmasters: staff.filter(
        (s) => s.user.role === 'HEADMASTER' || s.user.role === 'SUPER_ADMIN',
      ),
      hods: staff.filter((s) => s.user.role === 'HOD'),
      teachers: staff.filter((s) => s.user.role === 'TEACHER'),
    };
  }

  /**
   * Get all departments with quick counts — used for the Academic Setup overview list.
   */
  async getDepartmentsOverview() {
    const departments = await this.prisma.department.findMany({
      include: {
        subjects: { select: { id: true } },
        staff: {
          select: { id: true, user: { select: { role: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      subjectCount: d.subjects.length,
      headmasterCount: d.staff.filter(
        (s) => s.user.role === 'HEADMASTER' || s.user.role === 'SUPER_ADMIN',
      ).length,
      hodCount: d.staff.filter((s) => s.user.role === 'HOD').length,
      teacherCount: d.staff.filter((s) => s.user.role === 'TEACHER').length,
    }));
  }

  /**
   * Get assignments for a specific teacher — used to scope the grading sheet.
   */
  async getMyGradingScope(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { staffProfile: true },
    });

    if (!user.staffProfile) return { subjects: [], classes: [] };

    if (user.role === Role.TEACHER) {
      // Return only assigned subject+class pairs
      const assignments = await this.prisma.teachingAssignment.findMany({
        where: { teacherId: user.staffProfile.id },
        include: {
          subject: { include: { department: true } },
          classSection: true,
        },
      });

      return {
        role: 'TEACHER',
        assignments: assignments.map(a => ({
          subjectId: a.subjectId,
          subjectName: a.subject.name,
          subjectCode: a.subject.code,
          subjectType: a.subject.type,
          classSectionId: a.classSectionId,
          className: a.classSection.name,
          classLevel: a.classSection.level,
        })),
      };
    }

    if (user.role === Role.HOD) {
      // Return all subjects in their department, and all classes in the school
      const subjects = await this.prisma.subject.findMany({
        where: { departmentId: user.staffProfile.departmentId ?? undefined, isActive: true },
      });

      const classes = await this.prisma.classSection.findMany({
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      });

      return {
        role: 'HOD',
        departmentId: user.staffProfile.departmentId,
        subjects: subjects.map(s => ({
          subjectId: s.id,
          subjectName: s.name,
          subjectCode: s.code,
          subjectType: s.type,
        })),
        classes: classes.map(c => ({
          classSectionId: c.id,
          className: c.name,
          classLevel: c.level,
        })),
      };
    }

    // Admin/Headmaster — return everything
    const subjects = await this.prisma.subject.findMany({ where: { isActive: true } });
    const classes = await this.prisma.classSection.findMany();
    return {
      role: user.role,
      subjects: subjects.map(s => ({ subjectId: s.id, subjectName: s.name, subjectCode: s.code, subjectType: s.type })),
      classes: classes.map(c => ({ classSectionId: c.id, className: c.name, classLevel: c.level })),
    };
  }

  //audit logs function
  async getAuditLogs(filters: {
    entity?: string;
    action?: string;
    userId?: string;
    take?: number;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.action && { action: filters.action as any }),
        ...(filters.userId && { userId: filters.userId }),
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            staffProfile: { select: { firstName: true, lastName: true, staffId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.take ?? 50,
    });
  }
}