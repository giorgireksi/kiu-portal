import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('chancellery admin approve → forward', () => {
    it('models admin_review defaults and legacy forwarded fallback', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        expect(page).toContain("routingStage: 'admin_review'");
        expect(page).toContain('forwardedTo: { professor: false, ta: false }');
        expect(page).toContain("return 'forwarded'");
        expect(page).toContain('Legacy cases without routingStage stay visible to course staff');
        expect(page).toContain('if (routingStage === \'forwarded\') return { professor: true, ta: true }');
        expect(page).toContain('function forwardChancelleryRequestToStaff');
        expect(page).toContain('function getChancelleryRoutingStage');
        expect(page).toContain('normalizeChancelleryForwardedTo');
    });

    it('gates professor/TA visibility until forwarded flags match', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        expect(page).toContain("if (getChancelleryRoutingStage(request) !== 'forwarded') return false");
        expect(page).toContain('if (role === USER_ROLES.PROFESSOR && !forwardedTo.professor) return false');
        expect(page).toContain('if (role === USER_ROLES.TA && !forwardedTo.ta) return false');
        expect(page).toContain('Choose at least one available course staff member to forward to');
        expect(page).toContain('Admin forwarded to');
    });

    it('exposes subject staff card and Forward popup modal', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        const html = readSource('chancellery.html');
        expect(page).toContain('Subject staff');
        expect(page).toContain('Professor:');
        expect(page).toContain('data-chancellery-action="open-forward-panel"');
        expect(page).toContain('Forward to course staff');
        expect(page).toContain('> Forward</button>');
        expect(page).toContain('data-chancellery-action="confirm-forward-to-staff"');
        expect(page).toContain('data-chancellery-forward-target="professor"');
        expect(page).toContain('data-chancellery-forward-target="ta"');
        expect(page).toContain('Forwarded to');
        expect(page).toContain('lux-status-pill home-hover-chip is-info');
        expect(page).toContain('lux-status-pill is-warning');
        expect(page).toContain('Needs forward');
        expect(page).toContain('chancellery-forward-overlay');
        expect(page).toContain('function openChancelleryForwardModal');
        expect(page).toContain('orders-recipient-filter-editor-modal modal-content lux-panel chancellery-forward-modal');
        expect(page).not.toContain('data-chancellery-forward-panel="1"');
        expect(page).toContain('title="Change who this case is forwarded to"');
        expect(page).toContain('Update forward');
        expect(page).toContain('lux-subcard lux-chancellery-subcard lux-soft-chrome home-hover-chip');
        expect(page).toContain("getChancelleryStatusPill(request.status, { hoverChip: false })");
        expect(page).not.toContain('lux-chancellery-routing-pill');
        expect(page).not.toContain("action === 'forward-to-staff'");
        expect(page).not.toContain('This case was already forwarded to course staff.');
        expect(html).toContain('chancellery.js?v=20260731-appealword1');
        expect(html).toContain('lux-page-bare-lite.css?v=20260731-casemodal1');
        expect(html).toContain('lux-modals.css?v=20260731-appealword1');
        expect(html).toContain('lux-layout-primitives.css?v=20260731-fwdvis1');
    });

    it('opens forward choices in a body overlay modal', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        expect(page).toContain('function ensureChancelleryForwardOverlay');
        expect(page).toContain('function closeChancelleryForwardModal');
        expect(page).toContain('function bindChancelleryForwardModalDelegates');
        expect(page).toContain("openChancelleryForwardModal(String(actionTrigger.getAttribute('data-request-id') || ''))");
        expect(page).toContain('function shouldPatchChancelleryDetailRegion');
        expect(page).not.toContain('wantsPanel !== hasPanel');
        expect(page).not.toContain("detailBody.querySelector('[data-chancellery-forward-panel=\"1\"]')");
        expect(page).not.toContain('context.uiState?.showForwardPanel');
        expect(page).toContain('function openChancelleryCaseModal');
        expect(page).toContain('chancellery-case-overlay');
        expect(page).toContain('admin-orders-thread-modal modal-content lux-panel chancellery-case-modal');
        expect(page).toContain('chancellery-case-header');
        expect(page).toContain('chancellery-case-scroll');
        expect(page).toContain('chancellery-case-decision-banner');
        expect(page).toContain('chancellery-case-decision-form');
        expect(page).not.toContain('chancellery-case-private-notes');
        expect(page).toContain('function decideChancelleryCase');
        expect(page).toContain('function updateChancelleryDecisionComment');
        expect(page).toContain('function canForwardChancelleryCase');
        expect(page).toContain('save-decision-comment');
        expect(page).toContain('One student-visible comment per case');
        expect(page).toContain('Write a decision comment before rejecting');
        expect(page).not.toContain('submit-staff-reply');
        expect(page).not.toContain('chancellery-staff-reply');
        expect(page).not.toContain('function addChancelleryInternalNote');
        expect(page).not.toContain('add-internal-note');
        expect(page).toContain('chancellery-case-identity');
        expect(page).toContain('chancellery-case-avatar');
        expect(page).toContain('function resolveChancelleryCaseStudent');
        expect(page).toContain('function resolveChancelleryCaseStudentPhoto');
        expect(page).toContain('function renderChancelleryCaseAvatar');
        expect(page).not.toContain('chancellery-case-modal-toolbar');
        expect(page).not.toContain("lux-section-kicker lux-chancellery-section-title\">Thread");
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#chancellery-case-panel.chancellery-case-panel');
        expect(modals).toContain('display: contents');
        expect(modals).toContain('.chancellery-case-header');
        expect(modals).toContain('.chancellery-case-identity');
        expect(modals).toContain('.chancellery-case-avatar');
        expect(modals).toContain('.chancellery-case-scroll');
        expect(modals).toContain('.chancellery-case-decision-banner');
        expect(modals).not.toContain('.chancellery-case-private-notes');
        expect(modals).not.toContain('.chancellery-case-composer');
    });

    it('admin-only case remove uses 3-step verification', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        expect(page).toContain('function removeChancelleryCase');
        expect(page).toContain('function buildChancelleryCaseRemoveVerification');
        expect(page).toContain('function runChancelleryRemoveVerification');
        expect(page).toContain("if (typeof runRegistrationRemoveVerification === 'function')");
        expect(page).toContain('data-chancellery-action="remove-case"');
        expect(page).toContain('lux-primary-btn lux-btn-danger');
        expect(page).toContain("removeChancelleryCase(String(actionTrigger.getAttribute('data-request-id') || ''))");
        expect(page).toContain('if (getEffectiveUserRole() !== USER_ROLES.ADMIN) return;');
        expect(page).toContain('Delete chancellery case "');
        expect(page).toContain('This permanently removes the petition and decision');
        expect(page).toContain('Type ${expectedToken} to confirm case deletion');
        expect(page).toContain('KIU_STATE.chancelleryRequests = ensureChancelleryRequestsStore()');
        expect(page).toContain('.filter((item) => String(item.id || \'\') !== request.id)');
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.chancellery-case-header-actions .lux-btn-danger');
    });

    it('adds compose admin-first copy and admin routing stage filter', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        expect(page).toContain('Choose a subject to open the official appeal document');
        expect(page).toContain('course staff see it after admin forwards');
        expect(page).toContain('data-chancellery-routing-filter="needs_forward"');
        expect(page).toContain('data-chancellery-routing-filter="forwarded"');
        expect(page).toContain('Needs forward');
        expect(page).toContain('function setChancelleryRoutingFilter');
        expect(page).toContain("routingFilter === 'needs_forward'");
    });
});
