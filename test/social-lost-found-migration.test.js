import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
    migrateLostFoundSocialState,
    normalizeLostFoundItem,
    normalizeLostFoundItems
} = require('../backend/platform/domains/social-state-service.js');

describe('social lost-found migration', () => {
    it('normalizes legacy open listings to lost status and strips dead fields', () => {
        const normalized = normalizeLostFoundItem({
            id: 'lf-legacy-1',
            kind: 'lost',
            status: 'open',
            facultyCode: 'ECON',
            campusScope: 'faculty',
            title: 'Wallet',
            resolvedAt: '',
            resolvedByUserId: ''
        });

        expect(normalized.status).toBe('lost');
        expect(normalized.title).toBe('Wallet');
        expect(normalized).toHaveProperty('expiresAt');
        expect(normalized).not.toHaveProperty('kind');
        expect(normalized).not.toHaveProperty('facultyCode');
        expect(normalized).not.toHaveProperty('kind');
        expect(normalized).not.toHaveProperty('facultyCode');
    });

    it('maps resolved and found-kind listings to found status', () => {
        const resolved = normalizeLostFoundItem({
            id: 'lf-legacy-2',
            kind: 'lost',
            status: 'resolved',
            resolvedAt: '2026-06-01T00:00:00.000Z',
            resolvedByUserId: 'user-1',
            authorUserId: 'user-1'
        });
        const foundKind = normalizeLostFoundItem({
            id: 'lf-legacy-3',
            kind: 'found',
            status: 'open',
            authorUserId: 'user-2'
        });

        expect(resolved.status).toBe('found');
        expect(resolved.foundAt).toBe('2026-06-01T00:00:00.000Z');
        expect(resolved.foundByUserId).toBe('user-1');
        expect(foundKind.status).toBe('found');
        expect(foundKind.foundByUserId).toBe('user-2');
    });

    it('migrates portal duplicates, strips dead ui keys, and bumps migration version', () => {
        const state = {
            social: {
                lostFoundItems: [],
                migrationVersion: 4
            },
            portal: {
                state: {
                    socialHub: {
                        lostFoundItems: [{
                            id: 'lf-portal-1',
                            kind: 'lost',
                            status: 'open',
                            title: 'Keys'
                        }],
                        ui: {
                            lostFoundFilter: 'open',
                            lostFoundBrowseFaculty: 'current',
                            lostFoundSearch: 'keys'
                        }
                    }
                }
            }
        };

        const migrated = migrateLostFoundSocialState(state);

        expect(migrated).toBe(true);
        expect(state.social.migrationVersion).toBe(5);
        expect(state.social.lostFoundItems).toHaveLength(1);
        expect(state.social.lostFoundItems[0].status).toBe('lost');
        expect(state.portal.state.socialHub.lostFoundItems).toBeUndefined();
        expect(state.portal.state.socialHub.ui.lostFoundFilter).toBeUndefined();
        expect(state.portal.state.socialHub.ui.lostFoundBrowseFaculty).toBeUndefined();
        expect(state.portal.state.socialHub.ui.lostFoundSearch).toBe('keys');
    });

    it('drops expired listings during normalization', () => {
        const past = new Date(Date.now() - 86_400_000).toISOString();
        const items = normalizeLostFoundItems([
            { id: 'lf-live', status: 'lost', title: 'Live', expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
            { id: 'lf-dead', status: 'lost', title: 'Dead', expiresAt: past }
        ]);

        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('lf-live');
    });

    it('deduplicates normalized items by id', () => {
        const items = normalizeLostFoundItems([
            { id: 'lf-1', status: 'lost', title: 'A' },
            { id: 'lf-1', status: 'found', title: 'B' }
        ]);

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('A');
    });
});