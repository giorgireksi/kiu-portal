import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS content library module split', () => {
    it('owns concepts in content-library and shared week/store infra in week-store', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const contentSource = readSource('assets/js/pages/lms-content-library-runtime.js');
        const weekStoreSource = readSource('assets/js/pages/lms-week-store-runtime.js');
        expect(lmsHtml).not.toContain('assets/js/pages/lms-week-store-runtime.js');
        expect(lmsHtml).not.toContain('assets/js/pages/lms-content-library-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain('assets/js/pages/lms-week-store-runtime.js?v=20260816-lmsquizweekfix1');
        expect(classroomSource).toContain('assets/js/pages/lms-content-library-runtime.js?v=20260714-lmspro2');
        expect(classroomSource).toContain('function ensureLmsContentRuntime()');
        expect(classroomSource.indexOf('lms-week-store-runtime.js')).toBeLessThan(
            classroomSource.indexOf('lms-materials-runtime.js')
        );
        expect(classroomSource.indexOf('lms-week-store-runtime.js')).toBeLessThan(
            classroomSource.indexOf('lms-assignments-runtime.js')
        );

        const liveQuizModuleBlock = classroomSource.match(/const LMS_LIVE_QUIZ_MODULE_URLS = Object\.freeze\(\[([\s\S]*?)\]\);/);
        expect(liveQuizModuleBlock?.[1] || '').toContain('lms-week-store-runtime.js');

        const sectionQuizSource = readSource('assets/js/pages/lms-section-quiz-runtime.js');
        expect(sectionQuizSource).toContain('function resolveLmsQuizContextWeeks(resourceKey)');
        expect(sectionQuizSource).toContain('weeks: resolveLmsQuizContextWeeks(resourceKey)');
        expect(sectionQuizSource).not.toMatch(/weeks:\s*ensureLmsWeeksForKey\(/);

        expect(contentSource).toContain('renderLmsWeekPanelEmptyState(');
        expect(contentSource).toContain('function renderLmsConceptsLibrary(courseId)');
        expect(contentSource).toContain('async function createLmsConcept(resourceKey)');
        expect(contentSource).toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(contentSource).toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(contentSource).toContain('function rateLmsConcept(resourceKey, conceptId, score)');
        expect(contentSource).toContain('function getLmsConceptReviewPillClass(reviewStatus = \'\')');
        expect(contentSource).not.toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(contentSource).not.toContain('function renderLmsWeekManager(resourceKey)');
        expect(contentSource).not.toContain('function ensureLmsAssignmentsForKey(resourceKey)');
        expect(contentSource).not.toContain('lms-week-manager-shell-actions');

        expect(weekStoreSource).toContain('function ensureLmsAssignmentsForKey(resourceKey)');
        expect(weekStoreSource).toContain('function ensureLmsMaterialsForKey(resourceKey)');
        expect(weekStoreSource).toContain('function ensureLmsSubmissionsForKey(resourceKey)');
        expect(weekStoreSource).toContain('function ensureLmsConceptsForKey(resourceKey)');
        expect(weekStoreSource).toContain('function ensureLmsConceptRatingsForKey(resourceKey)');
        expect(weekStoreSource).toContain('function normalizeLmsWeekLabel(value)');
        expect(weekStoreSource).toContain('function sortLmsWeekLabels(labels = [])');
        expect(weekStoreSource).toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(weekStoreSource).toContain('function buildLmsWeekSelectOptions(resourceKey, selectedValue = \'\')');
        expect(weekStoreSource).toContain('function groupLmsItemsByWeek(resourceKey, items, valueGetter)');
        expect(weekStoreSource).toContain('function renderLmsWeekManager(resourceKey)');
        expect(weekStoreSource).toContain('function openLmsWeekManagerModal(resourceKey)');
        expect(weekStoreSource).toContain('function addLmsWeek(resourceKey, inputId)');
        expect(weekStoreSource).toContain('function removeLmsWeek(resourceKey, weekLabel)');
        expect(weekStoreSource).not.toContain('lms-week-manager-shell-actions');
        expect(weekStoreSource).not.toContain('This group follows ${weeks.length} teaching week');
        expect(weekStoreSource).toContain('class="lms-route-card-head lms-week-manager-shell-head"');
        expect(weekStoreSource).toContain('class="lms-route-copy lms-route-copy-mt-4 lms-week-manager-shell-copy"');
        expect(weekStoreSource).toContain('class="lux-primary-btn lms-week-manager-input-action"');
        expect(weekStoreSource).toContain('lms-week-manager-modal lms-week-manager-modal-shell');
        expect(weekStoreSource).toContain('renderLmsGlassDialogCard');
        expect(weekStoreSource).toContain('lms-glass-dialog-overlay');

        expect(contentSource).toContain('class="lms-route-card-head lms-route-card-head-mb-16"');
        expect(contentSource).toContain('class="lms-route-copy lms-route-copy-mt-6"');
        expect(contentSource).toContain('class="lms-route-field lms-route-field-mt-14"');
        expect(contentSource).toContain('class="lms-concept-form-toggle"');
        expect(contentSource).toContain('class="lms-route-actions lms-route-actions-mt-16"');
        expect(contentSource).toContain('class="lms-route-stack lms-route-stack-gap-16"');
        expect(contentSource).toContain('class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6"');
        expect(contentSource).toContain('class="lms-concept-status-row"');
        expect(contentSource).toContain('class="lms-route-card lms-route-panel-compact lms-concept-leader-item');
        expect(contentSource).toContain('class="lms-route-card lms-route-panel-compact lms-concept-guidance-card"');
        expect(contentSource).toContain('class="lms-route-card lms-route-panel-compact lms-concept-card"');
        expect(contentSource).toContain('class="lms-route-card-head lms-concept-card-head"');
        expect(contentSource).toContain('lms-concept-review-pill');
        expect(contentSource).toContain('getLmsConceptReviewPillClass(concept.reviewStatus)');
        expect(contentSource).toContain("is-positive");
        expect(contentSource).toContain('class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square lms-route-btn-danger"');
        expect(contentSource).toContain('class="lms-route-copy lms-route-copy-mt-14 lms-route-copy-prewrap"');
        expect(contentSource).toContain('renderLmsStoredFileAttachmentShell(concept.file');
        expect(contentSource).toContain('class="lms-concept-card-footer"');
        expect(contentSource).toContain('class="lms-concept-card-footer-actions"');
        expect(contentSource).toContain('class="lms-concept-review-actions"');
        expect(contentSource).toContain('class="lms-concept-rating-note lms-route-meta lms-route-meta-12"');
        expect(contentSource).toContain("lms-concept-rate-btn");
        expect(contentSource).not.toContain('style="margin-bottom:16px;"');
        expect(contentSource).not.toContain('style="margin-top:6px;"');
        expect(contentSource).not.toContain('style="margin-top:14px;"');
        expect(contentSource).not.toContain('style="margin-top:16px;"');
        expect(contentSource).not.toContain('style="gap:16px;"');
        expect(contentSource).not.toContain('style="font-size:12px; margin-top:6px;"');
        expect(contentSource).not.toContain('style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;"');
        expect(contentSource).not.toContain('style="background:${reviewTone}"');
        expect(contentSource).not.toContain('style="background:rgba(var(--lux-accent-rgb),0.12); color:var(--lux-accent); border-color:rgba(var(--lux-accent-rgb),0.18);"');
        expect(contentSource).not.toContain('style="padding:7px 10px; color:var(--lux-red); border-color:rgba(220,38,38,0.18);"');
        expect(contentSource).not.toContain('style="margin-top:14px; white-space:pre-wrap;"');
        expect(contentSource).not.toContain('style="font-size:15px; margin-top:6px;"');
        expect(contentSource).not.toContain('style="margin-top:12px;"');
        expect(contentSource).not.toContain('style="display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-top:16px; align-items:flex-start;"');
        expect(contentSource).not.toContain('style="padding:7px 10px; min-width:42px;"');

        expect(lmsSource).not.toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsWeekManager(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsConceptsLibrary(courseId)');
        expect(lmsSource).not.toContain('async function createLmsConcept(resourceKey)');
        expect(lmsSource).not.toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(lmsSource).not.toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(lmsSource).not.toContain('function rateLmsConcept(resourceKey, conceptId, score)');
    });

    it('uses shared bare-lite layout for concept library surfaces', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-concepts');
        expect(bare).toContain('body.lux-route-lms .lms-concept-leader-list');
        expect(bare).toContain('body.lux-route-lms .lms-concept-review-pill.is-approved');
        expect(bare).toContain('body.lux-route-lms .lms-concept-rate-btn');
    });
});
