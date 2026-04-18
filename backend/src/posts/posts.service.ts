import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PostWithRelations = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  files: {
    id: number;
    filename: string;
    mimetype: string;
  }[];
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

  async list(limit: number = 20, offset: number = 0) {
    const posts = await this.prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            mimetype: true,
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

  async trendingHashtags(limit = 10) {
    const posts = await this.prisma.post.findMany({
      select: { content: true },
    });

    const counts = new Map<string, number>();
    const tagRegex = /#[\w]+/gi;
    for (const { content } of posts) {
      const tags = content.match(tagRegex) ?? [];
      for (const tag of tags) {
        const lower = tag.toLowerCase();
        counts.set(lower, (counts.get(lower) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  async searchByContent(q: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        files: { select: { id: true, filename: true, mimetype: true } },
        _count: { select: { likes: true, comments: true } },
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
        files: {
          select: {
            id: true,
            filename: true,
            mimetype: true,
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

  async create(authorId: number, content: string, fileId?: number) {
    const trimmed = content?.trim() ?? '';
    if (!trimmed && typeof fileId === 'undefined') {
      throw new BadRequestException('Post must have content or an attachment');
    }
    if (trimmed.length > 500) {
      throw new BadRequestException('Content must be 500 characters or fewer');
    }

    if (typeof fileId !== 'undefined') {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: { id: true, authorId: true, postId: true },
      });

      if (!file) {
        throw new BadRequestException('File not found');
      }

      if (file.authorId !== authorId) {
        throw new BadRequestException('You can only attach your own file');
      }

      if (file.postId !== null) {
        throw new BadRequestException('File is already attached to a post');
      }
    }

    const post = await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          authorId,
          content: trimmed,
        },
      });

      if (typeof fileId !== 'undefined') {
        await tx.file.update({
          where: { id: fileId },
          data: { postId: createdPost.id },
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: createdPost.id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          files: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
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

  async getPost(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            mimetype: true,
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

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.toResponse(post);
  }

  async deletePost(postId: number, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
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
      updatedAt: post.updatedAt,
      author: post.author,
      files: post.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/upload/${file.id}`,
      })),
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
