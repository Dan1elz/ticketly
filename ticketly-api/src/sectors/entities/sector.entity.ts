import { EntityRepositoryType, type Opt, type Rel } from '@mikro-orm/core';
import {
  Check,
  Entity,
  Enum,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import { Event } from '../../events/entities/event.entity';
import { EventCancelledException } from '../../events/events.exceptions';
import type { CreateSectorDto } from '../dto/create-sector.dto';
import type { UpdateSectorDto } from '../dto/update-sector.dto';
import { ESectorType } from '../enums/sector-type.enum';
import { SectorHasSeatsException } from '../sectors.exceptions';
import { SectorRepository } from '../sectors.repository';
import type { ISeatCounts } from '../sectors.types';

@Entity({ tableName: 'sectors', repository: () => SectorRepository })
@Unique({ properties: ['event', 'name'] })
@Check({ name: 'sectors_price_cents_check', expression: 'price_cents >= 0' })
@Check({
  name: 'sectors_max_per_order_check',
  expression: 'max_per_order is null or max_per_order > 0',
})
export class Sector extends BaseEntity {
  [EntityRepositoryType]?: SectorRepository;

  @Property({ type: 'string', length: 100 })
  name: string;

  @Enum({ items: () => ESectorType, nativeEnumName: 'sector_type' })
  type: ESectorType;

  @Property({ type: 'string', length: 500, nullable: true })
  description: string | null = null;

  // Dinheiro sempre em centavos: R$ 150,00 = 15000
  @Property({ type: 'integer' })
  priceCents: number;

  // Cor do setor na loja/admin, no formato #RRGGBB
  @Property({ type: 'string', length: 7 })
  color: string;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  // Máximo de ingressos desse setor num pedido (null = sem limite)
  @Property({ type: 'integer', nullable: true })
  maxPerOrder: number | null = null;

  // Não é coluna: o service preenche com a contagem dos assentos por status
  @Property({ type: 'json', persist: false })
  seatCounts: Opt<ISeatCounts>;

  // RESTRICT: evento com setor não é apagado (o service devolve 409 antes)
  @ManyToOne(() => Event, { deleteRule: 'restrict' })
  event: Rel<Event>;

  get isSeated(): boolean {
    return this.type === ESectorType.SEATED;
  }

  update(data: UpdateSectorDto) {
    this.ensureEventNotCancelled();

    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.priceCents !== undefined) this.priceCents = data.priceCents;
    if (data.color !== undefined) this.color = data.color;
    if (data.displayOrder !== undefined) this.displayOrder = data.displayOrder;
    if (data.maxPerOrder !== undefined) this.maxPerOrder = data.maxPerOrder;
  }

  // Assento nunca é excluído, então setor com assento também não
  ensureRemovable() {
    if (this.seatCounts.total > 0) {
      throw new SectorHasSeatsException();
    }
  }

  // Evento cancelado não muda mais: vale pro setor e pros assentos dele
  ensureEventNotCancelled() {
    if (this.event.isCancelled) {
      throw new EventCancelledException();
    }
  }

  static create(event: Event, data: CreateSectorDto): Sector {
    if (event.isCancelled) {
      throw new EventCancelledException();
    }

    const sector = new Sector();

    sector.event = event;
    sector.name = data.name;
    sector.type = data.type;
    sector.description = data.description;
    sector.priceCents = data.priceCents;
    sector.color = data.color;
    sector.displayOrder = data.displayOrder;
    sector.maxPerOrder = data.maxPerOrder;

    return sector;
  }
}
