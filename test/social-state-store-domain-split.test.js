import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
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
            'appendSocialGroupActivity',
            'appendSocialProjectActivity',
            'createSocialGroupConversation',
            'ensureSocialGroupChat',
            'ensureSocialProjectCollections',
            'getSocialBootstrap',
            'isLostFoundItemExpired',
            'listSocialGroupChats',
            'listSocialRelationshipsForUser',
            'migrateLostFoundSocialState',
            'normalizeLostFoundItem',
            'normalizeLostFoundItems',
            'renameSocialGroupConversation',
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
        store.state.accounts['friend-1'] = {
            id: 'friend-1',
            displayName: 'Friend One',
            email: 'friend@example.com',
            role: 'student',
            facultyCode: 'ECON',
            accountStatus: 'active'
        };
        store.state.portal.state.studentAdminProfiles = {
            'owner-1': { id: 'owner-1', accountStatus: 'active' },
            'friend-1': { id: 'friend-1', accountStatus: 'active' }
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
        expect(upserted.lostFoundItems[0].facultyCode).toBe('ECON');

        const chat = store.ensureSocialGroupChat('group-1', 'owner-1');
        expect(chat?.chat?.groupId).toBe('group-1');
        expect(chat?.chat?.conversationName).toBe('General');
        expect(chat?.social?.groups).toHaveLength(1);

        const created = store.createSocialGroupConversation('group-1', 'Exam prep', 'owner-1');
        expect(created?.chat?.conversationName).toBe('Exam prep');
        expect(created?.chat?.groupId).toBe('group-1');
        expect(created?.chats).toHaveLength(2);
        expect(created?.chats.every((entry) => entry.messages.some((message) => message.isSystem && message.eventId === created.event.id))).toBe(true);
        expect(store.createSocialGroupConversation('group-1', 'Exam prep', 'owner-1')?.duplicate).toBe(true);

        const renamed = store.renameSocialGroupConversation('group-1', created.chat.id, 'Final review', 'owner-1');
        expect(renamed?.chat?.conversationName).toBe('Final review');
        expect(renamed?.chats).toHaveLength(2);
        expect(renamed?.chats.every((entry) => entry.messages.some((message) => message.isSystem && message.eventId === renamed.event.id))).toBe(true);
        expect(renamed?.event?.type).toBe('conversation.renamed');

        const invited = store.inviteSocialGroupMember('group-1', 'friend-1', 'owner-1');
        expect(invited?.latestActivity?.type).toBe('member.invited');
        expect(invited?.chats.every((entry) => entry.messages.some((message) => message.isSystem && message.eventId === invited.latestActivity.id))).toBe(true);
        const joined = store.setSocialGroupMembership('group-1', 'friend-1', 'join', 'friend-1');
        expect(joined?.latestActivity?.type).toBe('member.added');
        expect(Object.values(store.state.chats).every((entry) => entry.members.includes('friend-1'))).toBe(true);
        const settings = store.updateSocialGroup('group-1', { visibility: 'private' }, 'owner-1');
        expect(settings?.latestActivity?.type).toBe('group.settings.changed');
        expect(Object.values(store.state.chats).every((entry) => entry.messages.at(-1)?.isSystem)).toBe(true);
    });

    it('repairs social group chat membership when a viewer can access the group but is not yet a chat member', () => {
        const store = new PlatformStore({});
        store.state.accounts['owner-1'] = {
            id: 'owner-1',
            displayName: 'Owner One',
            email: 'owner@example.com',
            role: 'student',
            facultyCode: 'ECON',
            accountStatus: 'active'
        };
        store.state.accounts['admin-1'] = {
            id: 'admin-1',
            displayName: 'Admin One',
            email: 'admin@example.com',
            role: 'admin',
            facultyCode: 'ECON',
            accountStatus: 'active'
        };
        store.state.social.groups = [{
            id: 'group_29bbf4bfb8d2ca01',
            name: 'Workspace Group',
            ownerUserId: 'owner-1',
            memberIds: ['owner-1'],
            pendingMemberIds: [],
            joinedAtByUser: { 'owner-1': '2026-01-01T00:00:00.000Z' },
            visibility: 'public',
            facultyCode: 'ECON',
            avatarImage: '',
            bannerImage: '',
            createdAt: '2026-01-01T00:00:00.000Z'
        }];
        const chatId = 'portal-group::social::group_29bbf4bfb8d2ca01';
        store.ensureChatBase({
            id: chatId,
            type: 'group',
            members: ['owner-1'],
            name: 'Workspace Group',
            groupId: 'group_29bbf4bfb8d2ca01',
            createdBy: 'owner-1',
            createdAt: '2026-01-01T00:00:00.000Z'
        });
        store.state.social.groups[0].chatId = chatId;

        expect(store.markChatMessagesRead(chatId, 'admin-1')?.id).toBe(chatId);
        expect(store.state.chats[chatId].members).toContain('admin-1');
    });
});
