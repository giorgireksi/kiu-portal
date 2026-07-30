import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin orders thread modal layout', () => {
    it('uses a document viewer shell without chat composer or reply controls', () => {
        const workspace = readSource('assets/js/shared/orders-workspace.js');
        const modals = readSource('assets/css/lux-modals.css');

        expect(workspace).toContain('admin-orders-thread-modal modal-content lux-panel');
        expect(workspace).toContain('admin-orders-thread-header modal-header');
        expect(workspace).toContain('admin-orders-thread-body modal-body lux-scrollbar');
        expect(workspace).toContain('data-admin-order-detail-body');
        expect(workspace).toContain('aria-label="Order details"');
        expect(workspace).toContain('aria-label="Close order details"');
        expect(workspace).toContain('renderOrderDetailDescriptionMarkup');
        expect(workspace).toContain('renderOrderDetailAttachmentsMarkup');
        expect(workspace).toContain('orders-admin-filter-strip');
        expect(workspace).toContain('Items · ${escapeHtml(getOrdersRecipientFilterEditorRoleLabel(getAdminAudienceRole()))}');
        expect(workspace).not.toContain('orders-admin-audience-filter-head');
        expect(workspace).not.toContain('Dispatch institutional orders');
        expect(workspace).toContain('thread: []');
        expect(workspace).toContain('legacy thread arrays stay inert');

        expect(workspace).not.toContain('admin-orders-thread-chat-log');
        expect(workspace).not.toContain('admin-orders-thread-composer');
        expect(workspace).not.toContain('data-admin-order-thread-remove-open');
        expect(workspace).not.toContain('confirmThreadReplyDelete');
        expect(workspace).not.toContain('function deleteAdminOrderThreadEntry');
        expect(workspace).not.toContain('function sendAdminOrderThreadReply');
        expect(workspace).not.toContain('function appendAdminOrderThreadReply');
        expect(workspace).not.toContain('threadRemoveWasOpen');
        expect(workspace).not.toContain('document.body.appendChild(threadRemoveOverlay)');
        expect(workspace).toContain('document.body.appendChild(threadOverlay)');
        expect(workspace).toContain('staleRemoveOverlay.remove()');
        expect(workspace).toContain('threadWasOpen');
        expect(workspace).toMatch(/threadWasOpen[\s\S]*?classList\.add\('active'\)/);

        expect(modals).toContain('.admin-orders-thread-modal > #admin-orders-thread-panel');
        expect(modals).toContain('display: contents');
        expect(modals).toContain('.admin-orders-thread-header');
        expect(modals).toContain('.admin-orders-thread-body');
        expect(modals).not.toContain('.admin-orders-thread-chat-log');
        expect(modals).not.toContain('.admin-orders-thread-composer');
        expect(modals).not.toContain('#admin-orders-thread-remove-overlay');
        expect(modals).not.toContain('.admin-orders-thread-msg-bubble');
    });
});
