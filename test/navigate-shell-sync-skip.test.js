import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('navigate shell sync skip', () => {
    it('skips syncAll when navigate returns navigationSkipped', () => {
        const indexLuxury = readSource('assets/js/features/index-luxury.js');

        expect(indexLuxury).toContain('function queueShellSync(args, result) {');
        expect(indexLuxury).toContain('if (result?.navigationSkipped) return;');
    });
});
