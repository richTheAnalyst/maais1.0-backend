import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional,IsArray, ValidateNested, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer'

export class UpsertGradeDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  termId: string;

  @ApiProperty({ example: 25, description: 'Class score out of 30' })
  @IsNumber()
  @Min(0)
  @Max(30)
  classScore: number;

  @ApiProperty({ example: 55, description: 'Exam score out of 70' })
  @IsNumber()
  @Min(0)
  @Max(70)
  examScore: number;

  @ApiPropertyOptional({ example: 'Outstanding performance' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasObservation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observationText?: string;
}

export class BulkUpsertGradeDto {
  @ApiProperty({ type: [UpsertGradeDto] })
  @IsArray()
  @ValidateNested({ each: true})
  @Type(() => UpsertGradeDto)
  entries: UpsertGradeDto[];
}

export class CorrectGradeDto {
  @ApiProperty()
  @IsString()
  gradeEntryId: string;

  @ApiProperty({ enum: ['classScore', 'examScore', 'remark'] })
  @IsEnum(['classScore', 'examScore', 'remark'])
  fieldChanged: 'classScore' | 'examScore' | 'remark';

  @ApiProperty()
  @IsString()
  newValue: string;

  @ApiProperty({ example: 'Score was incorrectly entered' })
  @IsString()
  reason: string;
}

export class LockGradeDto {
  @ApiProperty()
  @IsString()
  gradeEntryId: string;
}

