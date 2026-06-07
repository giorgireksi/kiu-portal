import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin-orders route regressions', () => {
    it('keeps the shell free of dead page-pack imports and inline handlers', () => {
        const html = readSource('admin-orders.html');
        const appSource = readSource('assets/js/app/app.js');
        const pageScript = readSource('assets/js/pages/admin-orders.js');
        const messengerSource = readSource('assets/js/shared/messenger.js');
        const ordersWorkspace = readSource('assets/js/shared/orders-workspace.js');

        expect(html).toContain('assets/js/shared/messenger.js');
        expect(html).toContain('assets/js/shared/orders-workspace.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('oninput=');
        expect(html).not.toContain('onchange=');
        expect(html).not.toContain('setInterval(');
        expect(html).not.toContain('transition: all');
        expect(html).toContain('assets/js/pages/admin-orders.js?v=20260515-admin-orders-page1');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('data-admin-orders-close-modal="true"');
        expect(html).toContain('data-admin-orders-palette="obsidian-amber"');
        expect(html).toContain('data-admin-orders-interface-mode="dark"');
        expect(html).toContain('data-admin-orders-transparency="true"');
        expect(html).toContain('data-admin-orders-apply-custom-color="true"');
        expect(html).toContain('Colour &amp; Motion Studio');
        expect(html).toContain('Obsidian &amp; Amber');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'orders'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-admin-orders-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain('function bindAdminOrdersStudioControls()');
        expect(html).not.toContain('function ensureAdminOrdersContent()');
        expect(pageScript).toContain('function bindAdminOrdersStudioControls()');
        expect(pageScript).toContain('function ensureAdminOrdersContent()');
        expect(pageScript).toContain("window.addEventListener('load', ensureAdminOrdersContent, { once: true });");
        expect(pageScript).toContain("switchFacultyTheme(facultyCode, { refreshDependentViews: false });");
        expect(pageScript).toContain("window.refreshStandaloneDesktopRouteShellContext({ rerender: false, refreshActiveRoute: false });");
        expect(pageScript).not.toContain('window.syncAll();');
        expect(appSource).toContain("window.ensureOrdersNavLinks = function ensureOrdersNavLinksFallback()");
        expect(appSource).toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
        expect(appSource).toContain('window.getAllStudents = getAllStudents;');
        expect(appSource).toContain('window.getAllStaff = getAllStaff;');
        expect(messengerSource).not.toContain('function renderAdminOrders()');
        expect(messengerSource).not.toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
        expect(messengerSource).not.toContain("function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty())");
        expect(ordersWorkspace).not.toContain('oninput="updateAdminOrdersSearch(this.value)"');
        expect(ordersWorkspace).not.toContain('onclick="setAdminOrdersRoleFilter(');
        expect(ordersWorkspace).not.toContain('onchange="toggleAdminOrderRecipient(');
        expect(ordersWorkspace).not.toContain('onclick="selectAdminOrderRecord(');
        expect(ordersWorkspace).not.toContain('onclick="deleteAdminOrder(');
        expect(ordersWorkspace).toContain("'data-admin-orders-role-filter': role");
        expect(ordersWorkspace).toContain('data-admin-order-view="');
        expect(ordersWorkspace).toContain('orders-status-filter lux-filter-pill');
        expect(ordersWorkspace).toContain('orders-detail-panel lux-detail-panel');
        expect(ordersWorkspace).toContain('orders-metric-card lux-stack-card');
        expect(ordersWorkspace).toContain('orders-attachment-card lux-inline-card');
        expect(ordersWorkspace).toContain('orders-recipient-card lux-inline-card');
        expect(ordersWorkspace).toContain('function ensureAdminOrdersShell(root)');
        expect(ordersWorkspace).toContain('function renderAdminOrdersRecipientsPanelRegions(container, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients)');
        expect(ordersWorkspace).toContain('function createAdminRecipientRow(user, selectedRecipientSet)');
        expect(ordersWorkspace).toContain('function renderAdminOrdersRecipientsPanel(');
        expect(ordersWorkspace).toContain('function renderAdminOrdersComposePanel(');
        expect(ordersWorkspace).toContain('function renderAdminOrdersTablePanel(');
        expect(ordersWorkspace).toContain('function renderOrderDetailRegions(container, selectedOrder, options = {})');
        expect(ordersWorkspace).toContain('function renderAdminOrdersDetailPanel(container, selectedOrder)');
        expect(ordersWorkspace).toContain('renderAdminOrdersRecipientsPanelRegions(shell.recipientsPanel, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients);');
        expect(ordersWorkspace).toContain('shell.composePanel.innerHTML = renderAdminOrdersComposePanel(');
        expect(ordersWorkspace).toContain('shell.ordersTablePanel.innerHTML = renderAdminOrdersTablePanel(');
        expect(ordersWorkspace).toContain('container.replaceChildren(fragment);');
        expect(ordersWorkspace).toContain('renderAdminOrdersDetailPanel(shell.detailPanel, selectedOrder);');
        expect(html).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(html).toContain('assets/js/features/ui.js?v=20260429-peopleisolation1');
        expect(html).toContain('assets/js/features/index-luxury.js?v=20260531-partbg7');
    });

    it('keeps admin-orders glass tokens aligned with utilities and index dedupe', () => {
        const css = readSource('assets/css/admin-orders-route.css');
        const ordersCss = readSource('assets/css/orders-route.css');
        const luxuryCss = readSource('assets/css/index-luxury.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const html = readSource('admin-orders.html');

        expect(html).toContain('assets/css/admin-orders-route.css?v=20260602-aordersglass1');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260602-aordersglass1');
        expect(css).toContain('--aorders-fade-surface');
        expect(css).toContain('--aorders-fade-chip');
        expect(css).toContain('--aorders-fade-row');
        expect(css).toContain('--aorders-fade-modal');
        expect(css).toContain('#admin-orders-root .lux-summary-surface');
        expect(css).toContain('#admin-orders-root .lux-control');
        expect(css).toContain('#admin-orders-root .lux-status-pill');
        expect(css).toContain('#admin-orders-root .orders-detail-panel.lux-detail-panel');
        expect(css).toContain('background: var(--aorders-fade-surface) !important');
        expect(css).toContain('background: var(--aorders-fade-danger) !important');
        expect(css).toContain('background: var(--aorders-fade-control) !important');
        expect(css).toContain('#admin-orders-root .orders-admin-panel');
        expect(css).toContain('Command center restyle');
        expect(css).toContain('Panel shells');
        expect(css).toContain('#admin-orders-root .orders-admin-panel::before');
        expect(css).toContain('display: none !important');
        expect(luxuryCss).not.toContain('body.lux-entry-admin-orders .orders-shell');
        expect(luxuryCss).not.toContain('body.lux-entry-admin-orders #admin-orders-root .stat-card');
        expect(luxuryCss).toContain(':not(.lux-route-admin-orders) #admin-orders-root>*');
        expect(luxuryCss).toContain(':not(.lux-route-admin-orders) textarea');
        expect(luxuryCss).toMatch(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\):not\(\.lux-route-admin-orders\).*\.surface-card/
        );
        expect(luxuryCss).toMatch(
            /body\.lux-nonhome-page:not\(\.lux-route-students-admin\):not\(\.lux-route-admin-orders\).* \.lux-card::before/
        );
        expect(css).toContain('#admin-orders-root .orders-admin-hero-side');
        expect(css).toContain('#admin-orders-root .orders-admin-hero-side .lux-hero-signal');
        expect(css).toContain('Soft chrome');
        expect(css).toContain('#admin-orders-root .orders-recipient-list-shell');
        expect(css).toContain('#admin-orders-root .orders-metric-card');
        expect(css).toContain('html.lux-high-transparency body.lux-route-admin-orders');
        expect(ordersCss).toMatch(
            /html\.lux-high-transparency.*body\.lux-route-orders:not\(\.lux-light-mode\)/
        );
        expect(luxuryCss).not.toMatch(
            /html\.lux-high-transparency.*body\.lux-route-orders:not\(\.lux-light-mode\) \.orders-detail-card/
        );
        expect(utilitiesSource).toContain("el.classList.contains('orders-admin-hero-side')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-hero-signal')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-recipient-list-shell')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-metric-card')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-detail-empty')");
        expect(utilitiesSource).toContain("el.classList.contains('admin-orders-palette-option')");
        expect(utilitiesSource).toContain("el.classList.contains('admin-orders-studio-close')");
        expect(utilitiesSource).toContain("const isAdminOrdersRoute = document.body.classList.contains('lux-route-admin-orders');");
        expect(utilitiesSource).toContain('lux-route-admin-orders');
        expect(utilitiesSource).toContain('orders-admin-hero');
        expect(utilitiesSource).toContain('admin-orders-studio');
        expect(utilitiesSource).toContain("el.classList.contains('lux-control')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-status-pill')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-detail-panel')");
    });
});
