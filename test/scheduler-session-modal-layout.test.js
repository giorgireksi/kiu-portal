import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('scheduler session modal layout regressions', () => {
    it('matches the reference four-section field structure', () => {
        const html = readSource('admin-scheduler.html');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';

        expect((modalTemplate.match(/<section class="sch-form-section/g) || [])).toHaveLength(4);
        expect(modalTemplate).toContain('sch-form-section--identity');
        expect(modalTemplate).toContain('sch-form-section--schedule');
        expect(modalTemplate).toContain('sch-form-section--staffing');
        expect(modalTemplate).toContain('sch-form-section--scope');
        expect(modalTemplate).toContain('id="sch-modal-subtitle"');
        expect(modalTemplate).toContain('id="sch-modal-week"');
        expect(modalTemplate).not.toContain('sch-modal-context');
        expect(modalTemplate).toContain('class="sch-preset-manage-link"');
        expect(modalTemplate).toContain('fas fa-sliders-h');
        expect(modalTemplate).toContain('id="sch-conflict-msg" data-conflict-state="hidden" role="status" aria-live="polite" hidden');
        expect(modalTemplate).toContain('sch-input-label-spacer');
        expect(modalTemplate).toContain('Group ID');
        expect(modalTemplate).toContain('data-sch-session-modal-ssot="1"');
    });

    it('uses isolated session-modal CSS; admin-scheduler-route.css stays retired', () => {
        const droplist = readSource('assets/css/lux-droplist.css');
        const controls = readSource('assets/css/lux-controls.css');
        const modals = readSource('assets/css/lux-modals.css');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const html = readSource('admin-scheduler.html');

        expectRetiredCss('admin-scheduler-route.css');
        expect(html).not.toContain('admin-scheduler-route.css');
        expect(html).toContain('admin-scheduler-session-modal.css?v=20260804-staffbuttons1');
        expect(html).toMatch(/mobile-shell-core\.css[\s\S]*admin-scheduler-session-modal\.css/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(droplist).toContain('.lux-droplist-panel');
        expect(controls).toContain('.lux-picker-panel.is-closing');
        expect(html).toContain('lux-controls.css');
        expect(modals).not.toContain('#schModalOverlay *');
        expect(modals).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(modals).toContain('.sch-preset-manage-link:not(.lux-secondary-btn)');
        expect(modals).toMatch(/\.sch-modal-foot \.lux-primary-btn[\s\S]*?--lux-panel-cta-accent/);
        expect(modals).toContain(':is(#schPresetManagerOverlay, #profQuizModalOverlay) > .sch-modal');
        expect(session).not.toMatch(/\[data-lux-transparency-exempt="1"\]\s+#schModalOverlay/);
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-form-section');
        expect(session).toContain('border-top: 1px solid color-mix');
        expect(session).toContain('.sch-conflict-alert.show:not([hidden])');
        expect(session).toContain('font-family: inherit');
        expect(session).toContain('text-shadow: none');
    });

    it('uses the asd8 header and shared control geometry', () => {
        const html = readSource('admin-scheduler.html');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const modals = readSource('assets/css/lux-modals.css');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';

        expect(modalTemplate).toContain('sch-modal-head sch-modal-head-accent');
        expect(modalTemplate).toContain('data-admin-scheduler-modal-close="true"');
        expect(modalTemplate).toContain('fas fa-times sch-modal-close-muted');
        expect(modalTemplate).not.toMatch(/<button[^>]*sch-modal-close-muted/);
        expect(session).toContain('font-size: 28px');
        expect(modals).toMatch(/\.sch-modal-foot \.sch-create-btn[\s\S]*?min-width:\s*240px/);
        expect(session).not.toContain('min-width: 240px');
        expect(session).not.toContain('.sch-preset-manage-link');
        expect(modals).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(modals).toContain('.sch-preset-manage-link:not(.lux-secondary-btn)');
    });

    it('uses asd8 uppercase micro-label field captions in session modal CSS', () => {
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const modals = readSource('assets/css/lux-modals.css');

        const sessionLabelBlock =
            session.match(
                /#schModalOverlay\[data-lux-transparency-exempt="1"\] :is\(\s*\.sch-input-group > label[\s\S]*?\}\n/
            )?.[0] || '';
        expect(sessionLabelBlock).toContain('text-transform: uppercase');
        expect(sessionLabelBlock).toContain('font-size: 11px');
        expect(sessionLabelBlock).toContain('color: var(--lux-text-soft');
        expect(sessionLabelBlock).not.toContain('text-transform: none');
        expect(session).toContain("'Playfair Display'");
        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-input-label-row[\s\S]*?display:\s*flex/
        );
        expect(session).not.toMatch(/\.sch-create-btn[\s\S]*?linear-gradient/);
        expect(modals).toMatch(/\.sch-modal-foot \.lux-primary-btn[\s\S]*?--lux-panel-cta-accent/);
    });

    it('paints gradient head-accent in admin-scheduler-session-modal.css', () => {
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const html = readSource('admin-scheduler.html');

        expect(session).toContain('body.lux-route-admin-scheduler #schModalOverlay .sch-modal-head-accent');
        expect(session).toContain('linear-gradient');
        expect(fouc).not.toContain('#schModalOverlay');
        expect(fouc).toContain('#schPresetManagerOverlay, #profQuizModalOverlay) .sch-modal-head-accent');
        expect(html).toContain('lux-modals.css?v=20260803-schapply5');
        expect(html).toContain('lux-page-bare-lite.css?v=20260804-commandmerge1');
        expect(html).toContain('lux-fouc-ht.css?v=20260804-heroerase1');
    });

    it('uses shared CTA picker chrome from lux-controls, not session soft-field overrides', () => {
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const modals = readSource('assets/css/lux-modals.css');
        const controls = readSource('assets/css/lux-controls.css');

        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-input-label-spacer');
        expect(session).not.toContain('#schModalOverlay .sch-input-label-action');
        expect(session).toMatch(/max-height:\s*min\(90vh,\s*1100px\)\s*!important/);
        expect(session).not.toMatch(/border-width:\s*1px !important/);
        expect(session).not.toContain('font-weight: 600 !important');
        expect(session).not.toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] :is\(\s*\.lux-control,[\s\S]*?linear-gradient/
        );
        expect(modals).toMatch(
            /:is\(\s*#schModalOverlay\[data-lux-transparency-exempt="1"\],[\s\S]*?#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\]\s*\)[\s\S]*?\.sch-modal :is\([\s\S]*?\.lux-control[\s\S]*?\.lux-picker-btn--compact/
        );
        expect(controls).toMatch(/\.lux-picker-btn--compact[\s\S]*?var\(--lux-btn-well\)/);
        expect(controls).toMatch(/\.lux-picker-btn--compact[\s\S]*?var\(--lux-btn-pill-radius/);
    });

    it('splits preset manager section titles from session modal field labels', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');

        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-form-section-title[\s\S]*?text-transform:\s*none/
        );
        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-form-section-title[\s\S]*?font-size:\s*14px/
        );
        expect(modals).toMatch(
            /#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\] \.sch-form-section-title[\s\S]*?text-transform:\s*none/
        );
        const presetLabelBlock =
            modals.match(
                /#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\] :is\(\s*\.sch-input-group > label[\s\S]*?\}\n/
            )?.[0] || '';
        expect(presetLabelBlock).toContain('text-transform: uppercase');
        expect(presetLabelBlock).not.toContain('.sch-form-section-title');
    });

    it('right-aligns session modal foot CTA via session-modal SSOT', () => {
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const modals = readSource('assets/css/lux-modals.css');

        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-modal-foot[\s\S]*?justify-content:\s*flex-end/
        );
        expect(modals).toMatch(/\.sch-modal-foot \.sch-create-btn[\s\S]*?min-width:\s*240px/);
        expect(session).not.toMatch(/sch-create-btn[\s\S]*?min-width:\s*240px/);
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-form-section-head');
    });

    it('scopes scheduler form grid layout: session in session CSS, preset in bare-lite', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');

        expect(bare).not.toContain('#schModalOverlay');
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-input-row-two');
        expect(session).toMatch(/#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-input-row[\s\S]*?gap:\s*12px/);
        expect(bare).toContain(':is(#page-admin-scheduler, #schPresetManagerOverlay) .sch-input-row-two');
        expect(bare).toContain(':is(#page-admin-scheduler, #schPresetManagerOverlay) .sch-input-row-three');
        expect(bare).not.toMatch(
            /body\.lux-route-admin-scheduler \.sch-modal-body\s*\{[^}]*padding:\s*20px 24px/
        );
        expect(bare).toContain(':is(#page-admin-scheduler, #schPresetManagerOverlay) .sch-input-label-action');
        expect(bare).not.toContain('sch-input-label-spacer');
        expect(bare).toContain(':is(#page-admin-scheduler, #schPresetManagerOverlay) .sch-input-label-row');
        expect(bare).toContain(':is(#schPresetManagerOverlay, #profQuizModalOverlay) .sch-modal-mode-chip');
        expect(bare).not.toMatch(/body\.lux-route-admin-scheduler \.sch-modal-mode-chip\s*\{/);
        expect(bare).not.toMatch(/body\.lux-route-admin-scheduler \.sch-modal-subtitle,/);
        expect(bare).not.toMatch(/:is\(#page-admin-scheduler, #schModalOverlay, #schPresetManagerOverlay\)/);
    });
});
