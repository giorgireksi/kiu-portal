import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    socialProfileModelApi,
    installSocialProfileModel
} from '../assets/js/pages/social-profile-model.js';

function readSource(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

function reinstall(extra = {}) {
    const accounts = {
        u1: { id: 'u1', role: 'student', bio: 'Hi', facultyCode: 'CS' },
        u2: { id: 'u2', role: 'professor', facultyCode: 'CS' }
    };
    delete window.__KIU_SOCIAL_PROFILE_MODEL_LOADED;
    delete window.KiuSocialProfileModel;
    window.__kiuSocialProfileModelHooks = {
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => ({
            feed: [
                { id: 'p1', authorUserId: 'u1', createdAt: '2026-07-19T10:00:00.000Z' },
                { id: 'p2', authorUserId: 'u2', createdAt: '2026-07-18T10:00:00.000Z' }
            ],
            social: {
                relationships: [
                    { type: 'connection', status: 'accepted', fromId: 'u1', toId: 'u2' }
                ],
                pages: [{ id: 'pg1', name: 'Lab', isFollowing: true, followerCount: 2, ownerUserId: 'u1' }],
                groups: [{ id: 'g1', name: 'Club', membershipState: 'member', memberCount: 4, ownerUserId: 'u1', memberIds: ['u1', 'u2'] }]
            }
        }),
        accountById: (id) => accounts[id] || null,
        currentUserId: () => 'u1',
        currentUser: () => accounts.u1,
        isJoinedGroup: (g) => g?.membershipState === 'member',
        when: () => 'recently',
        currentFacultyCode: () => 'CS',
        ...extra
    };
    installSocialProfileModel(window);
}

const {
    connectionStatusFor,
    profilePostCount,
    profileFriendCount,
    isStaffAccount,
    audienceBadge,
    feedReason,
    inviteEligibleGroups
} = socialProfileModelApi;

describe('social-profile-model', () => {
    beforeEach(() => {
        reinstall();
    });

    it('exports profile helpers', () => {
        expect(window.__KIU_SOCIAL_PROFILE_MODEL_LOADED).toBe(true);
        expect(window.KiuSocialProfileModel.profilePostCount).toBe(window.profilePostCount);
        expect(connectionStatusFor('u2').state).toBe('connected');
        expect(profilePostCount('u1')).toBe(1);
        expect(profileFriendCount('u1')).toBe(1);
        expect(isStaffAccount({ role: 'professor' })).toBe(true);
        expect(audienceBadge({ audience: 'faculty' })).toBe('Faculty');
        expect(feedReason({ scopeType: 'group', scopeName: 'Club' }, {})).toBe('Active in Club');
        expect(inviteEligibleGroups()).toHaveLength(1);
    });

    it('ESM leaf loads on profile intent before the profile panel', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');
        const mod = readSource('assets/js/pages/social-profile-model.js');
        expect(mod).toContain('export function installSocialProfileModel');
        for (const name of [
            'connectionStatusFor',
            'profileAccount',
            'profilePosts',
            'profileFriends',
            'mutualConnectionCount',
            'personSuggestionScore',
            'inviteEligibleGroups',
            'feedReason'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(page).toContain(`resolveSocialProfileModelFunction('${name}'`);
        }
        expect(html).not.toMatch(/type="module"\s+src="assets\/js\/pages\/social-profile-model\.js/);
        expect(page).toContain('SOCIAL_PROFILE_MODEL_URL');
        expect(page).toContain("loadSocialDynamicModule(SOCIAL_PROFILE_MODEL_URL, 'Social profile model')");
    });
});
