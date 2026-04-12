import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TwoFactorModule } from './2fa/twofactor.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TwoFactorModule,
    PostsModule,
    UsersModule,
    ChatModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
