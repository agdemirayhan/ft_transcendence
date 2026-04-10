import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateCommentDto } from './create-comment.dto';
import { CreatePostDto } from './create-post.dto';
import { PostsService } from './posts.service';

type JwtRequest = {
  user: {
    id: number;
    email: string;
  };
};

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list() {
    return this.postsService.list();
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async feed(@Request() req: JwtRequest) {
    return this.postsService.feed(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: JwtRequest, @Body() body: CreatePostDto) {
    return this.postsService.create(req.user.id, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Request() req: JwtRequest, @Param('id', ParseIntPipe) postId: number) {
    return this.postsService.toggleLike(req.user.id, postId);
  }

  @Get(':id/comments')
  async listComments(@Param('id', ParseIntPipe) postId: number) {
    return this.postsService.listComments(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Request() req: JwtRequest,
    @Param('id', ParseIntPipe) postId: number,
    @Body() body: CreateCommentDto,
  ) {
    return this.postsService.createComment(req.user.id, postId, body.content);
  }
}
