import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PostWithRelations = {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts.map((post) => this.toResponse(post));
  }

  async create(authorId: number, content: string) {
    const trimmed = content?.trim();
    if (!trimmed) {
      throw new BadRequestException('Content cannot be empty');
    }
    if (trimmed.length > 500) {
      throw new BadRequestException('Content must be 500 characters or fewer');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: trimmed,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return this.toResponse(post);
  }

  private toResponse(post: PostWithRelations) {
    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: post.author,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
      },
    };
  }
}
