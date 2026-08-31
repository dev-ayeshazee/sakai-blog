import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1735000000000 implements MigrationInterface {
  name = 'Init1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" citext NOT NULL,
        "name" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "excerpt" character varying(220) NOT NULL,
        "tags" text array NOT NULL DEFAULT '{}',
        "author_id" uuid NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_author_id" ON "posts" ("author_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_published_at" ON "posts" ("published_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD CONSTRAINT "FK_posts_author_id"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_author_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_posts_published_at"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_author_id"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP INDEX "UQ_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
