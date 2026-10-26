import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Atrás do proxy de borda (nginx), quem conecta na API é o proxy. Confiar nos
  // X-Forwarded-* só quando vêm de rede privada (Docker) faz req.ip ser o IP do
  // visitante e req.protocol ser https, sem deixar alguém de fora forjar o cabeçalho
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');

  // WEB_URL aceita várias origens separadas por vírgula (ex.: dev e staging juntos).
  // A comparação é exata: https://site e http://site são origens diferentes
  const origins = (process.env.WEB_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  // Swagger só fora de produção (ou com SWAGGER_ENABLED=true): em staging ele
  // mostraria o mapa inteiro da API para qualquer um
  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Ticketly API').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
