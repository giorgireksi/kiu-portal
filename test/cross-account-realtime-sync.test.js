import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('cross-account realtime isolation and refresh', () => {
    it('stores active auth and backend sessions per browser tab', () => {
        const api = read('assets/js/app/api.js');
        const auth = read('assets/js/app/auth.js');
        const login = read('assets/js/pages/login-runtime.js');
        expect(api).toContain("sessionStorage.setItem(KIU_TAB_SESSION_TOKEN_KEY");
        expect(api).toContain("sessionStorage.setItem(KIU_TAB_AUTH_STATE_KEY");
        expect(auth).toContain("sessionStorage.getItem('KIU_TAB_AUTH_STATE')");
        expect(login).toContain("sessionStorage.setItem('KIU_TAB_PORTAL_SESSION_TOKEN'");
        expect(login).toContain("sessionStorage.setItem('KIU_TAB_AUTH_STATE'");
        expect(auth).toContain('startKiuMessengerSnapshotFallback');
        expect(auth).toContain("/api/messenger/snapshot?userId=");
    });

    it('emits targeted mail and orders changes and handles them in the client', () => {
        const mail = read('backend/platform/routes/mail-routes.js');
        const orders = read('backend/platform/routes/orders-routes.js');
        const auth = read('assets/js/app/auth.js');
        expect(mail).toContain("type: 'mail:updated'");
        expect(orders).toContain("type: 'orders:updated'");
        expect(auth).toContain("case 'mail:updated':");
        expect(auth).toContain("case 'orders:updated':");
    });

    it('emits academic changes for other open accounts to refresh authorized data', () => {
        const academic = read('backend/platform/routes/academic-routes.js');
        const auth = read('assets/js/app/auth.js');
        expect(academic).toContain("type: 'academic:updated'");
        expect(auth).toContain("case 'academic:updated':");
    });
});
