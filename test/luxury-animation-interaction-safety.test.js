import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury animation interaction safety', () => {
    it('does not globally disable pointer events during shell animation mode', () => {
        const css = readSource('assets/css/index-luxury.css');
        const start = css.indexOf('body.lux-is-animating * {');
        const end = css.indexOf('body.lux-is-animating .lux-card,', start);
        const block = start >= 0 && end > start ? css.slice(start, end) : '';

        expect(start).toBeGreaterThanOrEqual(0);
        expect(block).toContain('backdrop-filter: none !important;');
        expect(block).toContain('box-shadow: none !important;');
        expect(block).not.toContain('pointer-events: none !important;');
    });
});
