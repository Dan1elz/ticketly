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
import {
  ArtistImageNotFoundException,
  ArtistInactiveException,
  ArtistNotFoundException,
} from '../artists/artists.exceptions';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { EventListResponseDto } from './dto/event-list-response.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  EventCancelledException,
  EventNotFoundException,
  StageInUseException,
  StageNotFoundException,
} from './events.exceptions';
import { EventsService } from './events.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('events')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: EventResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    ArtistNotFoundException,
    ArtistInactiveException,
    ArtistImageNotFoundException,
  )
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: EventListResponseDto })
  @Public()
  @ApiErrors(HttpStatus.BAD_REQUEST)
  findAll(@Query() query: ListEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: EventResponseDto })
  @Public()
  @ApiErrors(HttpStatus.BAD_REQUEST, EventNotFoundException)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: EventResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    EventNotFoundException,
    EventCancelledException,
    StageNotFoundException,
    StageInUseException,
    ArtistNotFoundException,
    ArtistInactiveException,
    ArtistImageNotFoundException,
  )
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: EventResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    EventNotFoundException,
    EventCancelledException,
  )
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrors(HttpStatus.BAD_REQUEST, EventNotFoundException)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
