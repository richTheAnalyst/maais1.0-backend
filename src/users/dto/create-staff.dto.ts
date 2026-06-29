import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { Gender, Role } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({ example: 'teacher@mandoshts.edu.gh' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Teacher@2024!' })
  @IsString()
  password: string;

  @ApiProperty({ enum: Role, example: Role.TEACHER })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'TCH-2024-001' })
  @IsString()
  staffId: string;

  @ApiProperty({ example: 'Ama' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Owusu' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Abena' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '+233244000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}