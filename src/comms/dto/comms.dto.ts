import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  @ApiPropertyOptional({ type: [String], description: 'Leave empty to notify all students' })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @ApiProperty({ example: 'Term 2 Results Ready' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your Term 2 report cards are now available.' })
  @IsString()
  body: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;
}

export class EmergencyNotificationDto {
  @ApiProperty({ example: 'School Closure' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'School is closed tomorrow due to weather.' })
  @IsString()
  message: string;
}

export class PromotionDto {
  @ApiProperty()
  @IsString()
  academicYearId: string;
}