import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('personal data wireframe doc', () => {
    it('documents the professional page structure with ASCII wireframes', () => {
        const doc = readSource('docs/personal-data-wireframe.md');

        expect(doc).toContain('# Personal Data Wireframe');
        expect(doc).toContain('PROFILE RAIL');
        expect(doc).toContain('COMMAND BAR');
        expect(doc).toContain('ENROLLMENT');
        expect(doc).toContain('UNIVERSITY RECORD');
        expect(doc).toContain('ACADEMIC OVERVIEW');
        expect(doc).toContain('Professional structure rules');
        expect(doc).toContain('personal-data-rail');
        expect(doc).toContain('personal-data-command');
    });
});
