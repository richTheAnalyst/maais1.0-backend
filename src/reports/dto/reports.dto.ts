import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GenerateReportCardDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  termId: string;
}

export class BatchGenerateDto {
  @ApiProperty()
  @IsString()
  classSectionId: string;

  @ApiProperty()
  @IsString()
  termId: string;
}

export class BuildTranscriptDto {
  @ApiProperty({ example: 'MSHTS/2024/001', description: 'Student ID or index number' })
  @IsString()
  studentIdOrIndex: string;
}