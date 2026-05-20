const { Pool } = require('pg');

const DEFAULT_TABLE_NAME = 'kiu_platform_state_records';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function assertSafeTableName(value) {
    const normalized = String(value || '').trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) {
        throw new Error(`Invalid PostgreSQL table name "${normalized}".`);
    }
    return normalized;
}

class PostgresRecordStore {
    constructor(options = {}) {
        this.connectionString = String(options.connectionString || '').trim();
        this.tableName = assertSafeTableName(String(options.tableName || DEFAULT_TABLE_NAME).trim() || DEFAULT_TABLE_NAME);
        this.pool = new Pool({
            connectionString: this.connectionString
        });
    }

    async init() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                namespace TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
    }

    async loadState() {
        const result = await this.pool.query(`
            SELECT namespace, payload
            FROM ${this.tableName}
        `);
        if (!result.rows.length) return null;
        const state = {};
        result.rows.forEach(row => {
            state[row.namespace] = row.payload;
        });
        return state;
    }

    async writeState(state = {}) {
        const namespaces = Object.keys(state);
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const namespace of namespaces) {
                await client.query(`
                    INSERT INTO ${this.tableName} (namespace, payload, updated_at)
                    VALUES ($1, $2::jsonb, NOW())
                    ON CONFLICT (namespace)
                    DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
                `, [namespace, JSON.stringify(clone(state[namespace]))]);
            }
            await client.query(`
                DELETE FROM ${this.tableName}
                WHERE namespace <> ALL($1::text[])
            `, [namespaces]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = {
    PostgresRecordStore,
    DEFAULT_TABLE_NAME
};
