#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c6252bbb2a58a3b1f0298a6aca60d5bba359c0086afdd8b5d07d483720e201b6/contract';
import endContract from '../../snapshots/c6252bbb2a58a3b1f0298a6aca60d5bba359c0086afdd8b5d07d483720e201b6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/da074fda7e862176f5e3b3554fda34e4d6a392d4a9d29777f61cc326ea83e6e1/contract';
import startContract from '../../snapshots/da074fda7e862176f5e3b3554fda34e4d6a392d4a9d29777f61cc326ea83e6e1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'moderation_request',
        column: col('declined', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'moderation_request',
        column: col('old_content', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
