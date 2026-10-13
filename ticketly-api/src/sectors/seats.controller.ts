import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { Admin } from '../admins/entities/admin.entity';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import { EventCancelledException } from '../events/events.exceptions';
import { CreateSeatBlockDto } from './dto/create-seat-block.dto';
import { CreateSeatQuantityDto } from './dto/create-seat-quantity.dto';
import { SeatNoteDto } from './dto/seat-note.dto';
import { SeatResponseDto } from './dto/seat-response.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { SeatsService } from './seats.service';
import {
  SeatNotAvailableException,
  SeatNotBlockedException,
  SeatNotFoundException,
  SeatPositionTakenException,
  SectorNotFoundException,
  SectorNotGeneralAdmissionException,
  SectorNotSeatedException,
} from './sectors.exceptions';

// Assento nunca é excluído nem recebe PATCH { status }: cada mudança é uma
// ação com nome (block, unblock, cancel), que registra quem fez e quando
@ApiTags('seats')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller()
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  // Devolve o setor com as contagens novas (o bloco pode ter milhares de assentos)
  @Post('sectors/:sectorId/seats/grid')
  @ZodResponse({ status: HttpStatus.CREATED, type: SectorResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SectorNotFoundException,
    SectorNotSeatedException,
    EventCancelledException,
    SeatPositionTakenException,
  )
  createBlock(
    @Param('sectorId', ParseUUIDPipe) sectorId: string,
    @Body() dto: CreateSeatBlockDto,
  ) {
    return this.seatsService.createBlock(sectorId, dto);
  }

  @Post('sectors/:sectorId/seats/quantity')
  @ZodResponse({ status: HttpStatus.CREATED, type: SectorResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SectorNotFoundException,
    SectorNotGeneralAdmissionException,
    EventCancelledException,
  )
  createQuantity(
    @Param('sectorId', ParseUUIDPipe) sectorId: string,
    @Body() dto: CreateSeatQuantityDto,
  ) {
    return this.seatsService.createQuantity(sectorId, dto);
  }

  @Get('sectors/:sectorId/seats')
  @ZodResponse({ status: HttpStatus.OK, type: [SeatResponseDto] })
  @ApiErrors(HttpStatus.BAD_REQUEST, SectorNotFoundException)
  findBySector(@Param('sectorId', ParseUUIDPipe) sectorId: string) {
    return this.seatsService.findBySector(sectorId);
  }

  @Post('seats/:id/block')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: SeatResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SeatNotFoundException,
    EventCancelledException,
    SeatNotAvailableException,
  )
  block(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SeatNoteDto,
    @CurrentAdmin() admin: Admin,
  ) {
    return this.seatsService.block(id, dto, admin);
  }

  @Post('seats/:id/unblock')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: SeatResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SeatNotFoundException,
    EventCancelledException,
    SeatNotBlockedException,
  )
  unblock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: Admin,
  ) {
    return this.seatsService.unblock(id, admin);
  }

  @Post('seats/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: SeatResponseDto })
  @ApiErrors(
    HttpStatus.BAD_REQUEST,
    SeatNotFoundException,
    EventCancelledException,
    SeatNotAvailableException,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SeatNoteDto,
    @CurrentAdmin() admin: Admin,
  ) {
    return this.seatsService.cancel(id, dto, admin);
  }
}
