import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { readSocialPageChain, readSocialPageJs, readSocialHtml } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadFingerprintModel(extra = {}) {
    const sandbox = {
        window: {
            __kiuSocialFingerprintHooks: {
                text: (v) => String(v == null ? '' : v).trim(),
                postKey: (p) => String(p?.id || p || ''),
                isPostSaved: (id) => id === 'p1',
                ...extra
            }
        }
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-fingerprint-model.js'), 'utf8'),
        sandbox
    );
    return sandbox.window;
}

describe('social-fingerprint-model', () => {
    let win;

    beforeEach(() => {
        win = loadFingerprintModel();
    });

    it('exports fingerprint helpers', () => {
        expect(win.__KIU_SOCIAL_FINGERPRINT_MODEL_LOADED).toBe(true);
        expect(win.KiuSocialFingerprintModel.buildFeedFingerprint).toBe(win.buildFeedFingerprint);
    });

    it('builds feed and domain fingerprints', () => {
        const runtime = {
            feed: [{
                id: 'p1',
                viewerReaction: 'like',
                reactionCounts: { like: 2 },
                isPinned: true,
                replyCount: 1,
                shareCount: 0,
                comments: [{ id: 'c1', reactionCounts: { like: 1 }, replies: [] }]
            }],
            ui: { commentDraftByPost: {}, commentReplyTargetByPost: {} },
            social: {
                relationships: [{ id: 'r1', type: 'connection', status: 'accepted', fromId: 'u1', toId: 'u2' }],
                lostFoundItems: [{ id: 'lf1', status: 'lost', expiresAt: '2026-08-01', createdAt: '2026-07-01' }],
                surveys: [{ id: 's1', status: 'open', closesAt: '', responseCount: 0 }],
                surveyResponses: [],
                events: [{ id: 'e1', viewerRsvpStatus: 'going', viewerCanEdit: true, viewerCanDelete: false, attendeeSummary: { going: 1, interested: 0 } }],
                groups: [{ id: 'g1', membershipState: 'member', viewerIsMember: true, memberCount: 3, visibility: 'public', isManager: false }],
                reports: [{ id: 'rep1', status: 'open' }],
                projects: [{ id: 'pr1', status: 'active', tasks: [], members: [], createdAt: '2026-07-01' }],
                pages: [{ id: 'pg1', isFollowing: true }]
            },
            directory: [{ id: 'u1' }],
            notifications: [{ id: 'n1', isRead: false, createdAt: '2026-07-19' }],
            chats: [{ id: 'c1', unreadCount: 2, updatedAt: '2026-07-19' }]
        };
        expect(win.buildFeedFingerprint(runtime)).toContain('p1');
        expect(win.buildRelationshipsFingerprint(runtime)).toContain('r1');
        expect(win.buildLostFoundFingerprint(runtime)).toContain('lf1');
        expect(win.buildSurveysFingerprint(runtime)).toContain('s1');
        expect(win.buildEventsFingerprint(runtime)).toContain('e1');
        expect(win.buildGroupsFingerprint(runtime)).toContain('g1');
        expect(win.buildDirectoryFingerprint(runtime)).toContain('u1');
        expect(win.buildPagesFingerprint(runtime)).toContain('pg1');
    });

    it('is wired before social-page and peeled from it', () => {
        const page = readSocialPageJs();
        const chain = readSocialPageChain();
        const html = readSocialHtml();
        for (const name of [
            'collectCommentReactionFingerprint',
            'buildFeedFingerprint',
            'buildRelationshipsFingerprint',
            'buildPagesFingerprint'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(chain).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(chain).toMatch(/const buildSocialRenderSignature = window\.buildSocialRenderSignature/);
        expect(page).not.toMatch(/function\s+buildSocialRenderSignature\s*\(/);
        expect(chain).toMatch(/isSocialForceRenderReason/);
        expect(readSource('assets/js/pages/social-fingerprint-model.js')).toContain('function isSocialForceRenderReason(reason)');
        expect(page).not.toMatch(/const forceRender = \/\^/);
        expect(html).toContain('social-fingerprint-model.js');
        expect(html.indexOf('social-fingerprint-model.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('classifies force-render reasons', () => {
        expect(win.isSocialForceRenderReason('feed-tab')).toBe(true);
        expect(win.isSocialForceRenderReason('lost-found-tab')).toBe(true);
        expect(win.isSocialForceRenderReason('dialog-open')).toBe(true);
        expect(win.isSocialForceRenderReason('manual')).toBe(false);
        expect(win.isSocialForceRenderReason('poll-tick')).toBe(false);
    });

    it('render signature changes when lostFoundTab changes', () => {
        const baseRuntime = {
            feed: [],
            ui: { lostFoundTab: 'all' },
            social: {
                relationships: [],
                lostFoundItems: [],
                surveys: [],
                surveyResponses: [],
                events: [],
                groups: [],
                reports: [],
                projects: [],
                pages: []
            },
            directory: [],
            notifications: [],
            chats: []
        };
        win = loadFingerprintModel({
            currentUser: () => ({ role: 'student' }),
            currentUserId: () => 'u1',
            currentFacultyCode: () => 'CS',
            activeDialog: () => null,
            isPortalStoryViewerOpen: () => false,
            isPortalStoryComposerOpen: () => false
        });
        const allSig = win.buildSocialRenderSignature('lost-and-found', baseRuntime);
        const pinnedSig = win.buildSocialRenderSignature('lost-and-found', {
            ...baseRuntime,
            ui: { lostFoundTab: 'pinned' }
        });
        expect(allSig).not.toBe(pinnedSig);
    });

    it('builds a render signature from ui + fingerprints', () => {
        const runtime = {
            feed: [],
            ui: { activeChatId: 'c1', homeFeedFilter: 'all' },
            social: {
                relationships: [],
                lostFoundItems: [],
                surveys: [],
                surveyResponses: [],
                events: [],
                groups: [],
                reports: [],
                projects: [],
                pages: []
            },
            directory: [],
            notifications: [],
            chats: [],
            flash: { message: 'ok', tone: 'success' }
        };
        win = loadFingerprintModel({
            currentUser: () => ({ role: 'student' }),
            currentUserId: () => 'u1',
            currentFacultyCode: () => 'CS',
            activeDialog: () => ({ type: 'post-compose', postId: 'p1' }),
            isPortalStoryViewerOpen: () => false,
            isPortalStoryComposerOpen: () => false
        });
        const sig = win.buildSocialRenderSignature('feed', runtime);
        expect(sig).toContain('feed');
        expect(sig).toContain('student');
        expect(sig).toContain('c1');
        expect(sig).toContain('post-compose');
        expect(sig).toContain('ok');
    });

    it('portfolio fingerprint changes when extras are added', () => {
        const empty = {
            ui: { myPortfolio: { status: 'draft', sections: [], extras: [] }, portfolioSaveStatus: '' }
        };
        const withExtra = {
            ui: {
                myPortfolio: {
                    status: 'draft',
                    sections: [],
                    extras: [{ id: 'extra-1', kind: 'note', title: '', detail: '', url: '' }]
                },
                portfolioSaveStatus: ''
            }
        };
        expect(win.buildPortfolioFingerprint(empty)).not.toBe(win.buildPortfolioFingerprint(withExtra));
        expect(win.buildPortfolioFingerprint(withExtra)).toContain(':1:');
    });
});
