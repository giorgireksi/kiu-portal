import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { JSDOM } from 'jsdom';

const source = readFileSync(
    join(process.cwd(), 'assets/js/pages/social-pagination-runtime.js'),
    'utf8'
);

function loadPagination(url = 'https://example.test/social.html', options = {}) {
    const dom = new JSDOM('<!doctype html><body></body>', { url });
    const runtime = { ui: { activePanel: 'feed' } };
    if (options.storedPageSize) {
        dom.window.localStorage.setItem('KIU_SOCIAL_PAGINATION_PAGE_SIZE', String(options.storedPageSize));
    }
    const sandbox = {
        window: dom.window,
        document: dom.window.document,
        URL,
        console,
        Set,
        Map,
        Array,
        Math,
        Number,
        String,
        JSON,
        Object
    };
    sandbox.window.__kiuSocialLiteRuntime = runtime;
    sandbox.window.renderSocialPageNow = () => {};
    vm.runInNewContext(source, sandbox);
    return { dom, runtime, pagination: sandbox.window.KiuSocialPagination };
}

describe('social pagination runtime', () => {
    it('defaults to infinite mode and exposes the global mode control', () => {
        const { pagination, runtime } = loadPagination();

        expect(pagination.currentMode()).toBe('infinite');
        expect(pagination.currentPageSize()).toBe(20);
        expect(pagination.PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100]);
        expect(runtime.ui.socialPaginationMode).toBe('infinite');
        expect(pagination.renderModeControl('feed')).toContain('data-social-pagination-mode="pages"');
        expect(pagination.renderModeControl('feed')).toContain('data-action="social-pagination-page-size"');
        expect(pagination.renderModeControl('feed')).toContain('aria-pressed="true"');
    });

    it('renders a twenty-item page and numbered controls without changing collection markup', () => {
        const { dom, pagination, runtime } = loadPagination();
        const center = dom.window.document.createElement('main');
        const list = dom.window.document.createElement('section');
        for (let index = 0; index < 45; index += 1) {
            const item = dom.window.document.createElement('article');
            item.className = 'social-neo-post-card';
            list.appendChild(item);
        }
        center.appendChild(list);

        pagination.setMode('pages');
        pagination.decorate(center, 'feed');

        expect(runtime.ui.socialPaginationMode).toBe('pages');
        expect(list.querySelectorAll('.social-neo-post-card:not([hidden])')).toHaveLength(20);
        expect(list.querySelectorAll('.social-neo-post-card[hidden]')).toHaveLength(25);
        expect(center.querySelector('[data-social-pagination-controls="feed"]')).not.toBeNull();
        expect(center.querySelectorAll('[data-action="social-pagination-page"]')).not.toHaveLength(0);

        pagination.setPage('feed', 3);
        pagination.decorate(center, 'feed');
        expect(list.querySelectorAll('.social-neo-post-card:not([hidden])')).toHaveLength(5);
        expect(new URL(dom.window.location.href).searchParams.get('socialPage')).toBe('3');
    });

    it('hydrates panel and page from shareable URL state', () => {
        const { pagination, runtime } = loadPagination(
            'https://example.test/social.html?socialView=pages&socialPanel=photography&socialPage=4'
        );

        expect(pagination.currentMode()).toBe('pages');
        expect(runtime.ui.activePanel).toBe('photography');
        expect(runtime.ui.socialPaginationPages.photography).toBe(4);
    });

    it('prefers a valid URL page size over the remembered global preference', () => {
        const { pagination, runtime } = loadPagination(
            'https://example.test/social.html?socialView=pages&socialPanel=feed&socialPageSize=50',
            { storedPageSize: 10 }
        );

        expect(pagination.currentPageSize()).toBe(50);
        expect(runtime.ui.socialPaginationPageSize).toBe(50);
    });

    it('resets the active page and clamps the rendered slice when page size changes', () => {
        const { dom, pagination, runtime } = loadPagination();
        const center = dom.window.document.createElement('main');
        const list = dom.window.document.createElement('section');
        for (let index = 0; index < 45; index += 1) {
            const item = dom.window.document.createElement('article');
            item.className = 'social-neo-post-card';
            list.appendChild(item);
        }
        center.appendChild(list);

        pagination.setMode('pages');
        pagination.setPageSize(10);
        pagination.setPage('feed', 5);
        pagination.decorate(center, 'feed');
        expect(list.querySelectorAll('.social-neo-post-card:not([hidden])')).toHaveLength(5);

        pagination.setPageSize(50);
        pagination.decorate(center, 'feed');
        expect(runtime.ui.socialPaginationPageSize).toBe(50);
        expect(list.querySelectorAll('.social-neo-post-card:not([hidden])')).toHaveLength(45);
        expect(list.querySelectorAll('.social-neo-post-card[hidden]')).toHaveLength(0);
        expect(new URL(dom.window.location.href).searchParams.get('socialPage')).toBe('1');
        expect(new URL(dom.window.location.href).searchParams.get('socialPageSize')).toBe('50');
    });

    it('covers representative flat, nested, photography, and workspace collections', () => {
        const { dom, pagination, runtime } = loadPagination();
        pagination.setMode('pages');

        const cases = [
            { panel: 'photography', selector: '.social-photo-grid-tile', count: 21 },
            { panel: 'workspace', selector: '.social-project-activity-item', count: 21 }
        ];
        cases.forEach(({ panel, selector, count }) => {
            runtime.ui.activePanel = panel;
            pagination.syncPanel(panel);
            const center = dom.window.document.createElement('main');
            const list = dom.window.document.createElement('section');
            for (let index = 0; index < count; index += 1) {
                const item = dom.window.document.createElement('article');
                item.className = selector.slice(1);
                list.appendChild(item);
            }
            center.appendChild(list);
            pagination.decorate(center, panel);
            expect(list.querySelectorAll(`${selector}:not([hidden])`)).toHaveLength(20);
            expect(center.querySelector(`[data-social-pagination-controls="${panel}"]`)).not.toBeNull();
        });

        runtime.ui.activePanel = 'events';
        pagination.syncPanel('events');
        const eventsCenter = dom.window.document.createElement('main');
        const eventList = dom.window.document.createElement('section');
        eventList.className = 'social-neo-stack';
        for (let index = 0; index < 21; index += 1) {
            const group = dom.window.document.createElement('section');
            group.className = 'social-neo-event-date-group';
            const body = dom.window.document.createElement('div');
            const item = dom.window.document.createElement('article');
            item.className = 'social-neo-event-feature';
            body.appendChild(item);
            group.appendChild(body);
            eventList.appendChild(group);
        }
        eventsCenter.appendChild(eventList);
        pagination.decorate(eventsCenter, 'events');
        expect(eventList.querySelectorAll('.social-neo-event-feature:not([hidden])')).toHaveLength(20);
        expect(eventList.querySelectorAll('.social-neo-event-date-group[hidden]')).toHaveLength(1);
    });
});
