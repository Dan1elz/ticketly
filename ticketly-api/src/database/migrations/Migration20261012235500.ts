import { Migration } from '@mikro-orm/migrations';

export class Migration20261012235500 extends Migration {
  override name = 'Migration20261012235500';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "event_stages" drop constraint "event_stages_event_id_name_unique";`,
    );
    this.addSql(
      `alter table "event_stages" add constraint "event_stages_event_id_name_unique" unique ("event_id", "name") deferrable initially deferred;`,
    );
    this.addSql(
      `alter table "event_lineup" drop constraint "event_lineup_event_id_artist_id_unique";`,
    );
    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_event_id_artist_id_unique" unique ("event_id", "artist_id") deferrable initially deferred;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "event_lineup" drop constraint "event_lineup_event_id_artist_id_unique";`,
    );
    this.addSql(
      `alter table "event_lineup" add constraint "event_lineup_event_id_artist_id_unique" unique ("event_id", "artist_id");`,
    );
    this.addSql(
      `alter table "event_stages" drop constraint "event_stages_event_id_name_unique";`,
    );
    this.addSql(
      `alter table "event_stages" add constraint "event_stages_event_id_name_unique" unique ("event_id", "name");`,
    );
  }
}
