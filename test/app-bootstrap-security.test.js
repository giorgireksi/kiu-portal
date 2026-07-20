import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('app bootstrap security regressions', () => {
    it('does not use document.write for the API runtime bootstrap path', () => {
        const source = readSource('assets/js/app/app.js');

        expect(source).not.toContain('document.write(`');
        expect(source).toContain('const insertionParent = currentScript.parentNode || document.head;');
        expect(source).toContain('insertionParent.insertBefore(script, currentScript.nextSibling);');
        expect(source).not.toContain("if (document.readyState === 'loading' && typeof document.write === 'function')");
    });
});
