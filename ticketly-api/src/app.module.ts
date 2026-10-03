import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { AdminsModule } from './admins/admins.module';
import { ArtistsModule } from './artists/artists.module';
import { AuthModule } from './auth/auth.module';
import { ZodValidationPipe } from './common/zod/zod-validation.pipe';
import { EventsModule } from './events/events.module';
import { createMikroOrmConfig } from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: createMikroOrmConfig,
    }),
    AuthModule,
    AdminsModule,
    ArtistsModule,
    EventsModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
