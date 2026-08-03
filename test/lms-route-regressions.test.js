import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { expectLmsRouteCssLinks, expectRetiredLmsRouteCssGone } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('lms route regressions (retired skins purged)', () => {
    it('lms.html uses shared bare stack without retired route skins', () => {
        expectRetiredLmsRouteCssGone();
        expectLmsRouteCssLinks(read('lms.html'));
        expect(existsSync(join(process.cwd(), 'assets/css/lms-route.css'))).toBe(false);
    });

    it('marks layout-only shells and glass-root hosts per stage', () => {
        const html = read('lms.html');
        expect(html.match(/data-lux-layout-only="1"/g)).toHaveLength(4);
        expect(html).toMatch(/lms-clean-subjects--merged[\s\S]*<div class="lux-card-body" data-lux-layout-only="1">/);
        expect(html).toMatch(/lms-route-panel-pad-16-20 home-hover-chip/);
        expect(html).toMatch(/lms-route-panel lms-route-panel-compact" data-lux-glass-root="1"/);
        expect(html).toMatch(/lms-route-workspace-chrome home-hover-chip/);
        expect(html).not.toMatch(/lms-route-workspace-chrome[\s\S]*data-lux-glass-root="1"/);
    });

    it('uses shared typography and button primitives in static shell', () => {
        const html = read('lms.html');
        expect(html).toContain('lmsscss11');
        expect(html).toContain('student-schedule-refs.js');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-section-kicker lms-clean-kicker');
        expect(html).toContain('lux-page-title');
        expect(html).toContain('lux-card-title');
        expect(html).toContain('lux-card-copy');
        expect(html).toContain('lux-secondary-btn lms-clean-action-secondary');
    });

    it('shared layout primitives define LMS text roles', () => {
        const primitives = read('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lms-clean-kicker');
        expect(primitives).toContain('.lux-page-title');
        expect(primitives).toContain('.lux-card-title');
        expect(primitives).toContain('.lux-card-copy');
        expect(primitives).toContain('.lms-route-empty-title');
        expect(primitives).toContain('.lux-empty-state__title');
        expect(primitives).toContain('.lms-clean-card-title');
    });

    it('bare-lite LMS block is layout-only', () => {
        const bare = read('assets/css/lux-page-bare-lite.css');
        const lmsBlock = bare.split('/* ── LMS route')[1]?.split('/* ── Staff / students hub')[0] || '';
        const lmsBlockWithoutWhiteboardHud = lmsBlock.split('/* Whiteboard tab (retired lms-whiteboard-catalog.css')[0]
            + (lmsBlock.split('/* Interaction messenger (retired lms-interaction.css')[1] || '');
        expect(lmsBlock).toContain('body.lux-route-lms .lms-route-stage');
        expect(lmsBlock).toContain('.lux-lms-subject-card .lux-card-body');
        expect(lmsBlockWithoutWhiteboardHud).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--lms-fade-');
    });

    it('fouc-ht demotes nested LMS surfaces inside glass host', () => {
        const fouc = read('assets/css/lux-fouc-ht.css');
        const bare = read('assets/css/lux-page-bare-lite.css');
        expect(fouc).toContain('.lms-clean-subjects--merged');
        expect(fouc).toContain('.lux-lms-subject-card');
        expect(fouc).toMatch(/body\.lux-route-lms \.page-hero :is\(/);
        expect(fouc).toContain('.lms-student-semester-bar');
        expect(fouc).toContain('.lms-student-semester-option');
        expect(fouc).toContain('#lms-lane-chip');
        expect(fouc).toContain('.lms-pro-surface');
        expect(fouc).toContain('#page-lms-inner [data-lux-glass-root="1"]');
        expect(fouc).toContain('.lms-quiz-studio-hero');
        expect(fouc).toContain('.lms-quiz-tool-panel');
        expect(fouc).toContain('.lms-protected-monitor-page-shell');
        expect(bare).toContain('.gb-staff-control-grid');
        const gradebookStaff = read('assets/js/pages/gradebook-staff.js');
        expect(gradebookStaff).toContain('class="lux-control" data-gradebook-assessment-target="criterion"');
        expect(gradebookStaff).toContain('class="lms-route-title lms-route-title-26"');
        expect(gradebookStaff).toContain('class="lms-route-field-label gb-modern-kicker"');
        expect(gradebookStaff).toContain('gb-lms-staff-breakdown-table lux-modern-table');
        expect(gradebookStaff).toContain('class="lms-route-card-title">${escapeHtml(criterionMeta.label)}');
        expect(bare).toContain('.gb-lms-staff-breakdown-table');
        expect(bare).toContain('.gb-letter-badge');
        expect(bare).toContain('.gb-lms-staff-stat-grid .lux-strip-card');
        const gradebookHistoryUi = read('assets/js/pages/gradebook-history-ui-runtime.js');
        expect(gradebookHistoryUi).toContain('gb-empty-state lms-route-copy');
        const gradebookModel = read('assets/js/pages/gradebook-model.js');
        expect(gradebookModel).toContain('gb-scheme-table lux-modern-table');
        expect(gradebookModel).toContain('lms-route-field-label gb-scheme-label');
        expect(gradebookStaff).toContain('class="lms-route-card-title">${escapeHtml(group.name)}');
        expect(bare).toContain('.gb-scheme-shell');
        expect(bare).toContain('.gb-lms-subject-weights-group-list');
        const gradebookWorkspace = read('assets/js/pages/gradebook-workspace.js');
        expect(gradebookWorkspace).toContain('lms-route-field-label gb-score-edit-field');
        expect(gradebookWorkspace).toContain('lms-route-textarea lux-control lms-route-textarea-min-110');
        expect(bare).toContain('.gb-score-edit-card');
        expect(gradebookWorkspace).toContain('gb-modal-category-label');
        expect(gradebookWorkspace).toContain('gb-modal-category-card lux-soft-chrome');
        expect(gradebookWorkspace).toContain('lms-route-select lux-control');
        expect(gradebookModel).toContain('gb-modal-section lms-route-panel');
        expect(gradebookModel).toContain('gb-modal-history-card lux-soft-chrome');
        expect(bare).toContain('#student-evaluation-history-modal');
        expect(bare).toContain('.gb-modal-category-grid.is-filtered');
        expect(bare).toContain('.gb-modal-shell');
        expect(bare).toContain('.gb-modal-category-grid');
        expect(bare).toMatch(
            /:is\(#lms-gradebook-wrapper, #faculty-master-container, #student-evaluation-history-modal, #gradebook-category-history-modal\)[\s\S]*gb-score-history-row/
        );
        const tabsRuntime = read('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabsRuntime).toContain('id="lms-session-marker-title" class="lms-route-input lux-control"');
        expect(tabsRuntime).toContain('id="lms-session-marker-section-filter" class="lms-route-select lux-control"');
        expect(bare).toContain(':is(.lms-route-input, .lms-route-select, .lms-route-textarea).lux-control');
        expect(bare).not.toMatch(/\.lms-route-input,\s*\nbody\.lux-route-lms \.lms-route-select[\s\S]*?background:\s*rgba\(var\(--lux-glass-tint-rgb/);
        expect(fouc).toContain('.gb-modern-hero');
        expect(fouc).toContain('.gb-modern-stat,');
        expect(bare).toContain('body.lux-route-lms .gb-modern-hero h2');
        expect(bare).toContain('body.lux-route-lms .gb-modern-stat > strong');
        expect(bare).toContain('body.lux-route-lms .lms-session-planner-page');
        expect(bare).toContain('body.lux-route-lms .lms-session-hero');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-sessions');
        expect(bare).toContain('body.lux-route-lms .lms-session-marker-composer');
        expect(bare).toContain('body.lux-route-lms .lms-session-marker-preview-grid');
        expect(bare).toContain('body.lux-route-lms .lms-session-marker-card');
        expect(bare).toContain('--lms-workspace-panel-chrome');
        expect(bare).toContain('body.lux-route-lms .gb-modern-stack');
        expect(bare).toContain('body.lux-route-lms .lms-interaction-messenger');
        expect(bare).toContain('body.lux-route-lms .lms-interaction-direct');
        expect(bare).toContain('--lms-interaction-panel-chrome');
        expect(bare).toContain('body.lux-route-lms .lms-live-shell');
        expect(bare).toContain('body.lux-route-lms .lms-live-student-wait');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-live-quiz');
        expect(bare).toContain('body.lux-route-lms .lms-calls-page');
        expect(bare).toContain('body.lux-route-lms .lms-route-pill');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-calls');
        expect(bare).toContain('body.lux-route-lms .lms-member-stack');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-members');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-workspace');
        expect(bare).toContain('body.lux-route-lms .lms-assignment-banner');
        expect(bare).toContain('body.lux-route-lms .lms-week-accordion-panel');
        expect(bare).toContain('body.lux-route-lms .lms-assignment-card');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-concepts');
        expect(bare).toContain('body.lux-route-lms .lms-concept-form-toggle');
        expect(bare).toContain('body.lux-route-lms .lms-concept-card');
        expect(bare).toContain('body.lux-route-lms .lms-route-tab:is(.is-active, [aria-pressed="true"])');
        expect(bare).toContain('body.lux-route-lms #page-lms-groups [data-lux-glass-root="1"]');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-whiteboard');
        expect(bare).toContain('body.lux-route-lms .lms-whiteboard-layout');
        expect(bare).toContain('body.lux-route-lms .lms-whiteboard-stage');
        expect(fouc).toContain('.lms-whiteboard-tools');
        expect(fouc).toContain('.lms-whiteboard-command-bar');
        expect(bare).toContain('body.lux-route-lms .lms-whiteboard-tools');
        expect(bare).toContain('color: var(--lux-text-muted)');
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active');
        expect(bare).toContain('body.lux-route-lms .lms-bulk-action-grid');
        expect(bare).toContain('body.lux-route-lms .lux-lms-group-card');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-quiz');
        expect(bare).toContain('.lms-quiz-question-layout');
        expect(bare).toContain('.lms-quiz-tool-panel.is-collapsed .lms-quiz-tool-body');
        expect(bare).toContain('.lms-quiz-card-head');
        expect(bare).toContain('.lms-live-monitor-panel');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-monitoring');
        expect(bare).toContain('.lms-quiz-studio-control');
        expect(bare).toContain(').lux-control {');
        const quizShellBlock = bare.match(
            /body\.lux-route-lms #lms-content-area\.lms-tab-quiz :is\(\s*\.lms-quiz-studio-hero[\s\S]*?\.lms-quiz-rules-card[\s\S]*?\}\) \{[\s\S]*?\}/
        )?.[0] || '';
        expect(quizShellBlock).not.toContain('--lux-soft-chrome-surface');
        expect(quizShellBlock).not.toContain('background-color: var(--home-chip-surface-fill');
        expect(bare).toContain('body.lux-route-lms #lms-content-area .lms-route-empty');
        expect(bare).toContain('#lms-content-area > [data-lms-tab-loading]');
    });

    it('quiz studio student shell uses shared typography and shell classes', () => {
        const quiz = read('assets/js/pages/lms-quiz-workspace-runtime.js');
        const bare = read('assets/css/lux-page-bare-lite.css');
        const fouc = read('assets/css/lux-fouc-ht.css');

        expect(quiz).toContain('lux-section-kicker lms-quiz-studio-kicker">My Quizzes');
        expect(quiz).toContain('lux-page-title lms-quiz-studio-title');
        expect(quiz).toContain('lux-panel-copy lms-quiz-studio-copy');
        expect(quiz).toContain('lux-status-pill home-hover-chip lms-quiz-studio-hero-pill');
        expect(quiz).toContain('lux-empty-state lms-quiz-empty-state');
        expect(quiz).toContain('lux-empty-state__title">No quizzes are visible yet');
        expect(quiz).toContain('lms-student-quiz-card lux-soft-chrome home-hover-chip');
        expect(fouc).toContain('.lms-quiz-empty-state');
        expect(bare).not.toMatch(/\.lms-quiz-studio-hero-pill\s*\{[^}]*background:\s*rgba/);
    });

    it('student gradebook shell uses shared typography, shells, and hover chips', () => {
        const sectionQuiz = read('assets/js/pages/lms-section-quiz-runtime.js');
        const weights = read('assets/js/pages/gradebook-weights-runtime.js');
        const gradebookStaff = read('assets/js/pages/gradebook-staff.js');
        const bare = read('assets/css/lux-page-bare-lite.css');
        const fouc = read('assets/css/lux-fouc-ht.css');
        const primitives = read('assets/css/lux-layout-primitives.css');
        const tabsRuntime = read('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(sectionQuiz).toContain('lux-section-kicker lms-route-inline lms-route-inline-gap-8"><i class="fas fa-chart-line"></i> Grades');
        expect(sectionQuiz).toContain('id="dynamic-gb-title" class="lux-page-title lms-route-title');
        expect(sectionQuiz).toContain('lux-panel-copy lms-route-copy lms-route-copy-mt-6');
        expect(gradebookStaff).toContain('gb-student-context-bar lux-soft-chrome home-hover-chip');
        expect(gradebookStaff).toContain('lux-card-copy gb-student-context-title');
        expect(gradebookStaff).toContain('lux-panel-copy gb-student-context-copy-line');
        expect(sectionQuiz).not.toContain('gradebook-assessment-controls" class="lms-route-panel');
        expect(gradebookStaff).toContain('lux-section-kicker lms-route-field-label gb-modern-kicker');
        expect(weights).toContain('gb-modern-hero lux-soft-chrome home-hover-chip');
        expect(weights).toContain('is-student-clickable home-hover-chip');
        expect(weights).toMatch(/studentView \|\| studyCardOverlay \? ' lux-soft-chrome home-hover-chip'/);
        expect(weights).toContain('gb-modern-study-card-pointer lux-panel-copy');
        expect(bare).not.toMatch(/body\.lux-route-lms button\.gb-weight-row\.is-student-clickable:hover\s*\{[^}]*border-color/);
        expect(fouc).toContain('.gb-modern-hero.lux-soft-chrome');
        expect(fouc).toContain('.gb-weight-card.lux-soft-chrome');
        expect(primitives).toContain('#dynamic-gb-title.lux-page-title');
        expect(primitives).toContain('.gb-modern-hero h2.lux-page-title');
        expect(weights).toContain('gb-weight-row-meta lux-panel-copy');
        expect(weights).toContain('gb-weight-row-history-hint lux-panel-copy');
        expect(weights).toContain('gb-weight-stat is-earned lux-panel-copy');
        expect(weights).toContain('lux-card-copy gb-weight-row-title');
        expect(primitives).toContain('.gb-weight-row-title.lux-card-copy');
        expect(primitives).toContain('.gb-weight-stat.is-earned.lux-panel-copy');
        expect(weights).toContain('gb-composition-legend-stat is-earned lux-panel-copy');
        expect(bare).toContain('.gb-student-context-copy');
        expect(bare).toContain('.gb-scheme-progress-section');
        expect(fouc).toContain('.gb-student-context-bar.lux-soft-chrome.home-hover-chip');
        expect(primitives).toContain('.gb-composition-legend-stat.is-earned.lux-panel-copy');
        expect(tabsRuntime).toContain('gradebook-weights-runtime.js?v=20260729-lmsgbshare4');
    });

    it('category history modal uses shared shells and portal CSS', () => {
        const workspace = read('assets/js/pages/gradebook-workspace.js');
        const historyUi = read('assets/js/pages/gradebook-history-ui-runtime.js');
        const bare = read('assets/css/lux-page-bare-lite.css');
        const fouc = read('assets/css/lux-fouc-ht.css');
        const primitives = read('assets/css/lux-layout-primitives.css');
        const tabsRuntime = read('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(workspace).toContain('gb-category-history-card lux-soft-chrome home-hover-chip');
        expect(workspace).toContain('lux-card-copy gb-category-history-title');
        expect(workspace).toContain('gb-category-history-empty');
        expect(workspace).toContain('renderLmsGlassDialogCard');
        expect(historyUi).toContain('gb-score-history-row lux-soft-chrome home-hover-chip');
        expect(bare).toContain('#gradebook-category-history-modal .gb-category-history-shell');
        expect(bare).toContain('#gradebook-category-history-modal .gb-category-history-body');
        expect(fouc).toContain('#gradebook-category-history-modal');
        expect(fouc).toContain('.gb-category-history-card.lux-soft-chrome');
        expect(fouc).toMatch(/body:is\(\.lux-route-lms, \.lux-route-faculty-gradebook, \.lux-route-study-card\) #gradebook-category-history-modal/);
        expect(primitives).toContain('.gb-category-history-title.lux-card-copy');
        expect(primitives).toContain('.gb-category-history-score-value.lux-page-title');
        expect(tabsRuntime).toContain('gradebook-workspace.js?v=20260729-lmsgbshare3');
        expect(tabsRuntime).toContain('gradebook-history-ui-runtime.js?v=20260729-lmsgbshare3');
    });

    it('clears LMS tab content before each render to avoid stacked panels', () => {
        const shell = read('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        expect(shell).toMatch(/function prepareLmsContentAreaForTab[\s\S]*contentArea\.innerHTML = ''/);
        expect(shell).toContain("return base[ctx.tab] || null");
        expect(shell).toContain('workspace: {');
    });

    it('dynamic subject deck uses shared text primitives', () => {
        const js = read('assets/js/pages/lms-route-boot.js');
        expect(js).toContain('lux-section-kicker lms-clean-card-kicker');
        expect(js).toContain('lux-subject-row__title lms-clean-card-title lms-route-card-title');
        expect(js).toContain('<div class="lux-card-body" data-lux-layout-only="1">');
        expect(js).toContain('lux-lms-subject-card home-hover-chip');
        expect(js).toContain('lux-status-pill lux-soft-chrome is-muted home-hover-chip');
        expect(js).toContain('lmsScheduleLabel');
        expect(js).toContain('lux-empty-state__title lms-route-empty-title');
        expect(js).toContain('lux-empty-state__copy lms-route-empty-copy');
    });
});
