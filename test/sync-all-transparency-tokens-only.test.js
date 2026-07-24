import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('syncAll transparency tokens-only contract', () => {
    it('always queues transparency but uses tokensOnly when visual + transparency signatures match', () => {
        const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        expect(syncRuntime).toContain('visualHalfUnchanged && _transparencyUnchanged');
        expect(syncRuntime).toContain('tokensOnly = true');
        expect(syncRuntime).toContain('queueLuxuryTransparencyRefresh');
        expect(transparency).toContain('if (options?.tokensOnly === true)');
        expect(transparency).toContain('applyLiveTransparencyTokens(transparencyModel, fillRatio, percentage)');
        expect(transparency).toContain('__luxLastAppliedTransparencySignature');
    });

    it('skips legacy visual refresh when visual half is unchanged', () => {
        const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');
        expect(syncRuntime).toMatch(/!visualHalfUnchanged[\s\S]*queueLegacyVisualRefresh/);
    });
});
