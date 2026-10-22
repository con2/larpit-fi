#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8267abd1a67ddbbf70c2cca91574d0abbb47a6a5f08b132d43557eb5838cae9c/contract';
import endContract from '../../snapshots/8267abd1a67ddbbf70c2cca91574d0abbb47a6a5f08b132d43557eb5838cae9c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/2a0f2222815c2bbdbf602db2285a19cac46ed7d47c22207da3ec36218c1734af/contract';
import startContract from '../../snapshots/2a0f2222815c2bbdbf602db2285a19cac46ed7d47c22207da3ec36218c1734af/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropIndex({ schema: 'public', table: 'country', index: 'country_code_key' }),
      this.dropIndex({ schema: 'public', table: 'larp', index: 'larp_alias_key' }),
      this.dropIndex({
        schema: 'public',
        table: 'moderation_request',
        index: 'moderation_request_verification_code_key',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'unauthenticated_signup',
        index: 'unauthenticated_signup_verification_code_key',
      }),
      this.dropIndex({ schema: 'public', table: 'user', index: 'user_email_key' }),
      this.addUnique({
        schema: 'public',
        table: 'country',
        constraint: 'country_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'larp',
        constraint: 'larp_alias_key',
        columns: ['alias'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'moderation_request',
        constraint: 'moderation_request_verification_code_key',
        columns: ['verification_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'unauthenticated_signup',
        constraint: 'unauthenticated_signup_verification_code_key',
        columns: ['verification_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
