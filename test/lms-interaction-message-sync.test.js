import { describe, expect, it } from 'vitest';
import { readLmsInteractionSource, readLmsInteractionShellRuntime } from './helpers/lms-interaction-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction message sync', () => {
    it('dedupes direct chats by member pair in shared faculty helpers', () => {
        const facultySource = readSource('assets/js/shared/faculty.js');

        expect(facultySource).toContain('function findPortalMessengerDirectChat');
        expect(facultySource).toContain('function dedupePortalMessengerDirectChats');
        expect(facultySource).toContain('function reconcilePortalMessengerDirectChatDuplicates');
        expect(facultySource).toContain('findPortalMessengerDirectChat(left, right)');
        expect(facultySource).toContain('syncPortalMessengerDirectChatFromServer');
    });

    it('reconciles duplicate direct chats during realtime upsert', () => {
        const authSource = readSource('assets/js/app/auth.js');

        expect(authSource).toContain('reconcilePortalMessengerDirectChatDuplicates');
        expect(authSource).toContain('refreshLmsInteractionMessagesIfActive');
    });

    it('renders Members and deduped Recent sections in the interaction inbox', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function getLmsInteractionMembersForInbox');
        expect(runtimeSource).toContain('function getLmsInteractionRecentThreads');
        expect(runtimeSource).toContain('function renderLmsInteractionMemberRow');
        expect(runtimeSource).toContain('lms-interaction-direct__section-title is-members');
        expect(runtimeSource).toContain('dedupePortalMessengerDirectChats(scoped, userId)');
    });

    it('opens direct chats via API-first canonical ids', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('async function openLmsInteractionDirectChat');
        expect(runtimeSource).toContain("kiuRealtimeFetch('/api/messenger/direct'");
        expect(runtimeSource).toContain('reconcilePortalMessengerDirectChatDuplicates(payload.chat, true)');
        expect(runtimeSource).toContain('findPortalMessengerDirectChat(currentUserId, normalizedUserId)');
    });

    it('refreshes LMS interaction UI when messenger events arrive', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        const classroomSource = readLmsInteractionSource();

        expect(runtimeSource).toContain('function refreshLmsInteractionMessagesIfActive');
        expect(runtimeSource).toContain("contentArea.dataset.activeLmsTab !== 'interaction'");
        expect(classroomSource).toContain('bootstrapKiuRealtimeBridge().catch(() => null)');
    });

    it('bumps interaction sync cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2')
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
    });
});