import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as path from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });
  
  // Serve uploaded files as static assets
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.useStaticAssets(uploadsPath, {
    prefix: "/uploads",
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}

bootstrap();
