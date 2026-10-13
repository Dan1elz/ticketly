import { Migration } from '@mikro-orm/migrations';

export class Migration20261012233000 extends Migration {
  override name = 'Migration20261012233000';

  override up(): void | Promise<void> {
    this.addSql(
      `create type "sector_type" as enum ('SEATED', 'GENERAL_ADMISSION');`,
    );
    this.addSql(
      `create type "seat_status" as enum ('AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'CANCELLED');`,
    );

    this.addSql(
      `create table "sectors" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "event_id" uuid not null, "name" varchar(100) not null, "type" "sector_type" not null, "description" varchar(500) null, "price_cents" int not null, "color" varchar(7) not null, "display_order" int not null default 1, "max_per_order" int null, primary key ("id"), constraint "sectors_price_cents_check" check (price_cents >= 0), constraint "sectors_max_per_order_check" check (max_per_order is null or max_per_order > 0));`,
    );
    this.addSql(
      `alter table "sectors" add constraint "sectors_event_id_name_unique" unique ("event_id", "name");`,
    );
    this.addSql(
      `alter table "sectors" add constraint "sectors_event_id_foreign" foreign key ("event_id") references "events" ("id") on delete restrict;`,
    );

    this.addSql(
      `create table "seats" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "sector_id" uuid not null, "row" varchar(10) null, "number" int not null, "grid_row" int null, "grid_column" int null, "is_accessible" boolean not null default false, "status" "seat_status" not null default 'AVAILABLE', "status_note" varchar(500) null, "status_changed_at" timestamptz null, "status_changed_by_id" uuid null, primary key ("id"), constraint "seats_number_check" check (number > 0), constraint "seats_grid_check" check ((grid_row is null) = (grid_column is null)), constraint "seats_status_note_check" check (status not in ('BLOCKED', 'CANCELLED') or status_note is not null));`,
    );
    this.addSql(
      `alter table "seats" add constraint "seats_sector_id_foreign" foreign key ("sector_id") references "sectors" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "seats" add constraint "seats_status_changed_by_id_foreign" foreign key ("status_changed_by_id") references "admin_users" ("id") on delete set null;`,
    );

    // Únicos parciais (só assento não cancelado), escritos à mão: o @Unique
    // comum do MikroORM não gera WHERE
    this.addSql(
      `create unique index "seats_sector_id_row_number_unique" on "seats" ("sector_id", "row", "number") nulls not distinct where "status" <> 'CANCELLED';`,
    );
    this.addSql(
      `create unique index "seats_sector_id_grid_unique" on "seats" ("sector_id", "grid_row", "grid_column") where "status" <> 'CANCELLED';`,
    );

    // Contagem por status (setor e evento) e reserva da pista (primeiros livres)
    this.addSql(
      `create index "seats_sector_id_status_index" on "seats" ("sector_id", "status");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table "seats";`);
    this.addSql(`drop table "sectors";`);
    this.addSql(`drop type "seat_status";`);
    this.addSql(`drop type "sector_type";`);
  }
}
