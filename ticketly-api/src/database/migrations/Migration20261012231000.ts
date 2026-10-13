import { Migration } from '@mikro-orm/migrations';

export class Migration20261012231000 extends Migration {
  override name = 'Migration20261012231000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "event_stages" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "event_id" uuid not null, "name" varchar(100) not null, "display_order" int not null default 1, primary key ("id"));`,
    );
    this.addSql(
      `alter table "event_stages" add constraint "event_stages_event_id_name_unique" unique ("event_id", "name");`,
    );
    this.addSql(
      `alter table "event_stages" add constraint "event_stages_event_id_foreign" foreign key ("event_id") references "events" ("id") on delete cascade;`,
    );

    // Um palco por texto distinto de cada evento, na ordem em que aparece no lineup
    this.addSql(
      `insert into "event_stages" ("id", "created_at", "updated_at", "event_id", "name", "display_order")
       select gen_random_uuid(), now(), now(), "event_id", "stage",
              row_number() over (partition by "event_id" order by min("display_order"), "stage")
       from "event_lineup"
       group by "event_id", "stage";`,
    );

    this.addSql(`alter table "event_lineup" add column "stage_id" uuid null;`);
    this.addSql(
      `update "event_lineup" l set "stage_id" = s."id"
       from "event_stages" s
       where s."event_id" = l."event_id" and s."name" = l."stage";`,
    );
    this.addSql(
      `alter table "event_lineup" alter column "stage_id" set not null;`,
    );
    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_stage_id_foreign" foreign key ("stage_id") references "event_stages" ("id") on delete restrict;`,
    );
    this.addSql(`alter table "event_lineup" drop column "stage";`);
  }

  // Volta o nome do palco pro texto no lineup (palco sem artista se perde)
  override down(): void | Promise<void> {
    this.addSql(
      `alter table "event_lineup" add column "stage" varchar(100) not null default 'Main Stage';`,
    );
    this.addSql(
      `update "event_lineup" l set "stage" = s."name"
       from "event_stages" s
       where s."id" = l."stage_id";`,
    );
    this.addSql(
      `alter table "event_lineup" drop constraint "event_lineup_stage_id_foreign";`,
    );
    this.addSql(`alter table "event_lineup" drop column "stage_id";`);
    this.addSql(`drop table "event_stages";`);
  }
}
