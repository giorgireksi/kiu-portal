import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadPinModel(overrides = {}) {
    const sandbox = {
        window: {
            KIU_STATE: {
                socialHub: {
                    savedPosts: []
                }
            },
            getPortalSocialRuntimeState: () => ({
                social: {
                    moduleCuratorPins: {
                        event: ['event-1'],
                        survey: ['survey-1']
                    },
                    userPins: {
                        survey: ['survey-2'],
                        event: ['event-2']
                    },
                    researchPublications: [
                        { id: 'research-1', isSaved: true },
                        { id: 'research-2', isSaved: false }
                    ]
                }
            }),
            getCurrentUser: () => ({ id: 'viewer-1', role: 'student' }),
            ...overrides
        }
    };
    sandbox.window.window = sandbox.window;
    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-pin-model.js'), 'utf8');
    vm.runInNewContext(source, sandbox);
    return sandbox.window.KiuSocialPinModel;
}

describe('social-pin-model', () => {
    let pinModel;

    beforeEach(() => {
        pinModel = loadPinModel();
    });

    it('reads curator pins from portal runtime state', () => {
        expect(pinModel.curatorPinIds('event')).toEqual(['event-1']);
        expect(pinModel.curatorPinIds('events')).toEqual(['event-1']);
    });

    it('reads personal pins from flattened userPins bucket', () => {
        expect(pinModel.userPinIds('survey')).toEqual(['survey-2']);
        expect(pinModel.userPinIds('surveys')).toEqual(['survey-2']);
    });

    it('reads photography personal pins from KIU_STATE.socialHub.savedPosts', () => {
        pinModel = loadPinModel({
            KIU_STATE: {
                socialHub: {
                    savedPosts: [
                        { userId: 'viewer-1', itemType: 'post', itemId: 'post-photo-1' },
                        { userId: 'other', itemType: 'post', itemId: 'post-photo-2' }
                    ]
                }
            }
        });
        expect(pinModel.userPinIds('photo')).toEqual(['post-photo-1']);
        expect(pinModel.userPinIds('photography')).toEqual(['post-photo-1']);
    });

    it('reads research personal pins from isSaved publications', () => {
        expect(pinModel.userPinIds('research')).toEqual(['research-1']);
    });

    it('partitions pinned tab into highlighted and yours', () => {
        const items = [
            { id: 'event-1', title: 'Highlighted' },
            { id: 'event-2', title: 'Yours' },
            { id: 'event-3', title: 'Other' }
        ];
        const sections = pinModel.partitionPinnedTab('event', items);
        expect(sections.highlighted.map((item) => item.id)).toEqual(['event-1']);
        expect(sections.yours.map((item) => item.id)).toEqual(['event-2']);
        expect(sections.all.map((item) => item.id)).toEqual(['event-1', 'event-2']);
    });

    it('allows curator pin when viewer is photo author', () => {
        expect(pinModel.viewerCanCuratorPin('photo', { authorUserId: 'viewer-1' })).toBe(true);
        expect(pinModel.viewerCanCuratorPin('photo', { authorUserId: 'other-1' })).toBe(false);
    });

    it('allows curator pin for admin role', () => {
        pinModel = loadPinModel({
            getCurrentUser: () => ({ id: 'admin-1', role: 'admin' })
        });
        expect(pinModel.viewerCanCuratorPin('photo', { authorUserId: 'other-1' })).toBe(true);
    });

    it('renderPinnedSections uses shared kicker and matte empty state', () => {
        const html = pinModel.renderPinnedSections('event', { highlighted: [], yours: [] }, () => '', 'Nothing pinned.');
        expect(html).toContain('social-neo-empty home-hover-chip');
        expect(html).not.toContain('social-pin-section-title');
        const withItems = pinModel.renderPinnedSections('event', {
            highlighted: [{ id: 'event-1', title: 'A' }],
            yours: []
        }, (item) => `<span>${item.title}</span>`, 'Empty');
        expect(withItems).toContain('lux-section-kicker social-pin-section-title');
        expect(withItems).toContain('social-pin-section');
        expect(withItems).toContain('Highlighted');
    });

    it('renderModulePinActions uses single Save button for all viewers', () => {
        const html = pinModel.renderModulePinActions('survey', 'survey-1', { canCuratorPin: false });
        expect(html).toContain('data-action="module-personal-pin"');
        expect(html).toContain('> Save</button>');
        expect(html).not.toContain('social-module-pin-menu-shell');
        expect(html).not.toContain('module-curator-pin');
    });

    it('renderModulePinActions shows Saved label when already pinned', () => {
        const html = pinModel.renderModulePinActions('survey', 'survey-2', {
            canCuratorPin: true,
            isPersonalPinned: true
        });
        expect(html).toContain('> Saved</button>');
        expect(html).not.toContain('social-module-pin-menu-shell');
        expect(html).not.toContain('module-curator-pin');
    });

    it('exposes pin API health helpers and restart copy', () => {
        expect(pinModel.PIN_API_UNAVAILABLE_MESSAGE).toContain('npm run stop:local && npm run start:local');
        expect(pinModel.PIN_API_BANNER_MESSAGE).toContain('Pins won\'t save');
        expect(typeof pinModel.checkPinApiHealth).toBe('function');
        expect(typeof pinModel.setPinApiUnavailable).toBe('function');
    });
});
