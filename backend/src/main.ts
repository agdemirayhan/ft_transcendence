import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as path from "path";
import * as fs from "fs";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const certPath = path.join(process.cwd(), "certs");
  const httpsOptions = {
    key: fs.readFileSync(path.join(certPath, "key.pem")),
    cert: fs.readFileSync(path.join(certPath, "cert.pem")),
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
