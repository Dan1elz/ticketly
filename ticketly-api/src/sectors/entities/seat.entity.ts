import { EntityRepositoryType, type Opt, type Rel } from '@mikro-orm/core';
import {
  Check,
  Entity,
  Enum,
  Index,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Admin } from '../../admins/entities/admin.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { ESeatStatus } from '../enums/seat-status.enum';
import { SeatRepository } from '../seats.repository';
import type { ISeatBlockData, ISeatData } from '../sectors.types';
import { Sector } from './sector.entity';

// Os dois únicos só valem pra assento não cancelado: assim dá pra recriar um
// assento cancelado por engano. NULLS NOT DISTINCT faz o row vazio da pista
// contar como igual (sem ele daria pra ter dois "Pista 5")
@Entity({ tableName: 'seats', repository: () => SeatRepository })
@Unique({
  name: 'seats_sector_id_row_number_unique',
  expression: `create unique index "seats_sector_id_row_number_unique" on "seats" ("sector_id", "row", "number") nulls not distinct where "status" <> 'CANCELLED'`,
})
@Unique({
  name: 'seats_sector_id_grid_unique',
  expression: `create unique index "seats_sector_id_grid_unique" on "seats" ("sector_id", "grid_row", "grid_column") where "status" <> 'CANCELLED'`,
})
@Index({
  name: 'seats_sector_id_status_index',
  properties: ['sector', 'status'],
})
@Check({ name: 'seats_number_check', expression: 'number > 0' })
@Check({
  name: 'seats_grid_check',
  expression: '(grid_row is null) = (grid_column is null)',
})
@Check({
  name: 'seats_status_note_check',
  expression: `status not in ('BLOCKED', 'CANCELLED') or status_note is not null`,
})
export class Seat extends BaseEntity {
  [EntityRepositoryType]?: SeatRepository;

  // RESTRICT: assento nunca some, então setor com assento não é apagado
  @ManyToOne(() => Sector, { deleteRule: 'restrict' })
  sector: Rel<Sector>;

  // Fileira ("A", "B"...). Null na pista
  @Property({ type: 'string', length: 10, nullable: true })
  row: string | null = null;

  @Property({ type: 'integer' })
  number: number;

  // Posição do quadradinho na grade do admin/loja. Null na pista
  @Property({ type: 'integer', nullable: true })
  gridRow: number | null = null;

  @Property({ type: 'integer', nullable: true })
  gridColumn: number | null = null;

  @Property({ type: 'boolean', default: false })
  isAccessible: Opt<boolean> = false;

  @Enum({
    items: () => ESeatStatus,
    nativeEnumName: 'seat_status',
    default: ESeatStatus.AVAILABLE,
  })
  status: Opt<ESeatStatus> = ESeatStatus.AVAILABLE;

  // Motivo do bloqueio/cancelamento (obrigatório nesses dois status)
  @Property({ type: 'string', length: 500, nullable: true })
  statusNote: Opt<string> | null = null;

  @Property({ type: 'datetime', nullable: true })
  statusChangedAt: Opt<Date> | null = null;

  // Admin que mudou o status por último. Apagou o admin, fica null
  @ManyToOne(() => Admin, { nullable: true, deleteRule: 'set null' })
  statusChangedBy: Opt<Admin> | null = null;

  get isAvailable(): boolean {
    return this.status === ESeatStatus.AVAILABLE;
  }

  get isBlocked(): boolean {
    return this.status === ESeatStatus.BLOCKED;
  }

  block(note: string, admin: Admin) {
    this.changeStatus(ESeatStatus.BLOCKED, note, admin);
  }

  unblock(admin: Admin) {
    this.changeStatus(ESeatStatus.AVAILABLE, null, admin);
  }

  cancel(note: string, admin: Admin) {
    this.changeStatus(ESeatStatus.CANCELLED, note, admin);
  }

  private changeStatus(status: ESeatStatus, note: string | null, admin: Admin) {
    this.status = status;
    this.statusNote = note;
    this.statusChangedAt = new Date();
    this.statusChangedBy = admin;
  }

  static create(sector: Sector, data: ISeatData): Seat {
    const seat = new Seat();

    seat.sector = sector;
    seat.row = data.row;
    seat.number = data.number;
    seat.gridRow = data.gridRow;
    seat.gridColumn = data.gridColumn;
    seat.isAccessible = data.isAccessible;

    return seat;
  }

  // Setor SEATED: um retângulo da grade. Cada fileira vira uma linha e cada
  // número uma coluna. Ex: rows ["A","B"], números 1..10, começando na linha 1
  // e coluna 3 → A1 em (1,3), A10 em (1,12), B1 em (2,3)
  static createBlock(sector: Sector, block: ISeatBlockData): Seat[] {
    const seats: Seat[] = [];

    block.rows.forEach((row, rowIndex) => {
      for (
        let number = block.numberStart;
        number <= block.numberEnd;
        number++
      ) {
        seats.push(
          Seat.create(sector, {
            row,
            number,
            gridRow: block.gridRowStart + rowIndex,
            gridColumn: block.gridColumnStart + (number - block.numberStart),
            isAccessible: block.isAccessible,
          }),
        );
      }
    });

    return seats;
  }

  // Setor GENERAL_ADMISSION (pista): só ingressos numerados, sem fileira nem grade
  static createGeneralAdmission(
    sector: Sector,
    firstNumber: number,
    quantity: number,
  ): Seat[] {
    const seats: Seat[] = [];

    for (let number = firstNumber; number < firstNumber + quantity; number++) {
      seats.push(
        Seat.create(sector, {
          row: null,
          number,
          gridRow: null,
          gridColumn: null,
          isAccessible: false,
        }),
      );
    }

    return seats;
  }
}
