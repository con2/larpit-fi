#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3fbb682a1785fb1cc080b64270d39e7c8192be27a41cab8bca3b64681d683e0d/contract';
import startContract from '../../snapshots/3fbb682a1785fb1cc080b64270d39e7c8192be27a41cab8bca3b64681d683e0d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/da23d287377560c6383a99e887ae733d7be0e0e4d025b104a129aa1739c6d9a9/contract';
import endContract from '../../snapshots/da23d287377560c6383a99e887ae733d7be0e0e4d025b104a129aa1739c6d9a9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addNativeEnumValue({ schema: 'public', typeName: 'EditAction', value: 'MERGE' }),
      this.createTable({
        schema: 'public',
        table: 'larp_redirect',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('from_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['from_id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp_redirect',
        index: 'larp_redirect_larp_id_idx_6818caa7',
        columns: ['larp_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp_redirect',
        foreignKey: {
          name: 'larp_redirect_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
