import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('portal state cross-page persistence', () => {
    it('persists adminProgramStructures through savePortalState', () => {
        const store = new PlatformStore();
        const saved = store.savePortalState({
            adminProgramStructures: {
                ECON: {
                    prog: [{ id: 'module-1', title: 'Intro' }]
                }
            },
            meta: {
                portalStateSavedAt: Date.now()
            }
        });

        expect(saved.state.adminProgramStructures.ECON.prog).toHaveLength(1);
        expect(saved.state.adminProgramStructures.ECON.prog[0].id).toBe('module-1');
        expect(store.state.portal.state.adminProgramStructures.ECON.prog).toHaveLength(1);
    });

    it('stores portalStateSavedAt on server portal meta during save', () => {
        const store = new PlatformStore();
        const timestamp = Date.now();
        store.savePortalState({
            facultyProfiles: { ECON: { name: 'Economics' } },
            meta: { portalStateSavedAt: timestamp }
        });

        expect(getPortalStateSavedAtFromMeta(store.state.portal.meta)).toBeGreaterThanOrEqual(timestamp);
    });

    it('tracks portalStateSavedAt in saveState and merge helpers on the client', () => {
        const state = readSource('assets/js/app/state.js');
        const api = readSource('assets/js/app/api.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(state).toContain('meta.portalStateSavedAt = Date.now()');
        expect(api).toContain('function mergePortalStateFromLocal');
        expect(api).toContain('function getBestLocalPortalSnapshot');
        expect(api).toContain('function flushPortalStateBeforeNavigation');
        expect(api).toContain('function flushPortalStateSync');
        expect(api).toContain('serverMeta: payload.meta || {}');
        expect(navigation).toContain('function flushPortalStateForHardNavigation');
        expect(navigation).toContain('flushPortalStateBeforeNavigation');
    });

    it('awaits in-flight portal sync before bootstrap apply', () => {
        const api = readSource('assets/js/app/api.js');
        expect(api).toMatch(/if \(runtime\.syncPromise\) \{[\s\S]*?await runtime\.syncPromise/);
        expect(api).toContain('mergePortalStateFromLocal(localSnapshot, nextState');
    });
});

function getPortalStateSavedAtFromMeta(meta = {}) {
    const raw = meta.portalStateSavedAt;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = Date.parse(String(raw || ''));
    return Number.isFinite(parsed) ? parsed : 0;
}
