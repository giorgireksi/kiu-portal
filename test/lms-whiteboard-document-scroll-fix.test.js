import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard document scroll fix ux8', () => {
    it('guards wheel zoom over document views in select', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain("event.target.closest?.('[data-lms-whiteboard-document-view]')");
        expect(runtime).toContain("tool === 'select'");
    });

    it('keeps ink above preview for scroll and visibility', () => {
        const selectHandBlock = css.match(
            /\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-body[\s\S]*?pointer-events:\s*auto;\s*\}/
        )?.[0] || '';

        expect(css).toContain('.lms-whiteboard-document-layer');
        expect(css).toMatch(/lms-whiteboard-document-layer[\s\S]*overflow:\s*visible/);
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-frame');
        expect(selectHandBlock).not.toContain('z-index: 3');
        expect(css).toMatch(/\.lms-whiteboard-document-body[\s\S]*z-index:\s*1;/);
        expect(css).toMatch(/\.lms-whiteboard-document-ink[\s\S]*z-index:\s*2;/);
    });

    it('keeps document-body absolute in select/hand (no position:relative override)', () => {
        const selectHandBlock = css.match(
            /\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-body[\s\S]*?pointer-events:\s*auto;\s*\}/
        )?.[0] || '';

        expect(selectHandBlock).not.toContain('position: relative');
        expect(css).toMatch(/\.lms-whiteboard-document-body[\s\S]*position:\s*absolute;/);
    });

    it('keeps select tool document body scrollable without view-level blocking', () => {
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-body');
        expect(css).not.toMatch(/\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-view\s*\{[^}]*pointer-events:\s*none/);
    });

    it('adds scrollable docx srcdoc styles', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('html { margin: 0; height: 100%; overflow: auto; }');
        expect(docRuntime).toContain('body { margin: 0; padding: 0; overflow: visible;');
        expect(docRuntime).toContain('p:last-child { margin-bottom: 0; }');
    });

    it('bumps cache to doc-annotate', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});