import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('production single-writer regressions', () => {
    it('requires explicit single-writer mode in the production readiness gate', () => {
        const checker = readSource('tools/check-production-readiness.js');
        const envExample = readSource('.env.production.example');

        expect(checker).toContain("['KIU_SINGLE_WRITER_MODE=true', String(env.KIU_SINGLE_WRITER_MODE || '').trim().toLowerCase() === 'true']");
        expect(envExample).toContain('KIU_SINGLE_WRITER_MODE=true');
    });

    it('serializes postgres migrations behind an advisory lock', () => {
        const migrator = readSource('tools/migrate-postgres.js');

        expect(migrator).toContain('const migrationLockKey = Number(process.env.KIU_MIGRATION_LOCK_KEY || 4815162342);');
        expect(migrator).toContain("await client.query('select pg_advisory_lock($1)', [migrationLockKey]);");
        expect(migrator).toContain("await client.query('select pg_advisory_unlock($1)', [migrationLockKey]).catch(() => null);");
        expect(migrator).toContain('if (!Number.isSafeInteger(migrationLockKey)) {');
    });
});
