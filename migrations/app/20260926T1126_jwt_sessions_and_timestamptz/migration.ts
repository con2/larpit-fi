#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9bf918b93a85146ab41f68914f46530cb8facfbf4562e3f2b0d4eb83437998d0/contract';
import startContract from '../../snapshots/9bf918b93a85146ab41f68914f46530cb8facfbf4562e3f2b0d4eb83437998d0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/2a0f2222815c2bbdbf602db2285a19cac46ed7d47c22207da3ec36218c1734af/contract';
import endContract from '../../snapshots/2a0f2222815c2bbdbf602db2285a19cac46ed7d47c22207da3ec36218c1734af/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  // Prisma 7 stored UTC wall-clock time in timestamp columns, so the conversion to timestamptz
  // must read them as UTC regardless of the session time zone.
  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'authenticator' }),
      this.dropTable({ schema: 'public', table: 'session' }),
      this.alterColumnType({
        schema: 'public',
        table: 'account',
        column: 'created_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"created_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'account',
        column: 'updated_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"updated_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'cancelled_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"cancelled_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'ends_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"ends_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'signup_ends_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"signup_ends_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'signup_starts_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"signup_starts_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'starts_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"starts_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'larp',
        column: 'updated_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"updated_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'moderation_request',
        column: 'resolved_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"resolved_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'moderation_request',
        column: 'verified_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"verified_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'page',
        column: 'created_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"created_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'page',
        column: 'updated_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"updated_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'related_user',
        column: 'created_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"created_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'unauthenticated_signup',
        column: 'created_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"created_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'unauthenticated_signup',
        column: 'updated_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"updated_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'unauthenticated_signup',
        column: 'verified_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"verified_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'user',
        column: 'created_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"created_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'user',
        column: 'email_verified',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"email_verified" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'user',
        column: 'updated_at',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"updated_at" at time zone \'utc\'',
        },
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'verification_token',
        column: 'expires',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
          using: '"expires" at time zone \'utc\'',
        },
      }),
      this.setDefault({
        schema: 'public',
        table: 'moderation_request',
        column: 'verification_code',
        defaultSql: 'DEFAULT (gen_random_uuid())',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
