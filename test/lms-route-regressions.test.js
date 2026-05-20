import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms route regressions', () => {
    it('keeps the LMS shell on the current route-level markup contract', () => {
        const html = readSource('lms.html');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).toContain('assets/js/shared/messenger.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('id="lms-section-switch" role="group" aria-label="Class type"');
        expect(html).not.toContain('id="lms-section-switch" aria-label="Class type"');
        expect(html).toContain('id="lms-gradebook-wrapper" class="lms-gradebook-wrapper-shell"></div>');
        expect(html).not.toContain('id="lms-gradebook-wrapper" style=');
        expect(html).toContain('assets/js/pages/lms-live-quiz-workspace-runtime.js?v=20260518-lmslive1');
        expect(html).toContain('assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260518-lmsliveui1');
        expect(html).toContain('assets/js/pages/lms-grade-sync-runtime.js?v=20260518-lmsgrade1');
        expect(html).toContain('assets/js/pages/lms-file-storage-runtime.js?v=20260518-lmsfiles1');
        expect(html).toContain('assets/js/pages/lms-calls-runtime.js?v=20260518-lmscalls1');
        expect(html).toContain('assets/js/pages/lms-materials-runtime.js?v=20260518-lmsmaterials1');
        expect(html).toContain('assets/js/pages/lms-assignments-runtime.js?v=20260518-lmsassignments1');
        expect(html).toContain('assets/js/pages/lms-protected-quiz-runtime.js?v=20260518-lmsprotected1');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'lms'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-lms-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('<button class="mob-sheet-close-btn" type="button" id="mob-sheet-close">');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('onchange=');
    });
});
