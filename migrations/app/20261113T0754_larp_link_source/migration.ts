#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b30cef0f3f3972f3eeb1fed44acb1dc980a7c3c102561c3376d81263d55359a1/contract';
import startContract from '../../snapshots/b30cef0f3f3972f3eeb1fed44acb1dc980a7c3c102561c3376d81263d55359a1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cbe3198758045d5df1026d4166200bcb5d68598ebdcac6491c5387b367492bb4/contract';
import endContract from '../../snapshots/cbe3198758045d5df1026d4166200bcb5d68598ebdcac6491c5387b367492bb4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addNativeEnumValue({ schema: 'public', typeName: 'LarpLinkType', value: 'SOURCE' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
