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
import { ArtistNotFoundException } from '../artists/artists.exceptions';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { EventListResponseDto } from './dto/event-list-response.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventNotFoundException } from './events.exceptions';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: EventResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, ArtistNotFoundException)
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: EventListResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST)
  findAll(@Query() query: ListEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: EventResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, EventNotFoundException)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: EventResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    EventNotFoundException,
    ArtistNotFoundException,
  )
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrors(HttpStatus.BAD_REQUEST, EventNotFoundException)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
