import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('popup motion unification', () => {
    it('defines shared popup motion tokens', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-popup-anim-duration: 240ms');
        expect(tokens).toContain('--lux-popup-anim-close-duration: 180ms');
        expect(tokens).toContain('--lux-popup-slide-offset: 12px');
        expect(tokens).toContain('--lux-popup-scale-closed: 0.97');
    });

    it('drives hub modals and glass overlays with slide+scale transitions', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(/\.modal-overlay\.active[\s\S]*?opacity:\s*1/);
        expect(modals).toMatch(/\.modal-overlay\.active \.modal-content[\s\S]*?scale\(1\)/);
        expect(modals).not.toContain('modalSlideIn');
        expect(modals).toMatch(/\.lms-glass-dialog-overlay[\s\S]*?\.is-open[\s\S]*?opacity:\s*1/);
        expect(modals).toMatch(/\.registration-structured-modal-backdrop[\s\S]*?\.is-open[\s\S]*?opacity:\s*1/);
        expect(modals).toMatch(/\.lms-glass-dialog-overlay[\s\S]*?\.is-open > \*[\s\S]*?scale\(1\)/);
        expect(modals).toMatch(/\.is-closing:not\(\.is-open\)[\s\S]*?opacity:\s*0/);
    });

    it('exports glass overlay open/close helpers on window', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('window.openLuxGlassDialogOverlay');
        expect(utilities).toContain('window.closeLuxGlassDialogOverlay');
        expect(utilities).toContain('window.openLuxPortalModal');
        expect(utilities).toContain('window.closeLuxPortalModal');
        expect(utilities).toContain('LUX_POPUP_OPEN_MS = 240');
        expect(utilities).toContain('LUX_POPUP_CLOSE_MS = 180');
    });

    it('wires LMS quiz glass overlays through motion helpers', () => {
        const quiz = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const session = readSource('assets/js/pages/lms-quiz-workspace-session-runtime.js');
        expect(quiz).toContain('openLuxGlassDialogOverlay(overlay)');
        expect(quiz).toContain('closeLuxGlassDialogOverlay(overlay, { instant: true })');
        expect(quiz).toContain('function closeLmsQuizReviewModal()');
        expect(session).toContain('lms-glass-dialog-overlay lms-quiz-access-overlay');
        expect(session).toContain('function closeLmsQuizAccessDialog()');
        expect(session).toContain('renderLuxGlassDialogCard');
    });

    it('drives hub command-center modals with shared portal overlay motion', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const dialog = readSource('assets/js/shared/lux-glass-dialog.js');
        expect(modals).toMatch(/\.lms-glass-dialog-overlay[\s\S]*?\.is-open[\s\S]*?opacity:\s*1/);
        expect(modals).toMatch(/\.lms-glass-dialog-overlay[\s\S]*?\.is-open > \*[\s\S]*?scale\(1\)/);
        expect(dialog).toContain('window.openLuxHubFormModalRoot');
        expect(dialog).toContain('window.closeLuxHubFormModalRoot');
    });
});
