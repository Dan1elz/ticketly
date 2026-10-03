import { Migration } from '@mikro-orm/migrations';

export class Migration20261003031230 extends Migration {
  override name = 'Migration20261003031230';

  override up(): void | Promise<void> {
    this.addSql(`create type "event_status" as enum ('DRAFT', 'PUBLISHED');`);
    this.addSql(
      `create type "performance_type" as enum ('HEADLINER', 'SUPPORT', 'DJ');`,
    );
    this.addSql(
      `create type "lineup_status" as enum ('CONFIRMED', 'CANCELLED');`,
    );
    this.addSql(
      `create table "admin_users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(120) not null, "email" varchar(255) not null, "password" varchar(255) not null, "is_active" boolean not null default true, "last_login_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "admin_users" add constraint "admin_users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "artists" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(120) not null, "legal_name" varchar(120) not null, "genre" varchar(50) not null, "bio" varchar(2000) not null, "image_url" text not null, "social_links" jsonb not null, "is_active" boolean not null default true, primary key ("id"));`,
    );

    this.addSql(
      `create table "events" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(160) not null, "venue" varchar(160) not null, "starts_at" timestamptz not null, "status" "event_status" not null default 'DRAFT', primary key ("id"));`,
    );

    this.addSql(
      `create table "event_lineup" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "event_id" uuid not null, "artist_id" uuid not null, "stage" varchar(100) not null default 'Main Stage', "performance_type" "performance_type" not null default 'HEADLINER', "start_time" timestamptz null, "end_time" timestamptz null, "display_order" int not null default 1, "status" "lineup_status" not null default 'CONFIRMED', primary key ("id"));`,
    );
    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_event_id_artist_id_unique" unique ("event_id", "artist_id");`,
    );

    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_event_id_foreign" foreign key ("event_id") references "events" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_artist_id_foreign" foreign key ("artist_id") references "artists" ("id") on delete restrict;`,
    );
  }
}
