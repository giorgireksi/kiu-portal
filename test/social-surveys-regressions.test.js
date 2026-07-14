import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Social surveys regressions', () => {
    it('exposes the surveys panel in shell, runtime, and mobile', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const socialRuntimeJs = readAsset('assets/js/shared/social-runtime-lite.js');
        const socialMobileJs = readAsset('assets/js/pages/social-mobile.js');
        const socialHtml = readAsset('social.html');

        expect(socialPageJs).toContain("const SOCIAL_SURVEYS_MODULE_URL = 'assets/js/pages/social-surveys.js?v=20260714-surveys-click1';");
        expect(socialPageJs).toContain('function ensureSocialSurveysModule()');
        expect(socialPageJs).toContain('window.__kiuSocialSurveysHooks');
        expect(socialPageJs).toContain("'surveys'");
        expect(socialPageJs).toContain('panel-surveys');
        expect((socialPageJs + moduleJs)).toContain('survey-create-open');
        expect((socialPageJs + moduleJs)).toContain("if (kind === 'survey-create')");
        expect((socialPageJs + moduleJs)).toContain("data-form=\"survey-create\"");
        expect((socialPageJs + moduleJs)).toContain("formType === 'survey-response'");
        expect(socialRuntimeJs).toContain('surveys');
        expect(socialRuntimeJs).toContain('createPortalSocialSurvey');
        expect(socialRuntimeJs).toContain('closePortalSocialSurvey');
        expect(socialRuntimeJs).toContain('respondPortalSocialSurvey');
        expect((socialPageJs + moduleJs)).toContain('survey-question-add');
        expect((socialPageJs + moduleJs)).toContain('name="surveyScope"');
        expect(socialPageJs).toContain('linkedSurveyId');
        expect((socialPageJs + moduleJs)).toContain('survey-close');
        expect((socialPageJs + moduleJs)).toContain('survey-export');
        expect(socialMobileJs).toContain("'surveys'");
        expect(socialMobileJs).toContain('data-social-panel="surveys"');
        expect(socialHtml).toContain('social-surveys-lms.css');
        expect(socialHtml).not.toContain('assets/js/pages/social-surveys.js');
    });

    it('keeps surveys module scoped and wired for list, take, and results flows', () => {
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const css = readAsset('assets/css/social-surveys-lms.css');

        expect(moduleJs).toContain('social-neo-surveys-shell');
        expect(moduleJs).toContain('bodyHtml: listingsBody');
        expect(moduleJs).toContain('social-neo-surveys-empty');
        expect(moduleJs).not.toContain('<section class="social-neo-stack social-neo-survey-listings">');
        const surveysPanelBlock = moduleJs.match(/window\.renderSurveysPanel = function renderSurveysPanel\(\)[\s\S]*?\n    \};\n\}\)\(\);/)?.[0] || '';
        expect(surveysPanelBlock).not.toContain('social-neo-section-head');
        expect(moduleJs).toContain('function renderSurveysHero');
        expect(moduleJs).toContain('social-neo-surveys-hero-divider');
        expect(moduleJs).toContain('window.renderSurveysHero = renderSurveysHero');
        expect(moduleJs).toContain("merged ? ' is-merged' : ''");
        expect(css).toContain('.social-neo-surveys-hero.is-merged');
        expect(css).toContain('.social-neo-surveys-hero-divider');
        expect(moduleJs).toContain('social-neo-survey-card');
        expect(moduleJs).toContain('survey-take-open');
        expect(moduleJs).toContain('survey-results-open');
        expect(moduleJs).toContain('survey-export');
        expect(moduleJs).toContain('survey-close');
        expect(moduleJs).toContain('data-form="survey-response"');
        expect(moduleJs).toContain('social-neo-survey-submit-btn');
        expect(moduleJs).toContain('social-neo-survey-submit-btn-icon');
        expect(moduleJs).toContain('Submit responses');
        expect(socialPageJs).toContain('animateSurveyChoiceInteraction');
        expect(socialPageJs).toContain('rippleSurveyChoiceLabel');
        expect(socialPageJs).toContain('flashSurveySubmitButton');
        expect(socialPageJs).toContain('rippleSurveySubmitButton');
        expect(socialPageJs).toContain('is-rippling');
        expect(css).toContain('surveySubmitRipple');
        expect(css).toContain('surveySubmitPress');
        expect(css).toContain('surveySubmitRing');
        expect(socialPageJs).toContain('is-selecting');
        expect(css).toContain('surveyChoiceRipple');
        expect(css).toContain('surveyChoiceSpring');
        expect(css).toContain('surveySubmitIconPop');
        expect(css).toContain('surveySubmitSuccess');
        expect(css).toContain('data-panel="surveys"');
        expect(css).toContain('social-neo-survey-result-bar');
        // Hero stats use unified :is() lists with social-fade tokens
        expect(css).toContain('.social-neo-surveys-hero-stat');
        expect(css).toMatch(
            /\.social-neo-surveys-hero-stat[\s\S]{0,400}background:\s*var\(--social-fade-surface-soft\)/
        );
        expect(css).toMatch(
            /\.social-neo-surveys-hero-stat[\s\S]{0,400}border(?:-color)?:[^;]*var\(--social-fade-border-soft\)/
        );
        expect(css).not.toContain('#1a1410');

        const utilities = readAsset('assets/js/shared/utilities.js');
        expect(utilities).toContain("'social-neo-surveys-hero-stat'");
        expect(utilities).toContain("'social-neo-surveys-hero-stat'");
    });

    it('survey create uses flat hero layout matching surveys hero panel', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const surveysCss = readAsset('assets/css/social-surveys-lms.css');
        const rebuildCss = readAsset('assets/css/social-rebuild.css');

        const surveyCreateDialog = moduleJs.match(
            /function renderSurveyCreateDialog\(runtime\) \{[\s\S]*?\n    \}/
        )?.[0] || '';
        const surveyCreateQuestions = moduleJs.match(
            /function renderSurveyCreateQuestionsMarkup\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(surveyCreateDialog).toContain('social-neo-card social-neo-dialog-card social-neo-surveys-hero social-neo-surveys-create-hero');
        expect(surveyCreateDialog).toContain('social-neo-dialog-head');
        expect(surveyCreateDialog).toContain('social-neo-dialog-body--survey-create');
        expect(surveyCreateDialog).toContain('social-neo-dialog-actions');
        expect(surveyCreateDialog).toContain('social-neo-surveys-hero-stats');
        expect(surveyCreateDialog).toContain('social-neo-surveys-hero-toolbar');
        expect(surveyCreateDialog).toContain('social-neo-dialog-survey-create-section');
        expect(surveyCreateDialog).toContain('social-neo-form-grid-2');
        expect(surveyCreateDialog).toContain('social-neo-dialog-field');
        expect(surveyCreateDialog).toContain('social-neo-surveys-create-toggle-row');
        expect(surveyCreateDialog).toContain('social-neo-surveys-create-toggle-hint');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-create-toggle-option');
        expect(surveyCreateDialog).toContain('social-neo-surveys-create-questions');
        expect(surveyCreateDialog).toContain('renderSurveyCreateQuestionsMarkup()');
        expect(surveyCreateDialog).toContain('formatSurveyQuestionCountStat(draftQuestions)');
        expect(surveyCreateQuestions).toContain('social-neo-surveys-create-question-layout');
        expect(surveyCreateQuestions).toContain('social-neo-survey-question-rail');
        expect(surveyCreateQuestions).toContain('renderSurveyQuestionEditor');
        expect(surveyCreateDialog).not.toContain('draftQuestions.map((question, index) => renderSurveyQuestionDraftBlock');
        expect(surveyCreateDialog).toContain('social-neo-surveys-create-toolbar--split');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-hero-grid social-neo-surveys-create-settings');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-hero-grid social-neo-surveys-create-toggles');
        expect(surveyCreateDialog).toContain('social-neo-surveys-create-settings-grid');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-hero-tab--field');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-hero-tab--toggle');
        expect(surveyCreateDialog).not.toContain('social-neo-surveys-create-question-track');
        expect(surveyCreateDialog).toContain('social-neo-dialog-card--lms-create');
        expect(surveyCreateDialog).toContain('name="surveyScope" data-lux-picker');
        expect(surveyCreateDialog).toContain('name="surveyAudience" data-lux-picker');
        expect(surveyCreateDialog).toContain('name="surveyResultsVisibility" data-lux-picker');
        expect(surveyCreateDialog).not.toContain('data-lux-picker-enhanced="true"');

        expect(moduleJs).toContain('social-neo-survey-question-editor');
        expect(moduleJs).toContain('name="surveyQuestionType-');
        expect(moduleJs).toMatch(/name="surveyQuestionType-\$\{escape\(String\(index\)\)\}" data-lux-picker/);

        expect(surveysCss).toContain('social-neo-dialog-survey-create-section');
        expect(surveysCss).toContain('social-neo-surveys-create-questions');
        expect(surveysCss).toContain('social-neo-survey-question-editor');
        expect(surveysCss).toContain('social-neo-surveys-create-toolbar--split');
        expect(surveysCss).toContain('.social-neo-surveys-create-hero .lux-universal-picker-field');
        expect(surveysCss).not.toMatch(/\.social-neo-surveys-create-field\b/);
        expect(surveysCss).not.toMatch(/\.social-neo-surveys-create-toggle[^\-]/);

        expect(rebuildCss).toContain('#social-neo-overlay-portal .social-neo-dialog-card--survey-create');
        const surveyCreateShell = rebuildCss.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--survey-create[\s\S]*?\n\}/
        )?.[0] || '';
        expect(surveyCreateShell).toMatch(/--survey-create-/);
        expect(surveyCreateShell).not.toContain('--social-fade-modal');
    });

    it('wires survey create into transparency token pipeline', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const utilitiesJs = readAsset('assets/js/shared/utilities.js');
        const rebuildCss = readAsset('assets/css/social-rebuild.css');
        const surveyCreateDialog = moduleJs.match(
            /function renderSurveyCreateDialog\(runtime\) \{[\s\S]*?\n    \}/
        )?.[0] || '';
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';

        expect(moduleJs).toContain('social-neo-dialog-card--survey-create');
        expect(surveyCreateDialog).toContain('data-lux-transparency-exempt="1"');
        expect(utilitiesJs).toContain("el.closest('.social-neo-dialog-card--lms-create')");
        expect(utilitiesJs).not.toContain('.social-neo-dialog-card--lms-create:not(.social-neo-dialog-card--survey-create)');
        expect(utilitiesJs).toContain('SOCIAL_GLASS_EXEMPT_CREATE_DIALOG_SELECTORS');
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--survey-create'");
        expect(utilitiesJs).not.toContain("'social-neo-surveys-create-hero'");
        expect(utilitiesJs).not.toContain("'social-neo-dialog-survey-create-section'");
        expect(utilitiesJs).not.toContain("'social-neo-survey-question-editor'");
        expect(utilitiesJs).toContain("'#social-neo-overlay-portal'");
        expect(utilitiesJs).not.toContain("'social-neo-surveys-hero-tab--field'");
        expect(utilitiesJs).not.toContain("'social-neo-surveys-hero-tab--toggle'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--survey-create'");
        expect(rebuildCss).toMatch(/--survey-create-/);
        const surveyCreateShell = rebuildCss.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--survey-create[\s\S]*?\n\}/
        )?.[0] || '';
        expect(surveyCreateShell).toMatch(/--survey-create-/);
        expect(surveyCreateShell).not.toContain('--social-fade-modal');
    });

    it('registers backend survey collections and routes', () => {
        const stateShape = readAsset('backend/platform/state-shape.js');
        const routes = readAsset('backend/platform/routes/social-routes.js');
        const service = readAsset('backend/platform/domains/social-surveys-service.js');

        expect(stateShape).toContain('surveys: []');
        expect(stateShape).toContain('surveyQuestions: []');
        expect(stateShape).toContain('surveyResponses: []');
        expect(routes).toContain('/api/social/surveys');
        expect(routes).toContain('/api/social/surveys/:id/respond');
        expect(routes).toContain('/api/social/surveys/:id/close');
        expect(routes).toContain('/api/social/surveys/:id/results');
        expect(service).toContain('createSocialSurvey');
        expect(service).toContain('closeSocialSurvey');
        expect(service).toContain('promoteToFeed');
        expect(service).toContain('submitSocialSurveyResponse');
    });

    it('patches survey questions panel when question type changes', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');

        expect(socialPageJs).toContain('function patchSurveyCreateQuestionsPanel({ skipSync = false } = {})');
        const patchSurveyCreateQuestionsPanel = socialPageJs.match(
            /function patchSurveyCreateQuestionsPanel\(\{ skipSync = false \} = \{\}\) \{[\s\S]*?\n    \}/
        )?.[0] || '';
        expect(patchSurveyCreateQuestionsPanel).not.toContain('scheduleSocialOverlayTransparencyRefresh');
        expect((socialPageJs + moduleJs)).toContain("target.matches('form[data-form=\"survey-create\"] select[name^=\"surveyQuestionType-\"]')");
        expect((socialPageJs + moduleJs)).toContain('return patchSurveyCreateQuestionsPanel();');
        expect(socialPageJs).toContain('surveyQuestionHelp-');
        expect(socialPageJs).toContain('surveyQuestionMinRating-');
        expect(socialPageJs).toContain('surveyQuestionMaxLength-');
    });

    it('splits surveys into student and official lanes with staff gate', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const service = readAsset('backend/platform/domains/social-surveys-service.js');

        expect(socialPageJs).toContain('surveysSubTab');
        expect((socialPageJs + moduleJs)).toContain('surveys-lane-student');
        expect((socialPageJs + moduleJs)).toContain('surveys-lane-official');
        expect(socialPageJs).toContain('function surveyMatchesLane');
        expect(moduleJs).toContain('Publish official survey');
        expect(moduleJs).toContain('Create student survey');
        expect(socialPageJs).toContain('openDialog(\'survey-create\', { variant');
        expect(moduleJs).toContain('name="surveyIsOfficial"');
        expect(socialPageJs).toContain('isOfficial');
        expect(moduleJs).toContain('audienceStatLabel');
        expect(moduleJs).toContain('visibilityStatLabel');

        expect(moduleJs).toContain('survey.isOfficial');
        expect(moduleJs).toContain('surveysSubTab');

        expect(service).toContain('isOfficial');
        expect(service).toContain('isSocialStaffActor');
        expect(service).toContain("audience === 'campus' && !isOfficial");
        expect(service).toContain("audience === 'campus' && Boolean(survey?.isOfficial)");
        expect(service).toContain("audience === 'connections'");
        expect(service).toContain("audience === 'faculty'");
    });

    it('hides official survey publish and manage UI for non-staff accounts', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const service = readAsset('backend/platform/domains/social-surveys-service.js');

        expect(socialPageJs).toContain('function canPublishOfficialSurveys');
        expect(socialPageJs).toContain('canPublishOfficialSurveys');
        expect((socialPageJs + moduleJs)).toMatch(/if \(variant === 'official' && !canPublishOfficialSurveys\(\)\) return;/);

        // Hero create/manage gating lives in social-surveys.js after extraction.
        expect(moduleJs).toContain('function renderSurveysHero');
        expect(moduleJs).toContain('canPublishOfficialSurveys');
        expect(moduleJs).toMatch(/const canCreate = typeof options\.canCreate === 'boolean'/);
        expect(moduleJs).toContain('const showManaged = !isOfficialLane || canPublishOfficialSurveys(currentUser())');
        expect(moduleJs).toMatch(/const canCreate = !isOfficialLane \|\| canPublishOfficialSurveys\(\)/);
        expect(moduleJs).toContain('Switch tabs to see open or completed official surveys.');

        expect(service).toMatch(
            /if \(Boolean\(survey\.isOfficial\) && !isSocialStaffActor\.call\(this, normalizedUserId\)\) return false;/
        );
    });

    it('uses question rail, editor, delete confirm dialogs, and publish validation', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const surveysCss = readAsset('assets/css/social-surveys-lms.css');

        expect(socialPageJs).toContain('surveyDraftActiveIndex');
        expect(socialPageJs).toContain('function cloneSurveyDraftQuestions');
        expect(socialPageJs).toContain('function parseSurveyQuestionBlock');
        expect(moduleJs).toContain('function renderSurveyQuestionRail');
        expect(moduleJs).toContain('function renderSurveyQuestionEditor');
        expect(moduleJs).toContain('function renderSurveyDraftDeleteConfirmDialog');
        expect(moduleJs).toContain('function renderSurveyChoiceRows');
        expect(socialPageJs).toContain('cloneSurveyDraftQuestions(ensureSurveyDraftQuestions())');
        expect(socialPageJs).not.toMatch(/const draft = \[\];\s*\n\s*const blocks = form\.querySelectorAll\('\[data-survey-question-index\]'\)/);
        expect(socialPageJs).toContain('survey-draft-question-delete');
        expect(socialPageJs).toContain('survey-draft-choice-delete');
        expect((socialPageJs + moduleJs)).toContain('survey-question-select');
        expect(moduleJs).toContain('survey-question-option-remove');
        expect((socialPageJs + moduleJs)).toContain('dialog-survey-draft-question-delete');
        expect((socialPageJs + moduleJs)).toContain('dialog-survey-draft-choice-delete');
        expect(socialPageJs + readAsset('assets/js/pages/social-surveys.js') + readAsset('assets/js/pages/social-feed.js')).toContain('social-neo-delete-confirm');
        expect(moduleJs).toContain('social-neo-survey-choice-list');
        expect(moduleJs).toContain('social-neo-survey-choice-row');
        expect((socialPageJs + moduleJs)).toContain('if (optionCount <= 2) return');
        expect(moduleJs).toContain('social-neo-survey-choice-row--no-remove');
        expect(socialPageJs).not.toContain('renderSurveyDeleteConfirmBanner');
        expect(socialPageJs).not.toContain('surveyDraftPendingQuestionRemove');
        expect(socialPageJs).not.toContain('survey-question-remove-cancel');
        expect((socialPageJs + moduleJs)).toContain('needs text before publishing');
        expect(socialPageJs).toContain('function patchSurveyCreateQuestionsPanel({ skipSync = false } = {})');
        expect(socialPageJs).toContain('if (!skipSync) syncSurveyDraftFromForm(form);');
        expect((socialPageJs + moduleJs)).toContain('return patchSurveyCreateQuestionsPanel();');
        expect((socialPageJs + moduleJs)).toMatch(/if \(action === 'survey-question-option-add'\)[\s\S]{0,900}patchSurveyCreateQuestionsPanel\(\{ skipSync: true \}\)/);
        expect((socialPageJs + moduleJs)).toMatch(/if \(action === 'survey-question-remove'\)[\s\S]{0,300}openDialog\('survey-draft-question-delete'/);
        expect((socialPageJs + moduleJs)).toMatch(/if \(action === 'survey-question-option-remove'\)[\s\S]{0,800}openDialog\('survey-draft-choice-delete'/);
        expect((socialPageJs + moduleJs)).toMatch(/formType === 'dialog-survey-draft-question-delete'[\s\S]{0,500}restorePreviousDialog\(\)/);
        expect((socialPageJs + moduleJs)).toMatch(/formType === 'dialog-survey-draft-choice-delete'[\s\S]{0,500}restorePreviousDialog\(\)/);

        expect(surveysCss).toContain('social-neo-surveys-create-question-layout');
        expect(surveysCss).toContain('social-neo-survey-question-rail');
        expect(surveysCss).toContain('social-neo-survey-question-editor');
        expect(surveysCss).not.toContain('social-neo-survey-delete-banner');
        expect(surveysCss).toContain('social-neo-survey-choice-row');
        expect(surveysCss).toContain('social-neo-survey-choice-row--no-remove');
        expect(surveysCss).toContain('#social-neo-overlay-portal .social-neo-dialog-card--survey-create');
        expect(surveysCss).toMatch(/--survey-create-/);
        const surveyOverlayRailEditor = surveysCss.match(
            /#social-neo-overlay-portal \.social-neo-dialog-card--survey-create :is\(\s*\.social-neo-survey-question-rail,\s*\.social-neo-survey-question-editor\s*\)\s*\{[\s\S]*?\}/
        )?.[0] || '';
        expect(surveyOverlayRailEditor).toMatch(/--survey-create-/);
        expect(surveyOverlayRailEditor).not.toContain('background: transparent');
        expect(surveyOverlayRailEditor).not.toContain('--social-fade-surface-soft');

        const rebuildCss = readAsset('assets/css/social-rebuild.css');
        expect(rebuildCss).toMatch(
            /:is\(#public-social-root, #social-neo-overlay-portal\) \.social-neo-delete-confirm \{[\s\S]*background:\s*var\(--social-fade-modal\)/
        );
        expect(rebuildCss).toMatch(
            /:is\(#public-social-root, #social-neo-overlay-portal\) \.social-neo-delete-confirm-preview \{[\s\S]*background:\s*var\(--social-fade-surface-soft\)/
        );
        expect(rebuildCss).not.toMatch(/\.social-neo-delete-confirm \{[\s\S]*0\.98/);
        expect(rebuildCss).toMatch(
            /body\.lux-route-social \.social-neo-dialog-backdrop[\s\S]*var\(--lux-transparency-alpha/
        );

        const utilities = readAsset('assets/js/shared/utilities.js');
        const managedBlock = utilities.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        expect(utilities).not.toContain("'social-neo-survey-question-editor'");
        expect(utilities).not.toContain("'social-neo-survey-choice-list'");
        expect(utilities).not.toContain("'social-neo-survey-question-config-block'");
        expect(utilities).toContain("'social-neo-delete-confirm'");
        expect(utilities).toContain("'social-neo-delete-confirm-preview'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--survey-create'");
        expect(utilities).toContain("'social-neo-surveys-hero-stat'");
        expect(utilities).not.toContain("'social-neo-surveys-create-toggle-option'");
        expect(utilities).not.toContain("'social-neo-survey-delete-banner'");

        expect(surveysCss).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--survey-create[\s\S]*\.social-neo-surveys-hero-stat[\s\S]*--survey-create-/
        );
        expect(surveysCss).toMatch(/\.social-neo-surveys-create-toggle-row[\s\S]*--survey-create-/);
        expect(surveysCss).toContain('social-neo-surveys-create-toggle-hint');
        const surveyCreateShell = rebuildCss.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--survey-create[\s\S]*?\n\}/
        )?.[0] || '';
        expect(surveyCreateShell).toMatch(/--survey-create-/);
        expect(surveyCreateShell).not.toContain('--social-fade-modal');
    });

    it('avoids survey create dialog flicker when toggling anonymous or promote feed', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const toggleHandler = (socialPageJs + moduleJs).match(
            /if \(target\.matches\('form\[data-form="survey-create"\] \[name="surveyAnonymous"\], form\[data-form="survey-create"\] \[name="surveyPromoteFeed"\]'\)\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(toggleHandler).toContain('syncSurveyDraftFromForm(target.closest(\'form\'))');
        expect(toggleHandler).toContain('return;');
        expect(toggleHandler).not.toContain('rerenderSurveyCreateDialog');
    });

    it('uses a single Text survey question type with legacy normalization', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const moduleJs = readAsset('assets/js/pages/social-surveys.js');
        const service = readAsset('backend/platform/domains/social-surveys-service.js');

        expect(socialPageJs).toContain('function surveyQuestionIsText');
        expect(moduleJs).toContain('<option value="text"');
        expect(socialPageJs).not.toContain('>Short text</option>');
        expect(socialPageJs).not.toContain('>Long text</option>');
        expect(socialPageJs).toContain('surveyQuestionMaxLength-');
        expect(moduleJs).toContain('function surveyQuestionIsText');
        expect(moduleJs).toContain('social-neo-textarea');
        expect(moduleJs).not.toContain("questionType === 'long_text'");
        expect(service).toContain("return 'text'");
        expect(service).toContain("normalized === 'short_text'");
        expect(service).toContain("normalized === 'long_text'");
    });
});