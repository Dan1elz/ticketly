import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';

import { Admin } from '../admins/entities/admin.entity';
import { CreateSeatBlockDto } from './dto/create-seat-block.dto';
import { CreateSeatQuantityDto } from './dto/create-seat-quantity.dto';
import { SeatNoteDto } from './dto/seat-note.dto';
import { Seat } from './entities/seat.entity';
import { Sector } from './entities/sector.entity';
import { SeatRepository } from './seats.repository';
import {
  SeatNotAvailableException,
  SeatNotBlockedException,
  SeatNotFoundException,
  SeatPositionTakenException,
  SectorNotGeneralAdmissionException,
  SectorNotSeatedException,
} from './sectors.exceptions';
import { SectorsService } from './sectors.service';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: SeatRepository,
    private readonly sectorsService: SectorsService,
  ) {}

  // Setor SEATED: gera um retângulo de assentos na grade (ver Seat.createBlock)
  async createBlock(
    sectorId: string,
    dto: CreateSeatBlockDto,
  ): Promise<Sector> {
    const sector = await this.findEditableSector(sectorId);

    if (!sector.isSeated) {
      throw new SectorNotSeatedException();
    }

    const seats = Seat.createBlock(sector, dto);

    await this.ensurePositionsFree(sector, seats);

    return this.addSeats(sector, seats);
  }

  // Setor GENERAL_ADMISSION (pista): só cria mais N ingressos numerados
  async createQuantity(
    sectorId: string,
    dto: CreateSeatQuantityDto,
  ): Promise<Sector> {
    const sector = await this.findEditableSector(sectorId);

    if (sector.isSeated) {
      throw new SectorNotGeneralAdmissionException();
    }

    const firstNumber = (await this.seatRepository.maxNumber(sector.id)) + 1;
    const seats = Seat.createGeneralAdmission(
      sector,
      firstNumber,
      dto.quantity,
    );

    return this.addSeats(sector, seats);
  }

  async findBySector(sectorId: string): Promise<Seat[]> {
    await this.sectorsService.findOne(sectorId);

    return this.seatRepository.findBySector(sectorId);
  }

  // TODO (reserva): o flush faz UPDATE ... WHERE id = ?, sem olhar o status.
  // Se uma reserva pegar o assento entre o findOne e o flush, o bloqueio passa
  // por cima. Quando a reserva existir, trocar por UPDATE condicional
  async block(id: string, dto: SeatNoteDto, admin: Admin): Promise<Seat> {
    const seat = await this.findEditableSeat(id);

    if (!seat.isAvailable) {
      throw new SeatNotAvailableException();
    }

    seat.block(dto.note, admin);
    await this.seatRepository.saveChanges();

    return seat;
  }

  async unblock(id: string, admin: Admin): Promise<Seat> {
    const seat = await this.findEditableSeat(id);

    if (!seat.isBlocked) {
      throw new SeatNotBlockedException();
    }

    seat.unblock(admin);
    await this.seatRepository.saveChanges();

    return seat;
  }

  // Cancelado é definitivo ("criado indevidamente"): libera a fileira/número
  // e o quadradinho pra um assento novo
  async cancel(id: string, dto: SeatNoteDto, admin: Admin): Promise<Seat> {
    const seat = await this.findEditableSeat(id);

    if (!seat.isAvailable) {
      throw new SeatNotAvailableException();
    }

    seat.cancel(dto.note, admin);
    await this.seatRepository.saveChanges();

    return seat;
  }

  private async findEditableSector(id: string): Promise<Sector> {
    const sector = await this.sectorsService.findOne(id);

    this.sectorsService.ensureEventNotCancelled(sector.event);

    return sector;
  }

  private async findEditableSeat(id: string): Promise<Seat> {
    const seat = await this.seatRepository.findByIdWithSector(id);

    if (!seat) {
      throw new SeatNotFoundException();
    }

    this.sectorsService.ensureEventNotCancelled(seat.sector.event);

    return seat;
  }

  // Confere antes pra devolver 409 com mensagem clara. Os índices únicos do
  // banco continuam valendo pra duas requisições ao mesmo tempo (addSeats)
  private async ensurePositionsFree(sector: Sector, seats: Seat[]) {
    const taken = await this.seatRepository.findActiveBySector(sector.id);
    const takenNumbers = new Set(taken.map((s) => `${s.row}-${s.number}`));
    const takenCells = new Set(
      taken.map((s) => `${s.gridRow}-${s.gridColumn}`),
    );

    const conflict = seats.some(
      (s) =>
        takenNumbers.has(`${s.row}-${s.number}`) ||
        takenCells.has(`${s.gridRow}-${s.gridColumn}`),
    );

    if (conflict) {
      throw new SeatPositionTakenException();
    }
  }

  // Todos os assentos num flush só = uma transação: ou cria o bloco inteiro,
  // ou nenhum
  private async addSeats(sector: Sector, seats: Seat[]): Promise<Sector> {
    this.seatRepository.add(seats);

    try {
      await this.seatRepository.saveChanges();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new SeatPositionTakenException();
      }
      throw error;
    }

    await this.sectorsService.loadSeatCounts([sector]);

    return sector;
  }
}
