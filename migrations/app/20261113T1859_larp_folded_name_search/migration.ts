#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1b76f7d58a7134ecf94e11c64c932e54a83c74c123f53918cf5ebee5fd9154f4/contract';
import endContract from '../../snapshots/1b76f7d58a7134ecf94e11c64c932e54a83c74c123f53918cf5ebee5fd9154f4/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/da23d287377560c6383a99e887ae733d7be0e0e4d025b104a129aa1739c6d9a9/contract';
import startContract from '../../snapshots/da23d287377560c6383a99e887ae733d7be0e0e4d025b104a129aa1739c6d9a9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_folded_name_search_38e4386b',
        expression: sql`to_tsvector('simple', replace(replace(replace(replace(translate(lower("name"), 'àáâãāăąçćĉčďđðèéêëēĕėęěĝğġģìíîïĩīĭįıĺļľłñńņňòóôõōŏőøŕŗřśŝşšţťùúûüũūŭůűųýÿźżž', 'aaaaaaaccccdddeeeeeeeeeggggiiiiiiiiillllnnnnoooooooorrrssssttuuuuuuuuuuyyzzz'), 'æ', 'ae'), 'œ', 'oe'), 'ß', 'ss'), 'þ', 'th'))`,
        extras: { type: 'gin' },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
