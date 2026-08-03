import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

function extractStudentServiceFnBlock(source, name) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    if (start < 0) return '';
    const brace = source.indexOf('{', start);
    if (brace < 0) return '';
    let depth = 0;
    for (let i = brace; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, i + 1);
        }
    }
    return '';
}

/** Mirrors updateStudentServiceAnswerHelpfulButton for in-place DOM patch checks. */
function updateStudentServiceAnswerHelpfulButton(button, answer = {}) {
    const helpfulCount = Number(answer.helpfulCount || 0);
    const viewerHelpfulVote = Boolean(answer.viewerHelpfulVote);
    button.classList.toggle('is-active', viewerHelpfulVote);
    button.classList.toggle('lux-primary-btn', viewerHelpfulVote);
    button.setAttribute('aria-pressed', viewerHelpfulVote ? 'true' : 'false');
    const icon = button.querySelector('i');
    if (icon) icon.className = `${viewerHelpfulVote ? 'fas' : 'far'} fa-thumbs-up`;
    let label = button.querySelector('.student-service-qa-answer-helpful-label');
    if (!label) {
        label = button.querySelector('span');
        if (label) label.className = 'student-service-qa-answer-helpful-label';
    }
    if (!label) {
        label = document.createElement('span');
        label.className = 'student-service-qa-answer-helpful-label';
        button.appendChild(label);
    }
    label.textContent = `Helpful${helpfulCount ? ` (${helpfulCount})` : ''}`;
}

describe('student service answer helpful button UI', () => {
    it('updates vote state and count in place without replacing the button node', () => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lux-secondary-btn lux-secondary-btn-sm student-service-qa-answer-helpful-btn is-active lux-primary-btn';
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = '<i class="fas fa-thumbs-up" aria-hidden="true"></i> <span class="student-service-qa-answer-helpful-label">Helpful (1)</span>';

        updateStudentServiceAnswerHelpfulButton(btn, { helpfulCount: 0, viewerHelpfulVote: false });
        expect(btn.classList.contains('is-active')).toBe(false);
        expect(btn.classList.contains('lux-primary-btn')).toBe(false);
        expect(btn.getAttribute('aria-pressed')).toBe('false');
        expect(btn.querySelector('i').className).toBe('far fa-thumbs-up');
        expect(btn.querySelector('.student-service-qa-answer-helpful-label').textContent).toBe('Helpful');

        updateStudentServiceAnswerHelpfulButton(btn, { helpfulCount: 1, viewerHelpfulVote: true });
        expect(btn.classList.contains('is-active')).toBe(true);
        expect(btn.classList.contains('lux-primary-btn')).toBe(true);
        expect(btn.getAttribute('aria-pressed')).toBe('true');
        expect(btn.querySelector('.student-service-qa-answer-helpful-label').textContent).toBe('Helpful (1)');
    });

    it('answer feedback success path patches in place without thread re-render or success flash', () => {
        const staff = readAsset('assets/js/pages/student-service-qa-staff-runtime.js');
        const answerFeedbackFn = extractStudentServiceFnBlock(staff, 'setStudentServiceAnswerFeedback');
        expect(answerFeedbackFn).toContain('pendingAnswerHelpfulIds');
        expect(answerFeedbackFn).toContain('getStudentServiceQuestionRecordById');
        expect(answerFeedbackFn).toContain('resolveStudentServiceActorUserId');
        expect(answerFeedbackFn).toContain("ariaPressed === 'true'");
        expect(answerFeedbackFn).toContain('isStudentServiceAnswerHelpfulVoted(answerBefore, actorId)');
        expect(answerFeedbackFn).toContain('expectedVoted');
        expect(answerFeedbackFn).not.toContain('payloadVoted !== expectedVoted');
        expect(answerFeedbackFn).not.toContain('forceReconcile = true');
        expect(answerFeedbackFn).toContain('setStudentServiceActionButtonPending(triggerButton, true)');
        expect(answerFeedbackFn).toContain('buildStudentServiceAnswerHelpfulToggleSnapshot');
        expect(answerFeedbackFn).not.toContain('studentServiceHelpfulPending');
        expect(answerFeedbackFn).toContain('answer: answerFromPayload');
        expect(answerFeedbackFn).not.toMatch(/async function setStudentServiceAnswerFeedback[\s\S]*patchStudentServiceOpenQuestionThread/);
        expect(answerFeedbackFn).not.toMatch(/async function setStudentServiceAnswerFeedback[\s\S]*flashStudentServiceActionButton\(triggerButton, 'success'\)/);
        expect(answerFeedbackFn).not.toMatch(/async function setStudentServiceAnswerFeedback[\s\S]*refreshStudentServiceDataAndRender/);
    });

    it('patchStudentServiceAnswerHelpfulBtn accepts options.answer without store lookup', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        expect(qa).toContain('options.answer || findStudentServiceAnswerRecord(question, answerId)');
        expect(qa).not.toContain('if (!question || !answer) return false');
    });

    function buildStudentServiceAnswerHelpfulToggleSnapshot(answer, actorUserId, wasHelpful) {
        const userId = String(actorUserId || '').trim();
        if (!userId) return null;
        const helpfulVotes = (answer.helpfulVotes || [])
            .filter((entry) => String(entry?.userId || '') !== userId);
        if (!wasHelpful) {
            helpfulVotes.push({ userId, updatedAt: '2026-01-01T00:00:00.000Z' });
        }
        return {
            ...answer,
            helpfulVotes,
            helpfulCount: helpfulVotes.length,
            viewerHelpfulVote: !wasHelpful
        };
    }

    it('answer toggle snapshot vote on and off keeps helpfulVotes aligned with count', () => {
        const base = { id: 'a1', helpfulVotes: [], helpfulCount: 0, viewerHelpfulVote: false };
        const voted = buildStudentServiceAnswerHelpfulToggleSnapshot(base, 'user-1', false);
        expect(voted.helpfulCount).toBe(1);
        expect(voted.viewerHelpfulVote).toBe(true);
        expect(voted.helpfulVotes.length).toBe(1);

        const unvoted = buildStudentServiceAnswerHelpfulToggleSnapshot(voted, 'user-1', true);
        expect(unvoted.helpfulCount).toBe(0);
        expect(unvoted.viewerHelpfulVote).toBe(false);
        expect(unvoted.helpfulVotes.length).toBe(0);
    });

    it('answer toggle snapshot returns null without actor user id', () => {
        const base = { id: 'a1', helpfulVotes: [], helpfulCount: 0 };
        expect(buildStudentServiceAnswerHelpfulToggleSnapshot(base, '', false)).toBeNull();
    });
});

describe('student service modal detail action buttons', () => {
    it('question helpful uses aria-pressed direction and trusts server payload', () => {
        const staff = readAsset('assets/js/pages/student-service-qa-staff-runtime.js');
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        const questionFeedbackFn = extractStudentServiceFnBlock(staff, 'setStudentServiceQuestionFeedback');
        expect(questionFeedbackFn).toContain('pendingQuestionHelpfulIds.has(normalizedQuestionId)');
        expect(questionFeedbackFn).not.toContain('pendingQuestionHelpfulStartedAt');
        expect(questionFeedbackFn).not.toContain('Date.now() - startedAt < 5000');
        expect(questionFeedbackFn).toContain('reconcileStudentServiceQuestionViewerHelpful');
        expect(questionFeedbackFn).toContain('expectedVoted');
        expect(questionFeedbackFn).toContain("ariaPressed === 'true'");
        expect(questionFeedbackFn).not.toContain('payloadVoted !== expectedVoted');
        expect(questionFeedbackFn).not.toContain('forceReconcile = true');
        expect(questionFeedbackFn).toContain('setStudentServiceActionButtonPending(triggerButton, true)');
        expect(questionFeedbackFn).toContain('getStudentServiceQuestionRecordById');
        expect(questionFeedbackFn).toContain('getStudentServiceQuestionById(normalizedQuestionId)');
        expect(questionFeedbackFn).toContain('Question record is not available');
        expect(questionFeedbackFn).toContain('resolveStudentServiceActorUserId');
        expect(questionFeedbackFn).toContain('isStudentServiceQuestionHelpfulVoted(questionBefore, actorId)');
        expect(questionFeedbackFn).toContain('buildStudentServiceQuestionHelpfulToggleSnapshot');
        expect(questionFeedbackFn).not.toContain('studentServiceHelpfulPending');
        expect(questionFeedbackFn).toMatch(/mergeStudentServiceQuestionSnapshot\(optimisticQuestion\)/);
        expect(questionFeedbackFn).toContain('suppressRealtimeRefreshUntil');
        expect(questionFeedbackFn).not.toContain('patchStudentServiceOpenQuestionThread');
        expect(qa).toContain('patchStudentServiceQuestionCardStats(questionId, question)');
        expect(qa).toContain('function buildStudentServiceQuestionHelpfulToggleSnapshot(');
        expect(qa).toContain('function buildStudentServiceAnswerHelpfulToggleSnapshot(');
        expect(qa).toContain('function resolveStudentServiceActorUserId(');
        expect(qa).toContain('function getStudentServiceQuestionRecordById(');
        expect(qa).toContain('function getStudentServiceQuestionHelpfulCount(');
        expect(qa).toContain('function patchStudentServiceQuestionThreadPreviewMetrics(');
        expect(qa).toContain('patchStudentServiceQuestionThreadPreviewMetrics(questionId, question)');
        expect(qa).toContain('function reconcileStudentServiceQuestionViewerHelpful(');
        expect(qa).toContain('function getStudentServiceQuestionViewerHelpfulVote(');
        expect(qa).toContain('window.setStudentServiceQuestionOwnerResolution = setStudentServiceQuestionOwnerResolution');
        expect(qa).toContain('patchStudentServiceQuestionHelpfulUi(questionId, { question })');
        expect(qa).not.toContain('if (Boolean(answer.viewerHelpfulVote)) return true');
        expect(qa).not.toContain('if (question.viewerVote === \'helpful\' || Boolean(question.viewerHelpfulVote)) return true');
    });

    it('owner resolution uses cycle target optimistic toggle without success flash or thread re-render', () => {
        const staff = readAsset('assets/js/pages/student-service-qa-staff-runtime.js');
        const ownerFn = extractStudentServiceFnBlock(staff, 'setStudentServiceQuestionOwnerResolution');
        expect(staff).toContain('storeStatus === normalizedStatus ? \'\' : normalizedStatus');
        expect(staff).toContain('pendingOwnerResolutionIds');
        expect(staff).toContain('ownerResolutionStatus: \'\'');
        expect(staff).toContain('question: questionFromPayload');
        expect(staff).toContain('triggerButton');
        expect(staff).toContain('triggerStudentServiceOwnerResolutionAnimation(triggerButton)');
        expect(ownerFn).toContain('getStudentServiceQuestionRecordById(normalizedQuestionId)');
        expect(ownerFn).toContain('getStudentServiceQuestionById(normalizedQuestionId)');
        expect(staff).not.toMatch(/async function setStudentServiceQuestionOwnerResolution[\s\S]*flashStudentServiceActionButton\(triggerButton, 'acting'\)/);
        expect(staff).not.toMatch(/async function setStudentServiceQuestionOwnerResolution[\s\S]*flashStudentServiceActionButton\(triggerButton, 'success'\)/);
        expect(staff).not.toContain('studentServiceOwnerResolutionPending');
    });

    it('patch helpers accept injected question and trigger targets', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        const ops = readAsset('assets/js/pages/student-service-ops-runtime.js');
        expect(qa).toContain('options.question || getStudentServiceQuestionById(questionId)');
        expect(qa).toContain('if (options.triggerButton) buttons.add(options.triggerButton)');
        expect(ops).toContain('options.question || getStudentServiceQuestionById(questionId)');
        expect(ops).toContain('if (options.actionRoot) roots.add(options.actionRoot)');
    });

    it('thread click handlers retry after QA module load', () => {
        const thread = readAsset('assets/js/pages/student-service-qa-thread-runtime.js');
        expect(thread).toContain('resolveStudentServiceExportImpl');
        expect(thread).toContain('setStudentServiceQuestionFeedback');
        expect(thread).toContain('event.stopPropagation()');
        expect(thread).toContain('setOwnerResolution');
        expect(thread).toContain('ensureStudentServiceQaModule()');
    });

    it('lazy QA staff deps resolve API paths at call time and throw when API client missing', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        expect(qa).toContain('function invokeStudentServicePostService(');
        expect(qa).toContain('function invokeStudentServiceApiPath(');
        expect(qa).toContain('Student Service API client is not loaded');
        expect(qa).toContain('postStudentService: invokeStudentServicePostService');
        expect(qa).toContain('questionFeedback: (questionId) => invokeStudentServiceApiPath(\'questionFeedback\', questionId)');
        expect(qa).toContain('questionOwnerResolution: (questionId) => invokeStudentServiceApiPath(\'questionOwnerResolution\', questionId)');
        expect(qa).not.toContain('STUDENT_SERVICE_API_PATHS: window.STUDENT_SERVICE_API_PATHS || {}');
        expect(qa).not.toContain('postStudentService: (...args) => window.postStudentService?.(...args)');
    });

    it('mountStudentServiceQuestionThreadModal does not clear in-flight question helpful pending', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        const mountBlock = extractStudentServiceFnBlock(qa, 'mountStudentServiceQuestionThreadModal');
        expect(mountBlock).not.toContain('pendingQuestionHelpfulIds');
    });

    it('answer helpful voter detection falls back to helpfulVotes array', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        expect(qa).toMatch(/function isStudentServiceAnswerHelpfulVoted[\s\S]*?helpfulVotes/);
        expect(qa).toContain('resolveStudentServiceActorUserId(actorUserId)');
    });
});

describe('student service question helpful button UI', () => {
    function resolveStudentServiceActorUserId(passedUserId = '') {
        const fromArg = String(passedUserId || '').trim();
        if (fromArg) return fromArg;
        return '';
    }

    function buildStudentServiceQuestionHelpfulToggleSnapshot(question, actorUserId, wasHelpful) {
        const userId = resolveStudentServiceActorUserId(actorUserId);
        if (!userId) return null;
        const helpfulVotes = (question.helpfulVotes || [])
            .filter((entry) => String(entry?.userId || '') !== userId);
        if (!wasHelpful) {
            helpfulVotes.push({ userId, value: 'helpful', updatedAt: '2026-01-01T00:00:00.000Z' });
        }
        const helpfulCount = helpfulVotes.filter((entry) => entry?.value === 'helpful').length;
        const notHelpfulCount = helpfulVotes.filter((entry) => entry?.value === 'not_helpful').length;
        return {
            ...question,
            helpfulVotes,
            helpfulCount,
            notHelpfulCount,
            viewerVote: wasHelpful ? '' : 'helpful',
            viewerHelpfulVote: !wasHelpful
        };
    }

    function updateStudentServiceQuestionHelpfulButton(button, question = {}) {
        const helpful = Number(question.helpfulCount || 0);
        const viewerHelpfulVote = question.viewerVote === 'helpful' || Boolean(question.viewerHelpfulVote);
        button.classList.toggle('is-active', viewerHelpfulVote);
        button.classList.toggle('lux-primary-btn', viewerHelpfulVote);
        button.setAttribute('aria-pressed', viewerHelpfulVote ? 'true' : 'false');
        const icon = button.querySelector('i');
        if (icon) icon.className = `${viewerHelpfulVote ? 'fas' : 'far'} fa-thumbs-up`;
        let label = button.querySelector('.student-service-qa-question-helpful-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'student-service-qa-question-helpful-label';
            button.appendChild(label);
        }
        label.textContent = `Helpful${helpful ? ` (${helpful})` : ''}`;
    }

    function isStudentServiceQuestionHelpfulVoted(question = {}, actorUserId = '') {
        const actorId = resolveStudentServiceActorUserId(actorUserId);
        if (!actorId) return false;
        return (question.helpfulVotes || []).some(
            (entry) => String(entry?.userId || '') === actorId && entry?.value !== 'not_helpful'
        );
    }

    it('ignores sticky viewerHelpfulVote when helpfulVotes has no actor entry', () => {
        const question = {
            id: 'q1',
            helpfulVotes: [],
            helpfulCount: 0,
            viewerVote: 'helpful',
            viewerHelpfulVote: true
        };
        expect(isStudentServiceQuestionHelpfulVoted(question, 'user-1')).toBe(false);
    });

    it('detects voted state from helpfulVotes when viewerVote is missing', () => {
        const question = {
            id: 'q1',
            helpfulVotes: [{ userId: 'user-1', value: 'helpful', updatedAt: '2026-01-01T00:00:00.000Z' }],
            helpfulCount: 1,
            viewerVote: '',
            viewerHelpfulVote: false
        };
        expect(isStudentServiceQuestionHelpfulVoted(question, 'user-1')).toBe(true);
        expect(isStudentServiceQuestionHelpfulVoted(question, 'other-user')).toBe(false);
    });

    it('toggle snapshot vote on and off keeps helpfulVotes aligned with count', () => {
        const base = { id: 'q1', helpfulVotes: [], helpfulCount: 0, viewerVote: '', viewerHelpfulVote: false };
        const voted = buildStudentServiceQuestionHelpfulToggleSnapshot(base, 'user-1', false);
        expect(voted.helpfulCount).toBe(1);
        expect(voted.viewerHelpfulVote).toBe(true);
        expect(voted.helpfulVotes.filter((e) => e.value === 'helpful').length).toBe(1);

        const unvoted = buildStudentServiceQuestionHelpfulToggleSnapshot(voted, 'user-1', true);
        expect(unvoted.helpfulCount).toBe(0);
        expect(unvoted.viewerHelpfulVote).toBe(false);
        expect(unvoted.helpfulVotes.filter((e) => e.value === 'helpful').length).toBe(0);
    });

    it('unvote snapshot clears viewer fields after prior vote', () => {
        const voted = {
            id: 'q1',
            helpfulVotes: [{ userId: 'user-1', value: 'helpful', updatedAt: '2026-01-01T00:00:00.000Z' }],
            helpfulCount: 1,
            viewerVote: 'helpful',
            viewerHelpfulVote: true
        };
        const unvoted = buildStudentServiceQuestionHelpfulToggleSnapshot(voted, 'user-1', true);
        expect(unvoted.helpfulCount).toBe(0);
        expect(unvoted.viewerVote).toBe('');
        expect(unvoted.viewerHelpfulVote).toBe(false);
        expect(isStudentServiceQuestionHelpfulVoted(unvoted, 'user-1')).toBe(false);
    });

    it('toggle snapshot returns null without actor user id', () => {
        const base = { id: 'q1', helpfulVotes: [], helpfulCount: 0 };
        expect(buildStudentServiceQuestionHelpfulToggleSnapshot(base, '', false)).toBeNull();
    });

    it('toggle snapshot does not double-count when existing vote uses another user id', () => {
        const base = {
            id: 'q1',
            helpfulVotes: [{ userId: 'other-user', value: 'helpful', updatedAt: '2026-01-01T00:00:00.000Z' }],
            helpfulCount: 1,
            viewerVote: '',
            viewerHelpfulVote: false
        };
        const voted = buildStudentServiceQuestionHelpfulToggleSnapshot(base, 'user-1', false);
        expect(voted.helpfulCount).toBe(2);
        const unvoted = buildStudentServiceQuestionHelpfulToggleSnapshot(voted, 'user-1', true);
        expect(unvoted.helpfulCount).toBe(1);
        expect(unvoted.viewerHelpfulVote).toBe(false);
    });

    it('updates vote state and count in place without replacing the button node', () => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lux-secondary-btn student-service-qa-question-helpful-btn';
        btn.innerHTML = '<i class="far fa-thumbs-up"></i><span class="student-service-qa-question-helpful-label">Helpful</span>';

        updateStudentServiceQuestionHelpfulButton(btn, { helpfulCount: 1, viewerVote: 'helpful', viewerHelpfulVote: true });
        expect(btn.classList.contains('is-active')).toBe(true);
        expect(btn.classList.contains('lux-primary-btn')).toBe(true);
        expect(btn.getAttribute('aria-pressed')).toBe('true');
        expect(btn.querySelector('.student-service-qa-question-helpful-label').textContent).toBe('Helpful (1)');

        updateStudentServiceQuestionHelpfulButton(btn, { helpfulCount: 0, viewerVote: '', viewerHelpfulVote: false });
        expect(btn.classList.contains('lux-primary-btn')).toBe(false);
        expect(btn.getAttribute('aria-pressed')).toBe('false');
        expect(btn.querySelector('.student-service-qa-question-helpful-label').textContent).toBe('Helpful');
    });

    it('inbox realtime skips refresh while pendingQuestionHelpfulIds is set', () => {
        const inbox = readAsset('assets/js/pages/student-service-inbox-runtime.js');
        expect(inbox).toContain('pendingQuestionHelpfulIds');
    });
});

describe('student service owner resolution cycle button', () => {
    function getStudentServiceOwnerResolutionCycleTarget(current) {
        const status = String(current || '').trim().toLowerCase();
        if (status === 'answered') return 'unanswered';
        if (status === 'unanswered') return 'unanswered';
        return 'answered';
    }

    function getStudentServiceOwnerResolutionButtonPresentation(question = {}) {
        const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
        if (ownerStatus === 'answered') {
            return {
                label: 'Marked as answered',
                iconClass: 'fas fa-check-circle',
                isActive: true,
                cycleTarget: 'unanswered'
            };
        }
        if (ownerStatus === 'unanswered') {
            return {
                label: 'Still waiting on this',
                iconClass: 'fas fa-hourglass-half',
                isActive: true,
                cycleTarget: 'unanswered'
            };
        }
        return {
            label: 'Set my status',
            iconClass: 'far fa-circle',
            isActive: false,
            cycleTarget: 'answered'
        };
    }

    function applyOwnerResolutionButtonPresentation(button, question = {}) {
        const presentation = getStudentServiceOwnerResolutionButtonPresentation(question);
        button.classList.toggle('is-active', presentation.isActive);
        button.classList.toggle('lux-primary-btn', presentation.isActive);
        button.setAttribute('aria-pressed', presentation.isActive ? 'true' : 'false');
        const icon = button.querySelector('i');
        if (icon) icon.className = presentation.iconClass;
        let label = button.querySelector('.student-service-qa-owner-resolution-label');
        if (!label) {
            label = button.querySelector('span');
            if (label) label.className = 'student-service-qa-owner-resolution-label';
        }
        if (!label) {
            label = document.createElement('span');
            label.className = 'student-service-qa-owner-resolution-label';
            button.appendChild(label);
        }
        label.textContent = presentation.label;
    }

    it('getStudentServiceOwnerResolutionCycleTarget cycles open answered unanswered', () => {
        expect(getStudentServiceOwnerResolutionCycleTarget('')).toBe('answered');
        expect(getStudentServiceOwnerResolutionCycleTarget('answered')).toBe('unanswered');
        expect(getStudentServiceOwnerResolutionCycleTarget('unanswered')).toBe('unanswered');
    });

    it('updates label icon and classes across three states', () => {
        const btn = document.createElement('button');
        btn.dataset.studentServiceOwnerResolutionCycle = 'true';
        btn.innerHTML = '<i class="far fa-circle"></i><span class="student-service-qa-owner-resolution-label">Set my status</span>';

        applyOwnerResolutionButtonPresentation(btn, { ownerResolutionStatus: 'answered' });
        expect(btn.classList.contains('is-active')).toBe(true);
        expect(btn.classList.contains('lux-primary-btn')).toBe(true);
        expect(btn.getAttribute('aria-pressed')).toBe('true');
        expect(btn.querySelector('i').className).toBe('fas fa-check-circle');
        expect(btn.querySelector('.student-service-qa-owner-resolution-label').textContent).toBe('Marked as answered');

        applyOwnerResolutionButtonPresentation(btn, { ownerResolutionStatus: 'unanswered' });
        expect(btn.querySelector('.student-service-qa-owner-resolution-label').textContent).toBe('Still waiting on this');
        expect(btn.querySelector('i').className).toBe('fas fa-hourglass-half');

        applyOwnerResolutionButtonPresentation(btn, { ownerResolutionStatus: '' });
        expect(btn.classList.contains('lux-primary-btn')).toBe(false);
        expect(btn.getAttribute('aria-pressed')).toBe('false');
        expect(btn.querySelector('.student-service-qa-owner-resolution-label').textContent).toBe('Set my status');
        expect(btn.querySelector('i').className).toBe('far fa-circle');
    });

    it('ops runtime renders single cycle button markup', () => {
        const ops = readAsset('assets/js/pages/student-service-ops-runtime.js');
        expect(ops).toContain('function getStudentServiceOwnerResolutionCycleTarget(');
        expect(ops).toContain('function getStudentServiceOwnerResolutionButtonPresentation(');
        expect(ops).toContain('function applyStudentServiceOwnerResolutionButtonPresentation(');
        expect(ops).toContain('updateStudentServiceOwnerResolutionButtons(root, question = {}, triggerButton = null)');
        expect(ops).toContain('applyStudentServiceOwnerResolutionButtonPresentation(options.triggerButton, question)');
        expect(ops).toContain('data-student-service-owner-resolution-cycle="true"');
        expect(ops).toContain('student-service-qa-owner-resolution-cycle-btn');
        expect(ops).toContain('student-service-qa-owner-resolution-label');
        expect(ops).not.toContain('data-student-service-owner-resolution="answered"');
        expect(ops).not.toContain('data-student-service-owner-resolution="unanswered"');
        expect(ops).toContain('triggerStudentServiceOwnerResolutionAnimation');
        expect(ops).toContain('is-owner-resolving');
    });

    it('staff clear step: unanswered POST unanswered yields optimistic empty status', () => {
        const storeStatus = 'unanswered';
        const normalizedStatus = 'unanswered';
        const optimisticStatus = storeStatus === normalizedStatus ? '' : normalizedStatus;
        expect(optimisticStatus).toBe('');
    });

    it('stale unanswered payload normalizes to clear before merge', () => {
        const staff = readAsset('assets/js/pages/student-service-qa-staff-runtime.js');
        expect(staff).toContain('storeStatus === normalizedStatus');
        expect(staff).toContain('ownerResolutionStatus: \'\'');
        expect(staff).toMatch(/q = \{ \.\.\.q, ownerResolutionStatus: '' \}/);
    });

    it('thread resolver uses export chain for cycle target', () => {
        const thread = readAsset('assets/js/pages/student-service-qa-thread-runtime.js');
        expect(thread).toContain('resolveStudentServiceExportImpl(\'getStudentServiceOwnerResolutionCycleTarget\')');
        expect(thread).toContain('KiuStudentService?.getStudentServiceOwnerResolutionCycleTarget');
    });

    it('bare-lite CSS styles owner-resolution active resolving animation and cycle layout', () => {
        const css = readAsset('assets/css/lux-page-bare-lite.css');
        expect(css).toContain('student-service-qa-owner-resolution-btn');
        expect(css).toContain('student-service-qa-owner-resolution-cycle-btn');
        expect(css).toContain('is-owner-resolving');
        expect(css).toContain('student-service-owner-resolution-pulse');
        expect(css).toContain('prefers-reduced-motion');
    });

    it('thread modal binds Dark-style chip burst on modal buttons', () => {
        const events = readAsset('assets/js/pages/student-service-events.js');
        const css = readAsset('assets/css/lux-page-bare-lite.css');
        const html = readAsset('student-service.html');
        expect(events).toContain('__studentServiceModalChipBurstBound');
        expect(events).toContain("closest?.('.student-service-qa-thread-modal button')");
        expect(events).toContain('spawnLuxChipBurstParticles');
        expect(events).toContain("addEventListener('pointerdown'");
        expect(css).toContain('#student-service-modal-root > .lux-chip-burst-particle');
        expect(css).toContain('@keyframes lux-chip-particle-out');
        expect(css).toContain('@keyframes lux-chip-particle-spark');
        expect(css).toContain('@keyframes lux-chip-particle-streak');
        expect(html).toContain('lux-page-bare-lite.css?v=20260803-ssburst1');
    });
});
