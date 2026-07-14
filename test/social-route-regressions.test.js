import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social route regressions', () => {
    it('keeps standalone social bootstrap time helpers available without loading app.js', () => {
        const bootstrap = readSource('assets/js/app/social-standalone-bootstrap.js');
        const html = readSource('social.html');

        expect(html).toContain('assets/js/app/social-standalone-bootstrap.js?v=20260608-groups-create2');
        expect(html).not.toContain('assets/js/app/app.js');
        expect(bootstrap).toContain('window.normalizeTimeString = normalizeTimeString');
        expect(bootstrap).toContain('window.parseTimeString = parseTimeString');
        expect(bootstrap).toContain('window.convertTimeToMinutes = convertTimeToMinutes');
        expect(bootstrap).toContain('window.minutesToTimeString = minutesToTimeString');
    });

    it('keeps social glass tokens aligned with utilities and index-luxury dedupe', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const indexLuxury = readSource('assets/css/index-luxury.css');
        const html = readSource('social.html');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260713-accentborder3');
        expect(html).toContain('assets/css/index-luxury.css?v=20260713-accentborder2');
        expect(html).toContain('lux-route-social');

        expect(css).toMatch(/body\.lux-route-social\s*\{[\s\S]*--social-fade-surface:/);
        expect(css).toContain('--sn-bdr: var(--social-fade-border-soft)');
        expect(css).toContain('--social-fade-surface');
        expect(css).toContain('--social-fade-surface-soft');
        expect(css).toContain('--social-fade-control');
        expect(css).toContain('--social-fade-chip');
        expect(css).toContain('--social-fade-row');
        expect(css).toContain('--social-fade-modal');
        expect(css).toContain('/* ═══ Social Route Isolation ═══ */');
        expect(css).toContain('background: var(--social-fade-surface) !important');
        expect(css).toContain('background: var(--social-fade-surface-soft) !important');
        expect(css).toContain('--sn-bg: var(--social-fade-surface)');
        expect(css).toContain('html.lux-high-transparency body.lux-route-social');

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-social')");
        expect(utilitiesSource).toContain("el.classList.contains('social-neo-card')");
        expect(utilitiesSource).toContain('SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES');
        expect(utilitiesSource).toContain("'social-neo-dialog-card'");
        expect(utilitiesSource).not.toContain('if (isSocialSurface)');

        expect(indexLuxury).toContain(
            'body:not(.lux-light-mode):not(.lux-route-social) .social-neo-card'
        );
        expect(indexLuxury).toContain('Social glass SSoT: --social-fade-*');
        expect(indexLuxury).not.toMatch(
            /body\.lux-route-social #page-social \.social-neo-card[\s\S]{0,200}rgba\(10, 15, 24/
        );
    });

    it('keeps project tasks tab header compact with inline stats and create action', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');
        const projectsCss = readSource('assets/css/social-projects-lms.css');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const tasksTabBlock = (() => {
                    const start = classicBlock.indexOf('const renderTasksTab = () => {');
                    if (start < 0) return '';
                    let depth = 0;
                    for (let i = start; i < classicBlock.length; i++) {
                        const ch = classicBlock[i];
                        if (ch === '{') depth += 1;
                        else if (ch === '}') {
                            depth -= 1;
                            if (depth === 0) return classicBlock.slice(start, i + 1);
                        }
                    }
                    return '';
                })();

        expect(tasksTabBlock).toContain('social-project-task-shell-header');
        // Desk header is roomy (not compact flag); stats live in shared CSS + desk chrome.
        expect(tasksTabBlock).toContain('social-project-task-shell-header--roomy');
        expect((socialPage + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-stats-inline');
        expect(tasksTabBlock).toContain('project-task-create-open');
        expect(tasksTabBlock).not.toContain('social-project-task-shell-toolbar');
        expect(tasksTabBlock).not.toContain('social-project-task-shell-summary');
        expect(tasksTabBlock).not.toContain('Total, overdue, and status counts.');
        expect(projectsCss).toContain('.social-project-task-shell-header');
        expect(projectsCss).toContain('.social-project-task-stats-inline');
        expect(projectsCss).toMatch(/\.social-project-task-stats-bar\s*\{[^}]*display:\s*grid/);
    });

    it('keeps project task creation in the social dialog overlay', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const projectsCss = readSource('assets/css/social-projects-lms.css');

        expect((socialPage + readSource('assets/js/pages/social-workspace.js'))).toContain("openDialog('project-task-create'");
        expect((socialPage + readSource('assets/js/pages/social-workspace.js'))).toContain('project-task-create-open');
        expect(socialPage).toContain('renderProjectTaskCreateDialog');
        expect(socialPage + readSource('assets/js/pages/social-workspace.js')).toContain("kind === 'project-task-create'");
        expect((socialPage + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-shell');
        expect(classicBlock).toContain('social-project-task-compose-trigger');
        expect(socialPage).not.toContain('project-task-toggle-form');
        expect(socialPage).not.toContain('social-project-task-form-wrap');
        expect(projectsCss).not.toContain('.social-project-task-form-wrap');
        expect(projectsCss).toContain('.social-project-task-shell');
        expect(projectsCss).toContain('.social-project-task-compose-trigger');
    });

    it('merges community hero and tab content into one panel', () => {
        const communityModule = readSource('assets/js/pages/social-community.js');
        const socialPage = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(communityModule).toContain('renderDirectoryBody');
        expect(communityModule).toContain('renderRequestBody');
        expect(communityModule).not.toContain('renderDirectorySection');
        expect(communityModule).not.toContain('<div class="social-neo-stack social-neo-community-layout">');
        expect(communityModule).toContain('renderCommunityHero(runtime, activeCommunityTab, communityStats, activeBody');
        expect(socialPage).toContain('social-neo-community-hero-divider');
        expect(socialPage).toContain('is-merged');
        expect(css).toContain('.social-neo-community-panel.is-merged');
        expect(css).toContain('.social-neo-community-hero-divider');
    });

    it('merges groups hero shell with grid content like events', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');
        const groupsModule = readSource('assets/js/pages/social-groups.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(groupsModule).toContain('social-neo-groups-shell--merged');
        expect(groupsModule).toContain('social-neo-groups-hero-divider');
        expect(groupsModule).toContain('social-neo-groups-hub-body');
        expect(groupsModule).toContain('renderGroupsHero(runtime, groups, activeTab, { gridHtml: contentView })');
        expect(socialPage).toContain('function renderGroupsPanel()');
        expect(socialPage).toContain("queueDeferredModuleRender('groups-module')");
        expect(groupsModule).toMatch(/social-neo-groups-hero[\s\S]*is-merged/);
        expect(css).toContain('.social-neo-groups-shell--merged');
        expect(css).toContain('.social-neo-groups-hero-divider');
        expect(css).toContain('.social-neo-groups-hero.is-merged .social-neo-empty-hero');
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social \.social-neo-groups-hero \{[\s\S]*border-color: var\(--social-fade-border-soft\)/
        );
        const lightGroupsHero = css.match(
            /html body\.lux-light-mode\.lux-route-social \.social-neo-groups-hero \{[\s\S]*?\n\}/
        )?.[0] || '';
        // asd10: light groups hero may use fade surface tokens (design SSOT)
        if (lightGroupsHero) {
            expect(lightGroupsHero).toMatch(/border-color|background/);
        }
    });

    it('keeps events surfaces on social-fade tokens in light mode instead of nested inline glass', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(utilities).toContain('SOCIAL_FADE_CSS_MANAGED_CLASSES');
        expect(utilities).toContain("'social-neo-events-hero-stat'");
        expect(utilities).toContain("'social-neo-events-lane'");
        expect(utilities).toContain("if (shouldKeepSocialFadeCssBackground(el))");

        // Unified hero-stat :is() list + dedicated events lane/stat fade tokens
        expect(css).toContain('.social-neo-events-hero-stat');
        expect(css).toContain('.social-neo-events-hero .social-neo-events-hero-stat.lux-strip-card');
        expect(css).toMatch(
            /body\.lux-route-social \.social-neo-events-lane \{[\s\S]*background:\s*var\(--social-fade-surface\)/
        );
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social \.social-neo-events-hero-stat \{[\s\S]*var\(--social-fade-surface-soft\)/
        );
        expect(css).toContain('body.lux-route-social .social-neo-events-hero {');
    });

    it('drops Plan tab and keeps Budget instead of Outcome', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).not.toContain("['plan', 'Plan'");
        expect(classicBlock).toContain("['budget', 'Budget'");
        expect(classicBlock).not.toMatch(/\['milestones', 'Milestones'/);
        expect(classicBlock).not.toMatch(/\['meetings', 'Meetings'/);
        expect(classicBlock).not.toMatch(/\['outcome', 'Outcome'/);
        expect(classicBlock).not.toContain('renderPlanTab');
        expect(classicBlock).toContain('renderBudgetTab');
        expect(source).not.toContain('renderOutcomeTab');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/tabAlias\s*=\s*\{[^}]*outcome:\s*'budget'[^}]*\}/);
        expect(classicBlock).toContain('data-form="project-budget-settings"');
        expect(classicBlock).toContain('data-form="project-budget-category-add"');
        expect(classicBlock).toContain('data-form="project-budget-expense-add"');
    });

    it('patches project workspace tabs without replacing the full center shell', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).toContain('id="social-project-tab-panel"');
        expect(source).toContain("createSocialWorkspaceStub('patchProjectWorkspaceTab'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/if \(patchProjectWorkspaceTab\(state\(\)\)\) return;/);
        expect(source).toContain('WORKSPACE_DIALOG_KEEP_CENTER');
        expect(source).toContain('function renderDialogOnlyNow()');
    });
    it('uses asd10 social isolation glass (shared surface paint SSOT)', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');
        const indexLuxury = readSource('assets/css/index-luxury.css');

        const isolationBlock = css.match(
            /\/\* ═══ Social Route Isolation ═══ \*\/[\s\S]*?body\.lux-route-social #page-social/
        )?.[0] || '';

        expect(isolationBlock).toContain('--social-fade-surface:');
        expect(isolationBlock).toContain('calc(var(--lux-transparency-alpha, .92) * 0.91)');
        expect(isolationBlock).toContain('--social-fade-blur: blur(calc(2px + (var(--lux-transparency-alpha, 0.92) * 14px)))');
        expect(isolationBlock).not.toContain('/* Soft tier — cards and stat tiles');
        expect(css).not.toContain('/* Hero tier — lms-clean-hero fixed fill');

        expect(css).toContain('/* Panel shells — CSS-owned (wins over index-luxury + JS painter) */');
        expect(css).toMatch(
            /body\.lux-route-social #page-social :is\([\s\S]*\.social-neo-post-card,[\s\S]*background: var\(--social-fade-surface\)/
        );
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card[\s\S]*var\(--social-fade-modal/
        );

        const managedBlock = utilities.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        expect(managedBlock).toContain("'social-neo-card'");
        expect(utilities).toContain('function shouldKeepSocialFadeCssBackground(el)');
        expect(utilities).toContain('SOCIAL_FADE_CSS_MANAGED_CLASSES.has(className)');

        expect(indexLuxury).toContain(
            'body:not(.lux-light-mode):not(.lux-route-social)::before'
        );
    });

    it('restores visible panel borders and feed-hero markup from asd10 baseline', () => {
        const feedModule = readSource('assets/js/pages/social-feed.js');
        const css = readSource('assets/css/social-rebuild.css');
        const socialPage = readSource('assets/js/pages/social-page.js');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(css).toContain('--social-fade-border: rgba(var(--lux-accent-rgb), 0.16);');
        expect(css).toContain('--social-fade-border-soft: rgba(var(--lux-accent-rgb), 0.12);');
        expect(css).not.toContain('--social-fade-border-soft: transparent;');
        expect(css).not.toContain('--social-shell-outline');
        expect(css).not.toContain('Global Social Route Border Override');
        expect(css).toContain('border: 1px solid var(--sn-bdr) !important;');
        expect(css).toMatch(
            /\.social-neo-feed-header-card\s*>\s*:is\([\s\S]{0,400}background:\s*transparent/
        );
        expect(css).toMatch(
            /body\.lux-route-social \.social-neo-feed-hero \{[\s\S]*border: 1px solid var\(--social-fade-border-soft\)/
        );

        expect(feedModule).toContain('social-neo-feed-hero-stat');
        expect(socialPage).not.toContain('page-hero-title">Home Stream');
        expect((socialPage + feedModule)).toContain('social-neo-composer-card');
        expect(socialPage).not.toContain('keepsSocialOutlineBorder');
        expect(utilities).not.toContain('keepsSocialOutlineBorder');
        expect(utilities).not.toContain('SOCIAL_CONTENT_SHELL_OUTLINE_CLASSES');

        expect(readSource('assets/css/index-luxury.css')).toContain(
            'body.lux-nonhome-page:not(.lux-route-students-admin):not(.lux-route-profile):not(.lux-route-chancellery):not(.lux-route-staff):not(.lux-route-social) .page-hero'
        );
    });
});
