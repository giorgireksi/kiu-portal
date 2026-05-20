import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PostgresRecordStore, DEFAULT_TABLE_NAME } = require('../backend/platform/postgres-record-store.js');

describe('postgres record store safety', () => {
    it('rejects unsafe table identifiers before building SQL', () => {
        expect(() => new PostgresRecordStore({ connectionString: 'postgres://example', tableName: 'safe_table' })).not.toThrow();
        expect(() => new PostgresRecordStore({ connectionString: 'postgres://example', tableName: DEFAULT_TABLE_NAME })).not.toThrow();
        expect(() => new PostgresRecordStore({ connectionString: 'postgres://example', tableName: 'unsafe-table;drop table users' })).toThrow(/Invalid PostgreSQL table name/i);
        expect(() => new PostgresRecordStore({ connectionString: 'postgres://example', tableName: 'schema.table' })).toThrow(/Invalid PostgreSQL table name/i);
    });
});
