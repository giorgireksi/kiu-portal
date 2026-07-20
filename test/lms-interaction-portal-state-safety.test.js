import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const RESOURCE_KEY = 'SUBJ1::GROUP1';
const STAFF_POST_ID = 'msg_staff_1';

describe('LMS interaction portal state safety', () => {
    it('drops forged student announcements while preserving staff threads and replies', () => {
        const store = new PlatformStore();
        store.state.portal.state = {
            messages: {
                [RESOURCE_KEY]: [
                    {
                        id: STAFF_POST_ID,
                        type: 'announcement',
                        sender: 'Professor',
                        text: 'Welcome',
                        isProf: true,
                        isStaff: false,
                        createdAt: '2026-06-09T10:00:00.000Z'
                    },
                    {
                        id: 'msg_reply_1',
                        parentId: STAFF_POST_ID,
                        type: 'reply',
                        sender: 'Student',
                        text: 'Thanks',
                        createdAt: '2026-06-09T10:05:00.000Z'
                    }
                ]
            }
        };

        const saved = store.savePortalState({
            messages: {
                [RESOURCE_KEY]: [
                    {
                        id: STAFF_POST_ID,
                        type: 'announcement',
                        sender: 'Professor',
                        text: 'Welcome',
                        isProf: true,
                        isStaff: false,
                        createdAt: '2026-06-09T10:00:00.000Z'
                    },
                    {
                        id: 'msg_reply_1',
                        parentId: STAFF_POST_ID,
                        type: 'reply',
                        sender: 'Student',
                        text: 'Thanks',
                        createdAt: '2026-06-09T10:05:00.000Z'
                    },
                    {
                        id: 'msg_forged_1',
                        type: 'announcement',
                        sender: 'Student',
                        text: 'Hacked top-level post',
                        isProf: true,
                        isStaff: true,
                        createdAt: '2026-06-09T10:10:00.000Z'
                    },
                    {
                        id: 'msg_reply_orphan',
                        parentId: 'missing-parent',
                        type: 'reply',
                        sender: 'Student',
                        text: 'Orphan reply',
                        createdAt: '2026-06-09T10:11:00.000Z'
                    }
                ]
            }
        }, { effectiveRole: 'student' });

        const messages = saved.state.messages[RESOURCE_KEY];
        expect(messages).toHaveLength(2);
        expect(messages.map(item => item.id)).toEqual([STAFF_POST_ID, 'msg_reply_1']);
        expect(messages.find(item => item.id === 'msg_forged_1')).toBeUndefined();
        expect(messages.find(item => item.id === 'msg_reply_orphan')).toBeUndefined();
    });

    it('allows staff to add announcements and students to add replies under staff posts', () => {
        const store = new PlatformStore();
        store.state.portal.state = {
            messages: {
                [RESOURCE_KEY]: [
                    {
                        id: STAFF_POST_ID,
                        type: 'announcement',
                        sender: 'TA',
                        text: 'Lab moved',
                        isProf: false,
                        isStaff: true,
                        createdAt: '2026-06-09T11:00:00.000Z'
                    }
                ]
            }
        };

        const staffSaved = store.savePortalState({
            messages: {
                [RESOURCE_KEY]: [
                    {
                        id: STAFF_POST_ID,
                        type: 'announcement',
                        sender: 'TA',
                        text: 'Lab moved',
                        isProf: false,
                        isStaff: true,
                        createdAt: '2026-06-09T11:00:00.000Z'
                    },
                    {
                        id: 'msg_staff_new',
                        type: 'announcement',
                        sender: 'TA',
                        text: 'Bring laptops',
                        isProf: false,
                        isStaff: true,
                        createdAt: '2026-06-09T11:10:00.000Z'
                    }
                ]
            }
        }, { effectiveRole: 'ta' });

        expect(staffSaved.state.messages[RESOURCE_KEY]).toHaveLength(2);
        expect(staffSaved.state.messages[RESOURCE_KEY].find(item => item.id === 'msg_staff_new')?.text).toBe('Bring laptops');

        const studentSaved = store.savePortalState({
            messages: {
                [RESOURCE_KEY]: [
                    ...staffSaved.state.messages[RESOURCE_KEY],
                    {
                        id: 'msg_student_reply',
                        parentId: STAFF_POST_ID,
                        type: 'reply',
                        sender: 'Student',
                        text: 'Understood',
                        createdAt: '2026-06-09T11:15:00.000Z'
                    }
                ]
            }
        }, { effectiveRole: 'student' });

        const reply = studentSaved.state.messages[RESOURCE_KEY].find(item => item.id === 'msg_student_reply');
        expect(reply?.text).toBe('Understood');
        expect(reply?.isStaff).toBe(false);
        expect(reply?.isProf).toBe(false);
    });
});