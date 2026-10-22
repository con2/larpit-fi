#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8267abd1a67ddbbf70c2cca91574d0abbb47a6a5f08b132d43557eb5838cae9c/contract';
import startContract from '../../snapshots/8267abd1a67ddbbf70c2cca91574d0abbb47a6a5f08b132d43557eb5838cae9c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3348d670ff13a970414adf5aaa0749fae87fd6a4b67490205441b6a1f14cfb9c/contract';
import endContract from '../../snapshots/3348d670ff13a970414adf5aaa0749fae87fd6a4b67490205441b6a1f14cfb9c/contract.json' with { type: 'json' };
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
