import { Controller, Post, Body, UseGuards, Request, Get, Delete, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  async deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('language')
  async updateLanguage(@Request() req: any, @Body() body: { language: string }) {
    return this.authService.updateLanguage(req.user.id, body.language);
  }
}