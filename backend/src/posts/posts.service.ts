import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

type CommentWithAuthor = {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatarUrl: string | null;
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

  async feed(userId: number) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: [...followingIds, userId] },
      },
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

  async toggleLike(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
    }

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    return {
      postId,
      liked: !existingLike,
      likesCount,
    };
  }

  async listComments(postId: number) {
    await this.ensurePostExists(postId);

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return comments.map((comment) => this.toCommentResponse(comment));
  }

  async createComment(authorId: number, postId: number, content: string) {
    await this.ensurePostExists(postId);

    const trimmed = content?.trim();
    if (!trimmed) {
      throw new BadRequestException('Comment cannot be empty');
    }
    if (trimmed.length > 500) {
      throw new BadRequestException('Comment must be 500 characters or fewer');
    }

    const comment = await this.prisma.comment.create({
      data: {
        authorId,
        postId,
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
      },
    });

    return this.toCommentResponse(comment);
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

  private async ensurePostExists(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  private toCommentResponse(comment: CommentWithAuthor) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
    };
  }
}
