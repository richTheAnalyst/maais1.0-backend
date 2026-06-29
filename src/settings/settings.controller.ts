import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get school-wide settings' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Update school-wide settings' })
  updateSettings(
    @Body() body: { clashDetectionEnabled?: boolean; departmentColorsEnabled?: boolean },
    @CurrentUser('id') userId: string,
  ) {
    return this.settingsService.updateSettings(body, userId);
  }
}