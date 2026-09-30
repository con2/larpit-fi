#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/155b6d561e265f7b59c949ff40ee03b5eeecd2555fb939a30b8a63dc3135c913/contract';
import startContract from '../../snapshots/155b6d561e265f7b59c949ff40ee03b5eeecd2555fb939a30b8a63dc3135c913/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/2649fd5db40ceb62378597393d934f718060b8821703bfc7f482e6b7e6d12a16/contract';
import endContract from '../../snapshots/2649fd5db40ceb62378597393d934f718060b8821703bfc7f482e6b7e6d12a16/contract.json' with { type: 'json' };
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
