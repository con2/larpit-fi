#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/148d0fef1f054eba6f3396ba6adc560a1843ab85b3df6fa4662ab5351d291ad1/contract';
import endContract from '../../snapshots/148d0fef1f054eba6f3396ba6adc560a1843ab85b3df6fa4662ab5351d291ad1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9f1a525d8836b563f0f6f18c2ba3355176637c3082086702b14519f2adddc16b/contract';
import startContract from '../../snapshots/9f1a525d8836b563f0f6f18c2ba3355176637c3082086702b14519f2adddc16b/contract.json' with { type: 'json' };
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
