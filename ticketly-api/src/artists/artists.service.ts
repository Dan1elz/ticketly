import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import type { Paginated } from '../common/repositories/base.repository';
import { ArtistNotFoundException } from './artists.exceptions';
import { ArtistRepository } from './artists.repository';
import { CreateArtistDto } from './dto/create-artist.dto';
import { ListArtistsQueryDto } from './dto/list-artists-query.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Artist } from './entities/artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: ArtistRepository,
  ) {}

  async create(dto: CreateArtistDto): Promise<Artist> {
    const artist = Artist.create(dto);

    this.artistRepository.add(artist);
    await this.artistRepository.saveChanges();

    return artist;
  }

  findAll(query: ListArtistsQueryDto): Promise<Paginated<Artist>> {
    return this.artistRepository.search(query);
  }

  async findOne(id: string): Promise<Artist> {
    const artist = await this.artistRepository.findById(id);

    if (!artist) {
      throw new ArtistNotFoundException();
    }

    return artist;
  }

  async update(id: string, dto: UpdateArtistDto): Promise<Artist> {
    const artist = await this.findOne(id);

    artist.update(dto);

    await this.artistRepository.saveChanges();

    return artist;
  }

  async remove(id: string): Promise<void> {
    const artist = await this.findOne(id);

    this.artistRepository.remove(artist);
    await this.artistRepository.saveChanges();
  }
}
