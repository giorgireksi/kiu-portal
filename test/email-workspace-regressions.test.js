import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('email workspace regressions', () => {
    it('keeps the bounded mail workspace slice on explicit classes instead of inline template styling', () => {
        const source = readSource('assets/js/pages/email.js');

        expect(source).toContain('.mail-pill-row--center');
        expect(source).toContain('.mail-actions--center');
        expect(source).toContain('.mail-banner--mt-14');
        expect(source).toContain('.mail-panel-title--mt-18');
        expect(source).toContain('.mail-list-empty--compact');
        expect(source).toContain('.mail-empty-icon-sm');
        expect(source).toContain('.mail-empty-icon-md');
        expect(source).toContain('.mail-empty-icon-lg');
        expect(source).toContain('.mail-reader-title');
        expect(source).toContain('.mail-compose-actions--flush');
        expect(source).toContain('.mail-connect-title');
        expect(source).toContain('.mail-connect-copy');
        expect(source).toContain('type="file" multiple hidden');
        expect(source).toContain('class="mail-panel-title mail-panel-title--mt-18"');
        expect(source).toContain('class="mail-pill-row mail-pill-row--center"');
        expect(source).toContain('class="mail-actions mail-actions--center"');
        expect(source).toContain('class="mail-banner is-info mail-banner--mt-14"');

        expect(source).not.toContain('style="font-size:22px;"');
        expect(source).not.toContain('style="font-size:24px;"');
        expect(source).not.toContain('style="font-size:32px;"');
        expect(source).not.toContain('style="margin-top:0;"');
        expect(source).not.toContain('style="margin-top:18px;"');
        expect(source).not.toContain('style="min-height:0; padding:18px;"');
        expect(source).not.toContain('style="display:none;"');
        expect(source).not.toContain('style="font-size:24px; color:#fff;"');
        expect(source).not.toContain('style="max-width:560px; line-height:1.8; color:rgba(226,232,240,0.84);"');
        expect(source).not.toContain('style="justify-content:center;"');
        expect(source).not.toContain('style="margin:0;"');
    });
});
