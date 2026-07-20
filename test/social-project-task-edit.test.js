import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('social-project-task-edit.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });
});
