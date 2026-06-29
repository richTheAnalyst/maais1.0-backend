import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role, DayOfWeek } from '@prisma/client';
import { TimetableService } from './timetable.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Create a timetable entry' })
  create(@Body() body: any) {
    return this.timetableService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all timetable entries with optional filters' })
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('dayOfWeek') dayOfWeek?: DayOfWeek,
  ) {
    return this.timetableService.findAll({ teacherId, classId, dayOfWeek });
  }

  @Get('my-schedule')
  @ApiOperation({ summary: 'Get current teacher weekly schedule' })
  getMySchedule(@CurrentUser('id') userId: string) {
    return this.timetableService.getWeeklySchedule(userId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get timetable for a specific teacher' })
  getByTeacher(@Param('teacherId') teacherId: string) {
    return this.timetableService.findByTeacher(teacherId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get timetable for a specific class' })
  getByClass(@Param('classId') classId: string) {
    return this.timetableService.findByClass(classId);
  }

  @Get('weekly/:teacherId')
  @ApiOperation({ summary: 'Get weekly schedule grouped by day' })
  getWeekly(@Param('teacherId') teacherId: string) {
    return this.timetableService.getWeeklySchedule(teacherId);
  }

  @Get('clashes/:teacherId')
  @ApiOperation({ summary: 'Detect scheduling clashes for a teacher' })
  getClashes(@Param('teacherId') teacherId: string) {
    return this.timetableService.detectClashes(teacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a timetable entry by ID' })
  findOne(@Param('id') id: string) {
    return this.timetableService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Update a timetable entry' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.timetableService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.HOD)
  @ApiOperation({ summary: 'Delete a timetable entry' })
  delete(@Param('id') id: string) {
    return this.timetableService.delete(id);
  }
}