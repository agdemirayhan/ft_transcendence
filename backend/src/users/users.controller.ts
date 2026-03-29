import { Controller, Get, Post, Delete, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getProfile(id);
  }

  @Get(':id/posts')
  async getPosts(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPosts(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-status')
  async getFollowStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.getFollowStatus(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.follow(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.unfollow(req.user.id, id);
  }
}
