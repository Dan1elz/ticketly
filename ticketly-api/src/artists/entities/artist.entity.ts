import { EntityRepositoryType, type Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import { ArtistRepository } from '../artists.repository';
import type { CreateArtistDto, SocialLinks } from '../dto/create-artist.dto';
import type { UpdateArtistDto } from '../dto/update-artist.dto';

@Entity({ tableName: 'artists', repository: () => ArtistRepository })
export class Artist extends BaseEntity {
  [EntityRepositoryType]?: ArtistRepository;

  @Property({ type: 'string', length: 120 })
  name: string;

  @Property({ type: 'string', length: 120 })
  legalName: string;

  @Property({ type: 'string', length: 50 })
  genre: string;

  @Property({ type: 'string', length: 2000 })
  bio: string;

  @Property({ type: 'text' })
  imageUrl: string;

  @Property({ type: 'json' })
  socialLinks: Opt<SocialLinks> = {};

  @Property({ type: 'boolean', default: true })
  isActive: Opt<boolean> = true;

  update(data: UpdateArtistDto) {
    if (data.name !== undefined) this.name = data.name;
    if (data.legalName !== undefined) this.legalName = data.legalName;
    if (data.genre !== undefined) this.genre = data.genre;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl;
    if (data.socialLinks !== undefined) this.socialLinks = data.socialLinks;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  static create(data: CreateArtistDto): Artist {
    const artist = new Artist();

    artist.name = data.name;
    artist.legalName = data.legalName;
    artist.genre = data.genre;
    artist.bio = data.bio;
    artist.imageUrl = data.imageUrl;
    artist.socialLinks = data.socialLinks;

    return artist;
  }
}
