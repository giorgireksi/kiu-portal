import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import { join } from 'path';

describe('panel token alias guard', () => {
    it('passes on the current CSS tree', () => {
        const script = join(process.cwd(), 'tools/check-panel-token-aliases.js');
        const out = execFileSync(process.execPath, [script], { encoding: 'utf8' });
        expect(out).toContain('OK:');
    });

    it('is wired into npm run check:panels', () => {
        const pkg = require(join(process.cwd(), 'package.json'));
        expect(pkg.scripts['check:panels']).toContain('check-panel-token-aliases.js');
        expect(pkg.scripts['check:panels']).toContain('check-panel-snowflakes.js');
    });
});
