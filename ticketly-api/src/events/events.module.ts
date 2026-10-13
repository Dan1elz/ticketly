import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ArtistsModule } from '../artists/artists.module';
import { SectorsModule } from '../sectors/sectors.module';
import { EventLineup } from './entities/event-lineup.entity';
import { EventStage } from './entities/event-stage.entity';
import { Event } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Event, EventStage, EventLineup]),
    ArtistsModule,
    SectorsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
