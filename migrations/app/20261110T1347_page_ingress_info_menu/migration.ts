#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3fab43756e4cc561eca89bfac9f6928f67aec75f2da844c7de829c9e2cc8f08d/contract';
import startContract from '../../snapshots/3fab43756e4cc561eca89bfac9f6928f67aec75f2da844c7de829c9e2cc8f08d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b30cef0f3f3972f3eeb1fed44acb1dc980a7c3c102561c3376d81263d55359a1/contract';
import endContract from '../../snapshots/b30cef0f3f3972f3eeb1fed44acb1dc980a7c3c102561c3376d81263d55359a1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'page',
        column: col('ingress', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'page',
        column: col('menu_position', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      rawSql({
        id: 'data.page.front_page_ingress',
        label: 'Move the front page text from content to ingress',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'page' } },
        precheck: [],
        execute: [
          {
            description: 'move front page content to ingress',
            sql: "update public.page set ingress = content, content = '' where slug = 'front-page' and content <> ''",
          },
        ],
        postcheck: [
          {
            description: 'verify no front page keeps text in content',
            sql: "select not exists (select 1 from public.page where slug = 'front-page' and content <> '') as result",
          },
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
