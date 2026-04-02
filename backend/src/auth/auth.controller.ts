import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() body: { email: string; username: string; password: string }) {
    return this.authService.signup(body.email, body.username, body.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  // Neue Endpoints für Chat
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.authService.getConversations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:friendId')
  async getMessages(@Request() req: any, @Param('friendId') friendId: string) {
    return this.authService.getMessagesBetweenUsers(req.user.id, +friendId);
  }
}
