import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Event } from '../events/entities/event.entity';
import { Seat } from './entities/seat.entity';
import { Sector } from './entities/sector.entity';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';

// Setores e assentos no mesmo módulo: um não existe sem o outro.
// Event entra no forFeature só pra ler o evento (sem importar o EventsModule,
// que é quem importa este módulo)
@Module({
  imports: [MikroOrmModule.forFeature([Sector, Seat, Event])],
  controllers: [SectorsController, SeatsController],
  providers: [SectorsService, SeatsService],
  exports: [SectorsService],
})
export class SectorsModule {}
