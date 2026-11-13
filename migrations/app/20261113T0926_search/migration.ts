#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3fbb682a1785fb1cc080b64270d39e7c8192be27a41cab8bca3b64681d683e0d/contract';
import endContract from '../../snapshots/3fbb682a1785fb1cc080b64270d39e7c8192be27a41cab8bca3b64681d683e0d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cbe3198758045d5df1026d4166200bcb5d68598ebdcac6491c5387b367492bb4/contract';
import startContract from '../../snapshots/cbe3198758045d5df1026d4166200bcb5d68598ebdcac6491c5387b367492bb4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'command',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`uuidv7()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('is_builtin', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('language', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('synonyms', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'command',
        constraint: 'command_language_action_key',
        columns: ['language', 'action'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'command',
        index: 'command_search_en_00ead116',
        expression: sql`(setweight(to_tsvector('english', coalesce("label", '')), 'A') || setweight(to_tsvector('english', coalesce("synonyms", '')), 'B'))`,
        extras: { type: 'gin', where: sql`language = 'en'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'command',
        index: 'command_search_fi_01626d12',
        expression: sql`(setweight(to_tsvector('finnish', coalesce("label", '')), 'A') || setweight(to_tsvector('finnish', coalesce("synonyms", '')), 'B'))`,
        extras: { type: 'gin', where: sql`language = 'fi'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_search_en_62b430ca',
        expression: sql`(setweight(to_tsvector('english', coalesce("name", '')), 'A') || setweight(to_tsvector('english', coalesce("tagline", '')), 'B') || setweight(to_tsvector('english', coalesce("description", '')), 'C') || setweight(to_tsvector('english', coalesce("fluff_text", '')), 'D'))`,
        extras: { type: 'gin', where: sql`language = 'en'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_search_fi_85cd72f4',
        expression: sql`(setweight(to_tsvector('finnish', coalesce("name", '')), 'A') || setweight(to_tsvector('finnish', coalesce("tagline", '')), 'B') || setweight(to_tsvector('finnish', coalesce("description", '')), 'C') || setweight(to_tsvector('finnish', coalesce("fluff_text", '')), 'D'))`,
        extras: { type: 'gin', where: sql`language = 'fi'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_search_other_d4fec3bd',
        expression: sql`(setweight(to_tsvector('simple', coalesce("name", '')), 'A') || setweight(to_tsvector('simple', coalesce("tagline", '')), 'B') || setweight(to_tsvector('simple', coalesce("description", '')), 'C') || setweight(to_tsvector('simple', coalesce("fluff_text", '')), 'D'))`,
        extras: { type: 'gin', where: sql`language = 'OTHER'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_search_sv_bc657d4d',
        expression: sql`(setweight(to_tsvector('swedish', coalesce("name", '')), 'A') || setweight(to_tsvector('swedish', coalesce("tagline", '')), 'B') || setweight(to_tsvector('swedish', coalesce("description", '')), 'C') || setweight(to_tsvector('swedish', coalesce("fluff_text", '')), 'D'))`,
        extras: { type: 'gin', where: sql`language = 'sv'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'page',
        index: 'page_search_en_63313553',
        expression: sql`(setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("ingress", '')), 'B') || setweight(to_tsvector('english', coalesce("content", '')), 'C'))`,
        extras: { type: 'gin', where: sql`language = 'en'` },
      }),
      this.createIndex({
        schema: 'public',
        table: 'page',
        index: 'page_search_fi_1c3e666f',
        expression: sql`(setweight(to_tsvector('finnish', coalesce("title", '')), 'A') || setweight(to_tsvector('finnish', coalesce("ingress", '')), 'B') || setweight(to_tsvector('finnish', coalesce("content", '')), 'C'))`,
        extras: { type: 'gin', where: sql`language = 'fi'` },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
