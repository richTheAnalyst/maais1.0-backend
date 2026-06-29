import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademicArchitectModule } from './academic-architect/academic-architect.module';
import { GradingModule } from './grading/grading.module';
import { ReportsModule } from './reports/reports.module';
import { ArchiveModule } from './archive/archive.module';
import { CommsModule } from './comms/comms.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PortalModule } from './portal/portal.module';
import { BehaviorModule } from './behavior/behavior.module';
import { InterventionsModule } from './interventions/interventions.module';
import { TimetableModule } from './timetable/timetable.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicArchitectModule,
    GradingModule,
    ReportsModule,
    ArchiveModule,
    CommsModule,
    PortalModule,
    BehaviorModule,
    InterventionsModule,
    TimetableModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}