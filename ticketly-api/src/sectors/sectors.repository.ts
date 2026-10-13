import { BaseRepository } from '../common/repositories/base.repository';
import { Sector } from './entities/sector.entity';

export class SectorRepository extends BaseRepository<Sector> {
  findByEvent(eventId: string): Promise<Sector[]> {
    return this.find(
      { event: eventId },
      { orderBy: { displayOrder: 'asc', name: 'asc' } },
    );
  }

  // Junto com o evento: quase toda ação no setor precisa saber se o evento
  // foi cancelado
  findByIdWithEvent(id: string): Promise<Sector | null> {
    return this.findOne({ id }, { populate: ['event'] });
  }
}
