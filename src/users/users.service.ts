import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Role, Gender, AuditAction } from '@prisma/client';
import * as argon2 from 'argon2';

export interface CreateStaffDto {
  email: string;
  password: string;
  role: Role;
  staffId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  phone?: string;
  departmentId?: string;
}

export interface CreateStudentDto {
  email?: string;
  password: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth?: string;
  currentClassId?: string;
  departmentId?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
}

export interface CreateParentDto {
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  occupation?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createStaff(dto: CreateStaffDto, createdById?: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(dto.password);

    const result = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        staffProfile: {
          create: {
            staffId: dto.staffId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            gender: dto.gender,
            phone: dto.phone,
            departmentId: dto.departmentId,
          },
        },
      },
      include: { staffProfile: true },
    });

    if (createdById) {
      await this.prisma.auditLog.create({
        data: {
          userId: createdById,
          action: AuditAction.CREATE,
          entity: 'StaffProfile',
          entityId: result.staffProfile?.id ?? result.id,
          payload: { staffId: dto.staffId, role: dto.role, email: dto.email },
        },
      });
    }

    return result;
  }

  async createStudent(dto: CreateStudentDto, createdById?: string) {
    const indexExists = await this.prisma.studentProfile.findUnique({
      where: { indexNumber: dto.indexNumber },
    });
    if (indexExists)
      throw new ConflictException(
        `Index number ${dto.indexNumber} already registered`,
      );

    const passwordHash = await argon2.hash(dto.password);
    const email = dto.email ?? `${dto.indexNumber}@student.mandoshts.edu.gh`;

    const student = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            indexNumber: dto.indexNumber,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            currentClassId: dto.currentClassId,
            departmentId: dto.departmentId,
          },
        },
      },
      include: {
        studentProfile: { include: { currentClass: true, department: true } },
      },
    });

    if (createdById) {
      await this.prisma.auditLog.create({
        data: {
          userId: createdById,
          action: AuditAction.CREATE,
          entity: 'StudentProfile',
          entityId: student.studentProfile?.id ?? student.id,
          payload: { indexNumber: dto.indexNumber },
        },
      });
    }

    // Handle parent creation if info provided
    if (dto.parentFirstName && dto.parentLastName && dto.parentPhone) {
      const parentEmail = dto.parentEmail || `${dto.parentPhone}@parent.com`;
      let parentUser = await this.prisma.user.findUnique({
        where: { email: parentEmail },
        include: { parentProfile: true },
      });

      if (!parentUser) {
        const parentPassHash = await argon2.hash('Parent@123!');
        parentUser = await this.prisma.user.create({
          data: {
            email: parentEmail,
            passwordHash: parentPassHash,
            role: Role.PARENT,
            phone: dto.parentPhone,
            parentProfile: {
              create: {
                firstName: dto.parentFirstName,
                lastName: dto.parentLastName,
                phone: dto.parentPhone,
                email: dto.parentEmail,
              },
            },
          },
          include: { parentProfile: true },
        });
      }

      if (parentUser.parentProfile) {
        await this.prisma.studentParentLink.upsert({
          where: {
            studentId_parentId: {
              studentId: student.studentProfile!.id,
              parentId: parentUser.parentProfile.id,
            },
          },
          create: {
            studentId: student.studentProfile!.id,
            parentId: parentUser.parentProfile.id,
            relationship: dto.parentRelationship || 'Guardian',
            isPrimary: true,
          },
          update: {},
        });
      }
    }

    return student;
  }

  async createParent(dto: CreateParentDto) {
    const email = dto.email || `${dto.phone}@parent.com`;
    const exists = await this.prisma.user.findUnique({
      where: { email },
    });
    if (exists)
      throw new ConflictException('Parent email/phone already in use');

    const passwordHash = await argon2.hash(dto.password || 'Parent@123!');

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.PARENT,
        phone: dto.phone,
        parentProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email,
            occupation: dto.occupation,
          },
        },
      },
      include: { parentProfile: true },
    });
  }

  //update staffs and students function
  async updateStaffProfile(
  staffProfileId: string,
  dto: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phone?: string;
    email?: string;
    password?: string;
  },
  requesterId: string,
  requesterRole: Role,
) {
  // Find the staff profile + linked user
  const staff = await this.prisma.staffProfile.findUniqueOrThrow({
    where: { id: staffProfileId },
    include: { user: true },
  });

  // HOD can only edit staff in their own department
  if (requesterRole === Role.HOD) {
    const requester = await this.prisma.staffProfile.findFirst({
      where: { userId: requesterId },
      select: { departmentId: true },
    });
    if (staff.departmentId !== requester?.departmentId && staff.userId !== requesterId) {
      throw new ForbiddenException('You can only edit staff in your department.');
    }
  }

  // Teacher can only edit themselves
  if (requesterRole === Role.TEACHER && staff.userId !== requesterId) {
    throw new ForbiddenException('You can only edit your own profile.');
  }

  // Update staff profile fields
  await this.prisma.staffProfile.update({
    where: { id: staffProfileId },
    data: {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.middleName !== undefined && { middleName: dto.middleName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    },
  });

  // Update user email / password
  const userUpdate: any = {};
  if (dto.email) userUpdate.email = dto.email;
  if (dto.password) userUpdate.passwordHash = await argon2.hash(dto.password);

  if (Object.keys(userUpdate).length > 0) {
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: userUpdate,
    });
  }

  return this.prisma.staffProfile.findUnique({
    where: { id: staffProfileId },
    include: { user: { select: { id: true, email: true, role: true } }, department: true },
  });
}

async updateStudentProfile(
  studentProfileId: string,
  dto: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    email?: string;
    password?: string;
  },
  requesterId: string,
  requesterRole: Role,
) {
  const student = await this.prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentProfileId },
    include: {
      user: true,
      currentClass: true,
    },
  });

  // HOD: can edit students in their department's classes
  if (requesterRole === Role.HOD) {
    const requester = await this.prisma.staffProfile.findFirst({
      where: { userId: requesterId },
      select: { departmentId: true },
    });
    const deptSubjects = await this.prisma.subject.findMany({
      where: { departmentId: requester?.departmentId ?? '' },
      select: { id: true },
    });
    const deptAssignments = await this.prisma.teachingAssignment.findMany({
      where: { subjectId: { in: deptSubjects.map(s => s.id) } },
      select: { classSectionId: true },
    });
    const allowedClassIds = [...new Set(deptAssignments.map(a => a.classSectionId))];
    if (!allowedClassIds.includes(student.currentClassId ?? '')) {
      throw new ForbiddenException('This student is not in your department\'s classes.');
    }
  }

  // Teacher cannot edit student profiles
  if (requesterRole === Role.TEACHER) {
    throw new ForbiddenException('Teachers cannot edit student profiles.');
  }

  await this.prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.middleName !== undefined && { middleName: dto.middleName }),
      ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
    },
  });

  const userUpdate: any = {};
  if (dto.email) userUpdate.email = dto.email;
  if (dto.password) userUpdate.passwordHash = await argon2.hash(dto.password);
  if (Object.keys(userUpdate).length > 0) {
    await this.prisma.user.update({
      where: { id: student.userId },
      data: userUpdate,
    });
  }

  return this.prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: { user: { select: { id: true, email: true } }, currentClass: true },
  });
}

async getMyProfile(userId: string) {
  const user = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      staffProfile: { include: { department: true } },
      studentProfile: { include: { currentClass: true, department: true } },
    },
  });
  return user;
}

  async getAllStudents(user?: { id: string; role: Role }, classId?: string) {

  if (user?.role === Role.TEACHER) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!staff) return [];

    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { teacherId: staff.id },
      select: { classSectionId: true },
    });
    const allowedClassIds = [...new Set(assignments.map(a => a.classSectionId))];

    // If classId requested, verify teacher is assigned to it
    if (classId && !allowedClassIds.includes(classId)) {
      return []; // Teacher has no assignment in this class — return empty
    }

    return this.prisma.studentProfile.findMany({
      where: {
        archivedAt: null,
        currentClassId: classId
          ? classId  // specific class requested
          : { in: allowedClassIds }, // all their classes
      },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        currentClass: true,
        department: true,
        reportCards: { select: { id: true } },
        grades: { select: { id: true, totalScore: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  if (user?.role === Role.HOD) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { userId: user.id },
      select: { departmentId: true },
    });

    // HOD: show students in classes where their department teaches
    const subjects = await this.prisma.subject.findMany({
      where: { departmentId: staff?.departmentId ?? undefined },
      select: { id: true },
    });
    const subjectIds = subjects.map(s => s.id);

    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { classSectionId: true },
    });
    const classIds = [...new Set(assignments.map(a => a.classSectionId))];

    return this.prisma.studentProfile.findMany({
      where: {
        archivedAt: null,
        currentClassId: classId
          ? (classIds.includes(classId) ? classId : undefined)
          : { in: classIds },
      },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        currentClass: true,
        department: true,
        reportCards: { select: { id: true } },
        grades: { select: { id: true, totalScore: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  // Admin/Headmaster — full access
  return this.prisma.studentProfile.findMany({
    where: {
      archivedAt: null,
      ...(classId ? { currentClassId: classId } : {}),
    },
    include: {
      user: { select: { id: true, email: true, isActive: true } },
      currentClass: true,
      department: true,
      reportCards: { select: { id: true } },
      grades: { select: { id: true, totalScore: true } },
    },
    orderBy: { lastName: 'asc' },
  });
}

  async getStudentProfile(studentId: string, requesterRole?: Role) {
    return this.prisma.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        currentClass: true,
        department: true,
        user: { select: { email: true, lastLoginAt: true } },
        parentLinks: { include: { parent: true } },
        grades: {
          where: requesterRole === Role.STUDENT ? { isApproved: true } : {},
          include: { subject: true, term: { include: { academicYear: true } } },
          take: 50,
          orderBy: { term: { academicYear: { startDate: 'desc' } } },
        },
        reportCards: {
          include: { term: { include: { academicYear: true } } },
          orderBy: { term: { academicYear: { startDate: 'desc' } } },
        },
      },
    });
  }

  async getAllStaff(user?: { id: string; role: Role }) {
    let departmentId: string | undefined;

    if (user?.role === Role.HOD) {
      const staff = await this.prisma.staffProfile.findUnique({
        where: { userId: user.id },
      });
      departmentId = staff?.departmentId || undefined;
    }

    return this.prisma.staffProfile.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        department: true,
        teachingAssignments: { include: { subject: true, classSection: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async deactivateUser(userId: string, deactivatedById?: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    if (deactivatedById) {
      await this.prisma.auditLog.create({
        data: {
          userId: deactivatedById,
          action: AuditAction.DELETE,
          entity: 'User',
          entityId: userId,
          payload: { deactivated: true },
        },
      });
    }

    return updated;
  }

  // ─── CSV Bulk Operations ───────────────────────────────────

  async bulkCreateStudents(rows: CreateStudentDto[]) {
    const results: {
      row: number;
      success: boolean;
      error?: string;
      indexNumber?: string;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const dto = rows[i];
      try {
        await this.createStudent(dto);
        results.push({
          row: i + 1,
          success: true,
          indexNumber: dto.indexNumber,
        });
      } catch (err: any) {
        results.push({
          row: i + 1,
          success: false,
          error: err.message,
          indexNumber: dto.indexNumber,
        });
      }
    }

    return {
      total: rows.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async bulkCreateStaff(rows: CreateStaffDto[]) {
    const results: {
      row: number;
      success: boolean;
      error?: string;
      staffId?: string;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const dto = rows[i];
      try {
        await this.createStaff(dto);
        results.push({ row: i + 1, success: true, staffId: dto.staffId });
      } catch (err: any) {
        results.push({
          row: i + 1,
          success: false,
          error: err.message,
          staffId: dto.staffId,
        });
      }
    }

    return {
      total: rows.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async exportStudentsCSV(user?: { id: string; role: Role }) {
    const students = await this.getAllStudents(user);
    return students.map((s) => ({
      indexNumber: s.indexNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName ?? '',
      gender: s.gender,
      dateOfBirth: s.dateOfBirth
        ? s.dateOfBirth.toISOString().split('T')[0]
        : '',
      email: s.user?.email ?? '',
      currentClass: s.currentClass
        ? `${s.currentClass.level}|${s.currentClass.name}`
        : '',
      department: s.department?.name ?? '',
      isActive: s.user?.isActive ?? true,
    }));
  }

  async exportStaffCSV(user?: { id: string; role: Role }) {
    const staff = await this.getAllStaff(user);
    return staff.map((s) => ({
      staffId: s.staffId,
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName ?? '',
      gender: s.gender,
      phone: s.phone ?? '',
      email: s.user?.email ?? '',
      role: s.user?.role ?? '',
      department: s.department?.name ?? '',
      isActive: s.user?.isActive ?? true,
    }));
  }
}
