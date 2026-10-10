import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StorageModule } from '../storage/storage.module';
import { ArtistsController } from './artists.controller';
import { ArtistImageSubscriber } from './artist-image.subscriber';
import { ArtistsService } from './artists.service';
import { Artist } from './entities/artist.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Artist]), StorageModule],
  controllers: [ArtistsController],
  providers: [ArtistsService, ArtistImageSubscriber],
  exports: [ArtistsService],
})
export class ArtistsModule {}
