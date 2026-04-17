import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts(userId: number) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { username: true } },
        _count: { select: { likes: true } },
      },
    });
  }

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

  async updateBio(userId: number, bio: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { bio: bio.trim() || null },
      select: { id: true, bio: true },
    });
    return updated;
  }

  async searchUsers(query: string, currentUserId: number) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        username: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
        bio: true,
        _count: { select: { followers: true, posts: true } },
        followers: {
          where: { followerId: currentUserId },
          select: { followerId: true },
        },
      },
      take: 20,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      bio: u.bio,
      followers: u._count.followers,
      posts: u._count.posts,
      isFollowing: u.followers.length > 0,
    }));
  }

  async getSuggestions(currentUserId: number) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        followers: { none: { followerId: currentUserId } },
      },
      select: {
        id: true,
        username: true,
        _count: { select: { followers: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 5,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      followers: u._count.followers,
      isFollowing: false,
    }));
  }

  async getFollowers(userId: number) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: { select: { id: true, username: true, _count: { select: { followers: true } } } },
      },
    });
    return follows.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      followers: f.follower._count.followers,
    }));
  }

  async getFollowing(userId: number) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: { select: { id: true, username: true, _count: { select: { followers: true } } } },
      },
    });
    return follows.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      followers: f.following._count.followers,
    }));
  }

  async getFollowStatus(followerId: number, followingId: number) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { isFollowing: !!follow };
  }

  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    return { isFollowing: true };
  }

  async unfollow(followerId: number, followingId: number) {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
    return { isFollowing: false };
  }
}
