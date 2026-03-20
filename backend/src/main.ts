import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ← CORS hinzufügen
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'], // dein Frontend-Port
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
