import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('LMS live quiz dual-client smoke', () => {
    it('runs professor and student Playwright contexts against live-quiz tab', () => {
        const result = spawnSync(process.execPath, [join(ROOT, 'tools/lms_live_quiz_smoke.mjs')], {
            cwd: ROOT,
            encoding: 'utf8',
            env: { ...process.env }
        });
        if (result.status !== 0) {
            const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
            throw new Error(output || `Live quiz smoke exited with status ${result.status}`);
        }
        expect(result.stdout).toContain('LMS live quiz dual-client smoke passed.');
    }, 120000);
});