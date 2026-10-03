import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import { ArtistNotFoundException } from '../artists/artists.exceptions';
import { ArtistsService } from '../artists/artists.service';
import { Artist } from '../artists/entities/artist.entity';
import type { Paginated } from '../common/repositories/base.repository';
import { CreateEventDto } from './dto/create-event.dto';
import type { LineupItemDto } from './dto/lineup-item.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import type { LineupEntry } from './entities/event-lineup.entity';
import { Event } from './entities/event.entity';
import { EventNotFoundException } from './events.exceptions';
import { EventRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: EventRepository,
    private readonly artistsService: ArtistsService,
  ) {}

  // Evento, artistas novos e lineup vão no mesmo flush = mesma transação:
  // ou salva tudo, ou nada
  async create(dto: CreateEventDto): Promise<Event> {
    const lineup = await this.resolveLineup(dto.lineup);
    const event = Event.create(dto, lineup);

    this.eventRepository.add(event);
    await this.eventRepository.saveChanges();

    return event;
  }

  findAll(query: ListEventsQueryDto): Promise<Paginated<Event>> {
    return this.eventRepository.search(query);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findByIdWithLineup(id);

    if (!event) {
      throw new EventNotFoundException();
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    const lineup = dto.lineup
      ? await this.resolveLineup(dto.lineup)
      : undefined;

    event.update(dto, lineup);

    await this.eventRepository.saveChanges();

    return event;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    this.eventRepository.remove(event);
    await this.eventRepository.saveChanges();
  }

  // Cada item traz um artistId (busca no banco) ou um artist (cria um novo)
  private async resolveLineup(items: LineupItemDto[]): Promise<LineupEntry[]> {
    const existing = await this.artistsService.findByIds(
      items.flatMap((item) => item.artistId ?? []),
    );
    const artistsById = new Map(existing.map((artist) => [artist.id, artist]));

    return items.map(({ artistId, artist: newArtist, ...data }) => {
      const artist = artistId
        ? artistsById.get(artistId)
        : newArtist && Artist.create(newArtist);

      if (!artist) {
        throw new ArtistNotFoundException();
      }

      return { ...data, artist };
    });
  }
}
