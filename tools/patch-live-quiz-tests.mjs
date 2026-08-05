import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const testDir = join(root, 'test');
const files = readFileSync('/dev/stdin', 'utf8').trim().split('\n').filter(Boolean);

const helperImport = `import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';`;

for (const rel of files) {
    const path = join(testDir, rel);
    let src = readFileSync(path, 'utf8');
    if (!src.includes('lms-live-quiz')) continue;

    if (!src.includes('helpers/lms-live-quiz-source.js')) {
        src = src.replace(
            /import \{ describe, expect, it \} from 'vitest';/,
            `import { describe, expect, it } from 'vitest';\n${helperImport}`
        );
    }

    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-live-quiz-ui-runtime\.js'\)/g,
        'readLmsLiveQuizUiChain()'
    );
    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-live-quiz-workspace-runtime\.js'\)/g,
        'readLmsLiveQuizWorkspaceRuntime()'
    );
    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-live-quiz-access-runtime\.js'\)/g,
        'readLmsLiveQuizAccessRuntime()'
    );
    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-live-quiz-session-runtime\.js'\)/g,
        'readLmsLiveQuizSessionRuntime()'
    );
    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-live-quiz-ui-staff-runtime\.js'\)/g,
        'readLmsLiveQuizUiStaffRuntime()'
    );

    writeFileSync(path, src);
    console.log('patched', rel);
}
