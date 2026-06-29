import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RefreshDto } from './dto/refresh.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser() user: User, @Body('refreshToken') token: string) {
    return this.authService.logout(user.id, token);
  }
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user with profile' })
  async getMe(@CurrentUser() user: User) {
    const { passwordHash: _, ...rest } = user as any;

    // Fetch with profile included
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        staffProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    const { passwordHash: __, ...fullRest } = fullUser as any;
    return fullRest;
  }
}
