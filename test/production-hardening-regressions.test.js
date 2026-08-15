import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('production hardening regressions', () => {
    it('runs the backend as the node user after root-only setup work', () => {
        const dockerfile = readSource('Dockerfile');
        const compose = readSource('docker-compose.production.yml');

        expect(dockerfile).toContain('\nUSER node\n');
        expect(dockerfile).not.toContain('su-exec');
        expect(dockerfile).toContain('node tools/migrate-postgres.js && exec node backend/platform/server.js');
        expect(compose).toContain('node tools/migrate-postgres.js && exec node backend/platform/server.js');
        expect(compose).toContain('read_only: true');
        expect(compose).toContain('cap_drop:\n      - ALL');
        expect(compose).toContain('no-new-privileges:true');
    });

    it('uses the production env source and hides internal repo material from Caddy file serving', () => {
        const compose = readSource('docker-compose.production.yml');
        const caddyfile = readSource('infra/caddy/Caddyfile');

        expect(compose).toContain('- .env.production');
        expect(compose).not.toContain('- .env\n');
        expect(caddyfile).toContain('hide /.env');
        expect(caddyfile).toContain('hide /backend');
        expect(caddyfile).toContain('hide /docs');
        expect(caddyfile).toContain('hide /tools');
        expect(caddyfile).toContain('hide /.git');
        expect(caddyfile).toContain('hide /anti-cheat');
        expect(caddyfile).toContain('hide /package.json');
    });

    it('keeps local static serving bounded and adds browser isolation headers', () => {
        const server = readSource('tools/local_dev_server.js');

        expect(server).toContain("if (!['GET', 'HEAD'].includes(String(request.method || '').toUpperCase())");
        expect(server).toContain("'X-Content-Type-Options': 'nosniff'");
        expect(server).toContain("'X-Frame-Options': 'SAMEORIGIN'");
    });

    it('rejects weak production credentials in readiness gates', () => {
        const checker = readSource('tools/check-production-readiness.js');

        expect(checker).toContain('hasStrongSecret');
        expect(checker).toContain('KIU_ADMIN_PASSWORD');
        expect(checker).toContain('KIU_FIREBASE_SERVICE_ACCOUNT_FILE or JSON');
    });

    it('does not let pre-bootstrap browser state overwrite the server in production', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain('window.__KIU_PORTAL_BOOTSTRAP_PENDING');
        expect(api).toContain("pendingSyncReason = 'beforeunload'");
        expect(api).toContain('navigation-before-bootstrap');
    });

    it('dedups bootstrap on the in-flight request so a refreshed session hydrates from the server', () => {
        const api = readSource('assets/js/app/api.js');

        // The schedule guard must check a genuine in-flight bootstrap, not the sticky
        // module-load flag that never clears on a refresh without a force call.
        expect(api).toContain('runtime.bootstrapScheduled');
        expect(api).toContain('runtime.bootstrapPromise || runtime.bootstrapScheduled');
        // The old guard swallowed every schedule while the sticky module-load flag was
        // set, so a refreshed session never hydrated. It must no longer be present.
        expect(api).not.toContain("!force && typeof window !== 'undefined' && window.__KIU_PORTAL_BOOTSTRAP_PENDING)");
    });

    it('persists staff-authored content keys and reports role-dropped keys', () => {
        const store = readSource('backend/platform/store.js');
        const route = readSource('backend/platform/routes/portal-support-routes.js');
        const api = readSource('assets/js/app/api.js');

        // Professor/TA/admin may author these global content keys; students cannot.
        expect(store).toContain('PORTAL_STAFF_AUTHORED_GLOBAL_KEYS');
        expect(store).toContain("'timetable'");
        expect(store).toContain("'assignments'");
        expect(store).toContain("'availableGroups'");
        expect(store).toContain('PORTAL_ADMIN_AUTHORED_SCHEDULE_KEYS');
        expect(store).toContain('merged[key] = clone(value)');
        expect(store).toContain('droppedKeys.push(key)');
        // Server tracks keys the session role could not persist and returns them.
        expect(store).toContain('droppedKeys.push(key)');
        expect(route).toContain('droppedKeys: Array.isArray(savedState?.droppedKeys)');
        expect(api).toContain('KIU_PORTAL_DROPPED_KEYS');
    });

    it('flushes unsaved edits reliably on unload with sendBeacon and a dirty flag', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain('dirtySinceLastSync');
        expect(api).toContain('navigator.sendBeacon');
        expect(api).toContain("reason: 'beforeunload'");
        expect(api).toContain('runtime.bootstrapScheduled');
    });

    it('refreshes other sessions after a durable portal-state write without self-echo loss', () => {
        const api = readSource('assets/js/app/api.js');
        const auth = readSource('assets/js/app/auth.js');
        const route = readSource('backend/platform/routes/portal-support-routes.js');

        expect(api).toContain('schedulePortalStateRefreshFromRealtime');
        expect(api).toContain('runtime.dirtySinceLastSync');
        expect(api).toContain('flushPortalStateSync({ forceLatest: true })');
        expect(auth).toContain("case 'portal:state-upsert':");
        expect(auth).toContain('schedulePortalStateRefreshFromRealtime(payload)');
        expect(route).toContain("sessionToken: String(sessionAccount?.token || '').trim()");
    });

    it('keeps account records and portal directory mirrors synchronized', () => {
        const accounts = readSource('backend/platform/domains/accounts-service.js');
        const staff = readSource('assets/js/pages/staff-command-center.js');
        const students = readSource('assets/js/pages/students-command-center.js');

        expect(accounts).toContain('syncAccountToPortalState');
        expect(accounts).toContain('inferPortalStaffIdentity');
        expect(accounts).toContain("staffTypeId === 'ta'");
        expect(staff).toContain('{ syncPortalState: true }');
        expect(students).toContain('queueRealtimeUserSync(userRecord, { syncPortalState: true })');
    });

    it('never unblocks saves when bootstrap fails so an empty page cannot clobber the server', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain('Authenticated but bootstrap failed');
        expect(api).toContain('__kiuBootstrapRetryScheduled');
        expect(api).toContain('bootstrapPortalBackendState(true)');
    });
});
