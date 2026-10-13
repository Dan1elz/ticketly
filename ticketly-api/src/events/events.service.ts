import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import {
  ArtistInactiveException,
  ArtistNotFoundException,
} from '../artists/artists.exceptions';
import { ArtistsService } from '../artists/artists.service';
import { Artist } from '../artists/entities/artist.entity';
import type { IPaginated } from '../common/repositories/base.repository';
import { CreateEventDto } from './dto/create-event.dto';
import type { LineupItemDto } from './dto/lineup-item.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import type { ILineupEntry } from './events.types';
import { Event } from './entities/event.entity';
import {
  EventCancelledException,
  EventNotFoundException,
  StageInUseException,
  StageNotFoundException,
} from './events.exceptions';
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
    const event = Event.create(dto, dto.stages, lineup);

    this.eventRepository.add(event);
    await this.eventRepository.saveChanges();

    return event;
  }

  findAll(query: ListEventsQueryDto): Promise<IPaginated<Event>> {
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

    if (event.isCancelled) {
      throw new EventCancelledException();
    }

    this.ensureStagesMatchLineup(event, dto);

    const currentArtistIds = new Set(
      event.lineup.getItems().map((item) => item.artist.id),
    );
    const lineup = dto.lineup
      ? await this.resolveLineup(dto.lineup, currentArtistIds)
      : undefined;

    event.update(dto, dto.stages, lineup);

    await this.eventRepository.saveChanges();

    return event;
  }

  // TODO (setores): recusar (409) se houver assento SOLD ou RESERVED
  async cancel(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.isCancelled) {
      throw new EventCancelledException();
    }

    event.cancel();
    await this.eventRepository.saveChanges();

    return event;
  }

  // TODO (setores): evento com setores não é excluído, só cancelado (409)
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    this.eventRepository.remove(event);
    await this.eventRepository.saveChanges();
  }

  // Com as duas listas no PATCH, o DTO já conferiu. Com só uma, a outra vem do
  // banco: lineup novo precisa usar palcos que existem, e palco que saiu da
  // lista não pode estar no lineup atual
  private ensureStagesMatchLineup(event: Event, dto: UpdateEventDto) {
    if (dto.lineup && !dto.stages) {
      const names = event.stageNames();

      if (dto.lineup.some((item) => !names.has(item.stage))) {
        throw new StageNotFoundException();
      }
    }

    if (dto.stages && !dto.lineup) {
      const names = new Set(dto.stages.map((stage) => stage.name));
      const inUse = event.lineup
        .getItems()
        .some((item) => !names.has(item.stage.name));

      if (inUse) {
        throw new StageInUseException();
      }
    }
  }

  // Cada item traz um artistId (busca no banco) ou um artist (cria um novo).
  // Artista desativado não entra em evento, mas continua nos que já estava
  private async resolveLineup(
    items: LineupItemDto[],
    currentArtistIds = new Set<string>(),
  ): Promise<ILineupEntry[]> {
    const [existing] = await Promise.all([
      this.artistsService.findByIds(
        items.flatMap((item) => item.artistId ?? []),
      ),
      ...items.flatMap((item) =>
        item.artist
          ? [this.artistsService.ensureImageExists(item.artist.imageKey)]
          : [],
      ),
    ]);
    const artistsById = new Map(existing.map((artist) => [artist.id, artist]));

    return items.map(({ artistId, artist: newArtist, ...data }) => {
      const artist = artistId
        ? artistsById.get(artistId)
        : newArtist && Artist.create(newArtist);

      if (!artist) {
        throw new ArtistNotFoundException();
      }

      if (!artist.isActive && !currentArtistIds.has(artist.id)) {
        throw new ArtistInactiveException();
      }

      return { ...data, artist };
    });
  }
}
