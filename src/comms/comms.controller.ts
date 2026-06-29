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
import { CommsService } from './comms.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import { SendNotificationDto, EmergencyNotificationDto } from './dto/comms.dto';

@ApiTags('Comms')
@ApiBearerAuth()
@Controller('comms')
export class CommsController {
  constructor(private commsService: CommsService) {}

  @Post('notify')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Send notification to students' })
  sendNotification(
    @Body() dto: SendNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commsService.sendNotification(dto, userId);
  }

  @Post('emergency')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Broadcast emergency SMS to all parents' })
  emergency(
    @Body() dto: EmergencyNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commsService.broadcastEmergency(dto.title, dto.message, userId);
  }

  @Get('notifications/:studentId')
  @ApiOperation({ summary: "Get student's notification inbox" })
  getNotifications(
    @Param('studentId') studentId: string,
    @Query('unreadOnly') unreadOnly: boolean,
  ) {
    return this.commsService.getStudentNotifications(studentId, unreadOnly);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string) {
    return this.commsService.markAsRead(id);
  }

  @Get('analytics/pulse')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get academic pulse dashboard data' })
  getPulse(@Query('academicYearId') academicYearId?: string) {
    return this.commsService.getAnalyticsPulse(academicYearId);
  }
  //staff endpoints
  @Post('notify-staff')
  @Roles(Role.TEACHER, Role.HOD, Role.HEADMASTER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send notification to staff members' })
  notifyStaff(
    @Body() dto: { staffIds: string[]; title: string; body: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.commsService.notifyStaff(
      dto.staffIds,
      dto.title,
      dto.body,
      userId,
    );
  }

  @Get('staff-notifications/:staffId')
  @ApiOperation({ summary: "Get staff member's notification inbox" })
  getStaffNotifications(
    @Param('staffId') staffId: string,
    @Query('unreadOnly') unreadOnly: boolean,
  ) {
    return this.commsService.getStaffNotifications(staffId, unreadOnly);
  }
}
