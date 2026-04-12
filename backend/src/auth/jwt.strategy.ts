import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (payload.twoFactorPending) {
      throw new UnauthorizedException('2FA verification required');
    }

    const userId = Number(payload?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return { id: user.id, email: user.email };
  }
}
