import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('orders route regressions', () => {
    it('keeps orders inbox glass tokens aligned with utilities and index dedupe', () => {
        const css = readSource('assets/css/orders-route.css');
        const luxuryCss = readSource('assets/css/index-luxury.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const ordersHtml = readSource('orders.html');
        const indexHtml = readSource('index.html');
        const ordersSource = readSource('assets/js/shared/orders-workspace.js');

        expect(ordersHtml).toContain('assets/css/orders-route.css?v=20260531-ordersglass1');
        expect(ordersHtml).toContain('assets/js/shared/utilities.js?v=20260531-routeglass3');
        expect(ordersHtml).toContain('assets/js/shared/orders-workspace.js?v=20260604-ordersboot1');
        expect(indexHtml).toContain('assets/css/orders-route.css?v=20260531-ordersglass1');
        expect(indexHtml).toContain('assets/js/shared/utilities.js?v=20260531-routeglass3');
        expect(indexHtml).toContain('assets/css/index-luxury.css?v=20260531-partbg4');

        expect(css).toContain('--orders-fade-surface');
        expect(css).toContain('--orders-fade-chip');
        expect(css).toContain('--orders-fade-row');
        expect(css).toContain('--orders-fade-blur');
        expect(css).toContain(':is(#page-orders, #orders-inbox-root) .orders-inbox-hero');
        expect(css).toContain(':is(#page-orders, #orders-inbox-root) .lux-control');
        expect(css).toContain(':is(#page-orders, #orders-inbox-root) .orders-metric-card');
        expect(css).toContain('background: var(--orders-fade-surface) !important');
        expect(css).toContain('Home-style command center restyle');
        expect(css).toContain('html.lux-high-transparency body.lux-route-home');

        expect(luxuryCss).not.toContain('body.lux-route-orders .orders-inbox-hero {');
        expect(luxuryCss).not.toContain('Orders inbox: keep the live JS-rendered widgets');

        expect(utilitiesSource).toContain("el.closest?.('#page-orders, #orders-inbox-root')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-inbox-hero')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-list-card')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-detail-card')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-item')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-status-filter')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-list-wrap')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-hero-signal')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-metric-card')");
        expect(utilitiesSource).toContain("el.classList.contains('orders-detail-empty')");
        expect(utilitiesSource).not.toContain("'.orders-inbox-shell', '.orders-recipient-list-shell'");
        expect(ordersSource).toContain('function renderOrdersInboxAccessState(container, message)');
        expect(ordersSource).toContain('Orders workspace unavailable');
        expect(ordersSource).toContain("document.addEventListener('DOMContentLoaded', renderOrdersInboxPage, { once: true });");
    });
});
