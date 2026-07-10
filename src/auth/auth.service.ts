import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return null;

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  async login(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.email, user.role),
      this.createRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async refreshTokens(userId: string, token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token invalid or expired');
    }

    // Rotate: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return this.login(user);
  }

  async logout(userId: string | undefined, token: string) {
    if (!userId) {
      // Token already expired — nothing to invalidate server-side
      return { message: 'Logged out' };
    }
    // existing logic to invalidate refresh token...
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token },
    });
    return { message: 'Logged out successfully' };
  }

  private async signAccessToken(id: string, email: string, role: string) {
    return this.jwt.signAsync(
      { sub: id, email, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );
  }

  private async createRefreshToken(userId: string) {
    const token = uuidv4();
    const days = 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  private sanitizeUser(user: User) {
    const userDto = { ...user } as any;
    delete userDto.passwordHash;
    return userDto;
  }
}
