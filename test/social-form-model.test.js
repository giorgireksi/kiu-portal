import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    socialFormModelApi,
    installSocialFormModel
} from '../assets/js/pages/social-form-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const {
    parseDependsOnFromForm,
    polylineToSmoothPathD,
    collectSurveyAnswersFromForm,
    surveyQuestionNeedsOptions,
    surveyQuestionIsText,
    surveyQuestionTypeMeta,
    normalizeLostFoundItem,
    lostFoundSuggestionItems,
    toDateTimeLocalValue,
    fromDateTimeLocalValue,
    defaultSurveyDraftQuestions,
    defaultSurveyDraftSettings,
    surveyAudienceCreateLabel,
    parseSurveyScopeValue
} = socialFormModelApi;

describe('social-form-model', () => {
    beforeEach(() => {
        delete window.__KIU_SOCIAL_FORM_MODEL_LOADED;
        delete window.KiuSocialFormModel;
        installSocialFormModel(window);
    });

    it('exports pure form helpers', () => {
        expect(window.__KIU_SOCIAL_FORM_MODEL_LOADED).toBe(true);
        expect(window.KiuSocialFormModel).toBe(socialFormModelApi);
        expect(typeof parseDependsOnFromForm).toBe('function');
        expect(typeof polylineToSmoothPathD).toBe('function');
        expect(typeof collectSurveyAnswersFromForm).toBe('function');
        expect(typeof window.parseDependsOnFromForm).toBe('function');
    });

    it('parses dependsOn from select or hidden inputs', () => {
        const form = {
            querySelector: (sel) => {
                if (sel === 'select[name="projectTaskDependsOnIds"]') {
                    return {
                        selectedOptions: [{ value: 'a' }, { value: 'b' }]
                    };
                }
                return null;
            },
            querySelectorAll: () => []
        };
        expect(parseDependsOnFromForm(form)).toEqual(['a', 'b']);
    });

    it('builds smooth path geometry from points', () => {
        const two = polylineToSmoothPathD([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
        expect(two.d).toMatch(/^M /);
        expect(two.d).toContain('L ');
        const multi = polylineToSmoothPathD([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 20, y: 10 }
        ]);
        expect(multi.d).toContain(' C ');
    });

    it('classifies survey question types', () => {
        expect(surveyQuestionNeedsOptions('single_choice')).toBe(true);
        expect(surveyQuestionIsText('long_text')).toBe(true);
        expect(surveyQuestionTypeMeta('rating').label).toMatch(/Rating/i);
    });

    it('normalizes lost-found and filters suggestions', () => {
        const item = normalizeLostFoundItem({
            id: 'lf1',
            title: 'Blue bottle',
            status: 'lost',
            category: 'Items',
            locationText: 'Library',
            createdAt: '2026-01-01T00:00:00.000Z'
        });
        expect(item.id).toBe('lf1');
        expect(item.title).toBe('Blue bottle');
        window.__kiuSocialFormHooks = {
            text: (v) => String(v == null ? '' : v).trim(),
            state: () => ({
                social: {
                    lostFoundItems: [
                        item,
                        normalizeLostFoundItem({
                            id: 'lf2',
                            title: 'Keys',
                            status: 'found',
                            createdAt: '2026-01-02T00:00:00.000Z'
                        })
                    ]
                }
            }),
            currentUserId: () => 'u1'
        };
        // re-read helpers that close over hooks via window
        const suggestions = window.lostFoundSuggestionItems('bottle');
        expect(Array.isArray(suggestions)).toBe(true);
    });

    it('ESM leaf + classic bridge wired before social-page', () => {
        const model = readSource('assets/js/pages/social-form-model.js');
        const bridge = readSource('assets/js/pages/social-form-model-bridge.js');
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');
        expect(model).toContain('export function installSocialFormModel');
        expect(model).not.toMatch(/^\(function\s+initSocialFormModel/m);
        expect(model).not.toContain('WORKSPACE_DIALOG_KEEP_CENTER');
        expect(model).not.toContain('let bound = false');
        expect(bridge).toContain('KiuSocialFormModel');
        expect(page).toContain('WORKSPACE_DIALOG_KEEP_CENTER');
        expect(page).toContain('let bound = false');
        expect(page).toContain('KiuSocialFormModel');
        expect(page).not.toMatch(/function parseDependsOnFromForm\s*\(/);
        for (const name of [
            'toDateTimeLocalValue',
            'fromDateTimeLocalValue',
            'defaultSurveyDraftQuestions',
            'defaultSurveyDraftSettings',
            'ensureSurveyDraftSettings',
            'ensureSurveyDraftQuestions',
            'parseSurveyScopeValue',
            'syncSurveyDraftFromForm'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(page).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(html).toMatch(/<script\s+type="module"\s+src="assets\/js\/pages\/social-form-model\.js/);
        expect(html).toContain('social-form-model-bridge.js');
        expect(html.indexOf('social-form-model.js')).toBeLessThan(html.indexOf('social-form-model-bridge.js'));
        expect(html.indexOf('social-form-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));
        expect(html.indexOf('social-task-model.js')).toBeLessThan(html.indexOf('social-form-model.js'));
    });

    it('builds survey draft defaults and datetime locals', () => {
        window.__kiuSocialFormHooks = {
            text: (v) => String(v == null ? '' : v).trim(),
            state: () => ({ ui: {} }),
            currentUserId: () => 'u1',
            postingScopeOptions: () => [{ type: 'profile', id: 'u1', name: 'My profile' }]
        };
        expect(toDateTimeLocalValue('2026-07-19T12:30:00.000Z')).toMatch(/2026-07-19T/);
        expect(fromDateTimeLocalValue('2026-07-19T12:30')).toMatch(/Z$/);
        expect(defaultSurveyDraftQuestions()).toHaveLength(1);
        expect(defaultSurveyDraftSettings('official').audience).toBe('campus');
        expect(defaultSurveyDraftSettings('student').audience).toBe('faculty');
        expect(surveyAudienceCreateLabel('faculty')).toBe('My faculty');
        expect(parseSurveyScopeValue('profile:u1').scopeType).toBe('profile');
    });

    it('renders unavailable media without bridge URLs when storage is missing', () => {
        const model = readSource('assets/js/pages/social-form-model.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const content = readSource('assets/js/pages/social-chrome-model.js');
        expect(model).toContain('file.storageMissing === true');
        expect(model).toContain('Image unavailable');
        expect(model).toContain('data-social-file-key');
        expect(model).toContain('__kiuIsSocialFileUnavailable');
        expect(runtime).toContain('const storageMissing = file.storageMissing === true');
        expect(runtime).toContain('isSocialFileUnavailable(storageKey)');
        expect(runtime).toContain("queueRender('file-unavailable')");
        expect(content).toContain('const storageMissing = file?.storageMissing === true');
        expect(content).toContain('__kiuIsSocialFileUnavailable');
    });
});
