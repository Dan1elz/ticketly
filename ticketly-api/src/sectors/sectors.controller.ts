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
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { Admin } from '../admins/entities/admin.entity';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import {
  EventCancelledException,
  EventNotFoundException,
} from '../events/events.exceptions';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import {
  SectorHasSeatsException,
  SectorNameAlreadyExistsException,
  SectorNotFoundException,
} from './sectors.exceptions';
import { SectorsService } from './sectors.service';

// Sem prefixo no @Controller: criar e listar ficam debaixo do evento
// (/events/:eventId/sectors), o resto direto em /sectors/:id.
// GET são públicos: sem token (loja) só setores de show publicado
@ApiTags('sectors')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller()
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Post('events/:eventId/sectors')
  @ZodResponse({ status: HttpStatus.CREATED, type: SectorResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    EventNotFoundException,
    EventCancelledException,
    SectorNameAlreadyExistsException,
  )
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateSectorDto,
  ) {
    return this.sectorsService.create(eventId, dto);
  }

  @Get('events/:eventId/sectors')
  @ZodResponse({ status: HttpStatus.OK, type: [SectorResponseDto] })
  @Public()
  @ApiErrors(HttpStatus.BAD_REQUEST, EventNotFoundException)
  findByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentAdmin() admin: Admin | undefined,
  ) {
    return admin
      ? this.sectorsService.findByEvent(eventId)
      : this.sectorsService.findByPublishedEvent(eventId);
  }

  @Get('sectors/:id')
  @ZodResponse({ status: HttpStatus.OK, type: SectorResponseDto })
  @Public()
  @ApiErrors(HttpStatus.BAD_REQUEST, SectorNotFoundException)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: Admin | undefined,
  ) {
    return admin
      ? this.sectorsService.findOne(id)
      : this.sectorsService.findPublished(id);
  }

  @Patch('sectors/:id')
  @ZodResponse({ status: HttpStatus.OK, type: SectorResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SectorNotFoundException,
    EventCancelledException,
    SectorNameAlreadyExistsException,
  )
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSectorDto) {
    return this.sectorsService.update(id, dto);
  }

  @Delete('sectors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SectorNotFoundException,
    SectorHasSeatsException,
  )
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.sectorsService.remove(id);
  }
}
