import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social event edit flow', () => {
    it('exposes update API and edit action wiring in the social runtime and page layer', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const page = readSource('assets/js/pages/social-page.js');
        const eventsModule = readSource('assets/js/pages/social-events.js');
        const routes = readSource('backend/platform/routes/social-routes.js');
        const domain = readSource('backend/platform/domains/social-content-service.js');

        expect(runtime).toContain('async function updateEvent(eventId, input = {})');
        expect(runtime).toContain("method: 'PATCH'");
        expect(runtime).toContain('updatePortalSocialEvent: updateEvent');

        expect((page + eventsModule)).toContain("if (action === 'event-edit-open')");
        expect(page).toContain('function eventCanManage(item = {})');
        expect(page).toContain("text(item.createdById) === userId");
        expect(page).toContain('function prefillEventEditDraft(event = {})');
        expect(runtime).toContain('viewerCanEdit: Boolean(event?.viewerCanEdit || event?.viewerCanDelete)');
        expect(page).toContain('function clearEventDraft()');
        expect((page + eventsModule)).toContain('await updatePortalSocialEvent(editId, updatePayload)');
        expect((page + eventsModule)).toContain("renderSocialPageNow('event-updated')");
        expect(eventsModule).toContain('social-neo-events-edit-btn');
        expect(eventsModule).toContain('function renderManagedEventsCard(title, list, emptyCopy)');
        expect(eventsModule).toContain('social-neo-events-edit-btn--manage');
        expect(eventsModule).toContain('data-action="event-edit-open" data-event-id="${escape(text(item.id))}"><i class="fas fa-pen"></i> Edit</button>');
        expect(eventsModule).toContain('can be edited or removed from here');
        expect(eventsModule).not.toMatch(/renderManagedEventsCard[\s\S]{0,900}\$\{eventCanManage\(item\) \? `<button[^`]*event-edit-open/);

        expect(routes).toContain("app.patch('/api/social/events/:id'");
        expect(domain).toContain('function canEditSocialEvent(event, userId)');
        expect(domain).toContain('function updateSocialEvent(eventId, payload = {}, actorId = \'\')');
        expect(domain).toContain('viewerCanEdit:');
    });
});