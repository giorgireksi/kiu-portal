import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('admin orders title presets', () => {
    it('compose head exposes Titles control next to the title input', () => {
        const workspace = readSource('assets/js/shared/orders-workspace.js');
        expect(workspace).toContain('orders-compose-title-field');
        expect(workspace).toContain('orders-compose-title-toolbar');
        expect(workspace).toContain('data-admin-orders-manage-titles="1"');
        expect(workspace).toContain('data-admin-order-draft-input="title"');
        expect(workspace).toContain('openAdminOrdersTitlePresets');
    });

    it('ships a dedicated titles overlay with CRUD + apply + save hooks', () => {
        const workspace = readSource('assets/js/shared/orders-workspace.js');
        expect(workspace).toContain("admin-orders-titles-overlay");
        expect(workspace).toContain('admin-orders-titles-modal modal-content lux-panel');
        expect(workspace).toContain('data-admin-orders-titles-add="1"');
        expect(workspace).toContain('data-admin-orders-titles-save="1"');
        expect(workspace).toContain('data-admin-orders-title-apply');
        expect(workspace).toContain('data-admin-orders-title-remove');
        expect(workspace).toContain('data-admin-orders-title-edit');
        expect(workspace).toContain('kiuAdminOrderTitlePresets');
        expect(workspace).toContain('function readAdminOrderTitlePresets');
        expect(workspace).toContain('function writeAdminOrderTitlePresets');
        expect(workspace).toContain('normalizeAdminOrderTitlePresetsList');
        expect(workspace).toContain('applyAdminOrderTitlePreset');
        expect(workspace).toContain('isAdminOrdersTitlePresetsOpen()');
    });

    it('styles the titles overlay above create and lays out the compose title toolbar', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(modals).toContain('.admin-orders-titles-overlay.modal-overlay');
        expect(modals).toContain('z-index: 2450');
        expect(modals).toContain('.admin-orders-titles-modal.modal-content');
        expect(modals).toContain('.admin-orders-titles-head');
        expect(bare).toContain('.orders-compose-title-field');
        expect(bare).toContain('.orders-compose-title-toolbar');
    });

    it('cache-busts admin-orders assets for titles presets', () => {
        const html = readSource('admin-orders.html');
        expect(html).toMatch(/lux-modals\.css\?v=20260730-chanfiltercss1/);
        expect(html).toMatch(/lux-page-bare-lite\.css\?v=20260730-filterbtncss1/);
        expect(html).toMatch(/orders-workspace\.js\?v=20260730-filterbtncss1/);
    });
});
