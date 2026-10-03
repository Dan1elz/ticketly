import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.WEB_URL });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('Ticketly API').addBearerAuth().build(),
  );
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
