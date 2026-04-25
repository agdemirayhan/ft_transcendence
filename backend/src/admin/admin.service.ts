import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        onlineStatus: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  async updateUserAvatar(userId: number, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }

  async updateUserBio(userId: number, bio: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { bio: bio.trim() || null },
      select: { id: true, bio: true },
    });
  }

  async updateUserRole(userId: number, role: string) {
    if (!['user', 'admin'].includes(role)) throw new NotFoundException('Invalid role');
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
  }

  async getAllPosts() {
    return this.prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePost(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }
}
