/* CONTRACT: Each social domain module exports the is/handle click/input/change (+ submit) contract; logic stays out of social-page.js. — see docs/test-as-map.md */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

/** Lazy domain modules (not shell/mobile/render-plan). */
const DOMAIN_MODULES = [
    { file: 'social-community.js', token: 'Community', requireSubmit: false },
    { file: 'social-alerts.js', token: 'Alerts', requireSubmit: false },
    { file: 'social-lost-found.js', token: 'LostFound', requireSubmit: true },
    { file: 'social-photography.js', token: 'Photography', requireSubmit: true },
    { file: 'social-surveys.js', token: 'Surveys', requireSubmit: true },
    { file: 'social-messages.js', token: 'Messages', requireSubmit: true },
    { file: 'social-profile.js', token: 'Profile', requireSubmit: true },
    { file: 'social-events.js', token: 'Events', requireSubmit: true },
    { file: 'social-groups.js', token: 'Groups', requireSubmit: true },
    { file: 'social-feed.js', token: 'Feed', requireSubmit: true },
    { file: 'social-pages.js', token: 'Pages', requireSubmit: true },
    { file: 'social-workspace.js', token: 'Workspace', requireSubmit: true }
];

describe('social domain export contract', () => {
    it('documents the contribution boundary on the architecture page', () => {
        const docs = readSource('docs/social-architecture.md');
        expect(docs).toContain('Contribution rule');
        expect(docs).toContain('Domain module export contract');
        expect(docs).toContain('routeSocialDomain');
        expect(docs).toMatch(/Domain logic never lands in `social-page\.js`/);
    });

    it('exports is/handle click, input, change (+ submit when required) and MODULE_LOADED', () => {
        for (const { file, token, requireSubmit } of DOMAIN_MODULES) {
            const source = readSource(`assets/js/pages/${file}`)
                + (file === 'social-workspace.js'
                    ? readSource('assets/js/pages/social-workspace-events.js')
                        + readSource('assets/js/pages/social-workspace-events-input-runtime.js')
                        + readSource('assets/js/pages/social-workspace-events-submit-runtime.js')
                        + readSource('assets/js/pages/social-workspace-week-plan-model.js')
                    : '');
            const required = [
                `isSocial${token}ClickAction`,
                `handleSocial${token}Click`,
                `isSocial${token}InputTarget`,
                `handleSocial${token}Input`,
                `isSocial${token}ChangeTarget`,
                `handleSocial${token}Change`
            ];
            if (requireSubmit) {
                required.push(`isSocial${token}SubmitForm`, `handleSocial${token}Submit`);
            }
            for (const name of required) {
                expect(source, `${file} should define ${name}`).toContain(`function ${name}`);
                if (file === 'social-workspace.js' && name.startsWith('handleSocial')) {
                    expect(
                        readSource('assets/js/pages/social-workspace.js')
                        + readSource('assets/js/pages/social-workspace-events.js'),
                        `${file} should export window.${name}`
                    ).toContain(`window.${name}`);
                } else {
                    expect(source, `${file} should expose ${name} through its module API`)
                        .toMatch(new RegExp(`window\\.${name}|__kiu\\w+Expose`));
                }
            }
            expect(source, `${file} should set MODULE_LOADED`).toMatch(/__KIU_SOCIAL_\w+_MODULE_LOADED/);
        }
    });

    it('routes domain events through routeSocialDomain on the shell page', () => {
        const page = readSource('assets/js/pages/social-page.js')
            + readSource('assets/js/pages/social-page-boot-runtime.js');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');
        const pageEvents = readSource('assets/js/pages/social-page-events.js');
        expect(shellNav).toContain('function routeSocialDomain(');
        expect(page).toContain('createKiuSocialShellNavApi');
        expect(page).toContain('createKiuSocialPageEventsApi');
        expect(shellNav).toContain("handle: 'handleSocialFeedClick'");
        expect(shellNav).toContain("handle: 'handleSocialWorkspaceClick'");
        expect(pageEvents).toContain("handle: 'handleSocialFeedSubmit'");
        expect(pageEvents).toContain("handle: 'handleSocialFeedInput'");
        expect(pageEvents).toContain("handle: 'handleSocialFeedChange'");
    });

    it('keeps the twelve domain modules present under pages/', () => {
        const dir = join(process.cwd(), 'assets/js/pages');
        const names = new Set(readdirSync(dir));
        for (const { file } of DOMAIN_MODULES) {
            expect(names.has(file), `missing ${file}`).toBe(true);
        }
    });
});
