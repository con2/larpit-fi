#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/64e0a3f175597a2f5b896f7472d946266586f01702d0509ac69280780bb27ade/contract';
import endContract from '../../snapshots/64e0a3f175597a2f5b896f7472d946266586f01702d0509ac69280780bb27ade/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fdb9c0b26d71943b28f4d591c51f4bec7d7a32f1a35c59cbb8ede2e0138bce2e/contract';
import startContract from '../../snapshots/fdb9c0b26d71943b28f4d591c51f4bec7d7a32f1a35c59cbb8ede2e0138bce2e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'larp_alias_redirect',
        columns: [
          col('alias', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['alias'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp_alias_redirect',
        index: 'larp_alias_redirect_larp_id_idx_6818caa7',
        columns: ['larp_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp_alias_redirect',
        foreignKey: {
          name: 'larp_alias_redirect_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
