import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('orders route regressions', () => {
    it('keeps non-admin orders as a real standalone route with the shared orders runtime', () => {
        const ordersHtml = readSource('orders.html');
        const indexHtml = readSource('index.html');
        const appSource = readSource('assets/js/app/app.js');
        const navigationSource = readSource('assets/js/features/navigation.js');
        const messengerSource = readSource('assets/js/shared/messenger.js');
        const ordersWorkspace = readSource('assets/js/shared/orders-workspace.js');

        expect(indexHtml).toContain('id="page-orders"');
        expect(indexHtml).not.toContain('assets/js/shared/orders-workspace.js?v=20260516-orders-workspace1');
        expect(appSource).toContain("const ORDERS_RUNTIME_SCRIPT = 'assets/js/shared/orders-workspace.js?v=20260516-orders-workspace1';");
        expect(appSource).toContain('window.ensurePortalOrdersRuntimeLoaded = function ensurePortalOrdersRuntimeLoaded()');
        expect(navigationSource).toContain('const PORTAL_STANDALONE_ROUTE_IDS = new Set([');
        expect(navigationSource).toContain("'orders'");

        expect(ordersHtml).toContain('id="page-orders"');
        expect(ordersHtml).toContain('assets/js/shared/orders-workspace.js?v=20260516-orders-workspace1');
        expect(ordersHtml).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(ordersHtml).toContain('bootStandaloneOrdersPage');
        expect(ordersHtml).not.toContain('assets/js/shared/social-hub.js');
        expect(ordersHtml).not.toContain('assets/js/shared/social-render.js');
        expect(ordersHtml).not.toContain('assets/js/shared/social-media.js');
        expect(ordersHtml).not.toContain('assets/js/shared/messenger.js');
        expect(ordersHtml).not.toContain('assets/js/pages/gradebook.js');
        expect(ordersHtml).not.toContain('assets/js/pages/lms.js');
        expect(ordersHtml).not.toContain('assets/js/pages/registration.js');
        expect(ordersHtml).not.toContain('assets/js/pages/planner.js');
        expect(ordersHtml).not.toContain('assets/js/pages/directories.js');
        expect(ordersHtml).not.toContain('assets/js/pages/student-registration.js');
        expect(ordersHtml).not.toContain('assets/js/pages/admin-registration.js');
        expect(ordersHtml).not.toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(ordersHtml).not.toContain('assets/js/pages/standalone-mobile-shell.js?v=20260518-standalone-shell1');
        expect(ordersHtml).not.toContain('(function initMobileExperience(){');
        expect(ordersHtml).not.toContain('setInterval(function(){if(typeof window.navigate===');
        expect(ordersHtml).not.toContain("window.location.replace(target);");

        expect(appSource).toContain("window.ensureOrdersNavLinks = function ensureOrdersNavLinksFallback()");
        expect(appSource).toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
        expect(appSource).toContain('window.getAllStudents = getAllStudents;');
        expect(appSource).toContain('window.getAllStaff = getAllStaff;');
        expect(messengerSource).not.toContain('function renderOrdersInboxPage()');
        expect(messengerSource).not.toContain('function renderAdminOrders()');
        expect(messengerSource).not.toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
        expect(messengerSource).not.toContain("function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty())");
        expect(ordersWorkspace).toContain('function renderOrdersInboxPage()');
        expect((ordersWorkspace.match(/function renderOrdersInboxPage\(\)/g) || []).length).toBe(1);
        expect(ordersWorkspace).toContain('function renderAdminOrders()');
        expect(ordersWorkspace).not.toContain('function renderOrdersInboxPageLegacySnapshot()');
        expect(ordersWorkspace).toContain('orders-inbox-hero lux-summary-surface lux-summary-surface--hero');
        expect(ordersWorkspace).toContain('lux-stat-card lux-summary-surface lux-summary-surface--panel');
        expect(ordersWorkspace).not.toContain('oninput="updateAdminOrdersSearch(this.value)"');
        expect(ordersWorkspace).not.toContain('onclick="setAdminOrdersRoleFilter(');
        expect(ordersWorkspace).not.toContain('onchange="toggleAdminOrderRecipient(');
        expect(ordersWorkspace).not.toContain('onclick="selectAdminOrderRecord(');
        expect(ordersWorkspace).not.toContain('onclick="deleteAdminOrder(');
        expect(ordersWorkspace).not.toContain('oninput="updateRecipientOrdersSearch(this.value)"');
        expect(ordersWorkspace).not.toContain('onclick="setRecipientOrdersStatus(');
        expect(ordersWorkspace).not.toContain('onclick="openRecipientOrder(');
        expect(ordersWorkspace).toContain('data-admin-orders-role-filter=');
        expect(ordersWorkspace).toContain('data-admin-order-view=');
        expect(ordersWorkspace).toContain('data-recipient-order-status=');
        expect(ordersWorkspace).toContain('data-recipient-order-open=');
        expect(ordersWorkspace).toContain('function renderOrderDetailRegions(container, selectedOrder, options = {})');
        expect(ordersWorkspace).toContain('function renderRecipientOrdersListPanelV2(uiState, allOrders, orders, selectedOrder, currentUser)');
        expect(ordersWorkspace).toContain('function renderRecipientOrdersListPanelRegions(container, uiState, allOrders, orders, selectedOrder, currentUser)');
        expect(ordersWorkspace).toContain('function renderAdminOrdersRecipientsPanelRegions(container, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients)');
        expect(ordersWorkspace).toContain('function createRecipientOrdersListItem(order, currentUser, selectedOrder)');
        expect(ordersWorkspace).toContain('function createAdminRecipientRow(user, selectedRecipientSet)');
        expect(ordersWorkspace).toContain('function renderRecipientOrdersDetailRegions(container, selectedOrder)');
        expect(ordersWorkspace).toContain('function ensureRecipientOrdersShell(container)');
        expect(ordersWorkspace).toContain('function renderRecipientOrdersListPanel(');
        expect(ordersWorkspace).toContain('function renderRecipientOrdersDetailPanel(');
        expect(ordersWorkspace).toContain('shell.heroStats.innerHTML = renderRecipientOrdersHeroStats(');
        expect(ordersWorkspace).toContain('renderRecipientOrdersListPanelRegions(shell.listPanel, uiState, allOrders, orders, selectedOrder, currentUser);');
        expect(ordersWorkspace).toContain('renderAdminOrdersRecipientsPanelRegions(shell.recipientsPanel, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients);');
        expect(ordersWorkspace).toContain('container.replaceChildren(fragment);');
        expect(ordersWorkspace).toContain('renderRecipientOrdersDetailRegions(shell.detailPanel, selectedOrder);');
    });

    it('keeps the standalone orders page free of mojibake markers and preserves the live workspace labels in the runtime owner', () => {
        const ordersHtml = readSource('orders.html');
        const ordersWorkspace = readSource('assets/js/shared/orders-workspace.js');

        expect(ordersHtml).not.toContain('ÃƒÆ’');
        expect(ordersHtml).not.toContain('Ã¯Â¿Â½');
        expect(ordersHtml).toContain('bootStandaloneOrdersPage');
        expect(ordersWorkspace).toContain('Orders Inbox');
        expect(ordersWorkspace).toContain('Official orders and decisions');
        expect(ordersWorkspace).toContain('My Orders');
    });
});
