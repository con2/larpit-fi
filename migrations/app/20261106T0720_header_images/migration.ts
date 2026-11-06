#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2649fd5db40ceb62378597393d934f718060b8821703bfc7f482e6b7e6d12a16/contract';
import startContract from '../../snapshots/2649fd5db40ceb62378597393d934f718060b8821703bfc7f482e6b7e6d12a16/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/76853b0563218b0c64e83c60615f92e39bda654a02a47d64d77e520304a46942/contract';
import endContract from '../../snapshots/76853b0563218b0c64e83c60615f92e39bda654a02a47d64d77e520304a46942/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'HeaderImageSource',
        members: ['UPLOAD', 'LARPPIKUVAT'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'HeaderTextTreatment',
        members: ['NONE', 'DROP_SHADOW', 'OPAQUE_BACKGROUND'],
      }),
      this.createTable({
        schema: 'public',
        table: 'header_image',
        columns: [
          col('content_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('crop_height', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('crop_width', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('crop_x', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('crop_y', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('height', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('uuidv7()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('larppikuvat_picture_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('photographer_credit', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revision', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('source', '"HeaderImageSource"', {
            notNull: true,
            default: lit('UPLOAD'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'HeaderImageSource' } },
          }),
          col('text_treatment', '"HeaderTextTreatment"', {
            notNull: true,
            default: lit('NONE'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'HeaderTextTreatment' } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('uploaded_by_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('width', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'larp',
        column: col('header_image_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'page',
        column: col('header_image_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'header_image',
        foreignKey: {
          name: 'header_image_uploaded_by_id_fkey',
          columns: ['uploaded_by_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp',
        foreignKey: {
          name: 'larp_header_image_id_fkey',
          columns: ['header_image_id'],
          references: { schema: 'public', table: 'header_image', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'page',
        foreignKey: {
          name: 'page_header_image_id_fkey',
          columns: ['header_image_id'],
          references: { schema: 'public', table: 'header_image', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
