import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@mandoshts.edu.gh' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@2024!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}