import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz UI module split', () => {
    it('moves LMS live quiz UI/render helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const liveQuizUiSource = readLmsLiveQuizUiChain();
        expect(lmsHtml).not.toContain('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain('assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260728-livepatch1');
        expect(classroomSource).toContain('function ensureLmsLiveQuizRuntime()');
        expect(liveQuizUiSource).toContain('function getLmsLiveStudentId()');
        expect(liveQuizUiSource).toContain('function canManageLmsLiveQuiz(resourceKey = currentCourseId)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveScoreList(session = null, limit = 8)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveStaffWorkspace(context)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveStudentWorkspace(context)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveQuizSection(courseId, options = {})');
        expect(liveQuizUiSource).toContain('class="lms-live-score-main"');
        expect(liveQuizUiSource).toContain('class="lms-live-score-name"');
        expect(liveQuizUiSource).toContain('class="lms-live-copy lms-live-copy-mt-2 lms-route-meta-11"');
        expect(liveQuizUiSource).toContain('style="--lms-live-breakdown-width:');
        expect(liveQuizUiSource).toContain('class="lms-live-pill-row lms-live-pill-row--center"');
        expect(liveQuizUiSource).toContain('class="lms-live-broadcast-header"');
        expect(liveQuizUiSource).toContain('class="lms-live-broadcast-question-card"');
        expect(liveQuizUiSource).toContain('class="lms-live-broadcast-control-deck"');
        expect(liveQuizUiSource).toContain('class="lms-live-score-list lms-live-score-list--wide lms-live-summary-list"');
        expect(liveQuizUiSource).toContain('class="lms-live-stage lms-live-summary-shell"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-text lms-live-summary-title"');
        expect(liveQuizUiSource).toContain('class="lms-live-copy lms-live-copy-mt-10 lms-live-copy-center"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-head"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-main"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-title"');
        expect(liveQuizUiSource).toContain('class="lms-live-pill-row lms-live-pill-row--end"');
        expect(liveQuizUiSource).toContain('lms-live-wait-icon');
        expect(liveQuizUiSource).toContain('class="lms-live-score-list lms-live-score-list-mt-12"');
        expect(liveQuizUiSource).toContain('class="lms-live-form-grid lms-live-form-grid-mt-12"');
        expect(liveQuizUiSource).toContain('class="lux-secondary-btn lms-live-import-btn-mt-10"');
        expect(liveQuizUiSource).toContain('class="lms-live-breakdown-wrap-mt-12"');
        expect(liveQuizUiSource).toContain('class="lms-live-copy lms-live-copy-auto-center lms-live-copy-waiting"');
        expect(liveQuizUiSource).toContain('class="lms-live-title lms-live-title-responsive"');
        expect(liveQuizUiSource).toContain('class="lms-live-stage lms-live-stage-min-320"');
        expect(liveQuizUiSource).toContain('class="lms-live-stage is-waiting lms-live-stage-wait-shell"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-text lms-live-stage-wait-title"');
        expect(liveQuizUiSource).toContain('class="lms-live-copy lms-live-copy-auto-center lms-live-stage-wait-copy"');
        expect(liveQuizUiSource).toContain('lms-live-sync-card is-error');
        expect(liveQuizUiSource).toContain('class="lms-live-label is-danger"');
        expect(liveQuizUiSource).toContain('class="lms-live-copy lms-route-copy-mt-6 is-danger"');
        expect(liveQuizUiSource).toContain('lms-live-sync-card is-syncing');
        expect(liveQuizUiSource).toContain('class="lms-live-label lms-live-label--left lms-live-label-mb-7"');
        expect(liveQuizUiSource).toContain('class="lms-live-panel lms-live-queue-panel"');
        expect(liveQuizUiSource).toContain('class="lms-route-card-head lms-route-card-head-mb-14 lms-live-queue-head"');
        expect(liveQuizUiSource).toContain('class="lms-live-label lms-live-queue-kicker"');
        expect(liveQuizUiSource).toContain('class="lms-route-card-title lms-live-card-title-mt-5 lms-live-queue-title"');
        expect(liveQuizUiSource).toContain('class="lms-live-actions lms-live-queue-actions"');
        expect(liveQuizUiSource).toContain('class="lms-live-question-list lms-live-queue-list"');
        expect(liveQuizUiSource).toContain('lms-live-queue-empty-card');
        expect(liveQuizUiSource).toContain('lms-live-queue-empty-copy');
        expect(liveQuizUiSource).not.toContain('style="width:${escapeHtml(String(item.percent))}%;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:2px; font-size:11px;"');
        expect(liveQuizUiSource).not.toContain('style="width:min(720px,100%); margin:0 auto;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:10px; text-align:center;"');
        expect(liveQuizUiSource).not.toContain('style="border-color:rgba(239,68,68,0.42); background:rgba(127,29,29,0.22); margin-bottom:14px;"');
        expect(liveQuizUiSource).not.toContain('style="color:#fecaca;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:6px; color:#fee2e2;"');
        expect(liveQuizUiSource).not.toContain('style="border-color:rgba(59,130,246,0.32); background:rgba(30,64,175,0.16); margin-bottom:14px;"');
        expect(liveQuizUiSource).not.toContain('style="text-align:left; margin-bottom:7px;"');
        expect(liveQuizUiSource).not.toContain('style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;"');
        expect(liveQuizUiSource).not.toContain('style="min-width:0;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:5px; font-weight:850; color:var(--lux-text);"');
        expect(liveQuizUiSource).not.toContain('style="justify-content:center;"');
        expect(liveQuizUiSource).not.toContain('style="font-size:34px; color:var(--lux-accent); opacity:0.72;"');
        expect(liveQuizUiSource).not.toContain('style="margin:0 auto;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:12px;"');
        expect(liveQuizUiSource).not.toContain('style="justify-content:flex-end;"');
        expect(liveQuizUiSource).not.toContain('style="margin-bottom:14px;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:12px;"');
        expect(liveQuizUiSource).not.toContain('style="margin-top:10px;"');
        expect(liveQuizUiSource).not.toContain('style="max-width:620px;margin:10px auto 0;"');
        expect(liveQuizUiSource).not.toContain('style="font-size:clamp(22px,5vw,34px);"');
        expect(liveQuizUiSource).not.toContain('style="min-height:320px;"');
        expect(lmsSource).not.toContain('function getLmsLiveStudentId()');
        expect(lmsSource).not.toContain('function canManageLmsLiveQuiz(resourceKey = currentCourseId)');
        expect(lmsSource).not.toContain('function renderLmsLiveScoreList(session = null, limit = 8)');
        expect(lmsSource).not.toContain('function renderLmsLiveStaffWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsLiveStudentWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsLiveQuizSection(courseId)');
    });
});
