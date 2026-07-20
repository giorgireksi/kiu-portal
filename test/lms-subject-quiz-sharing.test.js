import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function createSubjectQuizVmContext() {
    const vm = require('vm');
    const context = {
        console,
        KIU_STATE: {
            meta: {},
            lmsQuizBuilder: {},
            lmsSubjectQuizBank: {}
        },
        canonicalCourseKey: (value) => String(value || '').trim().toLowerCase(),
        normalizeAssessmentNumber: (value, fallback = 1) => {
            const parsed = parseInt(value, 10);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        },
        normalizeLmsWeekLabel: (value) => String(value || '').trim() || 'Week 1',
        compareLmsWeekLabels: (left, right) => String(left).localeCompare(String(right)),
        makeAdminExamEntityId: (prefix) => `${prefix}-test-1`,
        normalizeLmsQuizAssessmentType: (value = 'quiz') => String(value || 'quiz'),
        getLmsQuizAssessmentMeta: (type = 'quiz') => ({ label: type === 'quiz' ? 'Quiz' : String(type) }),
        normalizeLmsQuizQuestionList: (questions = []) => (Array.isArray(questions) ? questions : []),
        normalizeLmsQuizVariantList: (variants = []) => (Array.isArray(variants) ? variants : []),
        normalizeLmsQuizStoredRecord: (quiz = {}) => ({
            ...quiz,
            status: quiz.status || 'draft',
            assessmentType: quiz.assessmentType || 'quiz',
            weekLabel: quiz.weekLabel || 'Week 1',
            questions: quiz.questions || [],
            variants: quiz.variants || [],
            allowedStudentIds: quiz.allowedStudentIds || [],
            isPublished: quiz.isPublished === true,
            durationMinutes: quiz.durationMinutes || 20,
            publishMode: quiz.publishMode || 'manual',
            lockedAfterPublish: quiz.lockedAfterPublish !== false,
            attendanceMode: quiz.attendanceMode || 'manual-access-list',
            attendanceRequired: quiz.attendanceRequired !== false,
            attendanceGateEnabled: quiz.attendanceGateEnabled !== false,
            requiresBlueExamNetwork: quiz.requiresBlueExamNetwork === true,
            blueSessionMode: quiz.blueSessionMode || 'helper-session',
            submissionsVisible: quiz.submissionsVisible !== false
        }),
        normalizeLmsSectionType: (value) => {
            const normalized = String(value || '').trim().toLowerCase();
            return normalized === 'workshop' ? 'workshop' : (normalized === 'lecture' ? 'lecture' : '');
        },
        currentCourseId: ''
    };

    const lmsSource = readSource('assets/js/pages/lms.js');
    const start = lmsSource.indexOf('function getLmsSectionSuffix');
    const end = lmsSource.indexOf('function getLmsQuizDisplayLabel');
    const helperBlock = lmsSource.slice(start, end);

    vm.createContext(context);
    vm.runInContext(`const LMS_SECTION_SUFFIX_PREFIX = '__lmssec_';
${helperBlock}
function resolveCanonicalLmsResourceKey(resourceKey) {
    return String(resourceKey || '').trim();
}
function ensureLmsStores() {}
function isLmsSubjectQuizPublishedAnywhere() { return false; }
function removeLmsSubjectQuizRecord() {}
function compareLmsQuizRecords() { return 0; }
function sortLmsQuizzes(quizzes = []) { return [...quizzes]; }
function getLmsQuizDisplayLabel(quiz = {}) {
    return quiz.assessmentType === 'quiz' ? 'Quiz' : String(quiz.assessmentType || 'Quiz');
}
`, context);
    return context;
}

describe('LMS subject quiz sharing', () => {
    it('stores quiz helpers and routes quiz tab through group-level keys', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const initialStateSource = readSource('assets/js/data/initial-state.js');

        expect(lmsSource).toContain('function getLmsQuizGroupResourceKey(courseKey = currentCourseId)');
        expect(lmsSource).toContain('function ensureLmsSubjectQuizBank(subjectId)');
        expect(lmsSource).toContain('function migrateLmsQuizSectionWorkspaces()');
        expect(lmsSource).toContain("if (normalizedTab === 'quiz' || normalizedTab === 'monitoring')");
        expect(initialStateSource).toContain('state.lmsSubjectQuizBank');
        expect(quizSource).toContain('function toggleLmsQuizBuilderPreview(quizId = null)');
        expect(quizSource).toContain('function closeLmsQuizBuilderPreview()');
        expect(quizSource).toContain('function openLmsQuizBuilderPreviewModal(quizId = null)');
        expect(quizSource).toContain('function openLmsSubjectQuizLibraryModal()');
        expect(quizSource).toContain("overlay.id = 'lms-quiz-preview-modal'");
        expect(quizSource).toContain("overlay.id = 'lms-quiz-subject-library-modal'");
        expect(quizSource).not.toContain('data-lms-click="openLmsQuizBuilderPreviewModal()"');
        expect(quizSource).toContain('data-lms-click="openLmsSubjectQuizLibraryModal()"');
        expect(quizSource).toContain('data-lms-click="toggleLmsQuizBuilderPreview(');
        expect(quizSource).not.toContain('${renderLmsSubjectQuizLibraryPanel(context)}');
        expect(quizSource).not.toContain('${renderLmsQuizBuilderPreviewPanel(context, uiState)}');
        expect(quizSource).toContain('Shared across subject');
        expect(quizSource).toContain('function renderLmsSubjectQuizLibraryBody(context)');
        expect(quizSource).toContain('lms-quiz-library-card');
        expect(quizSource).toContain('lms-quiz-preview-toolbar');
        expect(quizSource).toContain('lms-quiz-preview-viewport');
        expect(quizSource).toContain('lms-quiz-studio-modal');
        expect(quizSource).not.toContain('lms-quiz-subject-library-table-head');
        expect(quizSource).toContain('bucketCounts.drafts.length');
        expect(quizSource).not.toContain('${workspace.drafts.length}');
        expect(lmsSource).toContain('createdInGroupId');
        expect(lmsSource).toContain('function snapshotLmsQuizContentForDeployment(contentQuiz = {})');
        expect(lmsSource).toContain('contentSnapshot');
        expect(lmsSource).toContain('function hoistLegacyLmsQuizGroupBuckets()');
        expect(quizSource).toContain('function addLmsSubjectQuizLibraryDraftToGroup(resourceKey, quizId)');
        expect(quizSource).toContain('Add as Draft in');
        expect(quizSource).toContain('Edit content anytime; add to a group as draft or publish when ready.');
        expect(quizSource).not.toMatch(/function loadLmsQuizDraftForEdit[\s\S]{0,800}can no longer be edited/);
        expect(quizSource).not.toMatch(/function saveLmsQuizBuilderDraft[\s\S]{0,2200}can no longer be edited/);
        expect(quizSource).toContain('Published groups keep their current version until you republish.');
    });

    it('migrates section-scoped quiz workspaces into subject bank and group deployments', () => {
        const ctx = createSubjectQuizVmContext();
        const quizId = 'lms-quiz-test-1';
        ctx.KIU_STATE.lmsQuizBuilder['SUBJ::g1__lmssec_lecture'] = {
            drafts: [{
                id: quizId,
                subjectId: 'SUBJ',
                title: 'Shared Quiz',
                weekLabel: 'Week 2',
                questions: [{ id: 'q1', type: 'mcq', text: '2+2?', options: ['3', '4'], correctOption: 1 }],
                status: 'draft',
                updatedAt: '2026-07-04T10:00:00.000Z'
            }],
            published: [],
            closed: [],
            submissions: {}
        };

        ctx.migrateLmsQuizSectionWorkspaces();

        expect(ctx.KIU_STATE.meta.lmsSubjectQuizMigrated).toBe(true);
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts).toHaveLength(1);
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].title).toBe('Shared Quiz');
        expect(ctx.KIU_STATE.lmsQuizBuilder['SUBJ::g1__lmssec_lecture']).toBeUndefined();
        expect(ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g1')).toHaveLength(1);
        expect(ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g2')).toHaveLength(1);
        expect(ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g2')[0].id).toBe(quizId);
    });

    it('hoists group-key legacy drafts into subject bank and preserves origin group metadata', () => {
        const ctx = createSubjectQuizVmContext();
        const quizId = 'lms-quiz-g2-draft';
        ctx.KIU_STATE.meta.lmsSubjectQuizMigrated = true;
        ctx.KIU_STATE.lmsQuizBuilder['SUBJ::g2'] = {
            drafts: [{
                id: quizId,
                subjectId: 'SUBJ',
                title: 'G2 Draft Quiz',
                weekLabel: 'Week 3',
                groupId: 'g2',
                groupName: 'G2',
                questions: [{ id: 'q1', type: 'mcq', text: '1+1?', options: ['1', '2'], correctOption: 1 }],
                status: 'draft',
                updatedAt: '2026-07-04T11:00:00.000Z'
            }],
            published: [],
            closed: [],
            deployments: {},
            submissions: {}
        };

        ctx.hoistLegacyLmsQuizGroupBuckets();

        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts).toHaveLength(1);
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].createdInGroupId).toBe('g2');
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].createdInGroupName).toBe('G2');
        expect(ctx.KIU_STATE.lmsQuizBuilder['SUBJ::g2'].drafts).toHaveLength(0);
        expect(ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g1')).toHaveLength(1);
        expect(ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g1')[0].title).toBe('G2 Draft Quiz');
    });

    it('preserves createdInGroupId on first save and when publishing in another group', () => {
        const ctx = createSubjectQuizVmContext();
        const quiz = {
            id: 'lms-quiz-origin',
            title: 'Origin Quiz',
            weekLabel: 'Week 1',
            groupId: 'g2',
            groupName: 'G2',
            questions: [],
            status: 'draft'
        };
        ctx.saveLmsQuizWorkspaceRecord('SUBJ::g2', { ...quiz, subjectId: 'SUBJ' });
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].createdInGroupId).toBe('g2');

        ctx.saveLmsQuizGroupDeployment('SUBJ::g1', {
            ...quiz,
            status: 'published',
            isPublished: true,
            publishedAt: '2026-07-04T12:00:00.000Z'
        });
        ctx.saveLmsSubjectQuizRecord('SUBJ', {
            ...ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0],
            title: 'Origin Quiz Updated'
        });
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].createdInGroupId).toBe('g2');
        expect(ctx.KIU_STATE.lmsSubjectQuizBank.SUBJ.drafts[0].createdInGroupName).toBe('G2');
    });

    it('keeps published deployment content frozen until republish refreshes snapshot', () => {
        const ctx = createSubjectQuizVmContext();
        const quizId = 'lms-quiz-snapshot';
        const originalQuestion = { id: 'q1', type: 'mcq', text: 'Original?', options: ['A', 'B'], correctOption: 1 };
        const updatedQuestion = { id: 'q1', type: 'mcq', text: 'Updated?', options: ['A', 'B'], correctOption: 1 };

        ctx.saveLmsSubjectQuizRecord('SUBJ', {
            id: quizId,
            subjectId: 'SUBJ',
            title: 'Snapshot Quiz',
            weekLabel: 'Week 1',
            questions: [originalQuestion],
            status: 'draft'
        });

        const snapshot = ctx.snapshotLmsQuizContentForDeployment(ctx.getLmsSubjectQuizById('SUBJ', quizId));
        ctx.saveLmsQuizGroupDeployment('SUBJ::g1', {
            id: quizId,
            status: 'published',
            isPublished: true,
            allowedStudentIds: ['s1'],
            publishedAt: '2026-07-04T12:00:00.000Z',
            contentSnapshot: snapshot
        });

        ctx.saveLmsSubjectQuizRecord('SUBJ', {
            ...ctx.getLmsSubjectQuizById('SUBJ', quizId),
            questions: [updatedQuestion],
            title: 'Snapshot Quiz Updated'
        });

        const publishedView = ctx.getLmsQuizById('SUBJ::g1', quizId);
        expect(publishedView.title).toBe('Snapshot Quiz');
        expect(publishedView.questions[0].text).toBe('Original?');

        const draftView = ctx.getAllLmsQuizWorkspaceRecords('SUBJ::g2')[0];
        expect(draftView.questions[0].text).toBe('Updated?');

        const refreshedSnapshot = ctx.snapshotLmsQuizContentForDeployment(ctx.getLmsSubjectQuizById('SUBJ', quizId));
        ctx.saveLmsQuizGroupDeployment('SUBJ::g1', {
            id: quizId,
            status: 'published',
            isPublished: true,
            allowedStudentIds: ['s1'],
            publishedAt: '2026-07-04T12:00:00.000Z',
            contentSnapshot: refreshedSnapshot
        });
        const republishedView = ctx.getLmsQuizById('SUBJ::g1', quizId);
        expect(republishedView.title).toBe('Snapshot Quiz Updated');
        expect(republishedView.questions[0].text).toBe('Updated?');
    });

    it('renders preview markup with disabled student inputs', () => {
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        expect(quizSource).toContain('function renderLmsQuizPreviewQuestionMarkup(question, index, options = {})');
        expect(quizSource).toContain('<textarea disabled');
        expect(quizSource).toContain('<input type="radio" disabled');
    });

    

});
