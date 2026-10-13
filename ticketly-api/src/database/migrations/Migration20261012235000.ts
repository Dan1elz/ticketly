import { Migration } from '@mikro-orm/migrations';

export class Migration20261012235000 extends Migration {
  override name = 'Migration20261012235000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "event_stages" add column "description" varchar(500) null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "event_stages" drop column "description";`);
  }
}
