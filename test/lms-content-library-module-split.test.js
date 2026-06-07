import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS content library module split', () => {
    it('moves LMS week and concept ownership out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const contentSource = readSource('assets/js/pages/lms-content-library-runtime.js');
        const routeCss = readSource('assets/css/lms-route.css');

        expect(lmsHtml).toContain('assets/js/pages/lms-content-library-runtime.js?v=20260518-lmscontent1');

        expect(contentSource).toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(contentSource).toContain('function renderLmsWeekManager(resourceKey)');
        expect(contentSource).toContain('function renderLmsConceptsLibrary(courseId)');
        expect(contentSource).toContain('async function createLmsConcept(resourceKey)');
        expect(contentSource).toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(contentSource).toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(contentSource).toContain('function rateLmsConcept(resourceKey, conceptId, score)');
        expect(contentSource).toContain('function getLmsConceptReviewPillClass(reviewStatus = \'\')');
        expect(contentSource).toContain('class="lms-route-card-head lms-week-manager-shell-head"');
        expect(contentSource).toContain('class="lms-route-copy lms-route-copy-mt-4 lms-week-manager-shell-copy"');
        expect(contentSource).toContain('class="lms-route-actions lms-week-manager-shell-actions"');
        expect(contentSource).toContain('class="kiu-btn-blue lms-week-manager-input-action"');
        expect(contentSource).toContain('class="lms-quiz-board-modal lms-week-manager-modal lms-week-manager-modal-shell"');
        expect(contentSource).toContain('class="lms-quiz-board-head lms-week-manager-modal-head"');
        expect(contentSource).toContain('class="lms-quiz-board-body lms-week-manager-modal-body"');
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
        expect(contentSource).toContain('class="lms-route-pill lms-concept-review-pill ${getLmsConceptReviewPillClass(concept.reviewStatus)}"');
        expect(contentSource).toContain('class="lms-route-pill is-positive"');
        expect(contentSource).toContain('class="kiu-btn-outline lms-route-btn-compact lms-route-btn-compact-square lms-route-btn-danger"');
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
        expect(routeCss).toContain('.lms-route-copy-mt-14');
        expect(routeCss).toContain('.lms-route-stack-gap-16');
        expect(routeCss).toContain('.lms-route-actions-mt-12');
        expect(routeCss).toContain('.lms-route-copy-prewrap');
        expect(routeCss).toContain('.lms-week-manager-shell-head,');
        expect(routeCss).toContain('.lms-week-manager-input-action {');
        expect(routeCss).toContain('.lms-week-manager-modal-shell {');
        expect(routeCss).toContain('.lms-week-manager-modal-body {');
        expect(routeCss).toContain('.lms-concept-card {');
        expect(routeCss).toContain('.lms-concept-guidance-card {');
        expect(routeCss).toContain('.lms-concept-status-row {');
        expect(routeCss).toContain('.lms-concept-form-toggle');
        expect(routeCss).toContain('.lms-concept-review-pill.is-approved');
        expect(routeCss).toContain('.lms-concept-card-footer');
        expect(routeCss).toContain('.lms-concept-card-footer-actions,');
        expect(routeCss).toContain('.lms-concept-review-actions {');
        expect(routeCss).toContain('.lms-concept-rate-btn');

        expect(lmsSource).not.toContain('function ensureLmsWeeksForKey(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsWeekManager(resourceKey)');
        expect(lmsSource).not.toContain('function renderLmsConceptsLibrary(courseId)');
        expect(lmsSource).not.toContain('async function createLmsConcept(resourceKey)');
        expect(lmsSource).not.toContain('function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = \'approved\')');
        expect(lmsSource).not.toContain('function deleteLmsConcept(resourceKey, conceptId)');
        expect(lmsSource).not.toContain('function rateLmsConcept(resourceKey, conceptId, score)');
    });
});
