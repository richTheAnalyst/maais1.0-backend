import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GradingService } from './grading.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import {
  UpsertGradeDto,
  BulkUpsertGradeDto,
  CorrectGradeDto,
} from './dto/grading.dto';

@ApiTags('Grading')
@ApiBearerAuth()
@Controller('grading')
export class GradingController {
  service: any;
  constructor(private gradingService: GradingService) {}

  @Post('entries')
  @Roles(Role.TEACHER, Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit or update a grade entry' })
  upsertGrade(@Body() dto: UpsertGradeDto, @CurrentUser('id') userId: string) {
    return this.gradingService.upsertGrade(dto, userId);
  }

  @Post('entries/bulk')
  @Roles(Role.TEACHER, Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk grade entry for a class/subject' })
  bulkUpsert(
    @Body() dto: BulkUpsertGradeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gradingService.bulkUpsertGrades(dto.entries, userId);
  }

  @Patch('entries/:id/lock')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Lock a grade entry' })
  lockGrade(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.lockGrade(id, userId, role);
  }

  @Patch('entries/:id/unlock')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unlock a grade entry' })
  unlockGrade(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.unlockGrade(id, userId, role);
  }

  @Post('entries/bulk-unlock')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk unlock grade entries' })
  bulkUnlock(
    @Body('ids') ids: string[],
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.bulkUnlockGrades(ids, userId, role);
  }

  @Patch('entries/:id/approve')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Approve a grade entry' })
  approveGrade(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.approveGrade(id, userId, role);
  }

  @Post('entries/bulk-approve')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Bulk approve grade entries' })
  bulkApprove(
    @Body('ids') ids: string[],
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.bulkApproveGrades(ids, userId, role);
  }

  @Post('corrections')
  @Roles(Role.TEACHER, Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit a grade correction with audit trail' })
  correctGrade(
    @Body() dto: CorrectGradeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gradingService.correctGrade(dto, userId);
  }

  @Get('audit-tray')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get missing observations tray' })
  getMissingObservations(@Query('termId') termId: string) {
    return this.gradingService.getMissingObservationsTray(termId);
  }

  @Get('class-summary/:classId')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get class performance summary' })
  getClassSummary(
    @Param('classId') classId: string,
    @Query('termId') termId: string,
  ) {
    return this.gradingService.getClassPerformanceSummary(classId, termId);
  }

  @Get('students/:studentId/terms/:termId')
  @ApiOperation({ summary: 'Get all grades for a student in a term' })
  getStudentTermGrades(
    @Param('studentId') studentId: string,
    @Param('termId') termId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.gradingService.getStudentTermGrades(studentId, termId, role);
  }

  @Get('smart-remarks/:grade')
  @ApiOperation({ summary: 'Get smart remark suggestions for a grade' })
  getSmartRemarks(@Param('grade') grade: string) {
    return { grade, remarks: this.gradingService.getSmartRemarks(grade) };
  }

  @Get('boundaries')
  @ApiOperation({ summary: 'Get WAEC grade boundaries (read-only)' })
  getBoundaries() {
    return this.gradingService.getBoundaries();
  }

  //top performing student
  @Get('top-students/:departmentId')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get top performing students in a department' })
  getTopStudents(
    @Param('departmentId') departmentId: string,
    @Query('termId') termId: string,
    @Query('limit') limit?: string,
  ) {
    return this.gradingService.getTopStudentsByDepartment(
      departmentId,
      termId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('grade-distribution/:departmentId')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get grade distribution for a department' })
  getGradeDistribution(
    @Param('departmentId') departmentId: string,
    @Query('termId') termId: string,
  ) {
    return this.gradingService.getDepartmentGradeDistribution(
      departmentId,
      termId,
    );
  }

  @Get('my-grading-scope')
  @ApiOperation({
    summary: 'Get subjects and classes this user is allowed to grade',
  })
  getMyGradingScope(@CurrentUser('id') userId: string) {
    return this.service.getMyGradingScope(userId);
  }

  /**
   * performance filtered analytics
   */
  @Get('performance-filtered')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.HOD)
  @ApiOperation({
    summary: 'Get subject performance filtered by class, department, and type',
  })
  getPerformanceFiltered(
    @Query('classId') classId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('subjectType') subjectType?: 'CORE' | 'ELECTIVE',
  ) {
    return this.gradingService.getSubjectPerformanceFiltered({
      classId,
      departmentId,
      subjectType,
    });
  }

  @Get('analytics/teacher/:staffProfileId')
  @Roles(Role.TEACHER, Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get performance analytics for a teacher's subjects",
  })
  getTeacherAnalytics(
    @Param('staffProfileId') staffProfileId: string,
    @Query('termId') termId: string,
  ) {
    return this.gradingService.getTeacherAnalytics(staffProfileId, termId);
  }

  @Get('analytics/department/:departmentId')
  @Roles(Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get HOD analytics for department subjects' })
  getHODAnalytics(
    @Param('departmentId') departmentId: string,
    @Query('termId') termId: string,
  ) {
    return this.gradingService.getHODAnalytics(departmentId, termId);
  }
}
