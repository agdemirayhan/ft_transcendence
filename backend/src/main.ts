import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as path from "path";
import * as fs from "fs";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const certPath = path.join(process.cwd(), "certs");
  const keyPath = process.env.HTTPS_KEY_PATH || path.join(certPath, "key.pem");
  const certFilePath = process.env.HTTPS_CERT_PATH || path.join(certPath, "cert.pem");
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath),
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: true, credentials: true });

  const uploadsPath = path.join(process.cwd(), "uploads");
  app.useStaticAssets(uploadsPath, { prefix: "/uploads" });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}

bootstrap();
