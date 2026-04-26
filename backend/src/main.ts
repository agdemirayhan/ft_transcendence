import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as path from "path";
import * as fs from "fs";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const httpsKeyPath = process.env.HTTPS_KEY_PATH;
  const httpsCertPath = process.env.HTTPS_CERT_PATH;
  const httpsOptions =
    httpsKeyPath && httpsCertPath
      ? {
          key: fs.readFileSync(httpsKeyPath),
          cert: fs.readFileSync(httpsCertPath),
        }
      : undefined;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    ...(httpsOptions ? { httpsOptions } : {}),
  });
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
