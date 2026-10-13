import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';

import { Event } from '../events/entities/event.entity';
import { EventNotFoundException } from '../events/events.exceptions';
import { EventRepository } from '../events/events.repository';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { Seat } from './entities/seat.entity';
import { Sector } from './entities/sector.entity';
import { SeatRepository } from './seats.repository';
import {
  SectorNameAlreadyExistsException,
  SectorNotFoundException,
} from './sectors.exceptions';
import { SectorRepository } from './sectors.repository';
import type { ISeatCounts } from './sectors.types';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: SectorRepository,
    @InjectRepository(Seat)
    private readonly seatRepository: SeatRepository,
    @InjectRepository(Event)
    private readonly eventRepository: EventRepository,
  ) {}

  async create(eventId: string, dto: CreateSectorDto): Promise<Sector> {
    const event = await this.findEvent(eventId);
    const sector = Sector.create(event, dto);

    this.sectorRepository.add(sector);
    await this.saveChanges();
    await this.loadSeatCounts([sector]);

    return sector;
  }

  async findByEvent(eventId: string): Promise<Sector[]> {
    await this.findEvent(eventId);

    const sectors = await this.sectorRepository.findByEvent(eventId);
    await this.loadSeatCounts(sectors);

    return sectors;
  }

  async findOne(id: string): Promise<Sector> {
    const sector = await this.sectorRepository.findByIdWithEvent(id);

    if (!sector) {
      throw new SectorNotFoundException();
    }

    await this.loadSeatCounts([sector]);

    return sector;
  }

  // Loja (sem login): setor de show não publicado responde 404
  async findByPublishedEvent(eventId: string): Promise<Sector[]> {
    const event = await this.findEvent(eventId);

    if (!event.isPublished) {
      throw new EventNotFoundException();
    }

    return this.findByEvent(eventId);
  }

  async findPublished(id: string): Promise<Sector> {
    const sector = await this.findOne(id);

    if (!sector.event.isPublished) {
      throw new SectorNotFoundException();
    }

    return sector;
  }

  async update(id: string, dto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id);

    sector.update(dto);
    await this.saveChanges();

    return sector;
  }

  async remove(id: string): Promise<void> {
    const sector = await this.findOne(id);

    sector.ensureRemovable();

    this.sectorRepository.remove(sector);
    await this.saveChanges();
  }

  // Usados pelo EventsService (publicar, cancelar e excluir evento)
  countSeatsByEvent(eventId: string): Promise<ISeatCounts> {
    return this.seatRepository.countByEvent(eventId);
  }

  hasSectors(eventId: string): Promise<boolean> {
    return this.sectorRepository.existsByEvent(eventId);
  }

  async loadSeatCounts(sectors: Sector[]): Promise<void> {
    const counts = await this.seatRepository.countBySector(
      sectors.map((sector) => sector.id),
    );

    for (const sector of sectors) {
      const sectorCounts = counts.get(sector.id);
      if (sectorCounts) sector.seatCounts = sectorCounts;
    }
  }

  private async findEvent(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundException();
    }

    return event;
  }

  // O nome é único por evento (UQ event_id, name): quem barra é o banco
  private async saveChanges(): Promise<void> {
    try {
      await this.sectorRepository.saveChanges();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new SectorNameAlreadyExistsException();
      }
      throw error;
    }
  }
}
