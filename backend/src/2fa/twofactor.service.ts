import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA already enabled');
    }

    const clientId = process.env.OAUTH2_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('OAUTH2_CLIENT_ID is not configured');
    }

    const authorizationBaseUrl =
      process.env.OAUTH2_AUTH_URL ?? 'https://accounts.google.com/o/oauth2/v2/auth';
    const redirectUri =
      process.env.OAUTH2_REDIRECT_URI ?? 'http://localhost:3001/settings';
    const scope =
      process.env.OAUTH2_SCOPE ?? 'openid email profile';

    const state = `u${userId}-${Date.now()}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorTempSecret: state },
    });

    const searchParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return {
      message: 'OAuth2 window can be opened',
      oauth2Url: `${authorizationBaseUrl}?${searchParams.toString()}`,
    };
  }

  async verifySetup(userId: number) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorTempSecret: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorTempSecret) {
      throw new ConflictException('No OAuth2 setup in progress');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      },
    });

    return { message: '2FA enabled' };
  }

  async disable(userId: number) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      },
    });

    return { message: '2FA disabled' };
  }
}
