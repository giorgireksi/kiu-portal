import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadPortalLiveAlertRuntime(extra = {}) {
    const storage = new Map();
    const sessionStorage = {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        setItem: (key, value) => { storage.set(key, String(value)); }
    };
    const getCurrentUserId = extra.getCurrentUserId || (() => 'user-1');
    const sandbox = {
        sessionStorage,
        getCurrentUserId,
        window: {
            document: {
                getElementById: () => null,
                body: {
                    appendChild() {}
                },
                createElement: () => ({
                    id: '',
                    className: '',
                    setAttribute() {},
                    innerHTML: ''
                }),
                addEventListener() {}
            },
            sessionStorage,
            setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
            clearTimeout: () => {},
            clearInterval: () => {},
            setInterval: () => 1,
            addEventListener: () => {},
            getCurrentUserId,
            getPortalSystemNotificationIcon: () => 'fa-bell',
            ...extra
        }
    };
    sandbox.window.window = sandbox.window;
    sandbox.document = sandbox.window.document;
    vm.runInNewContext(readSource('assets/js/shared/portal-live-alert-runtime.js'), sandbox);
    return sandbox.window;
}

describe('portal-live-alert-runtime', () => {
    let win;

    beforeEach(() => {
        win = loadPortalLiveAlertRuntime();
    });

    it('documents 7s default duration and dismiss action', () => {
        const source = readSource('assets/js/shared/portal-live-alert-runtime.js');
        expect(source).toContain('const DEFAULT_DURATION_MS = 7000');
        expect(source).toContain('data-action="portal-live-alert-dismiss"');
        expect(win.__KIU_PORTAL_LIVE_ALERT_DEFAULT_MS).toBe(7000);
    });

    it('dedupes repeated alert ids', () => {
        const first = win.showPortalLiveAlert({ id: 'alert-1', title: 'Hello', text: 'World' });
        const second = win.showPortalLiveAlert({ id: 'alert-1', title: 'Hello', text: 'World' });
        expect(first).toBe('alert-1');
        expect(second).toBe('');
    });

    it('dismisses alerts manually', () => {
        win.showPortalLiveAlert({ id: 'alert-2', title: 'Dismiss me' });
        expect(win.dismissPortalLiveAlert('alert-2')).toBeUndefined();
    });

    it('wires auth loader and realtime handler', () => {
        const auth = readSource('assets/js/app/auth.js');
        const server = readSource('backend/platform/server.js');
        expect(auth).toContain('portal-live-alert-runtime.js?v=livealert1');
        expect(auth).toContain("case 'notification:created':");
        expect(server).toContain("type: 'notification:created'");
    });

    it('toasts local portal notifications from faculty.js', () => {
        const faculty = readSource('assets/js/shared/faculty.js');
        expect(faculty).toContain('showPortalLiveAlert');
    });

    it('collectLocalNotifications includes portal notification items', () => {
        const source = readSource('assets/js/shared/portal-live-alert-runtime.js');
        expect(source).toContain('getPortalNotificationItemsForUser');
    });

    it('merges base notification snapshot with live-alert cache', async () => {
        const baseItems = [
            { id: 'n1', title: 'A', text: 'a', read: false, createdAt: '2026-01-05' },
            { id: 'n2', title: 'B', text: 'b', read: false, createdAt: '2026-01-04' },
            { id: 'n3', title: 'C', text: 'c', read: false, createdAt: '2026-01-03' },
            { id: 'n4', title: 'D', text: 'd', read: false, createdAt: '2026-01-02' },
            { id: 'n5', title: 'E', text: 'e', read: false, createdAt: '2026-01-01' }
        ];
        const win = loadPortalLiveAlertRuntime({
            kiuPortalFetch: async () => ({ items: [] })
        });
        win.getNotificationSnapshot = () => ({ items: baseItems, unread: 5 });
        win.startPortalLiveAlertLoop();
        await win.pollPortalLiveAlerts(true);
        win.__kiuPortalLiveAlertSnapshot = {
            items: [{ id: 'c1', title: 'Cached', text: 'cache', read: false, createdAt: '2026-01-06', source: 'portal' }],
            unread: 1
        };
        const snapshot = win.getNotificationSnapshot({ id: 'user-1' });
        expect(snapshot.items.length).toBe(6);
        expect(snapshot.items.some((item) => item.id === 'c1')).toBe(true);
        expect(snapshot.items.some((item) => item.id === 'n5')).toBe(true);
    });
});
