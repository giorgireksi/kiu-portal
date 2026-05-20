const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = String(process.env.KIU_DATABASE_URL || process.env.DATABASE_URL || '').trim();
const migrationLockKey = Number(process.env.KIU_MIGRATION_LOCK_KEY || 4815162342);
const migrationsDir = path.resolve(process.cwd(), process.argv[2] || 'infra/postgres/init');

if (!databaseUrl) {
    console.error('KIU_DATABASE_URL or DATABASE_URL is required.');
    process.exit(1);
}

if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
}

if (!Number.isSafeInteger(migrationLockKey)) {
    console.error('KIU_MIGRATION_LOCK_KEY must be a safe integer.');
    process.exit(1);
}

const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

async function main() {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
        await client.query('select pg_advisory_lock($1)', [migrationLockKey]);
        await client.query(`
            create table if not exists schema_migrations (
                id text primary key,
                applied_at timestamptz not null default now()
            )
        `);

        for (const file of files) {
            const id = file.replace(/\.sql$/i, '');
            const alreadyApplied = await client.query('select 1 from schema_migrations where id = $1', [id]);
            if (alreadyApplied.rowCount) {
                console.log(`skip ${file}`);
                continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            console.log(`apply ${file}`);
            await client.query('begin');
            try {
                await client.query(sql);
                await client.query('insert into schema_migrations (id) values ($1)', [id]);
                await client.query('commit');
            } catch (error) {
                await client.query('rollback');
                throw error;
            }
        }

        console.log(`Migrations complete: ${files.length} file(s) checked.`);
    } finally {
        await client.query('select pg_advisory_unlock($1)', [migrationLockKey]).catch(() => null);
        await client.end();
    }
}

main().catch(error => {
    console.error(error.stack || error.message || error);
    process.exit(1);
});
