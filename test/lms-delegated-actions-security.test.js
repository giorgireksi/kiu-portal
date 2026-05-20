import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms delegated action security regressions', () => {
    it('uses a constrained delegated interpreter instead of new Function for data-lms actions', () => {
        const source = readSource('assets/js/pages/lms.js');

        expect(source).toContain('function splitLmsTopLevel(source, delimiter) {');
        expect(source).toContain('function resolveLmsDelegatedExpression(expression, event, element) {');
        expect(source).toContain('function executeLmsDelegatedStatement(statement, event, element) {');
        expect(source).not.toContain("new Function('event', 'element', normalizedCode)");
        expect(source).toContain("if (normalized === 'event.stopPropagation()') {");
        expect(source).toContain("document.querySelectorAll(checkedMatch[2]).forEach((node) => {");
    });
});
