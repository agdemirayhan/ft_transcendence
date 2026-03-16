import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { TwoFactorService } from './twofactor.service';

type JwtRequest = {
  user: {
    id: number;
  };
};

@Controller('2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(@Request() req: JwtRequest) {
    return this.twoFactorService.generateForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-setup')
  async verifySetup(@Request() req: JwtRequest, @Body() body: { token: string }) {
    return this.twoFactorService.verifySetup(req.user.id, body.token);
  }

  @Post('verify-login')
  async verifyLogin(@Body() body: { tempToken: string; token: string }) {
    return this.twoFactorService.verifyLogin(body.tempToken, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Request() req: JwtRequest, @Body() body: { token: string }) {
    return this.twoFactorService.disable(req.user.id, body.token);
  }
}