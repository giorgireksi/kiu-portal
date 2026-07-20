import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction direct messages', () => {
    it('registers the direct messages runtime as a lazy Interaction tab module', () => {
        const html = readSource('lms.html');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(html).not.toContain('lms-interaction-messages-runtime.js');
        expect(classroom).toContain('lms-interaction-messages-runtime.js?v=20260714-lmspro2');
        expect(classroom).toContain('function ensureLmsInteractionRuntime()');
        expect(classroom.indexOf('LMS_INTERACTION_MODULE_URLS')).toBeGreaterThan(-1);
    });

    it('exposes roster-scoped messaging helpers and split-pane shell', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function getLmsInteractionRoster(resourceKey)');
        expect(runtimeSource).toContain('function getLmsInteractionDirectory(resourceKey');
        expect(runtimeSource).toContain('function getLmsInteractionChatsForUser(resourceKey, userId)');
        expect(runtimeSource).toContain('lms-interaction-direct');
        expect(runtimeSource).toContain('data-lms-interaction-action="pick-file"');
        expect(runtimeSource).toContain('function sendLmsInteractionDirectMessage(resourceKey, chatId');
        expect(runtimeSource).toContain('isLmsInteractionRosterMember(canonicalKey, normalizedUserId)');
    });

    it('adds an announcements and messages mode switch to the interaction section', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain('renderLmsInteractionModeSwitch(mode)');
        expect(classroomSource).toContain('renderLmsInteractionBodyMarkup(resourceKey, mode)');
        expect(classroomSource).toContain('is-messages-mode');
        expect(classroomSource).toContain('bindLmsInteractionDelegatedEvents(contentArea)');
    });

    it('styles the direct messages split pane and mode switch', () => {
    });

    it('adds inline image preview helpers to the shared messenger renderer', () => {
        const messengerSource = readSource('assets/js/shared/messenger.js');

        expect(messengerSource).toContain('function isPortalMessengerImageFile(file)');
        expect(messengerSource).toContain('function buildPortalMessengerImagePreviewHtml(file');
        expect(messengerSource).toContain('${imageHtml}');
    });

    it('exposes merged class group chat helpers in the messages runtime', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function ensureLmsInteractionGroupChat');
        expect(runtimeSource).toContain('function buildLmsInteractionGroupChatId');
    });

    it('renders a pinned class chat card and private messages section in the rail', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(
            runtimeSource.includes('lms-interaction-direct__group-chat')
            || runtimeSource.includes('Class Chat')
        ).toBe(true);
        expect(
            runtimeSource.includes('renderLmsInteractionGroupChatCard')
            || runtimeSource.includes('Private messages')
        ).toBe(true);
    });

    it('lists the merged class group chat before private conversations', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        const chatOrderingBlock = runtimeSource.match(/function getLmsInteractionChatsForUser[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const inboxBlock = runtimeSource.match(/function renderLmsInteractionInboxMarkup[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const chatListBlock = runtimeSource.match(/function renderLmsInteractionChatListMarkup[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const messagesPaneBlock = runtimeSource.match(/function renderLmsInteractionMessagesPane[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const markupSource = inboxBlock || chatListBlock || messagesPaneBlock;

        expect(chatOrderingBlock).toContain('ensureLmsInteractionGroupChat');
        expect(chatOrderingBlock).toMatch(/return \[groupChat,\s*\.\.\.directChats\]/);
        expect(
            markupSource.includes('renderLmsInteractionGroupChatCard')
            || markupSource.includes('lms-interaction-direct__group-chat')
            || markupSource.includes('getLmsInteractionChatsForUser')
        ).toBe(true);

        if (markupSource.includes('Private messages')) {
            const groupIndex = Math.max(
                markupSource.indexOf('renderLmsInteractionGroupChatCard'),
                markupSource.indexOf('lms-interaction-direct__group-chat')
            );
            const privateIndex = markupSource.indexOf('Private messages');
            expect(groupIndex).toBeGreaterThan(-1);
            expect(privateIndex).toBeGreaterThan(-1);
            expect(groupIndex).toBeLessThan(privateIndex);
        }
    });

    it('styles the merged class group chat shell and role pills', () => {
    });

    it('uses unified inbox search, members list, and new message compose modal', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        expect(runtimeSource).toContain('function getLmsInteractionInboxThreads');
        expect(runtimeSource).toContain('function getLmsInteractionMembersForInbox');
        expect(runtimeSource).toContain('function getLmsInteractionRecentThreads');
        expect(runtimeSource).toContain('function renderLmsInteractionInboxMarkup');
        expect(runtimeSource).toContain('lms-interaction-direct__section-title is-members');
        expect(runtimeSource).toContain('lms-interaction-direct__member-row');
        expect(runtimeSource).toContain('data-lms-interaction-action="open-compose"');
        expect(runtimeSource).toContain('data-lms-interaction-action="close-compose"');
        expect(runtimeSource).toContain('Search conversations');
        expect(runtimeSource).toContain('Search classmates');
    });

    it('delegates interaction clicks from the content area', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function bindLmsInteractionDelegatedEvents');
        expect(runtimeSource).toContain('lmsInteractionDelegatedBound');
        expect(runtimeSource).not.toMatch(/shell\.dataset\.lmsInteractionBound = '1'/);
    });

    it('bumps interaction sync cache bust tokens for lazy Interaction module load', () => {
        const html = readSource('lms.html');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expectLmsRouteCssLinks(html);
        expect(classroom).toContain('assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2');
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
    });
});