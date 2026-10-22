#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3348d670ff13a970414adf5aaa0749fae87fd6a4b67490205441b6a1f14cfb9c/contract';
import startContract from '../../snapshots/3348d670ff13a970414adf5aaa0749fae87fd6a4b67490205441b6a1f14cfb9c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/25c665b2ed0501c3e7d98935710a687acc6c47f2b333420a651cbc7f888f7843/contract';
import endContract from '../../snapshots/25c665b2ed0501c3e7d98935710a687acc6c47f2b333420a651cbc7f888f7843/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setDefault({
        schema: 'public',
        table: 'larp',
        column: 'id',
        defaultSql: 'DEFAULT (uuidv7())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'larp_link',
        column: 'id',
        defaultSql: 'DEFAULT (uuidv7())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'moderation_request',
        column: 'id',
        defaultSql: 'DEFAULT (uuidv7())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'unauthenticated_signup',
        column: 'id',
        defaultSql: 'DEFAULT (uuidv7())',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
