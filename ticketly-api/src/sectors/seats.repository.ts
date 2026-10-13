import { BaseRepository } from '../common/repositories/base.repository';
import { Seat } from './entities/seat.entity';
import { ESeatStatus } from './enums/seat-status.enum';
import type { ISeatCounts } from './sectors.types';

export class SeatRepository extends BaseRepository<Seat> {
  // Junto com setor e evento: evento cancelado não deixa mudar o assento
  findByIdWithSector(id: string): Promise<Seat | null> {
    return this.findOne(
      { id },
      { populate: ['sector.event', 'statusChangedBy'] },
    );
  }

  // Grade: linha por linha, da esquerda pra direita. Pista: pelo número
  findBySector(sectorId: string): Promise<Seat[]> {
    return this.find(
      { sector: sectorId },
      {
        populate: ['statusChangedBy'],
        orderBy: {
          gridRow: 'asc',
          gridColumn: 'asc',
          row: 'asc',
          number: 'asc',
        },
      },
    );
  }

  // Assentos que ainda ocupam fileira/número/quadradinho (cancelado não ocupa)
  findActiveBySector(sectorId: string): Promise<Seat[]> {
    return this.find({
      sector: sectorId,
      status: { $ne: ESeatStatus.CANCELLED },
    });
  }

  // Maior número já usado no setor (conta os cancelados, pra não repetir
  // número na pista). 0 se o setor não tem assento
  async maxNumber(sectorId: string): Promise<number> {
    const last = await this.findOne(
      { sector: sectorId },
      { orderBy: { number: 'desc' } },
    );

    return last?.number ?? 0;
  }

  // countBy faz o GROUP BY no banco: volta só a contagem, sem carregar os
  // assentos (podem ser dezenas de milhares por evento)
  async countBySector(sectorIds: string[]): Promise<Map<string, ISeatCounts>> {
    // Começa tudo zerado: setor sem assento não volta do banco
    const countsBySector = new Map<string, ISeatCounts>();
    for (const sectorId of sectorIds) {
      countsBySector.set(sectorId, emptyCounts());
    }

    if (sectorIds.length === 0) return countsBySector;

    // Agrupando por dois campos, a chave vem junta:
    // { 'id-do-setor~~~AVAILABLE': 5, 'id-do-setor~~~BLOCKED': 1 }
    const result = await this.em.countBy(Seat, ['sector', 'status'], {
      where: { sector: { $in: sectorIds } },
    });

    for (const [key, quantity] of Object.entries(result)) {
      const [sectorId, status] = key.split('~~~') as [string, ESeatStatus];
      const counts = countsBySector.get(sectorId)!;

      counts[status] += quantity;
      counts.total += quantity;
    }

    return countsBySector;
  }

  async countByEvent(eventId: string): Promise<ISeatCounts> {
    const counts = emptyCounts();

    // { AVAILABLE: 10, SOLD: 2 }
    const result = await this.em.countBy(Seat, 'status', {
      where: { sector: { event: eventId } },
    });

    for (const [key, quantity] of Object.entries(result)) {
      const status = key as ESeatStatus;

      counts[status] += quantity;
      counts.total += quantity;
    }

    return counts;
  }
}

function emptyCounts(): ISeatCounts {
  return {
    AVAILABLE: 0,
    RESERVED: 0,
    SOLD: 0,
    BLOCKED: 0,
    CANCELLED: 0,
    total: 0,
  };
}
