import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, username: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, username, passwordHash: hashed },
    });
    return this.login(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return {
        requiresTwoFactor: true,
        tempToken: this.jwtService.sign(
          { ...payload, twoFactorPending: true },
          { expiresIn: '5m' },
        ),
      };
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async updateLanguage(userId: number, language: string) {
    const allowed = ['en', 'tr', 'de'];
    if (!allowed.includes(language)) {
      throw new UnauthorizedException('Invalid language');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { language },
    });
    return { message: 'Language updated.' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        twoFactorEnabled: true,
        language: true,
        _count: {
          select: { posts: true, followers: true, following: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { _count, ...rest } = user;
    return { ...rest, stats: { posts: _count.posts, followers: _count.followers, following: _count.following } };
  }

  async deleteAccount(userId: number) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: "Account deleted." };
  }

    async getAllUsers() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, avatarUrl: true, onlineStatus: true },
    });
  }

  async getConversations(userId: number) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: {
        senderId: true,
        receiverId: true,
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Map<number, { id: number; username: string }>();
    for (const m of messages) {
      const other = m.senderId === userId ? m.receiver : m.sender;
      if (!seen.has(other.id)) seen.set(other.id, other);
    }
    return Array.from(seen.values());
  }

  async getMessagesBetweenUsers(userId: number, friendId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
  }
}
