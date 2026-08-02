import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadChrome(extra = {}) {
    const runtime = {
        ui: {
            homeFeedFilter: 'following',
            profileTab: 'about',
            eventTitle: 'x',
            lostFoundTitle: 'y'
        }
    };
    const sandbox = {
        window: {
            location: { href: 'https://example.test/social.html' },
            __kiuSocialChromeHooks: {
                text: (v) => String(v == null ? '' : v).trim(),
                state: () => runtime,
                currentUserId: () => 'u1',
                currentUser: () => ({ facultyCode: 'ECON', role: 'student' }),
                toDateTimeLocalValue: (v) => String(v || '').slice(0, 16),
                ...extra
            }
        },
        URL,
        Date,
        Math,
        Set,
        Array,
        String,
        Boolean,
        Number
    };
    sandbox.window.window = sandbox.window;
    sandbox.runtime = runtime;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-chrome-model.js'), 'utf8'),
        sandbox
    );
    return sandbox;
}

describe('social-chrome-model', () => {
    let sandbox;
    let win;

    beforeEach(() => {
        sandbox = loadChrome();
        win = sandbox.window;
    });

    it('exports chrome helpers', () => {
        expect(win.__KIU_SOCIAL_CHROME_MODEL_LOADED).toBe(true);
        expect(win.KiuSocialChromeModel.roleLabel).toBe(win.roleLabel);
        expect(win.roleLabel('student')).toBe('Student');
        expect(win.isJoinedGroup({ membershipState: 'member' })).toBe(true);
        expect(win.pageTypeLabel({ pageType: 'campus' })).toBe('Campus Page');
        expect(win.messageLinks({ text: 'see https://kiu.edu.ge/x and more' })).toContain('https://kiu.edu.ge/x');
    });

    it('builds context tabs and clears drafts', () => {
        expect(win.buildContextTabItems('feed', sandbox.runtime)).toEqual([]);
        expect(win.buildContextTabItems('profile', sandbox.runtime).map((t) => t.action))
            .toEqual([
                'profile-tab-posts',
                'profile-tab-friends',
                'profile-tab-following',
                'profile-tab-saved',
                'profile-tab-about'
            ]);
        expect(win.renderContextTabs('alerts')).toContain('Messages');
        win.clearEventDraft();
        expect(sandbox.runtime.ui.eventTitle).toBe('');
        win.resetLostFoundDraft();
        expect(sandbox.runtime.ui.lostFoundTitle).toBe('');
    });

    it('is wired before social-page and peeled from it', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        for (const name of [
            'uniqueStrings',
            'roleLabel',
            'isJoinedGroup',
            'groupAvatar',
            'pageAvatar',
            'pagePostTypeLabel',
            'messageLinks',
            'clearEventDraft',
            'renderContextTabs',
            'escape',
            'when',
            'postKey',
            'displayName',
            'avatar',
            'fileUrl',
            'isImage',
            'currentFacultyCode'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(page).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(html).toContain('social-chrome-model.js');
        expect(html.indexOf('social-chrome-model.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('renders account presence and avatars', () => {
        sandbox.runtime.accountsById = {
            u2: { id: 'u2', displayName: 'Ada Lovelace', role: 'student', facultyCode: 'CS', online: true }
        };
        expect(win.displayName('u2')).toBe('Ada Lovelace');
        expect(win.accountSubtitle(sandbox.runtime.accountsById.u2)).toContain('Student');
        expect(win.presencePill(sandbox.runtime.accountsById.u2)).toContain('is-online');
        expect(win.avatar({ displayName: 'Ada Lovelace' })).toContain('is-fallback');
        expect(win.isImage({ name: 'shot.png', type: 'image/png' })).toBe(true);
        expect(win.postKey({ id: 'p1' })).toBe('p1');
        expect(win.escape('<x>')).toBe('&lt;x&gt;');
    });

    it('does not recurse when chrome hooks re-export escape', () => {
        win.__kiuSocialChromeHooks.escape = win.escape;
        expect(() => win.escape('<tag>')).not.toThrow();
        expect(win.escape('<tag>')).toBe('&lt;tag&gt;');
    });
});
