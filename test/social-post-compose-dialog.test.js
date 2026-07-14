import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social post compose dialog regressions', () => {
    it('replaces the inline Home composer with a Create post popup CTA', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const feedModule = readSource('assets/js/pages/social-feed.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect((source + feedModule)).toContain("if (action === 'post-compose-open')");
        expect((source + feedModule)).toContain("openDialog('post-compose'");
        expect(readSource('assets/js/pages/social-feed.js')).toContain("if (kind === 'post-compose')");
        expect(source).toContain('function renderPostComposeDialog(');
        expect(feedModule).toContain('function renderPostComposeDialog(');
        expect(source).toContain('function renderPostComposeShareSection(');
        expect(feedModule).toContain('function renderPostComposeShareSection(');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('postComposeDialogReasons');
        expect(feedModule).toContain('data-action="post-compose-open"');
        expect(feedModule).toContain('social-neo-composer-cta');

        const feedBlock = feedModule.match(/function renderFeedPanel\(\)[\s\S]*?\n    \}/)?.[0] || '';
        expect(feedBlock).toContain('post-compose-open');
        expect(feedBlock).not.toContain('data-action="post-submit"');
        expect(feedBlock).not.toContain('data-action="panel-events"');

        expect((source + feedModule)).toMatch(/if \(formType === 'post-compose'\)[\s\S]*?closeDialog\(\)/);
        expect(css).toContain('.social-neo-dialog-card--post-compose');
        expect(css).toContain('.social-neo-composer-cta');
    });

    it('uses Create workspace chrome with slim Share from campus and stacked attach picker', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const feedModule = readSource('assets/js/pages/social-feed.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const backend = readSource('backend/platform/domains/social-content-service.js');
        const surveys = readSource('backend/platform/domains/social-surveys-service.js');
        const css = readSource('assets/css/social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(source).toContain('function listAttachableEntities(');
        expect(source).toContain('function renderPostComposeShareSection(');
        expect(feedModule).toContain('function renderPostComposeShareSection(');
        expect(source).toContain('function renderPostComposeAttachDialog(');
        expect(feedModule).toContain('function renderPostComposeAttachDialog(');
        expect(source).toContain('function patchPostComposeAttachDialog(');
        expect(source).not.toContain('function renderPostComposeAttachView(');
        expect(source).not.toContain('function renderPostComposeBody(');
        expect(source).not.toContain("data-action=\"post-compose-attach-open\"");
        expect(source).not.toContain('postComposeView');
        expect(source).toContain("'post-compose-attach'");
        expect(feedModule).toContain('social-neo-dialog-card--post-compose social-neo-dialog-card--project-create social-neo-dialog-card--lms-create');
        expect(feedModule).toContain('social-neo-dialog-card--post-compose-attach');
        expect(feedModule).toContain('social-neo-dialog-backdrop--stacked-child');
        expect(feedModule).toContain('social-neo-dialog-project-create-section');
        expect(feedModule).toContain('social-neo-dialog-body--project-create');
        expect(feedModule).toContain('social-neo-post-compose-selected');
        expect(feedModule).toContain('social-neo-entity-card');
        expect(feedModule).toContain('Basic info');
        expect(feedModule).toContain('Share from campus');
        expect(feedModule).toContain('social-neo-post-compose-section-shortcuts');
        expect(feedModule).toContain('data-section="${escape(entry.id)}"');
        expect(feedModule).toContain('data-action="post-compose-attach-section"');
        expect(feedModule).toContain('data-action="post-compose-attach-pick-add"');
        expect(feedModule).toContain('data-action="post-compose-entity-remove"');
        expect((source + feedModule)).toContain("action === 'post-compose-attach-section'");
        expect((source + feedModule)).toContain("action === 'post-compose-attach-pick-add'");
        expect((source + feedModule)).toContain("action === 'post-compose-entity-remove'");
        expect((source + feedModule)).toContain("runtime.ui.composerEntityLinks = normalizeComposerEntityLinks([...existing, { type, id }])");
        expect((source + feedModule)).toContain("const mineRows = listAttachableEntities(section, 'mine', '')");
        expect((source + feedModule)).toContain("runtime.ui.postComposeAttachFilter = mineRows.length ? 'mine' : 'others'");
        expect((source + feedModule)).toContain("openDialog('post-compose-attach'");
        expect(source).toContain('function patchPostComposeDialog(');
        expect(feedModule).toContain('social-neo-post-compose-file-host');
        expect(feedModule).toContain('data-filter="mine"');
        expect(feedModule).toContain('data-filter="others"');
        expect(feedModule).toContain('My creations');
        expect(feedModule).toContain('Others / campus');
        expect(source).toContain('function renderPostEntityLinks(');
        expect(source).toContain("data-action=\"entity-link-open\"");
        expect(source).toContain('entityLinks');

        const shareFn = feedModule.match(/function renderPostComposeShareSection\([\s\S]*?\n    function /)?.[0] || '';
        expect(shareFn).toContain('social-neo-post-compose-selected');
        expect(shareFn).not.toContain('Search results');
        expect(shareFn).not.toContain('social-neo-dialog-invite-columns');
        expect(shareFn).not.toContain('post-compose-attach-filter');

        expect(runtime).toContain('entityLinks');
        expect(runtime).toContain('linkedSurveyId');

        expect(backend).toContain('function normalizeSocialEntityLinks(');
        expect(backend).toContain('entityLinks');
        expect(backend).toContain('SOCIAL_ENTITY_LINK_TYPES');

        expect(surveys).toContain("entityLinks: [{ type: 'survey', id: survey.id }]");

        expect(css).toContain(':is(.social-neo-dialog-card--project-create, .social-neo-dialog-card--post-compose)');
        expect(css).toContain('.social-neo-dialog-card--post-compose-attach');
        expect(css).toContain('.social-neo-dialog-body--post-compose-attach');
        expect(css).toContain('.social-neo-dialog-backdrop--post-compose-attach');
        expect(css).toMatch(/\.social-neo-dialog-backdrop:has\(> :is\(\.social-neo-dialog-card--project-create, \.social-neo-dialog-card--post-compose\)\)\s*\{[^}]*animation:\s*none/s);
        expect(css).not.toContain('body.lux-route-social .social-neo-dialog-body--post-compose');
        expect(utilities).toContain("'.social-neo-dialog-card--post-compose'");
        expect(utilities).toContain("'.social-neo-dialog-card--post-compose-attach'");
    });

    it('opens a stacked attach picker from section badges and patches it in place', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const feedModule = readSource('assets/js/pages/social-feed.js');
        const combined = source + feedModule;
        const stackedKinds = source.match(/const STACKED_DIALOG_KINDS = new Set\(\[[\s\S]*?\]\)/)?.[0] || '';
        const sectionHandler = combined.match(/if \(action === 'post-compose-attach-section'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const filterHandler = combined.match(/if \(action === 'post-compose-attach-filter'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const pickHandler = combined.match(/if \(action === 'post-compose-attach-pick-add'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const removeHandler = combined.match(/if \(action === 'post-compose-entity-remove'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const searchInput = (source + feedModule).match(/if \(target\.matches\('form\[data-form="post-compose-attach"\] \[name="postComposeAttachSearch"\]'\)\) \{[\s\S]*?\n        \}/)?.[0] || '';
        const shareFn = feedModule.match(/function renderPostComposeShareSection\([\s\S]*?\n    function /)?.[0] || '';

        expect(stackedKinds).toContain("'post-compose-attach'");
        expect(sectionHandler).toContain("openDialog('post-compose-attach'");
        expect(sectionHandler).not.toContain('patchPostComposeDialog');
        expect(filterHandler).toContain('if (patchPostComposeAttachDialog(runtime)) return;');
        expect(pickHandler).toContain('if (patchPostComposeAttachDialog(runtime)) return;');
        expect(removeHandler).toContain('patchPostComposeAttachDialog');
        expect(removeHandler).toContain('patchPostComposeDialog');
        expect(searchInput).toContain('if (patchPostComposeAttachDialog(runtime)) return;');
        expect(shareFn).toContain('social-neo-post-compose-selected');
        expect(shareFn).not.toContain('Search results');
        expect(shareFn).not.toContain('social-neo-dialog-invite-columns');
        expect(readSource('assets/js/pages/social-feed.js')).toContain("if (kind === 'post-compose-attach')");
    });

    it('keeps legacy linkedSurveyId feed cards while rendering entityLinks', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const feedModule = readSource('assets/js/pages/social-feed.js');
        expect(source).toContain('function postEntityLinks(');
        expect(source).toContain('linkedSurveyId');
        expect(source).toContain('survey-take-open');
        expect(source).toContain('social-neo-post-entity-card');
        // Card body owns renderPostEntityLinks call; helper stays on page, card in feed module.
        expect(source + feedModule).toContain('renderPostEntityLinks(post)');
        expect(feedModule).toContain('function renderPost(post)');
        expect(source).toMatch(/function renderPost\(post\)[\s\S]*window\.renderPost !== renderPost/);
    });
});
