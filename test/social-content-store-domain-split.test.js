import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const socialContentService = require('../backend/platform/domains/social-content-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social content store domain split', () => {
    it('keeps social content ownership in social-content-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(socialContentService)).toContain('createSocialPage');
        expect(Object.keys(socialContentService)).toContain('createSocialGroup');
        expect(Object.keys(socialContentService)).toContain('createSocialPost');
        expect(Object.keys(socialContentService)).toContain('createSocialEvent');
        expect(Object.keys(socialContentService)).toContain('createSocialReport');
        expect(source).toContain("} = require('./domains/social-content-service');");
        expect(source).toContain('getSocialAccount(userId) { return getSocialAccount.call(this, userId); }');
        expect(source).toContain('notifySocialMentions(payload = {}) { return notifySocialMentions.call(this, payload); }');
        expect(source).toContain('getSocialGroupMemberIds(group) { return getSocialGroupMemberIds.call(this, group); }');
    });

    it('preserves social account, mention, and relationship helper behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.accounts['user-a'] = { id: 'user-a', displayName: 'User A', email: 'a@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['user-b'] = { id: 'user-b', displayName: 'User B', email: 'b@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.social.relationships = [{ id: 'rel-1', fromId: 'user-a', toId: 'user-b', createdAt: '2026-01-01T00:00:00.000Z' }];

        expect(store.getSocialAccount('user-a')?.displayName).toBe('User A');
        expect(store.getSocialActorDisplayName('user-b')).toBe('User B');
        expect(store.resolveSocialMentionUserIds('Hello @user-a and @user-b')).toEqual(['user-a', 'user-b']);
        expect(store.getSocialRelationshipRecord('rel-1')?.fromId).toBe('user-a');
    });
});
