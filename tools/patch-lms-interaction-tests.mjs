import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const testDir = join(root, 'test');
const files = readFileSync('/dev/stdin', 'utf8').trim().split('\n').filter(Boolean);

const helperImport = `import { readLmsInteractionSource, readLmsInteractionShellRuntime } from './helpers/lms-interaction-source.js';`;

for (const rel of files) {
    const path = join(testDir, rel);
    let src = readFileSync(path, 'utf8');
    if (!src.includes('lms-interaction') && !src.includes('interaction-messenger')) continue;

    if (!src.includes('helpers/lms-interaction-source.js')) {
        src = src.replace(
            /import \{ describe, expect, it \} from 'vitest';/,
            `import { describe, expect, it } from 'vitest';\n${helperImport}`
        );
    }

    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-classroom-tabs-runtime\.js'\)/g,
        'readLmsInteractionSource()'
    );
    src = src.replace(
        /readSource\('assets\/js\/pages\/lms-classroom-tabs-shell-runtime\.js'\)/g,
        'readLmsInteractionShellRuntime()'
    );

    writeFileSync(path, src);
    console.log('patched', rel);
}
