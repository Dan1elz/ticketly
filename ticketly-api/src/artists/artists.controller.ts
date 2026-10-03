import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import {
  ArtistInUseException,
  ArtistNotFoundException,
} from './artists.exceptions';
import { ArtistsService } from './artists.service';
import { ArtistListResponseDto } from './dto/artist-list-response.dto';
import { ArtistResponseDto } from './dto/artist-response.dto';
import { CreateArtistDto } from './dto/create-artist.dto';
import { ListArtistsQueryDto } from './dto/list-artists-query.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@ApiTags('artists')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: ArtistResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST)
  create(@Body() dto: CreateArtistDto) {
    return this.artistsService.create(dto);
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ArtistListResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST)
  findAll(@Query() query: ListArtistsQueryDto) {
    return this.artistsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: ArtistResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, ArtistNotFoundException)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: ArtistResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, ArtistNotFoundException)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArtistDto) {
    return this.artistsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    ArtistNotFoundException,
    ArtistInUseException,
  )
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.artistsService.remove(id);
  }
}
