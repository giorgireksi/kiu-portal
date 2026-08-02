import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccounts(store) {
    store.state.accounts['owner-1'] = { id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON' };
    store.state.accounts['editor-1'] = { id: 'editor-1', displayName: 'Editor One', email: 'editor@example.com', role: 'student', facultyCode: 'ECON' };
    store.state.accounts['editor-2'] = { id: 'editor-2', displayName: 'Editor Two', email: 'editor2@example.com', role: 'student', facultyCode: 'CS' };
}

describe('social event editors', () => {
    it('stores editorIds on create and excludes the creator', () => {
        const store = new PlatformStore({});
        seedAccounts(store);
        const created = store.createSocialEvent({
            title: 'Team meetup',
            startsAt: '2026-08-10T10:00:00.000Z',
            editorIds: ['editor-1', 'owner-1', 'editor-1']
        }, 'owner-1');

        expect(created?.editorIds).toEqual(['editor-1']);
    });

    it('lets editors update content but not delete or change editorIds', () => {
        const store = new PlatformStore({});
        seedAccounts(store);
        const created = store.createSocialEvent({
            title: 'Team meetup',
            startsAt: '2026-08-10T10:00:00.000Z',
            editorIds: ['editor-1']
        }, 'owner-1');
        const eventId = created.id;

        expect(store.canEditSocialEvent(store.getSocialEventRecord(eventId), 'editor-1')).toBe(true);
        expect(store.canDeleteSocialEvent(store.getSocialEventRecord(eventId), 'editor-1')).toBe(false);
        expect(store.canManageSocialEventEditors(store.getSocialEventRecord(eventId), 'editor-1')).toBe(false);

        const updated = store.updateSocialEvent(eventId, {
            title: 'Updated by editor',
            editorIds: ['editor-2']
        }, 'editor-1');

        expect(updated?.title).toBe('Updated by editor');
        expect(updated?.editorIds).toEqual(['editor-1']);
        expect(store.deleteSocialEvent(eventId, 'editor-1')).toBeNull();
    });

    it('lets owners manage editorIds', () => {
        const store = new PlatformStore({});
        seedAccounts(store);
        const created = store.createSocialEvent({
            title: 'Team meetup',
            startsAt: '2026-08-10T10:00:00.000Z',
            editorIds: ['editor-1']
        }, 'owner-1');

        const updated = store.updateSocialEvent(created.id, {
            editorIds: ['editor-1', 'editor-2']
        }, 'owner-1');

        expect(updated?.editorIds).toEqual(['editor-1', 'editor-2']);
        expect(updated?.viewerIsEditor).toBe(false);
    });

    it('wires editor invite UI and payload transport in the frontend', () => {
        const eventsModule = readSource('assets/js/pages/social-events.js');
        const runtime = readSource('assets/js/shared/social-lite-content-runtime.js');
        const chrome = readSource('assets/js/pages/social-chrome-model.js');
        const domain = readSource('backend/platform/domains/social-content-service.js');

        expect(domain).toContain('function canManageSocialEventEditors(event, userId)');
        expect(domain).toContain('editorIds: getSocialEventEditorIds');
        expect(domain).toContain('viewerIsEditor:');

        expect(eventsModule).toContain('function buildEventEditorInviteContext(runtime)');
        expect(eventsModule).toContain('socialBrowseFacultyCodes');
        expect(eventsModule).toContain('function renderEventEditorInviteSection(runtime');
        expect(eventsModule).toContain('data-action="event-editor-add"');
        expect(eventsModule).toContain('data-action="event-editor-remove"');
        expect(eventsModule).toContain('payload.editorIds = selectedEditorIds');
        expect(eventsModule).toContain('eventCanManageEditors(editingEvent)');

        expect(runtime).toContain('editorIds: Array.isArray(input.editorIds)');
        expect(runtime).toContain('body.editorIds = input.editorIds');

        expect(chrome).toContain('function eventCanManageEditors(item = {})');
        expect(chrome).toContain('ui.eventEditorSelectedIds');
    });
});
