import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction messenger', () => {
    it('replaces hero and pinned board with a full-width messenger shell', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain('lms-interaction-messenger');
        expect(classroomSource).toContain('data-lms-interaction-region="stream"');
        expect(classroomSource).toContain('data-lms-interaction-region="composer"');
        expect(classroomSource).not.toContain('Pinned Board');
        const renderBlock = classroomSource.match(/function renderLmsInteractionSection[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(renderBlock).not.toContain('lms-route-hero');
        expect(renderBlock).not.toContain('lms-route-split--chat');
    });

    it('enforces staff-only announcements and threaded student replies', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const lmsSource = readSource('assets/js/pages/lms.js');

        expect(lmsSource).toContain('function canPostLmsInteractionAnnouncement()');
        expect(lmsSource).toContain('function canReplyToLmsInteractionPost(message)');
        expect(lmsSource).toContain('function isLmsInteractionMessageFromStaff(message)');
        expect(classroomSource).toContain('function sendLmsInteractionReply(resourceKey, parentId)');
        expect(classroomSource).toContain('canPostLmsInteractionAnnouncement()');
        expect(classroomSource).toContain('canReplyToLmsInteractionPost(parent)');
        expect(classroomSource).toContain("type: 'announcement'");
        expect(classroomSource).toContain("type: 'reply'");
        expect(classroomSource).toContain('parentId:');
    });

    it('keeps students from using the bottom announcement composer', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain('function renderLmsInteractionComposerMarkup(resourceKey)');
        expect(classroomSource).toContain('lms-interaction-student-hint');
        expect(classroomSource).toContain('lms-interaction-announce-input');
        expect(classroomSource).toMatch(/if \(!canPostLmsInteractionAnnouncement\(\)\)/);
    });

    it('patches the stream region instead of full re-render on send', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain('function updateLmsInteractionStreamUi(resourceKey)');
        expect(classroomSource).toContain('function updateLmsInteractionComposerUi(resourceKey)');
        expect(classroomSource).toMatch(/sendLmsInteractionMessage[\s\S]*updateLmsInteractionStreamUi\(resourceKey\)/);
        expect(classroomSource).toMatch(/sendLmsInteractionReply[\s\S]*updateLmsInteractionStreamUi\(canonicalKey\)/);
        expect(classroomSource).toMatch(/getCurrentLmsActiveTab\(\) === 'interaction'[\s\S]*updateLmsInteractionStreamUi\(resourceKey\)/);
    });

    it('skips interaction deep toolkit injection to avoid duplicate hero paint', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain("tab === 'quiz' || tab === 'live-quiz' || tab === 'interaction'");
    });

    it('keeps interaction messenger helpers without dead moderation or skipped-tab toolkit panels', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const configBlock = classroomSource.match(/function getLmsSectionEnhancementConfig[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const toolkitBlock = classroomSource.match(/function renderLmsDeepSectionToolkit[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(classroomSource).toContain('function getLmsInteractionMessengerStats(resourceKey)');
        expect(classroomSource).not.toContain('ensureLmsInteractionModerationForKey');
        expect(classroomSource).not.toContain('createLmsInteractionQuestion');
        expect(configBlock).not.toContain('Pinned items');
        expect(configBlock).not.toContain('Open questions');
        expect(configBlock).not.toContain("title: 'Classroom Messenger'");
        expect(configBlock).not.toContain("title: 'Live Quiz Control Room'");
        expect(configBlock).not.toContain("title: 'Assignment Workflow'");
        expect(toolkitBlock).toContain('sessions:');
        expect(toolkitBlock).toContain('calls:');
        expect(toolkitBlock).toContain('members:');
        expect(toolkitBlock).toContain('materials:');
        expect(toolkitBlock).toContain('concepts:');
        expect(toolkitBlock).not.toContain("'live-quiz':");
        expect(toolkitBlock).not.toContain('assignments:');
        expect(toolkitBlock).not.toContain('interaction:');
    });

    it('keeps announcements mode staff-only while messages mode lives in a separate runtime', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(classroomSource).toMatch(/if \(!canPostLmsInteractionAnnouncement\(\)\)/);
        expect(runtimeSource).toContain('data-lms-interaction-action="send-message"');
        expect(runtimeSource).not.toContain('canPostLmsInteractionAnnouncement');
    });

    it('defaults students to messages mode and staff to announcements', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function resolveDefaultLmsInteractionMode()');
        expect(runtimeSource).toContain("? 'announcements'");
        expect(runtimeSource).toContain(": 'messages'");
        expect(runtimeSource).toContain('mode: resolveDefaultLmsInteractionMode()');
    });
});