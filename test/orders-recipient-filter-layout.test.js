import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
    buildMinimalOrdersRecipientFilterLayout,
    normalizeOrdersRecipientFilterRole,
    normalizeOrdersRecipientFilterLayout
} = require('../backend/platform/domains/orders-recipient-filter-service.js');
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('orders recipient filter layout', () => {
    it('normalizes empty layout to minimal team default', () => {
        expect(normalizeOrdersRecipientFilterLayout(null)).toEqual(buildMinimalOrdersRecipientFilterLayout());
        expect(normalizeOrdersRecipientFilterLayout({ version: 1, filters: [] }).filters).toEqual([]);
    });

    it('keeps one enabled select per field and drops invalid fields', () => {
        const normalized = normalizeOrdersRecipientFilterLayout({
            version: 1,
            filters: [
                {
                    id: 'custom_type',
                    type: 'select',
                    field: 'type',
                    label: 'Order type',
                    enabled: true,
                    options: [{ value: 'General Order', label: 'General Order' }]
                },
                {
                    id: 'custom_type_dup',
                    type: 'select',
                    field: 'type',
                    label: 'Duplicate',
                    enabled: true,
                    options: [{ value: 'HR Order', label: 'HR Order' }]
                },
                {
                    id: 'custom_bad',
                    type: 'select',
                    field: 'assignee',
                    label: 'Assignee',
                    enabled: true,
                    options: [{ value: 'x', label: 'X' }]
                },
                {
                    id: 'custom_kind',
                    type: 'select',
                    field: 'kind',
                    label: 'Kind',
                    enabled: false,
                    options: [{ value: 'announcement', label: 'Announcements' }]
                }
            ]
        });
        expect(normalized.filters.map((filter) => filter.field)).toEqual(['type', 'kind']);
        expect(normalized.filters[0].options[0].value).toBe('General Order');
        expect(normalized.filters[1].enabled).toBe(false);
    });

    it('does not seed default options when select options are missing', () => {
        const normalized = normalizeOrdersRecipientFilterLayout({
            version: 1,
            filters: [{
                id: 'empty_type',
                type: 'select',
                field: 'type',
                label: 'Type',
                enabled: true,
                options: []
            }]
        });
        expect(normalized.filters).toEqual([]);
    });

    it('strips legacy dateRange rows from stored layouts (From/To is universal)', () => {
        const normalized = normalizeOrdersRecipientFilterLayout({
            version: 1,
            filters: [{
                id: 'custom_date',
                type: 'dateRange',
                field: 'date',
                label: 'Sent date',
                enabled: true
            }]
        });
        expect(normalized.filters).toEqual([]);
    });

    it('normalizes recipient role scope to supported orders inbox roles', () => {
        expect(normalizeOrdersRecipientFilterRole('student')).toBe('student');
        expect(normalizeOrdersRecipientFilterRole('Professor')).toBe('professor');
        expect(normalizeOrdersRecipientFilterRole('student_service')).toBe('student_service');
        expect(normalizeOrdersRecipientFilterRole('admin')).toBe('student');
        expect(normalizeOrdersRecipientFilterRole('')).toBe('student');
    });

    it('allows admin save and rejects non-admin save', () => {
        const store = new PlatformStore({});
        store.upsertAccount({
            id: 'admin-1',
            email: 'admin1@example.com',
            displayName: 'Admin One',
            role: 'admin'
        });
        store.upsertAccount({
            id: 'student-1',
            email: 'student1@example.com',
            displayName: 'Student One',
            role: 'student'
        });

        const denied = store.saveOrdersRecipientFilterLayout({
            facultyCode: 'ECON',
            recipientRole: 'student',
            layout: {
                version: 1,
                filters: [{
                    id: 'custom_status',
                    type: 'select',
                    field: 'status',
                    label: 'Status',
                    enabled: true,
                    options: [{ value: 'Active', label: 'Active' }]
                }]
            }
        }, 'student-1', 'student');
        expect(denied?.status).toBe(403);

        const saved = store.saveOrdersRecipientFilterLayout({
            facultyCode: 'ECON',
            recipientRole: 'student',
            layout: {
                version: 1,
                filters: [{
                    id: 'custom_status',
                    type: 'select',
                    field: 'status',
                    label: 'Status',
                    enabled: true,
                    options: [{ value: 'Active', label: 'Active' }]
                }]
            }
        }, 'admin-1', 'admin');
        expect(saved?.ok).toBe(true);
        expect(saved.facultyCode).toBe('ECON');
        expect(saved.recipientRole).toBe('student');
        expect(saved.recipientFilterLayout.filters).toHaveLength(1);

        const loaded = store.getOrdersRecipientFilterLayout('ECON', 'student');
        expect(loaded.recipientFilterLayout.filters[0].field).toBe('status');
        expect(loaded.recipientRole).toBe('student');

        const otherFaculty = store.getOrdersRecipientFilterLayout('BM', 'student');
        expect(otherFaculty.recipientFilterLayout.filters).toEqual([]);
    });

    it('saves connected Orders roles only and leaves others untouched', () => {
        const store = new PlatformStore({});
        store.upsertAccount({
            id: 'admin-1',
            email: 'admin1@example.com',
            displayName: 'Admin One',
            role: 'admin'
        });

        store.saveOrdersRecipientFilterLayout({
            facultyCode: 'ECON',
            recipientRole: 'student',
            connectedRoles: ['student'],
            layout: {
                version: 1,
                filters: [{
                    id: 'shared_type',
                    type: 'select',
                    field: 'type',
                    label: 'Order type',
                    enabled: true,
                    options: [{ value: 'General Order', label: 'General Order' }]
                }]
            }
        }, 'admin-1', 'admin');

        store.saveOrdersRecipientFilterLayout({
            facultyCode: 'ECON',
            recipientRole: 'professor',
            connectedRoles: ['professor', 'ta'],
            layout: {
                version: 1,
                filters: [{
                    id: 'prof_kind',
                    type: 'select',
                    field: 'kind',
                    label: 'Kind',
                    enabled: true,
                    options: [{ value: 'announcement', label: 'Announcements' }]
                }]
            }
        }, 'admin-1', 'admin');

        const studentLoaded = store.getOrdersRecipientFilterLayout('ECON', 'student');
        const professorLoaded = store.getOrdersRecipientFilterLayout('ECON', 'professor');
        const taLoaded = store.getOrdersRecipientFilterLayout('ECON', 'ta');
        const ssLoaded = store.getOrdersRecipientFilterLayout('ECON', 'student_service');

        expect(studentLoaded.recipientFilterLayout.filters.map((filter) => filter.field)).toEqual(['type']);
        expect(professorLoaded.recipientFilterLayout.filters.map((filter) => filter.field)).toEqual(['kind']);
        expect(taLoaded.recipientFilterLayout.filters.map((filter) => filter.field)).toEqual(['kind']);
        expect(ssLoaded.recipientFilterLayout.filters).toEqual([]);
        expect(professorLoaded.connectedRoles).toEqual(['professor', 'ta']);
        expect(studentLoaded.connectedRoles).toEqual(['student']);
    });

    it('migrates legacy faculty-only layouts into every recipient role bucket', () => {
        const store = new PlatformStore({});
        store.state.orders = {
            recipientFilterLayoutByFaculty: {
                ECON: {
                    version: 1,
                    filters: [{
                        id: 'legacy_status',
                        type: 'select',
                        field: 'status',
                        label: 'Legacy status',
                        enabled: true,
                        options: [{ value: 'Active', label: 'Active' }]
                    }]
                }
            }
        };

        const studentLoaded = store.getOrdersRecipientFilterLayout('ECON', 'student');
        const professorLoaded = store.getOrdersRecipientFilterLayout('ECON', 'professor');

        expect(studentLoaded.recipientFilterLayout.filters.map((filter) => filter.field)).toEqual(['status']);
        expect(professorLoaded.recipientFilterLayout.filters.map((filter) => filter.field)).toEqual(['status']);
        expect(store.state.orders.recipientFilterLayoutByFaculty).toBeUndefined();
        expect(store.state.orders.recipientFilterLayoutByFacultyRole.ECON.student.filters[0].field).toBe('status');
    });

    it('wires admin audience mirror chrome and empty draft filters', () => {
        const workspace = readSource('assets/js/shared/orders-workspace.js');
        const inbox = readSource('assets/js/shared/orders-inbox.js');
        const core = readSource('assets/js/shared/orders-runtime-core.js');
        const routes = readSource('backend/platform/routes/orders-routes.js');
        const ssFilters = readSource('assets/js/pages/student-service-filters.js');
        const modals = readSource('assets/css/lux-modals.css');
        const service = readSource('backend/platform/domains/orders-recipient-filter-service.js');

        expect(routes).toContain('/api/orders/recipient-filter-layout');
        expect(routes).toContain('recipientRole');
        expect(core).toContain('fetchOrdersRecipientFilterLayout');
        expect(core).toContain('saveOrdersRecipientFilterLayout');
        expect(core).toContain('ordersRecipientFilterLayoutByFacultyRole');
        expect(core).toContain('recipientRole: role');
        expect(core).toContain("options: []");
        expect(core).toContain("id: 'universal_date'");
        expect(core).toContain('getEnabledOrdersRecipientLayoutDateRange');
        expect(core).toContain('Universal From/To');
        expect(core).toContain('normalizeOrdersFilterConnectedRoles');
        expect(core).not.toContain('Mirror shared droplists to every Orders inbox role');
        expect(core).toContain("Object.freeze(['type', 'status', 'kind'])");
        expect(core).not.toContain("Object.freeze(['type', 'status', 'kind', 'date'])");
        expect(core).not.toContain('ORDERS_RECIPIENT_FILTER_DEFAULT_OPTIONS');
        expect(service).not.toContain('ORDERS_RECIPIENT_FILTER_DEFAULT_OPTIONS');
        expect(service).not.toContain("date: 'Date'");
        expect(service).toContain("new Set(['type', 'status', 'kind'])");
        expect(service).toContain('mergeOrdersFilterConnections');
        expect(workspace).toContain('data-admin-orders-audience-role');
        expect(workspace).toContain('countAdminAudienceNotifications');
        expect(workspace).toContain('getCachedOrdersRecipientFilterLayout(faculty, audienceRole)');
        expect(workspace).not.toContain('data-admin-orders-sent-read-status');
        expect(workspace).toContain('data-admin-orders-sent-layout-filter');
        expect(workspace).toContain('data-admin-orders-sent-filter="dateFrom"');
        expect(workspace).toContain('data-admin-orders-sent-filter="dateTo"');
        expect(workspace).toContain('data-orders-recipient-filter-connected-role');
        expect(workspace).toContain('Connected roles');
        expect(workspace).toContain('Save for connected roles');
        expect(workspace).not.toContain('Edit filters · All roles');
        expect(workspace).not.toContain('One catalog for Students, Professors, TAs, and Student Service');
        expect(workspace).toContain('From/To are always on');
        expect(workspace).not.toContain('Recipients get From / To date inputs. No dropdown options.');
        expect(workspace).not.toContain("filter.field === 'date'");
        expect(workspace).not.toContain('Same layout this audience sees in their Orders inbox.');
        expect(workspace).toContain('orders-inbox-layout-filters');
        expect(workspace).toContain('lux-picker-field orders-inbox-layout-filter');
        expect(workspace).toContain('lux-tab-btn orders-admin-audience-tab');
        expect(workspace).not.toContain('lux-tab-btn orders-status-filter');
        expect(workspace).toContain('data-lux-skip-modern-button="true"');
        expect(workspace).not.toContain('orders-admin-filter-grid--layout');
        expect(workspace).not.toContain('orders-admin-audience-tab lux-filter-pill home-hover-chip');
        expect(workspace).not.toContain('orders-status-filter lux-filter-pill home-hover-chip');
        expect(workspace).toContain('Edit filters');
        expect(workspace).toContain('Add filter');
        expect(workspace).toContain('All types');
        expect(inbox).toContain('lux-tab-btn orders-status-filter');
        expect(inbox).toContain('data-lux-skip-modern-button');
        expect(inbox).not.toContain('orders-status-filter lux-filter-pill home-hover-chip');
        expect(inbox).toContain('lux-tab-strip lux-tab-strip--segmented');
        expect(readSource('assets/css/lux-page-bare-lite.css')).toContain('Reassert lux-controls segmented strip recipe');
        expect(readSource('assets/js/features/luxury-index-runtime.js')).toContain('!/\\blux-tab-btn\\b/i.test(className)');
        expect(workspace).toContain('orders-recipient-filter-editor-modal modal-content lux-panel');
        expect(workspace).toContain('orders-recipient-filter-editor-head modal-header');
        expect(workspace).toContain('orders-recipient-filter-editor-body modal-body');
        expect(workspace).toContain('orders-recipient-filter-editor-actions modal-footer');
        expect(workspace).toContain("recipientFilterOverlay.className = 'modal-overlay orders-recipient-filter-editor-overlay'");
        expect(workspace).toContain("recipientFilterOverlay.setAttribute('data-lux-transparency-exempt', '1')");
        expect(workspace).not.toContain("recipientFilterOverlay.className = 'modal-overlay admin-orders-modal-overlay'");
        expect(workspace).not.toContain('data-orders-recipient-filter-role');
        expect(workspace).not.toContain("data-admin-orders-sent-filter=\"type\"");
        expect(workspace).not.toContain("data-admin-orders-sent-filter=\"recipientRole\"");
        expect(modals).toContain('.orders-recipient-filter-editor-overlay.modal-overlay');
        expect(modals).toContain('.modal-content.lux-panel[data-lux-transparency-exempt="1"]');
        expect(modals).toContain('.orders-recipient-filter-editor-row.lux-soft-chrome.home-hover-chip');
        expect(readSource('assets/css/lux-page-bare-lite.css')).toContain(
            'body:is(.lux-route-admin-orders, .lux-entry-admin-orders, .lux-route-chancellery) .orders-recipient-filter-editor-modal.modal-content'
        );
        expect(readSource('assets/css/lux-page-bare-lite.css')).toContain(
            '.orders-recipient-filter-editor-head .lux-tab-strip--segmented'
        );
        expect(workspace).toMatch(/class="lux-(?:primary|secondary)-btn home-hover-chip"[^>]*data-orders-recipient-filter/);
        expect(workspace).toContain('data-lux-skip-modern-button="true" data-orders-recipient-filter-save');
        expect(workspace).toContain('orders-recipient-filter-editor-row lux-soft-chrome home-hover-chip');
        expect(modals).toMatch(/\.modal-overlay\s*\{[\s\S]*?justify-content:\s*center/);
        expect(modals).toMatch(/\.modal-overlay\s*\{[\s\S]*?align-items:\s*center/);
        expect(workspace).not.toContain('Save for me');
        expect(inbox).toContain('data-recipient-order-layout-filter');
        expect(inbox).toContain('data-recipient-order-date-filter');
        expect(inbox).toContain('getEnabledOrdersRecipientLayoutSelects');
        expect(inbox).toContain('getEnabledOrdersRecipientLayoutDateRange');
        expect(inbox).toContain('matchesOrdersLayoutDateRange');
        expect(inbox).toContain('ordersRecipientLayoutHydratedKey');
        expect(inbox).toContain('fetchOrdersRecipientFilterLayout(getCurrentFaculty(), currentUser.role)');
        expect(inbox).toContain('data-recipient-order-status');
        expect(inbox).toContain('data-recipient-order-search');
        expect(ssFilters).toContain('Save for me');
    });

    it('applies layout filters in recipient visibility helper source', () => {
        const inbox = readSource('assets/js/shared/orders-inbox.js');
        expect(inbox).toContain("filter.field === 'type'");
        expect(inbox).toContain("filter.field === 'status'");
        expect(inbox).toContain("filter.field === 'kind'");
        expect(inbox).toContain('getRecipientOrderKind(order)');
        expect(inbox).toContain('matchesOrdersLayoutDateRange');
    });
});
