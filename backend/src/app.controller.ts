import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root() {
    return {
      message: 'ft_transcendence backend is running',
      health: '/health',
      auth: '/auth',
      twoFactor: '/2fa',
    };
  }

  @Get("health")
  health() {
    return this.appService.health();
  }
}
