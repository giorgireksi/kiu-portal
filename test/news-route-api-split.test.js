import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const tempDirs = [];

function makeTempDir() {
    const dir = mkdtempSync(join(tmpdir(), 'kiu-news-attachments-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(() => {
    while (tempDirs.length) {
        rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
});

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function buildDataUrl(text) {
    return `data:text/plain;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

function seedNewsAccounts(store) {
    store.state.accounts['news-admin'] = {
        id: 'news-admin',
        name: 'News Admin',
        displayName: 'News Admin',
        role: 'admin',
        facultyCode: 'ECON',
        grantedPrivileges: ['manage_news', 'manage_privileges'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['student-1'] = {
        id: 'student-1',
        name: 'Student One',
        displayName: 'Student One',
        role: 'student',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['student-2'] = {
        id: 'student-2',
        name: 'Student Two',
        displayName: 'Student Two',
        role: 'student',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
}

describe('news route api split', () => {
    it('mounts the backend news route family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/news-routes.js');

        expect(server).toContain("require('./routes/news-routes')");
        expect(server).toContain('registerNewsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/news/feed'");
        expect(routeModule).toContain("app.get('/api/news/sections'");
        expect(routeModule).toContain("app.put('/api/news/sections'");
        expect(routeModule).toContain("app.post('/api/news/posts'");
        expect(routeModule).toContain("app.patch('/api/news/posts/:id'");
        expect(routeModule).toContain("app.post('/api/news/posts/:id/replies'");
        expect(routeModule).toContain("type: 'news:updated'");
    });

    it('creates and updates news posts with attachments and feed filters', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedNewsAccounts(store);

        const created = store.createNewsPost({
            title: 'Attachment test',
            body: 'Post body with attachment',
            status: 'published',
            titleFontSize: 22,
            bodyFontSize: 20,
            excerptFontSize: 13,
            attachments: [{
                name: 'notice.pdf',
                mimeType: 'application/pdf',
                dataUrl: buildDataUrl('pdf payload')
            }]
        }, 'news-admin');

        expect(created.attachments).toHaveLength(1);
        expect(created.attachments[0].name).toBe('notice.pdf');
        expect(created.titleFontSize).toBe(22);
        expect(created.bodyFontSize).toBe(20);
        expect(created.excerptFontSize).toBe(13);

        const updated = store.updateNewsPost(created.id, {
            title: 'Attachment test updated',
            status: 'draft',
            pinned: true,
            titleFontSize: 25,
            bodyFontSize: 17,
            excerptFontSize: 19,
            attachments: created.attachments
        }, 'news-admin');

        expect(updated.title).toBe('Attachment test updated');
        expect(updated.status).toBe('draft');
        expect(updated.pinned).toBe(true);
        expect(updated.titleFontSize).toBe(25);
        expect(updated.bodyFontSize).toBe(17);
        expect(updated.excerptFontSize).toBe(19);

        const filtered = store.listNewsFeed({
            userId: 'news-admin',
            priority: 'standard',
            pinned: 'yes',
            status: 'draft'
        });

        expect(filtered.items.some(item => item.id === created.id)).toBe(true);

        const futurePublish = store.createNewsPost({
            title: 'Scheduled post',
            body: 'Future body',
            status: 'published',
            publishAt: '2099-01-01T09:00:00.000Z'
        }, 'news-admin');

        const studentFeed = store.listNewsFeed({ userId: 'student-1' });
        expect(studentFeed.items.some(item => item.id === futurePublish.id)).toBe(false);
        expect(store.canViewNewsPost(futurePublish, 'student-1')).toBe(false);
        expect(store.canViewNewsPost(futurePublish, 'news-admin')).toBe(true);
    });

    it('returns announcements newest-first without letting pinning or priority override chronology', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedNewsAccounts(store);

        const oldPinned = store.createNewsPost({
            title: 'Older pinned announcement',
            body: 'Older body',
            status: 'published',
            publishAt: '2024-01-01T09:00:00.000Z',
            pinned: true,
            priority: 'critical'
        }, 'news-admin');
        const newest = store.createNewsPost({
            title: 'Newest announcement',
            body: 'Newest body',
            status: 'published',
            publishAt: '2025-01-01T09:00:00.000Z',
            pinned: false,
            priority: 'standard'
        }, 'news-admin');

        const feed = store.listNewsFeed({ userId: 'news-admin' }).items;
        expect(feed.findIndex(item => item.id === newest.id)).toBeLessThan(feed.findIndex(item => item.id === oldPinned.id));

        store.updateNewsPost(oldPinned.id, { title: 'Edited older announcement' }, 'news-admin');
        const afterEdit = store.listNewsFeed({ userId: 'news-admin' }).items;
        expect(afterEdit.findIndex(item => item.id === newest.id)).toBeLessThan(afterEdit.findIndex(item => item.id === oldPinned.id));
    });

    it('manages news section catalog with counts, rename cascade, and delete guards', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedNewsAccounts(store);

        const feedBeforePost = store.listNewsFeed({ userId: 'news-admin' });
        expect(feedBeforePost.sectionCatalog.some(section => section.key === 'admissions')).toBe(true);
        expect(feedBeforePost.sections.some(section => section.key === 'admissions' && section.count === 0)).toBe(true);

        const created = store.createNewsPost({
            title: 'Admissions note',
            body: 'Welcome applicants',
            sectionLabel: 'Admissions',
            status: 'published'
        }, 'news-admin');

        expect(created.sectionKey).toBe('admissions');
        expect(store.listNewsFeed({ userId: 'news-admin' }).sections.find(section => section.key === 'admissions')?.count).toBe(1);

        const renamed = store.saveNewsSectionCatalog([
            { key: 'admissions', label: 'Admissions Office' },
            { key: 'academic-updates', label: 'Academic Updates' },
            { key: 'campus-life', label: 'Campus Life' },
            { key: 'events', label: 'Events' },
            { key: 'announcements', label: 'Announcements' },
            { key: 'research', label: 'Research' },
            { label: 'Sports' }
        ], 'news-admin');

        expect(renamed.catalog.some(section => section.key === 'sports' && section.label === 'Sports')).toBe(true);
        expect(store.ensureNewsState().posts.find(post => post.id === created.id)?.sectionLabel).toBe('Admissions Office');

        const withIcon = store.saveNewsSectionCatalog([
            { key: 'admissions', label: 'Admissions Office', icon: 'fa-door-open' },
            { key: 'academic-updates', label: 'Academic Updates', icon: 'fa-graduation-cap' },
            { key: 'campus-life', label: 'Campus Life', icon: 'fa-university' },
            { key: 'events', label: 'Events', icon: 'fa-calendar-star' },
            { key: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
            { key: 'research', label: 'Research', icon: 'fa-flask' },
            { label: 'Sports', icon: 'fa-trophy' }
        ], 'news-admin');
        expect(withIcon.catalog.find(section => section.key === 'sports')?.icon).toBe('fa-trophy');
        expect(withIcon.catalog.find(section => section.key === 'admissions')?.icon).toBe('fa-door-open');
        const rejectedIcon = store.saveNewsSectionCatalog([
            { key: 'admissions', label: 'Admissions Office', icon: 'fa-not-a-real-icon' },
            { key: 'academic-updates', label: 'Academic Updates' },
            { key: 'campus-life', label: 'Campus Life' },
            { key: 'events', label: 'Events' },
            { key: 'announcements', label: 'Announcements' },
            { key: 'research', label: 'Research' },
            { label: 'Sports', icon: 'fa-trophy' }
        ], 'news-admin');
        expect(rejectedIcon.catalog.find(section => section.key === 'admissions')?.icon).toBe('fa-door-open');
        expect(rejectedIcon.catalog.find(section => section.key === 'sports')?.icon).toBe('fa-trophy');

        // Icon-less persisted rows regain default catalog icons on ensure.
        store.state.news.sectionCatalog = [
            { key: 'events', label: 'Events' },
            { key: 'research', label: 'Research' }
        ];
        const backfilled = store.ensureNewsState().sectionCatalog;
        expect(backfilled.find(section => section.key === 'events')?.icon).toBe('fa-calendar-star');
        expect(backfilled.find(section => section.key === 'research')?.icon).toBe('fa-flask');
        expect(store.listNewsFeed({ userId: 'news-admin' }).sections.find(section => section.key === 'events')?.icon).toBe('fa-calendar-star');

        const existingAnnouncement = store.createNewsPost({
            title: 'Existing announcement',
            body: 'Already in announcements',
            sectionLabel: 'Announcements',
            status: 'published',
            publishAt: '2020-01-01T09:00:00.000Z',
            pinned: false
        }, 'news-admin');
        store.updateNewsPost(created.id, { pinned: true }, 'news-admin');

        const blockedDelete = store.saveNewsSectionCatalog([
            { key: 'academic-updates', label: 'Academic Updates' },
            { key: 'campus-life', label: 'Campus Life' },
            { key: 'events', label: 'Events' },
            { key: 'announcements', label: 'Announcements' },
            { key: 'research', label: 'Research' },
            { label: 'Sports' }
        ], 'news-admin');

        expect(blockedDelete.error).toMatch(/Admissions Office has 1 announcement/);

        const reassignedDelete = store.saveNewsSectionCatalog([
            { key: 'academic-updates', label: 'Academic Updates' },
            { key: 'campus-life', label: 'Campus Life' },
            { key: 'events', label: 'Events' },
            { key: 'announcements', label: 'Announcements' },
            { key: 'research', label: 'Research' },
            { label: 'Sports' }
        ], 'news-admin', { admissions: 'announcements' });

        expect(reassignedDelete.catalog.some(section => section.key === 'admissions')).toBe(false);
        const movedPost = store.ensureNewsState().posts.find(post => post.id === created.id);
        expect(movedPost?.sectionKey).toBe('announcements');
        expect(movedPost?.sectionLabel).toBe('Announcements');
        expect(movedPost?.pinned).toBe(false);
        expect(String(movedPost?.publishedAt || '')).toBe('2020-01-01T08:59:59.000Z');
        const announcementsFeed = store.listNewsFeed({
            userId: 'news-admin',
            section: 'announcements'
        }).items;
        expect(announcementsFeed[announcementsFeed.length - 1]?.id).toBe(created.id);

        const denied = store.saveNewsSectionCatalog([], 'student-1');
        expect(denied.status).toBe(403);
    });

    it('splits public and private news replies by visibility and replyMode', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedNewsAccounts(store);

        const bothPost = store.createNewsPost({
            title: 'Dual channel post',
            body: 'Reply body',
            status: 'published',
            replyMode: 'both'
        }, 'news-admin');
        expect(bothPost.replyMode).toBe('both');

        const publicOnly = store.addNewsReply(bothPost.id, { body: 'Public hello', visibility: 'public' }, 'student-1');
        expect(publicOnly.publicReplyCount).toBe(1);
        expect(publicOnly.privateReplyCount).toBe(0);

        const privateOnly = store.addNewsReply(bothPost.id, { body: 'Private note', visibility: 'private' }, 'student-1');
        expect(privateOnly.publicReplyCount).toBe(1);
        expect(privateOnly.privateReplyCount).toBe(1);

        const studentTwoView = store.decorateNewsPost(store.ensureNewsState().posts.find(post => post.id === bothPost.id), 'student-2');
        expect(studentTwoView.publicReplyCount).toBe(1);
        expect(studentTwoView.privateReplyCount).toBe(0);
        expect(studentTwoView.publicReplies[0]?.body).toBe('Public hello');

        const migratedPrivate = store.createNewsPost({ title: 'Private only', body: 'x', status: 'published', replyMode: 'private' }, 'news-admin');
        expect(migratedPrivate.replyMode).toBe('both');
        const allowedPublic = store.addNewsReply(
            migratedPrivate.id,
            { body: 'Now public ok', visibility: 'public' },
            'student-1'
        );
        expect(allowedPublic.error).toBeUndefined();
        expect(allowedPublic.publicReplyCount).toBe(1);

        const legacyAllowOnly = store.createNewsPost({
            title: 'Legacy allowReplies',
            body: 'x',
            status: 'published',
            allowReplies: false
        }, 'news-admin');
        expect(legacyAllowOnly.replyMode).toBe('none');
        expect(legacyAllowOnly.allowReplies).toBe(false);
        const rawLegacy = store.ensureNewsState().posts.find(post => post.id === legacyAllowOnly.id);
        expect(rawLegacy.replyMode).toBe('none');
        expect(rawLegacy.allowReplies).toBe(false);
    });

    it('persists section catalog, keeps soft-archive titles, and leans feed privileges', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedNewsAccounts(store);
        const calls = [];
        store.save = () => { calls.push('save'); };

        const saved = store.saveNewsSectionCatalog([
            { key: 'admissions', label: 'Admissions' },
            { key: 'campus-life', label: 'Campus Life' }
        ], 'news-admin');
        expect(saved.error).toBeUndefined();
        expect(calls).toContain('save');
        expect(store.getNewsSectionCatalog().some(section => section.key === 'campus-life')).toBe(true);

        const created = store.createNewsPost({
            title: 'Keep this title',
            body: 'Soft archive body',
            status: 'published',
            expiresAt: '2099-12-01T00:00:00.000Z',
            pinned: false
        }, 'news-admin');

        const archived = store.updateNewsPost(created.id, {
            status: 'archived',
            title: '[deleted]'
        }, 'news-admin');
        expect(archived.status).toBe('archived');
        expect(archived.title).toBe('Keep this title');
        expect(store.ensureNewsState().posts.find(post => post.id === created.id)?.title).toBe('Keep this title');

        const cleared = store.updateNewsPost(created.id, {
            expiresAt: '',
            pinned: true
        }, 'news-admin');
        expect(cleared.expiresAt).toBe('');
        expect(cleared.pinned).toBe(true);
        expect(cleared.title).toBe('Keep this title');
        expect(cleared.status).toBe('archived');

        const feed = store.listNewsFeed({ userId: 'news-admin' });
        expect(feed.privileges).toBeUndefined();
        expect(feed.viewerPrivileges).toBeUndefined();
        expect(Array.isArray(feed.sectionCatalog)).toBe(true);
        expect(Array.isArray(feed.sections)).toBe(true);
    });
});
