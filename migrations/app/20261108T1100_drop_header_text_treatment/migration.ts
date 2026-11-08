#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3fab43756e4cc561eca89bfac9f6928f67aec75f2da844c7de829c9e2cc8f08d/contract';
import endContract from '../../snapshots/3fab43756e4cc561eca89bfac9f6928f67aec75f2da844c7de829c9e2cc8f08d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/64e0a3f175597a2f5b896f7472d946266586f01702d0509ac69280780bb27ade/contract';
import startContract from '../../snapshots/64e0a3f175597a2f5b896f7472d946266586f01702d0509ac69280780bb27ade/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'header_image', column: 'text_treatment' }),
      this.dropNativeEnumType({ schema: 'public', typeName: 'HeaderTextTreatment' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
