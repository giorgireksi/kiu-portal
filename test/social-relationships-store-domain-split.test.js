import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const socialRelationshipsService = require('../backend/platform/domains/social-relationships-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social relationships store domain split', () => {
    it('keeps social relationship ownership in social-relationships-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(socialRelationshipsService).sort()).toEqual([
            'getPendingSocialConnectionRequestBetween',
            'getSocialFollowerIds',
            'isSocialConnection',
            'isSocialFollowingTarget',
            'removeSocialConnection',
            'respondSocialConnectionRequest',
            'sendSocialConnectionRequest',
            'toggleSocialFollow'
        ]);
        expect(source).toContain("} = require('./domains/social-relationships-service');");
        expect(source).toContain('return sendSocialConnectionRequest.call(this, fromUserId, toUserId);');
        expect(source).toContain('return toggleSocialFollow.call(this, userId, targetType, targetId);');
    });

    it('preserves follow and connection behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.accounts['user-a'] = { id: 'user-a', displayName: 'User A', email: 'a@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['user-b'] = { id: 'user-b', displayName: 'User B', email: 'b@example.com', role: 'student', facultyCode: 'ECON' };

        const request = store.sendSocialConnectionRequest('user-a', 'user-b');
        expect(request?.type).toBe('connection-request');
        const accepted = store.respondSocialConnectionRequest(request.id, 'user-b', true);
        expect(accepted?.connection?.type).toBe('connection');
        expect(store.isSocialConnection('user-a', 'user-b')).toBe(true);

        const follow = store.toggleSocialFollow('user-a', 'profile', 'user-b');
        expect(follow?.following).toBe(true);
        expect(store.isSocialFollowingTarget('user-a', 'profile', 'user-b')).toBe(true);
        expect(store.removeSocialConnection('user-a', 'user-b')).toBe(true);
    });
});
