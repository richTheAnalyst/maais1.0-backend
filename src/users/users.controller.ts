import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService, CreateParentDto } from './users.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateStudentDto } from './dto/create-student.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('staff')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create a staff account' })
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Post('students')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Enrol a new student' })
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Post('parents')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Enrol a new parent' })
  createParent(@Body() dto: CreateParentDto) {
    return this.usersService.createParent(dto);
  }

  @Get('students')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'List all active students' })
  getAllStudents(@CurrentUser() user: { id: string, role: Role }) {
    return this.usersService.getAllStudents(user);
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get full student profile' })
  getStudentProfile(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.usersService.getStudentProfile(id, role);
  }

  @Get('staff')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'List all staff members' })
  getAllStaff(@CurrentUser() user: { id: string, role: Role }) {
    return this.usersService.getAllStaff(user);
  }

  @Delete(':id/deactivate')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  //csv
  @Post('students/bulk-import')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Bulk import students from parsed CSV rows' })
bulkImportStudents(@Body('rows') rows: CreateStudentDto[]) {
  return this.usersService.bulkCreateStudents(rows);
}

@Post('staff/bulk-import')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
@ApiOperation({ summary: 'Bulk import staff from parsed CSV rows' })
bulkImportStaff(@Body('rows') rows: CreateStaffDto[]) {
  return this.usersService.bulkCreateStaff(rows);
}

@Get('students/export')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
@ApiOperation({ summary: 'Export students as CSV-ready JSON' })
exportStudents(@CurrentUser() user: { id: string; role: Role }) {
  return this.usersService.exportStudentsCSV(user);
}

@Get('staff/export')
@Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
@ApiOperation({ summary: 'Export staff as CSV-ready JSON' })
exportStaff(@CurrentUser() user: { id: string; role: Role }) {
  return this.usersService.exportStaffCSV(user);
}
}