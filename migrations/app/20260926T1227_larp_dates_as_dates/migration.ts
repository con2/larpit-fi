#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/148d0fef1f054eba6f3396ba6adc560a1843ab85b3df6fa4662ab5351d291ad1/contract';
import startContract from '../../snapshots/148d0fef1f054eba6f3396ba6adc560a1843ab85b3df6fa4662ab5351d291ad1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/155b6d561e265f7b59c949ff40ee03b5eeecd2555fb939a30b8a63dc3135c913/contract';
import endContract from '../../snapshots/155b6d561e265f7b59c949ff40ee03b5eeecd2555fb939a30b8a63dc3135c913/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  // The instants were chosen as Helsinki wall-clock times of the intended day, so the day is
  // taken in that zone.
  override get operations() {
    return [
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'ends_at',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
          using: '("ends_at" at time zone \'Europe/Helsinki\')::date',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'signup_ends_at',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
          using: '("signup_ends_at" at time zone \'Europe/Helsinki\')::date',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'signup_starts_at',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
          using: '("signup_starts_at" at time zone \'Europe/Helsinki\')::date',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'starts_at',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
          using: '("starts_at" at time zone \'Europe/Helsinki\')::date',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
