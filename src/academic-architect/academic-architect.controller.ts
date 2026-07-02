import { Controller, Get, Post, Patch, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AcademicArchitectService } from './academic-architect.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import {
  CreateAcademicYearDto,
  CreateTermDto,
  CreateDepartmentDto,
  CreateSubjectDto,
  CreateClassSectionDto,
  AssignTeacherDto,
  AssignClassTeacherDto,
} from './dto/academic-architect.dto';

@ApiTags('Academic Architect')
@ApiBearerAuth()
@Controller('academic')
export class AcademicArchitectController {
  constructor(private service: AcademicArchitectService) {}

  @Post('years')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create a new academic year' })
  createYear(@Body() dto: CreateAcademicYearDto) {
    return this.service.createAcademicYear(dto.label, new Date(dto.startDate), new Date(dto.endDate));
  }

  @Patch('years/:id/activate')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Set active academic year' })
  activateYear(@Param('id') id: string) {
    return this.service.setActiveYear(id);
  }

  @Get('years/active')
  @ApiOperation({ summary: 'Get current active academic year' })
  getActiveYear() {
    return this.service.getActiveYear();
  }

  @Post('terms')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create a term' })
  createTerm(@Body() dto: CreateTermDto) {
    return this.service.createTerm(dto.academicYearId, dto.termNumber, new Date(dto.startDate), new Date(dto.endDate));
  }

  @Patch('terms/:id/activate')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Set active term' })
  activateTerm(@Param('id') id: string) {
    return this.service.setActiveTerm(id);
  }

  //departments
  @Post('departments')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.service.createDepartment(dto.name, dto.code, dto.description);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  getAllDepartments() {
    return this.service.getAllDepartments();
  }

  @Delete('departments/:id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({summary: 'delete a department'})
  async deleteDepartment(@Param('id') id: string){
    return this.service.deleteDepartment(id);

  }

  //subjects
  @Post('subjects')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Create a subject' })
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.service.createSubject(dto);
  }

  @Delete('subjects/:id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Delete a subject' })
  async deleteSubject(@Param('id') id: string) {
    return this.service.deleteSubject({ id } as any);
  }


  @Get('subjects')
  @ApiOperation({ summary: 'Get all active subjects' })
  getAllSubjects() {
    return this.service.getAllSubjects();
  }

  //classes
  @Post('classes')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create a class section' })
  createClass(@Body() dto: CreateClassSectionDto) {
    return this.service.createClassSection(dto.name, dto.level, dto.capacity);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Get all class sections' })
  getAllClasses() {
    return this.service.getAllClassSections();
  }

  @Delete('classes/:id')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Delete a class section' })
deleteClass(@Param('id') id: string) {
  return this.service.deleteClassSection(id);
}

  @Patch('classes/:id/teacher')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Assign class teacher' })
  assignClassTeacher(@Param('id') id: string, @Body() dto: AssignClassTeacherDto) {
    return this.service.assignClassTeacher(id, dto.staffId);
  }


  //assignments
  @Post('assignments')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Assign teacher to subject/class' })
  assignTeacher(@Body() dto: AssignTeacherDto) {
    return this.service.assignTeacher(dto);
  }

  @Get('assignments/teacher/:teacherId')
  @ApiOperation({ summary: 'Get teacher assignments' })
  getTeacherAssignments(@Param('teacherId') teacherId: string) {
    return this.service.getTeacherAssignments(teacherId);
  }

  @Get('my-assignments')
  @ApiOperation({ summary: 'Get current teacher assignments' })
  getMyAssignments(@CurrentUser() user: any) {
    if (!user.staffProfile) return [];
    return this.service.getTeacherAssignments(user.staffProfile.id);
  }

  @Get('assignments')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
@ApiOperation({ summary: 'Get all teaching assignments' })
getAllAssignments() {
  return this.service.getAllAssignments();
}

@Delete('assignments/:id')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
@ApiOperation({ summary: 'Remove a teaching assignment' })
deleteAssignment(@Param('id') id: string, @CurrentUser('id') userId: string) {
  return this.service.deleteAssignment(id, userId);
}

@Patch('staff/:userId/role')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Change a staff member\'s system role' })
updateStaffRole(
  @Param('userId') staffUserId: string,
  @Body('role') role: Role,
  @CurrentUser('id') requesterId: string,
) {
  return this.service.updateStaffRole(staffUserId, role, requesterId);
}

@Patch('staff/:staffId/department')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Change a staff member\'s department' })
updateStaffDepartment(
  @Param('staffId') staffId: string,
  @Body('departmentId') departmentId: string | null,
  @CurrentUser('id') requesterId: string,
) {
  return this.service.updateStaffDepartment(staffId, departmentId, requesterId);
}

@Patch('terms/:id/unlock')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Unlock a previously locked term (sensitive action, audit logged)' })
unlockTerm(
  @Param('id') id: string,
  @Body('reason') reason: string,
  @CurrentUser('id') userId: string,
) {
  return this.service.unlockTerm(id, userId, reason);
}

@Get('departments/overview')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Get all departments with staff/subject counts' })
getDepartmentsOverview() {
  return this.service.getDepartmentsOverview();
}

@Get('departments/:id/roster')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Get a department with its HODs, teachers, and subjects' })
getDepartmentRoster(@Param('id') id: string) {
  return this.service.getDepartmentRoster(id);
}

@Get('my-grading-scope')
@ApiOperation({ summary: 'Get subjects and classes this user is allowed to grade' })
getMyGradingScope(@CurrentUser('id') userId: string) {
  return this.service.getMyGradingScope(userId);
}

//audit logs
@Get('audit-logs')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
@ApiOperation({ summary: 'Get audit logs with optional filters' })
getAuditLogs(
  @Query('entity') entity?: string,
  @Query('action') action?: string,
  @Query('userId') userId?: string,
  @Query('take') take?: string,
) {
  return this.service.getAuditLogs({ entity, action, userId, take: take ? parseInt(take) : 50 });
}
}