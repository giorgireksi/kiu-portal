import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social event edit flow', () => {
    it('exposes update API and edit action wiring in the social runtime and page layer', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const contentRuntime = readSource('assets/js/shared/social-lite-content-runtime.js');
        const page = readSource('assets/js/pages/social-page.js');
        const eventsModule = readSource('assets/js/pages/social-events.js');
        const routes = readSource('backend/platform/routes/social-routes.js');
        const domain = readSource('backend/platform/domains/social-content-service.js');

        expect(contentRuntime).toContain('async function updateEvent(eventId, input = {})');
        expect(contentRuntime).toContain("method: 'PATCH'");
        expect(runtime).toContain('updatePortalSocialEvent: updateEvent');

        expect((page + eventsModule + readSource('assets/js/pages/social-chrome-model.js'))).toContain("if (action === 'event-edit-open')");
        expect(readSource('assets/js/pages/social-chrome-model.js')).toContain('function eventCanManage(item = {})');
        expect(readSource('assets/js/pages/social-chrome-model.js')).toContain("text(item.createdById) === userId");
        expect(readSource('assets/js/pages/social-chrome-model.js')).toContain('function prefillEventEditDraft(event = {})');
        expect(runtime).toContain('viewerCanEdit: Boolean(event?.viewerCanEdit || event?.viewerCanDelete || event?.viewerIsEditor)');
        expect(readSource('assets/js/pages/social-chrome-model.js')).toContain('function clearEventDraft()');
        expect((page + eventsModule)).toContain('await updatePortalSocialEvent(editId, updatePayload)');
        expect((page + eventsModule)).toContain("renderSocialPageNow('event-updated')");
        expect(eventsModule).toContain('social-neo-events-edit-btn');
        expect(eventsModule).toContain('function renderManagedEventsCard(title, list, emptyCopy)');
        expect(eventsModule).toContain('social-neo-events-edit-btn--manage');
        expect(eventsModule).toContain('data-action="event-edit-open" data-event-id="${escape(text(item.id))}"><i class="fas fa-pen"></i> Edit</button>');
        expect(eventsModule).toContain('eventsStudentFilter');
        expect(eventsModule).toContain("action === 'events-student-filter'");
        expect(eventsModule).toContain('myStudentEvents = studentEvents.filter((entry) => eventCanManage(entry))');
        expect(eventsModule).toContain('communityStudentEvents = studentEvents.filter((entry) => !eventCanManage(entry))');
        expect(eventsModule).toContain('renderEventGroups(sortEventsByStart(visibleStudentEvents)');
        expect(eventsModule).toContain('data-action="events-student-filter"');
        expect(eventsModule).not.toContain('sortEventsWithManageableFirst');
        expect(eventsModule).not.toContain("'Your student events'");
        expect(eventsModule).not.toMatch(/renderManagedEventsCard[\s\S]{0,900}\$\{eventCanManage\(item\) \? `<button[^`]*event-edit-open/);

        expect(routes).toContain("app.patch('/api/social/events/:id'");
        expect(domain).toContain('function canEditSocialEvent(event, userId)');
        expect(domain).toContain('function canManageSocialEventEditors(event, userId)');
        expect(domain).toContain('function updateSocialEvent(eventId, payload = {}, actorId = \'\')');
        expect(domain).toContain('viewerCanEdit:');
        expect(domain).toContain('viewerIsEditor:');
        expect(eventsModule).toContain('const canEditEvent = Boolean(item.viewerCanEdit || item.viewerCanDelete || item.viewerIsEditor) || eventCanManage(item);');
        expect(eventsModule).toContain('social-neo-events-edit-btn--feature');
    });
});