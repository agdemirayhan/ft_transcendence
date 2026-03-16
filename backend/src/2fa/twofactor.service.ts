import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { generateSecret, verifyToken } from './twofactorauth';

type PendingTwoFactorPayload = {
  sub: number;
  email: string;
  twoFactorPending?: boolean;
  iat?: number;
  exp?: number;
};

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    const { secret, qrCodeDataUrl } = await generateSecret(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorTempSecret: secret },
    });

    return { qrCodeDataUrl };
  }

  async verifySetup(userId: number, token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorTempSecret: true,
      },
    });

    if (!user?.twoFactorTempSecret) {
      throw new BadRequestException('No 2FA setup in progress');
    }

    const isValid = verifyToken(token, user.twoFactorTempSecret);
    if (!isValid) {
      throw new BadRequestException('Invalid token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: user.twoFactorTempSecret,
        twoFactorTempSecret: null,
        twoFactorEnabled: true,
      },
    });

    return { message: '2FA enabled' };
  }

  async verifyLogin(tempToken: string, token: string) {
    if (!tempToken || !token) {
      throw new BadRequestException('tempToken and token are required');
    }

    let payload: PendingTwoFactorPayload;

    try {
      payload = this.jwtService.verify<PendingTwoFactorPayload>(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (!payload.twoFactorPending || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid temporary login state');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not enabled for this account');
    }

    const isValid = verifyToken(token, user.twoFactorSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async disable(userId: number, token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    const isValid = verifyToken(token, user.twoFactorSecret);
    if (!isValid) {
      throw new BadRequestException('Invalid token');
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
