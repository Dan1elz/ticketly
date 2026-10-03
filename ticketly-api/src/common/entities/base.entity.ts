import { randomUUID } from 'node:crypto';
import type { Opt } from '@mikro-orm/core';
import { PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Colunas que toda tabela do Ticketly tem. As entidades herdam daqui:
 * `export class Admin extends BaseEntity { ... }`
 *
 * `abstract` + sem @Entity(): essa classe não vira tabela, só "empresta"
 * as colunas pras filhas.
 */
export abstract class BaseEntity {
  // UUID gerado no Node (não no banco): o id já existe antes do flush(),
  // então dá pra usar ele (ex: num evento da outbox) antes de salvar
  @PrimaryKey({ type: 'uuid' })
  id: Opt<string> = randomUUID();

  @Property({ type: 'datetime' })
  createdAt: Opt<Date> = new Date();

  // onUpdate: o MikroORM atualiza sozinho a cada flush() que alterar a linha
  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Opt<Date> = new Date();
}
