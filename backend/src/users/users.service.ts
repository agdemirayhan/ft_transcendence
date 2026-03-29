import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        language: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      language: user.language,
      createdAt: user.createdAt,
      stats: {
        posts: user._count.posts,
        followers: user._count.followers,
        following: user._count.following,
      },
    };
  }

  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } else {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
    }

    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId } }),
      this.prisma.follow.count({ where: { followerId } }),
    ]);

    return {
      followingId,
      following: !existing,
      stats: {
        followers,
        following,
      },
    };
  }
}
