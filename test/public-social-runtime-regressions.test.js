import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('public social runtime retired', () => {
    it('does not ship the orphan public-social-runtime or social-canonical modules', () => {
        expect(existsSync(join(root, 'assets/js/shared/public-social-runtime.js'))).toBe(false);
        expect(existsSync(join(root, 'assets/js/shared/social-canonical.js'))).toBe(false);
        expect(existsSync(join(root, 'assets/js/shared/social-runtime-lite.js'))).toBe(true);
    });
});
