import { Migration } from '@mikro-orm/migrations';

export class Migration20261009190000 extends Migration {
  override name = 'Migration20261009190000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "artists" rename column "image_url" to "image_key";`,
    );
    this.addSql(
      `alter table "artists" alter column "image_key" type varchar(255) using left("image_key", 255);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "artists" alter column "image_key" type text using ("image_key"::text);`,
    );
    this.addSql(
      `alter table "artists" rename column "image_key" to "image_url";`,
    );
  }
}
