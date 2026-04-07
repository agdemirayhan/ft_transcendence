import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async createPost(content: string, authorId: number, fileId?: number) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Post content cannot be empty');
    }

    const post = await this.prisma.post.create({
      data: {
        content,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        files: true,
        likes: true,
        comments: true,
      },
    });

    // Link file to post if provided
    if (fileId) {
      await this.prisma.file.update({
        where: { id: fileId },
        data: { postId: post.id },
      });
    }

    return this.formatPost(post);
  }

  async getPosts(limit: number = 20, offset: number = 0) {
    const posts = await this.prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        files: true,
        likes: true,
        comments: true,
      },
    });

    return posts.map(p => this.formatPost(p));
  }

  async getPost(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        files: true,
        likes: true,
        comments: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.formatPost(post);
  }

  async deletePost(postId: number, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  private formatPost(post: any) {
    return {
      id: post.id,
      content: post.content,
      author: post.author,
      files: post.files.map((f: any) => ({
        id: f.id,
        filename: f.filename,
        mimetype: f.mimetype,
        url: `/uploads/${f.id}`,
      })),
      likes: post.likes.length,
      comments: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
