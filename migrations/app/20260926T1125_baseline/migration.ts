#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/30b413faa834169413399e0e933803985b17eeb5aa753a0bedbe998704f8d126/contract';
import endContract from '../../snapshots/30b413faa834169413399e0e933803985b17eeb5aa753a0bedbe998704f8d126/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'EditAction',
        members: ['CREATE', 'UPDATE', 'CLAIM', 'DELETE'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'EditFormPreference',
        members: ['FULL', 'COMPACT'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'EditStatus',
        members: [
          'PENDING_VERIFICATION',
          'VERIFIED',
          'AUTO_APPROVED',
          'APPROVED',
          'REJECTED',
          'WITHDRAWN',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Language',
        members: ['fi', 'en', 'sv', 'OTHER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'LarpLinkType',
        members: ['HOMEPAGE', 'PHOTOS', 'SOCIAL_MEDIA', 'PLAYER_GUIDE', 'OTHER', 'SIGNUP'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'LarpType',
        members: [
          'ONE_SHOT',
          'CAMPAIGN_LARP',
          'CAMPAIGN',
          'MULTIPLE_RUNS',
          'OTHER_EVENT_SERIES',
          'OTHER_EVENT',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'LocalSignupStatus',
        members: ['DISABLED', 'PUBLIC', 'CODE_REQUIRED'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Openness',
        members: ['OPEN', 'TARGETED', 'INVITE_ONLY'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'RelatedLarpType',
        members: [
          'SEQUEL',
          'SPINOFF',
          'IN_CAMPAIGN',
          'IN_SERIES',
          'RUN_OF',
          'RERUN_OF',
          'PLAYED_AT',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'RelatedUserRole',
        members: [
          'EDITOR',
          'CREATED_BY',
          'GAME_MASTER',
          'VOLUNTEER',
          'PLAYER',
          'FAVORITE',
          'TEAM_MEMBER',
          'LOCAL_SIGNUP_YES',
          'LOCAL_SIGNUP_MAYBE',
          'LOCAL_SIGNUP_NO',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'RelatedUserVisibility',
        members: ['PARTICIPANTS', 'GM', 'ONLY_ME'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'SubmitterRole',
        members: ['NONE', 'GAME_MASTER', 'VOLUNTEER', 'PLAYER', 'TEAM_MEMBER'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'TokenType',
        members: ['EMAIL_VERIFICATION', 'ACCOUNT_REMOVAL'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'UserRole',
        members: ['NOT_VERIFIED', 'VERIFIED', 'MODERATOR', 'ADMIN'],
      }),
      this.createTable({
        schema: 'public',
        table: 'account',
        columns: [
          col('access_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('expires_at', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('provider_account_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('refresh_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('scope', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('session_state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('token_type', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['provider', 'provider_account_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'authenticator',
        columns: [
          col('counter', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('credential_backed_up', 'bool', {
            notNull: true,
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('credential_device_type', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('credential_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('credential_public_key', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('provider_account_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('transports', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['user_id', 'credential_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'country',
        columns: [
          col('code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name_en', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name_fi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name_sv', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'holiday',
        columns: [
          col('date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('title_en', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title_fi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['date'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'larp',
        columns: [
          col('alias', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('cancelled_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ends_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('fluff_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('language', '"Language"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Language' } },
          }),
          col('local_signup_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('local_signup_status', '"LocalSignupStatus"', {
            notNull: true,
            default: lit('DISABLED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'LocalSignupStatus' } },
          }),
          col('location_text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('municipality_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('num_player_characters', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('num_total_participants', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('openness', '"Openness"', {
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Openness' } },
          }),
          col('related_user_visibility', '"RelatedUserVisibility"', {
            notNull: true,
            default: lit('GM'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedUserVisibility' } },
          }),
          col('signup_ends_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('signup_starts_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('starts_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('tagline', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', '"LarpType"', {
            notNull: true,
            default: lit('ONE_SHOT'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'LarpType' } },
          }),
          col('update_count', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'larp_link',
        columns: [
          col('href', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', '"LarpLinkType"', {
            notNull: true,
            default: lit('HOMEPAGE'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'LarpLinkType' } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'moderation_request',
        columns: [
          col('action', '"EditAction"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'EditAction' } },
          }),
          col('add_links', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('add_related_larps', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larp_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('new_content', 'jsonb', {
            notNull: true,
            default: lit({}),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('remove_links', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('remove_related_larps', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('resolved_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('resolved_by_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('resolved_message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"EditStatus"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'EditStatus' } },
          }),
          col('submitter_email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('submitter_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('submitter_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('submitter_role', '"SubmitterRole"', {
            notNull: true,
            default: lit('NONE'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'SubmitterRole' } },
          }),
          col('verification_code', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('verified_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'municipality',
        columns: [
          col('country_code', 'text', {
            notNull: true,
            default: lit('wd:Q33'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lat', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('long', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('name_fi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name_other', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name_other_language_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name_sv', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'page',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('language', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', {
            notNull: true,
            default: lit('front-page'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['slug', 'language'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'related_larp',
        columns: [
          col('left_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('right_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', '"RelatedLarpType"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedLarpType' } },
          }),
        ],
        constraints: [primaryKey(['left_id', 'right_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'related_user',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('role', '"RelatedUserRole"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedUserRole' } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('visibility', '"RelatedUserVisibility"', {
            notNull: true,
            default: lit('ONLY_ME'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedUserVisibility' } },
          }),
        ],
        constraints: [primaryKey(['larp_id', 'user_id', 'role'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'session',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('expires', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('session_token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'unauthenticated_signup',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('display_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larp_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('signup_status', '"RelatedUserRole"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedUserRole' } },
          }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('verification_code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('verified_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('visibility', '"RelatedUserVisibility"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RelatedUserVisibility' } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'unauthenticated_signup_signup_status_check',
            '(signup_status = ANY (ARRAY[\'LOCAL_SIGNUP_YES\'::"RelatedUserRole", \'LOCAL_SIGNUP_MAYBE\'::"RelatedUserRole", \'LOCAL_SIGNUP_NO\'::"RelatedUserRole"]))',
          ),
          checkExpression(
            'unauthenticated_signup_visibility_check',
            '(visibility = ANY (ARRAY[\'PARTICIPANTS\'::"RelatedUserVisibility", \'GM\'::"RelatedUserVisibility"]))',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('edit_form_preference', '"EditFormPreference"', {
            notNull: true,
            default: lit('FULL'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'EditFormPreference' } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email_verified', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', '"UserRole"', {
            notNull: true,
            default: lit('NOT_VERIFIED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'UserRole' } },
          }),
          col('title_en', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('title_fi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'verification_token',
        columns: [
          col('expires', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('identifier', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', '"TokenType"', {
            notNull: true,
            default: lit('EMAIL_VERIFICATION'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'TokenType' } },
          }),
        ],
        constraints: [primaryKey(['identifier', 'token'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authenticator',
        index: 'authenticator_credential_id_key',
        columns: ['credential_id'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'country',
        index: 'country_code_key',
        columns: ['code'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'larp',
        index: 'larp_alias_key',
        columns: ['alias'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'moderation_request',
        index: 'moderation_request_verification_code_key',
        columns: ['verification_code'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'session',
        index: 'session_session_token_key',
        columns: ['session_token'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'unauthenticated_signup',
        index: 'unauthenticated_signup_larp_email_pending_uidx',
        columns: ['larp_id', 'email'],
        extras: { where: '(verified_at IS NULL)', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'unauthenticated_signup',
        index: 'unauthenticated_signup_larp_email_verified_uidx',
        columns: ['larp_id', 'email'],
        extras: { where: '(verified_at IS NOT NULL)', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'unauthenticated_signup',
        index: 'unauthenticated_signup_verification_code_key',
        columns: ['verification_code'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'account',
        foreignKey: {
          name: 'account_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'authenticator',
        foreignKey: {
          name: 'authenticator_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp',
        foreignKey: {
          name: 'larp_municipality_id_fkey',
          columns: ['municipality_id'],
          references: { schema: 'public', table: 'municipality', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'larp_link',
        foreignKey: {
          name: 'larp_link_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'moderation_request',
        foreignKey: {
          name: 'moderation_request_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'moderation_request',
        foreignKey: {
          name: 'moderation_request_resolved_by_id_fkey',
          columns: ['resolved_by_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'moderation_request',
        foreignKey: {
          name: 'moderation_request_submitter_id_fkey',
          columns: ['submitter_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'municipality',
        foreignKey: {
          name: 'municipality_country_code_fkey',
          columns: ['country_code'],
          references: { schema: 'public', table: 'country', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'related_larp',
        foreignKey: {
          name: 'related_larp_left_id_fkey',
          columns: ['left_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'related_larp',
        foreignKey: {
          name: 'related_larp_right_id_fkey',
          columns: ['right_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'related_user',
        foreignKey: {
          name: 'related_user_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'related_user',
        foreignKey: {
          name: 'related_user_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'session',
        foreignKey: {
          name: 'session_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'unauthenticated_signup',
        foreignKey: {
          name: 'unauthenticated_signup_larp_id_fkey',
          columns: ['larp_id'],
          references: { schema: 'public', table: 'larp', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
