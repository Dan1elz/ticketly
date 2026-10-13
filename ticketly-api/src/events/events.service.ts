import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';

import {
  ArtistInactiveException,
  ArtistNotFoundException,
} from '../artists/artists.exceptions';
import { ArtistsService } from '../artists/artists.service';
import type { IPaginated } from '../common/repositories/base.repository';
import { SectorsService } from '../sectors/sectors.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { EventLineupRequestDto } from './dto/event-lineup-request.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EEventStatus } from './enums/event-status.enum';
import { Event } from './entities/event.entity';
import {
  EventCancelledException,
  EventConflictException,
  EventHasActiveSeatsException,
  EventHasSectorsException,
  EventNotFoundException,
  EventWithoutAvailableSeatsException,
} from './events.exceptions';
import { EventRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: EventRepository,
    private readonly artistsService: ArtistsService,
    private readonly sectorsService: SectorsService,
  ) {}

  // Evento, palcos e lineup vão no mesmo flush = mesma transação:
  // ou salva tudo, ou nada
  async create(dto: CreateEventDto): Promise<Event> {
    await this.ensureArtistsAvailable(dto.lineup);

    const event = Event.create(dto);

    this.eventRepository.add(event);
    await this.saveChanges();

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

  // Loja (sem login): só shows publicados, qualquer que seja o filtro pedido
  findAllPublished(query: ListEventsQueryDto): Promise<IPaginated<Event>> {
    return this.eventRepository.search({
      ...query,
      status: EEventStatus.PUBLISHED,
    });
  }

  // Loja: rascunho e cancelado respondem 404, como se não existissem
  async findPublished(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (!event.isPublished) {
      throw new EventNotFoundException();
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    if (event.isCancelled) {
      throw new EventCancelledException();
    }

    if (dto.status === EEventStatus.PUBLISHED && !event.isPublished) {
      await this.ensureHasAvailableSeats(event.id);
    }

    if (dto.lineup) {
      const currentArtistIds = new Set(
        event.lineup.getItems().map((item) => item.artist.id),
      );

      await this.ensureArtistsAvailable(dto.lineup, currentArtistIds);
    }

    event.update(dto);

    await this.saveChanges();

    return event;
  }

  // Com assento vendido ou reservado não cancela: alguém pagou (ou está
  // pagando). Na prática: volta pra DRAFT, espera as reservas expirarem e cancela
  async cancel(id: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.isCancelled) {
      throw new EventCancelledException();
    }

    const seats = await this.sectorsService.countSeatsByEvent(event.id);

    if (seats.SOLD > 0 || seats.RESERVED > 0) {
      throw new EventHasActiveSeatsException();
    }

    event.cancel();
    await this.eventRepository.saveChanges();

    return event;
  }

  // Evento com setores não é excluído, só cancelado: setor leva a assento, e
  // assento nunca some (é histórico dos pedidos)
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    if (await this.sectorsService.hasSectors(event.id)) {
      throw new EventHasSectorsException();
    }

    this.eventRepository.remove(event);
    await this.eventRepository.saveChanges();
  }

  // Publicar = aparecer na loja: precisa ter pelo menos um ingresso à venda
  private async ensureHasAvailableSeats(eventId: string) {
    const seats = await this.sectorsService.countSeatsByEvent(eventId);

    if (seats.AVAILABLE === 0) {
      throw new EventWithoutAvailableSeatsException();
    }
  }

  // Todo artista do lineup tem que existir. Artista desativado não entra em
  // evento, mas continua nos que já estava
  private async ensureArtistsAvailable(
    items: EventLineupRequestDto[],
    currentArtistIds = new Set<string>(),
  ) {
    const artists = await this.artistsService.findByIds(
      items.map((item) => item.artistId),
    );
    const artistsById = new Map(artists.map((artist) => [artist.id, artist]));

    for (const { artistId } of items) {
      const artist = artistsById.get(artistId);

      if (!artist) {
        throw new ArtistNotFoundException();
      }

      if (!artist.isActive && !currentArtistIds.has(artistId)) {
        throw new ArtistInactiveException();
      }
    }
  }

  // O id de palco e de lineup vem do front: um id que já existe em outro
  // evento (ou nome/artista repetido) é barrado pelos únicos do banco
  private async saveChanges(): Promise<void> {
    try {
      await this.eventRepository.saveChanges();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new EventConflictException();
      }
      throw error;
    }
  }
}
