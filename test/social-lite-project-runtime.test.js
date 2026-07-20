import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-lite-project-runtime peel', () => {
    it('owns project membership/tasks/budget/risk helpers via factory', () => {
        const main = readSource('assets/js/shared/social-runtime-lite.js');
        const peel = readSource('assets/js/shared/social-lite-project-runtime.js');
        expect(main).toContain('__kiuCreateSocialLiteProjectApi');
        expect(main).not.toMatch(/^\s*async function inviteProjectMember\b/m);
        expect(main).not.toMatch(/^\s*async function createProjectTask\b/m);
        expect(main).not.toMatch(/^\s*async function publishProjectShowcase\b/m);
        expect(peel).toContain('function inviteProjectMember');
        expect(peel).toContain('function createProjectTask');
        expect(peel).toContain('__kiuCreateSocialLiteProjectApi');
        expect(peel).toContain('__KIU_SOCIAL_LITE_PROJECT_LOADED');
        expect(peel).toContain('Object.assign(window, api)');
    });

    it('loads before social-runtime-lite.js on social.html and app.js', () => {
        const html = readSource('social.html');
        const app = readSource('assets/js/app/app.js');
        expect(html.indexOf('social-lite-project-runtime.js'))
            .toBeLessThan(html.indexOf('social-runtime-lite.js'));
        expect(app.indexOf('social-lite-project-runtime.js'))
            .toBeLessThan(app.indexOf("['assets/js/shared/social-runtime-lite.js"));
    });
});
