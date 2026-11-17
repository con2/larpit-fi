#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1b76f7d58a7134ecf94e11c64c932e54a83c74c123f53918cf5ebee5fd9154f4/contract';
import startContract from '../../snapshots/1b76f7d58a7134ecf94e11c64c932e54a83c74c123f53918cf5ebee5fd9154f4/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/da074fda7e862176f5e3b3554fda34e4d6a392d4a9d29777f61cc326ea83e6e1/contract';
import endContract from '../../snapshots/da074fda7e862176f5e3b3554fda34e4d6a392d4a9d29777f61cc326ea83e6e1/contract.json' with { type: 'json' };
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
        table: 'larp_tag',
        columns: [
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('tag_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['larp_id', 'tag_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'tag',
        columns: [
          col('description_en', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('description_fi', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`uuidv7()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('name_en', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name_fi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'moderation_request',
        column: col('add_tags', 'jsonb', {
          notNull: true,
          default: fn(sql`'[]'::jsonb`),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'moderation_request',
        column: col('remove_tags', 'jsonb', {
          notNull: true,
          default: fn(sql`'[]'::jsonb`),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'tag',
        constraint: 'tag_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp_tag',
        index: 'larp_tag_tag_id_idx_94b47830',
        columns: ['tag_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp_tag',
        foreignKey: {
          name: 'larp_tag_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp_tag',
        foreignKey: {
          name: 'larp_tag_tag_id_fkey',
          columns: ['tag_id'],
          references: { schema: 'public', table: 'tag', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
