import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('gradebook delegation regressions', () => {
    it('keeps gradebook history, roster, and staff actions on delegated handlers', () => {
        const source = readSource('assets/js/pages/gradebook.js');

        expect(source).toContain("event.target.closest('[data-gradebook-click], [data-gradebook-action]')");
        expect(source).toContain('data-gradebook-click="open-section"');
        expect(source).toContain('data-gradebook-click="open-history"');
        expect(source).toContain('data-gradebook-click="preview-student"');
        expect(source).toContain('data-gradebook-click="open-score-edit"');
        expect(source).toContain('data-gradebook-click="save-entry"');
        expect(source).toContain('data-gradebook-click="remove-entry"');
        expect(source).toContain('data-gradebook-click="toggle-history"');
        expect(source).toContain('data-gradebook-click="remove-custom-section"');
        expect(source).toContain('data-gradebook-click="create-entry"');
        expect(source).toContain('data-gradebook-click="create-named-attempt"');
        expect(source).toContain('data-gradebook-click="add-custom-section"');
        expect(source).toContain('data-gradebook-click="pending-queue"');
        expect(source).toContain('data-gradebook-click="export-csv"');
        expect(source).toContain('data-gradebook-click="publish"');
        expect(source).toContain('data-gradebook-click="finalize"');
        expect(source).toContain('data-gradebook-assessment-target="criterion"');
        expect(source).toContain('data-gradebook-assessment-target="number"');
        expect(source).toContain('data-gradebook-weight="${field.key}"');
        expect(source).not.toContain('onclick=');
        expect(source).not.toContain('onchange=');
        expect(source).not.toContain('oninput=');
    });
});
