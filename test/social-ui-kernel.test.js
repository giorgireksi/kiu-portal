import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-ui-kernel', () => {
    it('socialNeoDialogHead uses closeAction without undefined text()', () => {
        const kernel = readSource('assets/js/pages/social-ui-kernel.js');
        expect(kernel).toContain("options.closeAction || 'dialog-close'");
        expect(kernel).not.toContain('text(options.closeAction');
    });
});
