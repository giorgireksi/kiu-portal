import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function countOccurrences(source, needle) {
    return source.split(needle).length - 1;
}

const PNG_DATA_URL = `data:image/png;base64,${Buffer.from('png-bytes', 'utf8').toString('base64')}`;

describe('background gallery feature', () => {
    it('registers background gallery API routes on the platform server', () => {
        const server = readSource('backend/platform/server.js');
        const routes = readSource('backend/platform/routes/background-gallery-routes.js');
        expect(server).toContain('registerBackgroundGalleryRoutes(app, {');
        expect(routes).toContain("app.get('/api/background-gallery/catalog'");
        expect(routes).toContain("app.post('/api/background-gallery/catalog/promote'");
        expect(routes).toContain("app.get('/api/background-gallery/mine'");
        expect(routes).toContain("app.post('/api/background-gallery/upload'");
        expect(routes).toContain("app.post('/api/background-gallery/repair'");
    });

    it('wires background gallery store helpers and v2 state shape', () => {
        const store = readSource('backend/platform/store.js');
        const service = require('../backend/platform/domains/background-gallery-service.js');
        expect(store).toContain('getBackgroundGalleryCatalog()');
        expect(store).toContain('uploadBackgroundGalleryAsset');
        expect(store).toContain('migrateBackgroundGalleryUserItemsFromPortalPrefs');
        expect(store).not.toContain('PORTAL_SERVER_OWNED_USER_PREF_KEYS');
        expect(Object.keys(service).sort()).toEqual([
            'VALID_MEDIA_TYPES',
            'VALID_PALETTE_KEYS',
            'addBackgroundGalleryCatalogItem',
            'addBackgroundGalleryUserItem',
            'createEmptyBackgroundGalleryCatalog',
            'createEmptyBackgroundGalleryState',
            'ensureBackgroundGalleryState',
            'getBackgroundGalleryCatalog',
            'getBackgroundGalleryUserItems',
            'migrateBackgroundGalleryUserItemsFromPortalPrefs',
            'normalizeGalleryItem',
            'promoteBackgroundGalleryUserItem',
            'reconcileOrphanBackgroundGalleryUserFiles',
            'removeBackgroundGalleryCatalogItem',
            'removeBackgroundGalleryUserItem',
            'sanitizePaletteKey',
            'uploadBackgroundGalleryAsset'
        ]);
        const empty = service.createEmptyBackgroundGalleryState();
        expect(empty).toEqual({
            catalog: { images: [], videos: [] },
            userItemsByUser: {},
            version: 2
        });
    });

    it('maps sampled hues to studio palette keys', () => {
        const palette = readSource('assets/js/features/luxury-background-gallery-palette.js');
        expect(palette).toContain('mapGalleryHueToPaletteKey');
        expect(palette).toContain('pine-jade');
        expect(palette).toContain('ocean-teal');
        expect(palette).not.toContain('carbon-black');
        expect(palette).not.toContain('arctic-white');
        expect(palette).toContain('platinum-silver');
    });

    it('exposes silver curated palette in luxury SSOT and gallery service', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const galleryService = readSource('backend/platform/domains/background-gallery-service.js');
        const tokens = readSource('assets/css/lux-tokens.css');
        const paletteRuntime = readSource('assets/js/features/luxury-palette-runtime.js');
        expect(luxury).toContain("key: 'platinum-silver'");
        expect(galleryService).toContain("'platinum-silver'");
        expect(tokens).toContain('body.palette-platinum-silver');
        expect(luxury).not.toContain("key: 'carbon-black'");
        expect(luxury).not.toContain("key: 'arctic-white'");
        expect(luxury).not.toContain("name: 'Black'");
        expect(luxury).not.toContain("name: 'White'");
        expect(luxury).toContain("name: 'Silver'");
        expect(luxury).toContain("accent: '#7b8a9a'");
        expect(luxury).toContain("lightAccent: '#4a5563'");
        expect(tokens).toContain('#1a1e24');
        expect(tokens).toContain('#7b8fa8');
        expect(tokens).toContain('--lux-glass-tint-rgb: 38, 42, 48');
        expect(tokens).toContain('--lux-glass-tint-rgb: 130, 136, 142');
        expect(paletteRuntime).toContain('palette.lightAccent');
        expect(paletteRuntime).toContain('useLightAccent');
        expect(paletteRuntime).toContain('neutralGlassTintByKey');
        expect(paletteRuntime).toContain("stored === 'carbon-black' || stored === 'arctic-white'");
    });

    it('loads gallery scripts on boot and exposes lazy loader', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(luxury).toContain('ensureBackgroundGalleryScripts()');
        expect(luxury).toContain('__kiuEnsureBackgroundGalleryScripts');
        expect(luxury).toContain('__KIU_BACKGROUND_GALLERY_SCRIPTS_PROMISE');
        expect(luxury).toContain('bgg21');
        expect(luxury).toContain('window.showToast = showToast');
        expect(luxury).toContain('refreshBackgroundGalleryData');
        expect(luxury).toContain('getPortalSessionToken');
        expect(shellChrome).toContain('launchBackgroundGallery');
        expect(shellChrome).toContain('lux-bg-gallery-open-images');
        expect(shellChrome).toContain('lux-bg-gallery-open-videos');
    });

    it('loads gallery API scripts on standalone luxury routes', () => {
        const standalonePages = [
            'library.html',
            'staff.html',
            'profile-view.html',
            'students-admin.html',
            'admin-scheduler.html'
        ];
        standalonePages.forEach((page) => {
            const html = readSource(page);
            expect(html).toContain('api-lms-portal-runtime.js');
            expect(html).toContain('api-portal-persist-runtime.js');
            expect(html).toContain('assets/js/app/api.js');
            expect(html.indexOf('api-lms-portal-runtime.js')).toBeGreaterThan(html.indexOf('app.js'));
        });
        const stubs = readSource('assets/js/app/portal-api-stubs-runtime.js');
        expect(stubs).toContain('uploadBackgroundGalleryAsset');
        expect(stubs).toContain('asyncGalleryUploadStub');
        expect(stubs).toContain('Gallery upload API not loaded — hard refresh the page.');
    });

    it('uses separate gallery popups and launcher buttons in studio', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const runtime = readSource('assets/js/features/luxury-background-gallery-runtime.js');
        const luxury = readSource('assets/js/features/index-luxury.js');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');

        expect(shellChrome).toContain('id="lux-bg-gallery-open-images"');
        expect(shellChrome).toContain('id="lux-bg-gallery-open-videos"');
        expect(shellChrome).not.toContain('id="lux-bg-gallery-curated-grid"');
        expect(readSource('index.html')).toContain('luxury-shell-chrome.js?v=20260819-sidebarperf3');
        expect(studio).toContain('openBackgroundGalleryPopup');
        expect(studio).toContain('closeBackgroundGalleryPopup');
        expect(studio).toContain('Saved to My backgrounds');
        expect(studio).toContain('Sign in through the portal to upload backgrounds.');
        expect(atmosphere).toContain('function getBackgroundGallerySelection');
        expect(atmosphere).toContain('function setBackgroundGallerySelection');
        expect(atmosphere).toContain('function clearBackgroundGallery');
        expect(runtime).toContain('#lux-bg-media');
        expect(runtime).toContain('__kiuSyncBackgroundGalleryMedia');
        expect(luxury).toContain("key: 'gallery'");
        expect(luxury).toContain('backgroundGallerySelection');
        expect(luxury).toContain('luxury-background-gallery-optimizer.js');
        expect(foucCss).toContain('#lux-bg-media');
        expect(foucCss).toContain('100dvh');
        expect(foucCss).toContain('data-lux-static-background="gallery"');
        expect(countOccurrences(foucCss, '#lux-bg-media {')).toBe(1);
    });

    it('shows gallery backgrounds with object-fit fill across the viewport', () => {
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');
        expect(foucCss).toContain('object-fit: fill');
        expect(foucCss).toContain('background: #000');
        expect(foucCss).not.toMatch(/#lux-bg-media img[\s\S]*?object-fit:\s*cover/);
        expect(foucCss).not.toMatch(/#lux-bg-media img[\s\S]*?object-fit:\s*contain/);
        expect(studio).toContain('Scaled to fill the screen on all devices');
        expect(studio).not.toContain('Fullscreen cover on all devices');
        expect(studio).not.toContain('letterboxed if needed');
    });

    it('includes client-side image optimizer with WebP/JPEG fallback', () => {
        const optimizer = readSource('assets/js/features/luxury-background-gallery-optimizer.js');
        expect(optimizer).toContain('optimizeGalleryImageFile');
        expect(optimizer).toContain('image/webp');
        expect(optimizer).toContain('image/jpeg');
    });

    it('guards gallery rendering when background animation is on', () => {
        const runtime = readSource('assets/js/features/luxury-background-gallery-runtime.js');
        expect(runtime).toContain('areBackgroundAnimationsEnabled');
        expect(runtime).toContain('if (animationsOn) return false');
        expect(runtime).toContain('orientationchange');
    });

    it('scopes gallery popup to studio design tokens and inner shells', () => {
        const studioCss = readSource('assets/css/lux-studio.css');
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(studioCss).toContain(':is(#lux-studio-backdrop, #lux-bg-mode-params-backdrop, #lux-bg-gallery-backdrop, #social-neo-overlay-portal)');
        expect(studioCss).toContain('.lux-bg-gallery-tabs');
        expect(studioCss).toContain('minmax(140px, 1fr)');
        expect(studioCss).toMatch(/#lux-bg-gallery-backdrop\s*\{[\s\S]*?visibility:\s*hidden/);
        expect(studioCss).toContain('#lux-bg-gallery-backdrop.is-open');
        expect(studio).toContain('data-gallery-tab="curated"');
        expect(studio).toContain('lux-bg-gallery-tile-overlay');
        expect(studio).toContain('backdrop.hidden = true');
        expect(studio).toContain('backdrop.hidden = false');
        expect(studio).toMatch(/function bindBackgroundGalleryStudioControls\(\) \{\s*bindBackgroundGalleryStudioLauncher\(\);/);
        expect(shellChrome).toContain('#lux-bg-gallery-backdrop');
    });

    it('switches tabs after upload and remembers tab in sessionStorage', () => {
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        expect(studio).toContain("GALLERY_STATE.activeTab = 'mine'");
        expect(studio).toContain("GALLERY_STATE.activeTab = 'curated'");
        expect(studio).toContain('sessionStorage');
        expect(studio).toContain('storeGalleryTab');
        expect(studio).toContain('lastUploadedId');
        expect(studio).toContain('highlightNewUploadTile');
    });

    it('allows file access for gallery catalog and owned user items via userItemsByUser', () => {
        const filesService = readSource('backend/platform/domains/files-service.js');
        expect(filesService).toContain('stateContainsBackgroundGalleryCatalogFile');
        expect(filesService).toContain('actorOwnsBackgroundGalleryFileReference');
        expect(filesService).toContain('userItemsByUser');
    });

    it('uses atomic upload endpoint in studio and API wrapper', () => {
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        const api = readSource('assets/js/app/api-lms-portal-runtime.js');
        expect(studio).toContain('bindBackgroundGalleryPopupControls');
        expect(studio).toContain('bindBackgroundGalleryPopupControls(backdrop)');
        expect(studio).toContain('getPortalSessionToken');
        expect(studio).toContain('showUploadError');
        expect(studio).toContain('Array.from(event.target.files || [])');
        expect(studio).toContain('type="file" hidden multiple');
        expect(studio).toContain('handleGalleryUploads(files, { target })');
        expect(studio).toContain('MAX_BATCH_FILES = 20');
        expect(studio).toContain('GALLERY_MAX_BYTES = 100 * 1024 * 1024');
        expect(studio).toContain('Select up to ${MAX_BATCH_FILES} images or videos at a time.');
        expect(studio).toContain('Uploading ${batchPosition} of ${batchTotal}…');
        expect(studio).toContain('Uploaded ${uploaded} of ${files.length}.');
        expect(studio).toContain('event.target.value = \'\';');
        expect(studio).toContain('.catch(() => {})');
        expect(studio.indexOf('Array.from(event.target.files || [])')).toBeLessThan(
            studio.indexOf("event.target.value = '';", studio.indexOf('Array.from(event.target.files || [])'))
        );
        expect(studio).toContain('__KIU_BACKGROUND_GALLERY_STUDIO_VERSION');
        expect(studio).toContain("STUDIO_VERSION = 'bgg21'");
        expect(studio).toContain('notifyGalleryUser');
        expect(studio).toContain('lux-bg-gallery-status');
        expect(studio).toContain('lux-bg-gallery-version');
        expect(studio).toContain('Selected:');
        expect(studio).toContain('galleryPopupControlsAbort');
        expect(studio).toContain('lastSuccessfulUploadAt');
        expect(studio).toContain('UPLOAD_KEEP_LOCAL_MS');
        expect(studio).toContain('Upload saved locally; server list is empty');
        expect(studio).toContain('resolveGalleryFetch');
        expect(studio).toContain('getUploadBackgroundGalleryAsset');
        expect(studio).toContain('window.uploadBackgroundGalleryAsset');
        expect(studio).toContain('applyUploadResult');
        expect(studio).toContain('updateGalleryUploadSessionUi');
        expect(studio).toContain('KIU_PORTAL_SESSION_REQUIRED');
        expect(studio).toContain('Could not apply background.');
        expect(studio).toContain('uploadInFlight');
        expect(studio).toContain('syncGalleryCaches');
        expect(studio).not.toContain('traceGalleryUpload');
        expect(studio).not.toContain('scheduleBackgroundGalleryDelayedRefresh');
        expect(studio).not.toContain('refresh-kept-local-mine');
        expect(studio).not.toContain('uploadPortalStoredFile');
        expect(studio).not.toContain('Upload did not save. Sign in again and retry.');
        expect(studio).toContain('data-gallery-remove');
        expect(studio).toContain('lux-bg-gallery-delete-panel');
        expect(studio).toContain('id="lux-bg-gallery-delete-confirm"');
        expect(studio).toContain('confirmGalleryItemDelete');
        expect(studio).toContain('mediaBucket');
        expect(studio).toContain('awaitingFilePicker');
        expect(studio).toContain('armGalleryFilePickerCancelDetection');
        expect(api).toContain("kiuPortalFetch('/api/background-gallery/upload'");
        expect(api).toContain('uploadBackgroundGalleryAsset');
        expect(api).toContain('Gallery API not loaded');
        expect(api).toContain('Could not read file for upload');
        expect(api).toContain('timeoutMs: 120000');
        expect(api).toContain('new FormData()');
        expect(api).toContain('form.append(\'file\'');
        expect(readSource('backend/platform/multipart-upload.js')).toContain('Stream one multipart/form-data upload');
    });

    it('disables animations when applying gallery selection', () => {
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        expect(atmosphere).toContain('setBackgroundAnimationsEnabled(false, persist)');
        expect(atmosphere).toContain('return false');
        expect(atmosphere).toContain('return true');
    });

    it('rethrows local record store write failures', () => {
        const localStore = readSource('backend/platform/local-record-store.js');
        const queueBlock = localStore.slice(
            localStore.indexOf('queueWrite(task)'),
            localStore.indexOf('async writeFileAtomically')
        );
        expect(queueBlock).toContain('throw error');
    });

    it('keeps production backend lifecycle and upload failures observable', () => {
        const server = readSource('backend/platform/server.js');
        const compose = readSource('docker-compose.production.yml');
        expect(server).toContain('request body too large');
        expect(server).toContain('installProcessLifecycleHandlers');
        expect(server).toContain('uncaughtException');
        expect(server).toContain('unhandledRejection');
        const postgres = readSource('backend/platform/postgres-record-store.js');
        expect(postgres).toContain("this.pool.on('error'");
        expect(compose).toContain('${KIU_PRODUCTION_ENV_FILE:-.env.production}');
        expect(compose).toContain('http://127.0.0.1/ready');
    });

    it('restarts stale backend when API manifest mismatches', () => {
        const launcher = readSource('start-local-8876.sh');
        expect(launcher).toContain('backend_manifest_matches');
        expect(launcher).toContain('API manifest is stale');
    });

    it('does not strip backgroundGalleryUserItems in portal persist (moved to main state)', () => {
        const persist = readSource('assets/js/app/api-portal-persist-runtime.js');
        expect(persist).not.toContain('delete entry.backgroundGalleryUserItems');
    });

    it('GET /mine does not reconcile orphans on the hot path', () => {
        const routes = readSource('backend/platform/routes/background-gallery-routes.js');
        const mineGetBlock = routes.slice(
            routes.indexOf("app.get('/api/background-gallery/mine'"),
            routes.indexOf("app.post('/api/background-gallery/mine'")
        );
        expect(mineGetBlock).not.toContain('reconcileOrphanBackgroundGalleryUserFiles');
    });

    it('flushes pending writes after atomic gallery upload', () => {
        const routes = readSource('backend/platform/routes/background-gallery-routes.js');
        const uploadBlock = routes.slice(routes.indexOf("app.post('/api/background-gallery/upload'"));
        expect(uploadBlock).toContain('uploadBackgroundGalleryAsset');
        expect(uploadBlock).toContain('await store.flushPendingWrites()');
    });

    it('recovers the save queue after a transient write error', () => {
        const storeSource = readSource('backend/platform/store.js');
        const queueBlock = storeSource.slice(
            storeSource.indexOf('queueRecordStoreWrite(writeTask)'),
            storeSource.indexOf('save() {')
        );
        expect(queueBlock).toContain('recovering write queue');
        expect(queueBlock).toContain('this.lastStoreWriteError = error');
        expect(queueBlock).toContain('return next');
        expect(storeSource).toContain('if (this.lastStoreWriteError)');
    });

    it('streams multipart gallery uploads without buffering the binary body', async () => {
        const { Readable } = require('stream');
        const { rmSync, readFileSync } = require('fs');
        const { parseMultipartUpload } = require('../backend/platform/multipart-upload');
        const boundary = '----kiu-test-boundary';
        const body = Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="target"\r\n\r\nmine\r\n`
            + `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="background.png"\r\n`
            + 'Content-Type: image/png\r\n\r\nstreamed-bytes\r\n'
            + `--${boundary}--\r\n`
        );
        async function* chunks() {
            for (let index = 0; index < body.length; index += 3) yield body.subarray(index, index + 3);
        }
        const request = Readable.from(chunks());
        request.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
        const parsed = await parseMultipartUpload(request, { maxFileBytes: 1024 });
        expect(parsed.fields.target).toBe('mine');
        expect(parsed.file.name).toBe('background.png');
        expect(readFileSync(parsed.file.path, 'utf8')).toBe('streamed-bytes');
        rmSync(parsed.file.path, { force: true });
    });

    it('atomic upload creates file and gallery item in one operation', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-atomic-'));
        const stateDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-state-'));
        const statePath = join(stateDir, 'platform-state.json');
        const store = await PlatformStore.create({
            storageDriver: 'local-json',
            statePath,
            uploadsDir,
            maxFileUploadBytes: 4096
        });

        const result = await store.uploadBackgroundGalleryAsset({
            target: 'mine',
            name: 'bg.png',
            type: 'image/png',
            mediaType: 'image',
            label: 'Atomic upload',
            dataUrl: PNG_DATA_URL
        }, { actorUserId: 'student-1', actorRole: 'student' });

        expect(result?.item?.id).toBeTruthy();
        expect(result?.items?.images).toHaveLength(1);
        expect(result?.file?.id).toBeTruthy();
        expect(store.getFile(result.file.id)?.scope).toBe('background-gallery');
        expect(store.state.backgroundGallery.userItemsByUser['student-1'].images).toHaveLength(1);

        await store.flushPendingWrites();
        const reloaded = await PlatformStore.create({
            storageDriver: 'local-json',
            statePath,
            uploadsDir,
            maxFileUploadBytes: 4096
        });
        const persisted = reloaded.getBackgroundGalleryUserItems('student-1');
        expect(persisted.images).toHaveLength(1);
        expect(persisted.images[0].fileId).toBe(result.file.id);

        rmSync(uploadsDir, { recursive: true, force: true });
        rmSync(stateDir, { recursive: true, force: true });
    });

    it('allows a larger cap for gallery files without raising the ordinary file cap', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');
        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-size-cap-'));
        const store = new PlatformStore({
            uploadsDir,
            maxFileUploadBytes: 8,
            maxBackgroundGalleryUploadBytes: 16
        });
        const twelveBytes = `data:image/png;base64,${Buffer.from('twelve-bytes', 'utf8').toString('base64')}`;

        await expect(store.createFileFromUpload({
            name: 'gallery.png',
            type: 'image/png',
            dataUrl: twelveBytes,
            scope: 'background-gallery'
        })).resolves.toMatchObject({ scope: 'background-gallery', size: 12 });
        await expect(store.createFileFromUpload({
            name: 'ordinary.png',
            type: 'image/png',
            dataUrl: twelveBytes,
            scope: 'file'
        })).resolves.toBeNull();

        rmSync(uploadsDir, { recursive: true, force: true });
    });

    it('rolls back file blob when gallery item registration fails', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-rollback-'));
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });

        const result = await store.uploadBackgroundGalleryAsset({
            target: 'mine',
            name: 'bg.png',
            type: 'image/png',
            mediaType: 'video',
            label: 'Rollback test',
            dataUrl: PNG_DATA_URL
        }, { actorUserId: 'student-1', actorRole: 'student' });

        expect(result?.error).toBe('File type does not match mediaType.');
        expect(Object.keys(store.state.files || {})).toHaveLength(0);
        expect(store.getBackgroundGalleryUserItems('student-1').images).toHaveLength(0);

        rmSync(uploadsDir, { recursive: true, force: true });
    });

    it('migrates legacy portal-pref gallery items into userItemsByUser on boot', async () => {
        const { mkdtempSync, rmSync, writeFileSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');
        const { migrateBackgroundGalleryUserItemsFromPortalPrefs } = require('../backend/platform/domains/background-gallery-service.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-migrate-'));
        const stateDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-migrate-state-'));
        const statePath = join(stateDir, 'platform-state.json');
        const legacyItem = {
            id: 'bgg-legacy-1',
            fileId: 'file_legacy-1',
            mediaType: 'image',
            label: 'Legacy upload',
            recommendedPaletteKey: 'ocean-teal',
            createdAt: '2026-07-21T00:00:00.000Z',
            createdBy: 'admin-root'
        };
        writeFileSync(statePath, JSON.stringify({
            meta: { version: 1, updatedAt: '2026-07-21T00:00:00.000Z' },
            files: {},
            backgroundGallery: {
                catalog: { images: [], videos: [] },
                userItemsByUser: {},
                version: 1
            },
            portal: {
                state: {
                    homeDashboardPreferencesByUser: {
                        'admin-root': {
                            version: 5,
                            backgroundGalleryUserItems: {
                                images: [legacyItem],
                                videos: []
                            }
                        }
                    }
                }
            }
        }, null, 2));

        const store = await PlatformStore.create({
            storageDriver: 'local-json',
            statePath,
            uploadsDir,
            maxFileUploadBytes: 4096
        });
        const items = store.getBackgroundGalleryUserItems('admin-root');
        expect(items.images).toHaveLength(1);
        expect(items.images[0].id).toBe('bgg-legacy-1');
        expect(store.state.portal.state.homeDashboardPreferencesByUser['admin-root'].backgroundGalleryUserItems).toBeUndefined();

        const bareState = {
            backgroundGallery: { catalog: { images: [], videos: [] }, userItemsByUser: {}, version: 1 },
            portal: {
                state: {
                    homeDashboardPreferencesByUser: {
                        'user-2': {
                            backgroundGalleryUserItems: { images: [legacyItem], videos: [] }
                        }
                    }
                }
            }
        };
        migrateBackgroundGalleryUserItemsFromPortalPrefs(bareState);
        expect(bareState.backgroundGallery.userItemsByUser['user-2'].images).toHaveLength(1);

        rmSync(uploadsDir, { recursive: true, force: true });
        rmSync(stateDir, { recursive: true, force: true });
    });

    it('keeps gallery items isolated from portal preference sync', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-portal-'));
        const stateDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-portal-state-'));
        const statePath = join(stateDir, 'platform-state.json');
        const store = await PlatformStore.create({
            storageDriver: 'local-json',
            statePath,
            uploadsDir,
            maxFileUploadBytes: 4096
        });

        const uploaded = await store.uploadBackgroundGalleryAsset({
            target: 'mine',
            name: 'bg.png',
            type: 'image/png',
            mediaType: 'image',
            label: 'Portal isolation',
            dataUrl: PNG_DATA_URL
        }, { actorUserId: 'admin-root', actorRole: 'admin' });
        expect(uploaded?.items?.images).toHaveLength(1);

        store.savePortalState({
            homeDashboardPreferencesByUser: {
                'admin-root': { version: 6, visuals: { theme: 'dark' } }
            }
        }, { actorUserId: 'admin-root', effectiveRole: 'admin', allowGlobalWrite: true });

        const afterSync = store.getBackgroundGalleryUserItems('admin-root');
        expect(afterSync.images).toHaveLength(1);
        expect(afterSync.images[0].fileId).toBe(uploaded.file.id);
        expect(store.state.portal.state.homeDashboardPreferencesByUser['admin-root'].backgroundGalleryUserItems).toBeUndefined();

        await store.flushPendingWrites();
        const reloaded = await PlatformStore.create({
            storageDriver: 'local-json',
            statePath,
            uploadsDir,
            maxFileUploadBytes: 4096
        });
        const persisted = reloaded.getBackgroundGalleryUserItems('admin-root');
        expect(persisted.images).toHaveLength(1);

        rmSync(uploadsDir, { recursive: true, force: true });
        rmSync(stateDir, { recursive: true, force: true });
    });

    it('rejects upload when main state save fails', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-save-err-'));
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        store.recordStore = {
            writeState: async () => {
                throw new Error('disk full');
            }
        };

        await expect(store.uploadBackgroundGalleryAsset({
            target: 'mine',
            name: 'bg.png',
            type: 'image/png',
            mediaType: 'image',
            label: 'Save error',
            dataUrl: PNG_DATA_URL
        }, { actorUserId: 'student-1', actorRole: 'student' })).rejects.toThrow('disk full');

        rmSync(uploadsDir, { recursive: true, force: true });
    });

    it('reconciles orphan files only via explicit repair helper', async () => {
        const { mkdtempSync, rmSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-orphan-'));
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        const file = await store.createFileFromUpload({
            id: 'bgg-orphan-file',
            name: 'orphan-bg.png',
            type: 'image/png',
            dataUrl: PNG_DATA_URL,
            ownerUserId: 'admin-root',
            uploadedBy: 'admin-root',
            scope: 'background-gallery'
        });
        expect(file?.id).toBe('bgg-orphan-file');
        expect(store.getBackgroundGalleryUserItems('admin-root').images).toHaveLength(0);

        const items = await store.reconcileOrphanBackgroundGalleryUserFiles('admin-root', {
            actorUserId: 'admin-root',
            actorRole: 'admin'
        });
        expect(items.images).toHaveLength(1);
        expect(items.images[0].fileId).toBe(file.id);

        rmSync(uploadsDir, { recursive: true, force: true });
    });

    it('removes gallery item and purges file so orphan reconcile cannot resurrect it', async () => {
        const { mkdtempSync, rmSync, existsSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const { PlatformStore } = require('../backend/platform/store.js');

        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-bgg-remove-'));
        const store = new PlatformStore({ uploadsDir, maxFileUploadBytes: 4096 });
        const uploaded = await store.uploadBackgroundGalleryAsset({
            target: 'mine',
            name: 'remove-bg.png',
            type: 'image/png',
            mediaType: 'image',
            label: 'Remove me',
            dataUrl: `data:image/png;base64,${Buffer.from('remove-png', 'utf8').toString('base64')}`
        }, { actorUserId: 'admin-root', actorRole: 'admin' });
        expect(uploaded?.item?.id).toBeTruthy();
        expect(store.getBackgroundGalleryUserItems('admin-root').images).toHaveLength(1);

        const removed = await store.removeBackgroundGalleryUserItem('admin-root', uploaded.item.id, {
            actorUserId: 'admin-root',
            actorRole: 'admin'
        });
        expect(removed?.item?.id).toBe(uploaded.item.id);
        expect(store.getBackgroundGalleryUserItems('admin-root').images).toHaveLength(0);
        expect(store.getFile(uploaded.file.id)).toBeFalsy();
        expect(existsSync(uploaded.file.path)).toBe(false);

        const afterReconcile = await store.reconcileOrphanBackgroundGalleryUserFiles('admin-root', {
            actorUserId: 'admin-root',
            actorRole: 'admin'
        });
        expect(afterReconcile.images).toHaveLength(0);

        rmSync(uploadsDir, { recursive: true, force: true });
    });

    it('uses label-based upload control and upload button state helpers', () => {
        const studio = readSource('assets/js/features/luxury-background-gallery-studio.js');
        const studioCss = readSource('assets/css/lux-studio.css');
        expect(studio).toContain('for="lux-bg-gallery-file-input"');
        expect(studio).toContain('setGalleryUploadLabelText');
        expect(studio).toContain('resetGalleryUploadLabelSoon');
        expect(studioCss).toContain('.lux-bg-gallery-upload-btn.is-busy');
        expect(studioCss).toContain('.lux-bg-gallery-version');
    });
});
