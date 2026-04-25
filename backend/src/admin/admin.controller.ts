import { Controller, Get, Delete, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/avatar')
  updateUserAvatar(@Param('id', ParseIntPipe) id: number, @Body('avatarUrl') avatarUrl: string) {
    return this.adminService.updateUserAvatar(id, avatarUrl ?? '');
  }

  @Patch('users/:id/bio')
  updateUserBio(@Param('id', ParseIntPipe) id: number, @Body('bio') bio: string) {
    return this.adminService.updateUserBio(id, bio ?? '');
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role ?? 'user');
  }

  @Get('posts')
  getAllPosts() {
    return this.adminService.getAllPosts();
  }

  @Delete('posts/:id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePost(id);
  }
}
