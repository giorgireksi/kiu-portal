import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const socialStateService = require('../backend/platform/domains/social-state-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social state store domain split', () => {
    it('keeps social bootstrap/state ownership in social-state-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(socialStateService).sort()).toEqual([
            'appendSocialProjectActivity',
            'ensureSocialGroupChat',
            'ensureSocialProjectCollections',
            'getSocialBootstrap',
            'isLostFoundItemExpired',
            'listSocialRelationshipsForUser',
            'migrateLostFoundSocialState',
            'normalizeLostFoundItem',
            'normalizeLostFoundItems',
            'saveSocialMutation',
            'upsertSocialState'
        ]);
        expect(source).toContain("} = require('./domains/social-state-service');");
        expect(source).toContain('return getSocialBootstrap.call(this, viewerUserId);');
        expect(source).toContain('return upsertSocialState.call(this, social, actorId, reason);');
        expect(source).toContain('return ensureSocialGroupChat.call(this, groupId, actorId);');
    });

    it('preserves social bootstrap and group-chat behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = {
            id: 'owner-1',
            displayName: 'Owner One',
            email: 'owner@example.com',
            role: 'student',
            facultyCode: 'ECON',
            accountStatus: 'active'
        };
        store.state.social.groups = [{
            id: 'group-1',
            name: 'Study Group',
            ownerUserId: 'owner-1',
            memberIds: ['owner-1'],
            pendingMemberIds: [],
            joinedAtByUser: { 'owner-1': '2026-01-01T00:00:00.000Z' },
            avatarImage: '',
            bannerImage: '',
            createdAt: '2026-01-01T00:00:00.000Z'
        }];
        store.state.social.relationships = [{
            id: 'rel-1',
            fromId: 'owner-1',
            toId: 'friend-1',
            createdAt: '2026-01-02T00:00:00.000Z'
        }];

        const bootstrap = store.getSocialBootstrap('owner-1');
        expect(bootstrap.groups).toHaveLength(1);
        expect(bootstrap.relationships).toHaveLength(1);

        const upserted = store.upsertSocialState({
            lostFoundItems: [{
                id: 'lf-1',
                title: 'Keys',
                kind: 'lost',
                status: 'open',
                facultyCode: 'ECON'
            }]
        }, 'owner-1', 'social-save');
        expect(upserted.lostFoundItems).toHaveLength(1);
        expect(upserted.lostFoundItems[0].status).toBe('lost');
        expect(upserted.lostFoundItems[0].kind).toBeUndefined();
        expect(upserted.lostFoundItems[0].facultyCode).toBeUndefined();

        const chat = store.ensureSocialGroupChat('group-1', 'owner-1');
        expect(chat?.chat?.groupId).toBe('group-1');
        expect(chat?.social?.groups).toHaveLength(1);
    });
});
