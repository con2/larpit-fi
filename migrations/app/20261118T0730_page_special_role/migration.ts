#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/35f37c211c5d5bfe922c09f015cfd449f8155e90130c014589c3bf40430f87f9/contract';
import endContract from '../../snapshots/35f37c211c5d5bfe922c09f015cfd449f8155e90130c014589c3bf40430f87f9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c6252bbb2a58a3b1f0298a6aca60d5bba359c0086afdd8b5d07d483720e201b6/contract';
import startContract from '../../snapshots/c6252bbb2a58a3b1f0298a6aca60d5bba359c0086afdd8b5d07d483720e201b6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'PageSpecialRole',
        members: ['DISCORD'],
      }),
      this.addColumn({
        schema: 'public',
        table: 'page',
        column: col('special_role', '"PageSpecialRole"', {
          codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'PageSpecialRole' } },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
