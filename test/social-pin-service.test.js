import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccounts(store) {
    store.state.accounts['owner-1'] = {
        id: 'owner-1', displayName: 'Owner', email: 'owner@example.com', role: 'student', facultyCode: 'CS'
    };
    store.state.accounts['viewer-1'] = {
        id: 'viewer-1', displayName: 'Viewer', email: 'viewer@example.com', role: 'student', facultyCode: 'CS'
    };
    store.state.accounts['admin-1'] = {
        id: 'admin-1', displayName: 'Admin', email: 'admin@example.com', role: 'admin', facultyCode: 'CS'
    };
}

describe('social-pin-service', () => {
    it('toggles curator and personal pins with ordering and permissions', () => {
        const store = new PlatformStore();
        seedAccounts(store);
        store.state.social.events = [
            {
                id: 'event-1',
                title: 'Campus meetup',
                createdById: 'owner-1',
                category: 'social',
                status: 'published'
            },
            {
                id: 'event-2',
                title: 'Admin highlight',
                createdById: 'admin-1',
                category: 'university',
                status: 'published'
            }
        ];
        store.state.social.lostFoundItems = [{
            id: 'lf-1',
            title: 'Blue backpack',
            authorUserId: 'owner-1',
            status: 'lost'
        }];

        expect(store.toggleSocialModulePin('event', 'event-1', 'curator', 'viewer-1')).toBeNull();

        const curatorPin = store.toggleSocialModulePin('event', 'event-1', 'curator', 'owner-1');
        expect(curatorPin?.pinned).toBe(true);
        expect(store.state.social.moduleCuratorPins.event).toEqual(['event-1']);

        const personalPin = store.toggleSocialModulePin('lostFound', 'lf-1', 'personal', 'viewer-1');
        expect(personalPin?.pinned).toBe(true);
        expect(store.state.social.userPins['viewer-1'].lostFound).toEqual(['lf-1']);

        const adminPin = store.toggleSocialModulePin('event', 'event-2', 'curator', 'admin-1');
        expect(adminPin?.pinned).toBe(true);
        expect(store.state.social.moduleCuratorPins.event[0]).toBe('event-2');

        const listed = store.listModulePinnedIds('event', 'viewer-1', 'all');
        expect(listed.curator).toEqual(['event-2', 'event-1']);
        expect(listed.personal).toEqual([]);
        expect(listed.all).toEqual(['event-2', 'event-1']);
    });

    it('ensureStateShape initializes social pin buckets on hydrate', () => {
        const store = new PlatformStore();
        store.state = store.ensureStateShape({ social: { events: [] } });
        expect(store.state.social.moduleCuratorPins.survey).toEqual([]);
        expect(store.state.social.moduleCuratorPins.event).toEqual([]);
        expect(store.state.social.userPins).toEqual({});
    });

    it('exposes pin API version and health wiring', () => {
        const pinService = readSource('backend/platform/domains/social-pin-service.js');
        expect(pinService).toContain('SOCIAL_PIN_API_VERSION = 1');

        const systemRoutes = readSource('backend/platform/routes/system-routes.js');
        expect(systemRoutes).toContain('socialPinApiVersion');

        const launcher = readSource('start-local-lms-anticheat.sh');
        expect(launcher).toContain('pin_api_healthy()');
        expect(launcher).toContain('pin_api_healthy &&');
        expect(launcher).toContain('Backend missing socialPinApiVersion');
    });

    it('wires module Save buttons through renderModulePinActions', () => {
        const surveys = readSource('assets/js/pages/social-surveys.js');
        const events = readSource('assets/js/pages/social-events.js');
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        expect(surveys).toContain('renderModulePinActions');
        expect(events).toContain('renderModulePinActions');
        expect(lostFound).toContain('renderModulePinActions');
        expect(portfolioUi).toContain('renderModulePinActions');
    });

    it('exposes pin routes and client wiring', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        expect(routes).toContain("app.post('/api/social/pins/toggle'");
        expect(routes).toContain("app.get('/api/social/pins'");
        expect(routes).toContain('store.toggleSocialModulePin(');

        const pinModel = readSource('assets/js/pages/social-pin-model.js');
        expect(pinModel).toContain('module-personal-pin');
        expect(pinModel).not.toContain('social-module-pin-menu-shell');
        expect(pinModel).not.toContain('module-curator-pin');
        expect(pinModel).toContain('renderPinnedSections');
        expect(pinModel).toContain('getPortalSocialRuntimeState');
        expect(pinModel).not.toContain('__kiuSocialRuntime');

        const pageEvents = readSource('assets/js/pages/social-page-events.js');
        expect(pageEvents).toContain("action === 'module-curator-pin'");
        expect(pageEvents).not.toContain('social-module-pin-menu-shell');
        expect(pageEvents).toContain('togglePortalSocialModulePin');

        const research = readSource('assets/js/pages/social-research.js');
        expect(research).toContain("tab: 'pinned'");
        expect(research).toContain('renderResearchPinActions');

        const photography = readSource('assets/js/pages/social-photography.js');
        expect(photography).toContain('data-photography-tab="pinned"');
        expect(photography).toContain('renderPhotoPinActions');
    });
});
