import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const tempDirs = [];

function makeTempDir() {
    const dir = mkdtempSync(join(tmpdir(), 'kiu-social-feed-missing-'));
    tempDirs.push(dir);
    return dir;
}

function buildDataUrl(text, mimeType = 'text/plain') {
    return `data:${mimeType};base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

afterEach(() => {
    while (tempDirs.length) {
        rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
});

describe('social feed missing media', () => {
    it('marks feed post media with storageMissing when bridge file is absent', async () => {
        const uploadsDir = makeTempDir();
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 1024 * 1024 });
        const actorUserId = 'student-feed-missing';
        const file = await store.createFileFromUpload({
            id: 'feed-missing-image',
            name: 'photo.jpg',
            type: 'image/jpeg',
            dataUrl: buildDataUrl('tiny-image-bytes', 'image/jpeg'),
            ownerUserId: actorUserId,
            uploadedBy: actorUserId,
            scope: 'social'
        });

        unlinkSync(file.path);

        const post = store.createSocialPost({
            body: 'Post with missing image',
            media: [{
                storageKey: file.id,
                storageBackend: 'bridge',
                type: 'image/jpeg',
                name: 'photo.jpg'
            }]
        }, actorUserId);
        expect(post).toBeTruthy();

        const feed = store.listSocialFeed({ userId: actorUserId });
        const decorated = feed.items.find((entry) => entry.id === post.id);
        expect(decorated).toBeTruthy();
        expect(decorated.media[0].storageMissing).toBe(true);
        expect(decorated.media[0].previewDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });
});
