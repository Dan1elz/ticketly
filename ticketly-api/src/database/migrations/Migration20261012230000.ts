import { Migration } from '@mikro-orm/migrations';

export class Migration20261012230000 extends Migration {
  override name = 'Migration20261012230000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter type "event_status" add value if not exists 'CANCELLED';`,
    );
  }

  // Postgres não remove valor de enum: recria o tipo sem o CANCELLED.
  // Eventos cancelados voltam pra DRAFT (fora da loja)
  override down(): void | Promise<void> {
    this.addSql(
      `update "events" set "status" = 'DRAFT' where "status" = 'CANCELLED';`,
    );
    this.addSql(`alter table "events" alter column "status" drop default;`);
    this.addSql(`alter type "event_status" rename to "event_status_old";`);
    this.addSql(`create type "event_status" as enum ('DRAFT', 'PUBLISHED');`);
    this.addSql(
      `alter table "events" alter column "status" type "event_status" using ("status"::text::"event_status");`,
    );
    this.addSql(
      `alter table "events" alter column "status" set default 'DRAFT';`,
    );
    this.addSql(`drop type "event_status_old";`);
  }
}
