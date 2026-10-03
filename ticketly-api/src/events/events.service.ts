import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import { ArtistsService } from '../artists/artists.service';
import type { Paginated } from '../common/repositories/base.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
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

  async create(dto: CreateEventDto): Promise<Event> {
    const artist = await this.artistsService.findOne(dto.artistId);
    const event = Event.create(dto, artist);

    this.eventRepository.add(event);
    await this.eventRepository.saveChanges();

    return event;
  }

  findAll(query: ListEventsQueryDto): Promise<Paginated<Event>> {
    return this.eventRepository.search(query);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findByIdWithArtist(id);

    if (!event) {
      throw new EventNotFoundException();
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    const artist = dto.artistId
      ? await this.artistsService.findOne(dto.artistId)
      : undefined;

    event.update(dto, artist);

    await this.eventRepository.saveChanges();

    return event;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    this.eventRepository.remove(event);
    await this.eventRepository.saveChanges();
  }
}
