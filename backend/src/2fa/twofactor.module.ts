import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TwoFactorController } from './twofactorroutes';
import { TwoFactorService } from './twofactor.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
})
export class TwoFactorModule {}
 