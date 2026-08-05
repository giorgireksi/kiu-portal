import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('LMS live quiz HTTP e2e', () => {
    it('professor sync, student answer POST, and professor GET over real HTTP', () => {
        const result = spawnSync(process.execPath, [join(ROOT, 'tools/lms-live-quiz-http-e2e.mjs')], {
            cwd: ROOT,
            encoding: 'utf8',
            env: {
                ...process.env,
                NODE_ENV: 'test',
                KIU_ENVIRONMENT: 'test',
                KIU_ALLOW_LOCAL_PLATFORM_FALLBACK: '1'
            }
        });
        if (result.status !== 0) {
            const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
            throw new Error(output || `HTTP e2e exited with status ${result.status}`);
        }
        expect(result.stdout).toContain('LMS live quiz HTTP e2e passed.');
    });
});