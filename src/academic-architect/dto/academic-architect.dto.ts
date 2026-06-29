import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { TermNumber, ClassLevel, SubjectType } from '@prisma/client';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2024/2025' })
  @IsString()
  label: string;

  @ApiProperty({ example: '2024-09-02' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-07-31' })
  @IsDateString()
  endDate: string;
}

export class CreateTermDto {
  @ApiProperty()
  @IsString()
  academicYearId: string;

  @ApiProperty({ enum: TermNumber })
  @IsEnum(TermNumber)
  termNumber: TermNumber;

  @ApiProperty({ example: '2024-09-02' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsDateString()
  endDate: string;
}

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Science' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SCI' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Core Mathematics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CMATH' })
  @IsString()
  code: string;

  @ApiProperty({ enum: SubjectType })
  @IsEnum(SubjectType)
  type: SubjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateClassSectionDto {
  @ApiProperty({ example: '1A' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ClassLevel })
  @IsEnum(ClassLevel)
  level: ClassLevel;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  capacity?: number;
}

export class AssignTeacherDto {
  @ApiProperty()
  @IsString()
  teacherId: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty()
  @IsString()
  classSectionId: string;

  @ApiProperty()
  @IsString()
  academicYearId: string;
}

export class AssignClassTeacherDto {
  @ApiProperty()
  @IsString()
  staffId: string;
}