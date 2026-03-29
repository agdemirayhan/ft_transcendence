import { Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';

type JwtRequest = {
  user: {
    id: number;
    email: string;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async toggleFollow(@Request() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleFollow(req.user.id, id);
  }
}
