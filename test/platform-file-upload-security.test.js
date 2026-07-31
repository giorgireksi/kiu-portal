import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const tempDirs = [];

function makeTempDir() {
    const dir = mkdtempSync(join(tmpdir(), 'kiu-file-upload-'));
    tempDirs.push(dir);
    return dir;
}

function buildDataUrl(text) {
    return `data:text/plain;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

afterEach(() => {
    while (tempDirs.length) {
        rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
});

describe('platform file upload security', () => {
    it('persists owner metadata, sanitizes MIME types, and writes the decoded payload', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });

        const file = await store.createFileFromUpload({
            id: 'unsafe-html-demo',
            name: 'unsafe.html',
            type: 'text/html',
            dataUrl: buildDataUrl('<h1>demo</h1>'),
            ownerUserId: 'student-1',
            uploadedBy: 'student-1',
            scope: 'mail'
        });

        expect(file).not.toBeNull();
        expect(file.ownerUserId).toBe('student-1');
        expect(file.uploadedBy).toBe('student-1');
        expect(file.type).toBe('application/octet-stream');
        expect(readFileSync(file.path, 'utf8')).toBe('<h1>demo</h1>');
    });

    it('rejects oversized uploads before writing them to disk', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 8 });

        const file = await store.createFileFromUpload({
            id: 'too-large-demo',
            name: 'large.txt',
            type: 'text/plain',
            dataUrl: buildDataUrl('this payload is larger than eight bytes'),
            ownerUserId: 'student-1',
            uploadedBy: 'student-1'
        });

        expect(file).toBeNull();
    });

    it('rejects cross-user stored file references in the shared attachment normalizer', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        const ownedFile = await store.createFileFromUpload({
            id: 'owned-file',
            name: 'owned.txt',
            type: 'text/plain',
            dataUrl: buildDataUrl('owned'),
            ownerUserId: 'student-1',
            uploadedBy: 'student-1'
        });

        const reusedByOwner = store.normalizeMessageAttachment({ storageKey: ownedFile.id }, 'student-1');
        const reusedByOtherUser = store.normalizeMessageAttachment({ storageKey: ownedFile.id }, 'student-2');

        expect(reusedByOwner?.storageKey).toBe(ownedFile.id);
        expect(reusedByOtherUser).toBeNull();
    });

    it('blocks unrelated users from direct file access while allowing chat members to reach shared attachments', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        const sharedFile = await store.createFileFromUpload({
            id: 'chat-file',
            name: 'chat.txt',
            type: 'text/plain',
            dataUrl: buildDataUrl('chat payload'),
            ownerUserId: 'student-1',
            uploadedBy: 'student-1',
            scope: 'messenger'
        });

        store.state.chats['chat-1'] = {
            id: 'chat-1',
            type: 'direct',
            members: ['student-1', 'student-2'],
            messages: [
                {
                    id: 'msg-1',
                    file: {
                        storageKey: sharedFile.id
                    }
                }
            ]
        };

        expect(store.canActorAccessStoredFile(sharedFile.id, 'student-1', 'student')).toBe(true);
        expect(store.canActorAccessStoredFile(sharedFile.id, 'student-2', 'student')).toBe(true);
        expect(store.canActorAccessStoredFile(sharedFile.id, 'student-3', 'student')).toBe(false);
    });

    it('allows enrolled LMS participants to reach stored LMS attachments without reopening global file access', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        const lmsFile = await store.createFileFromUpload({
            id: 'lms-file',
            name: 'assignment.txt',
            type: 'text/plain',
            dataUrl: buildDataUrl('assignment payload'),
            ownerUserId: 'prof-1',
            uploadedBy: 'prof-1',
            scope: 'assignment'
        });

        store.state.courses.COURSE_LMS = { id: 'COURSE_LMS', name: 'Course LMS', facultyCode: 'ECON', ects: 5 };
        store.state.sections.SECTION_LMS = { id: 'SECTION_LMS', courseId: 'COURSE_LMS', professorId: 'prof-1', taIds: [], schedule: [] };
        store.state.enrollments.ENR_LMS = { id: 'ENR_LMS', studentId: 'student-9', courseId: 'COURSE_LMS', sectionId: 'SECTION_LMS', status: 'active' };
        store.state.lmsCourses.COURSE_LMS = {
            id: 'COURSE_LMS',
            assignments: [
                {
                    id: 'asn-1',
                    attachments: [{ storageKey: lmsFile.id }]
                }
            ],
            materials: [],
            teachingTeam: []
        };

        expect(store.canActorAccessStoredFile(lmsFile.id, 'prof-1', 'professor')).toBe(true);
        expect(store.canActorAccessStoredFile(lmsFile.id, 'student-9', 'student')).toBe(true);
        expect(store.canActorAccessStoredFile(lmsFile.id, 'student-10', 'student')).toBe(false);
    });

    it('allows news viewers to reach announcement attachments without reopening global file access', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        store.state.accounts['news-admin'] = {
            id: 'news-admin', displayName: 'News Admin', role: 'admin', email: 'news-admin@example.com'
        };
        store.state.accounts['student-news'] = {
            id: 'student-news', displayName: 'Student News', role: 'student', email: 'student-news@example.com', facultyCode: 'ECON'
        };
        store.state.accounts['outsider'] = {
            id: 'outsider', displayName: 'Outsider', role: 'student', email: 'outsider@example.com', facultyCode: 'BM'
        };

        const newsFile = await store.createFileFromUpload({
            id: 'news-file',
            name: 'flyer.jpg',
            type: 'image/jpeg',
            dataUrl: buildDataUrl('flyer-bytes'),
            ownerUserId: 'news-admin',
            uploadedBy: 'news-admin',
            scope: 'news'
        });

        store.state.news = store.state.news && typeof store.state.news === 'object' ? store.state.news : { posts: [], replies: [], sectionCatalog: [] };
        store.state.news.posts = [{
            id: 'news_post_1',
            title: 'Flyer post',
            body: 'See attachment',
            status: 'published',
            createdById: 'news-admin',
            audienceRoles: ['student'],
            audienceFacultyCodes: ['ECON'],
            attachments: [{ storageKey: newsFile.id, name: 'flyer.jpg' }]
        }];

        expect(store.canActorAccessStoredFile(newsFile.id, 'news-admin', 'admin')).toBe(true);
        expect(store.canActorAccessStoredFile(newsFile.id, 'student-news', 'student')).toBe(true);
        expect(store.canActorAccessStoredFile(newsFile.id, 'outsider', 'student')).toBe(false);
    });

    it('keeps upload ownership server-derived and flushes pending writes before responding', () => {
        const routeSource = readFileSync(join(process.cwd(), 'backend/platform/routes/files-routes.js'), 'utf8');

        expect(routeSource).toContain('ownerUserId: actor.actorUserId');
        expect(routeSource).not.toContain('ownerUserId: request.body?.ownerUserId');
        expect(routeSource).toContain('await store.flushPendingWrites()');
        expect(routeSource).toContain("sendError(response, 403, 'You are not allowed to access this file.');");
    });
});
