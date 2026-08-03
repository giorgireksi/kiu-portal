(function initStudentServiceQaModule() {
    const studentQaHubStub = window.__studentServiceStudentQaHubStub;
    const staffQaFeedStub = window.__studentServiceStaffQaFeedStub;
    if (
        typeof window.renderStudentServiceStudentQaHub === 'function'
        && typeof window.renderStudentServiceStaffQaFeed === 'function'
        && typeof studentQaHubStub === 'function'
        && typeof staffQaFeedStub === 'function'
        && window.renderStudentServiceStudentQaHub !== studentQaHubStub
        && window.renderStudentServiceStaffQaFeed !== staffQaFeedStub
        && typeof window.renderStudentServiceQuestionFeed === 'function'
        && typeof window.handleStudentServiceQaThreadClick === 'function'
    ) return;

    const __kiuSsApi = window.KiuStudentService || (window.KiuStudentService = {});
    window.__kiuSsApi = __kiuSsApi;

    function buildStudentServiceDefaultDraftQuestion() {
        return {
            title: '',
            body: '',
            category: 'General Question',
            facultyCode: normalizeFacultyCode(getCurrentFaculty?.() || '', ''),
            anonymousMode: true,
            displayIdentityToPeers: false,
            askMode: 'public'
        };
    }

    function resolveStudentServiceAnswerAuthorId(answer = {}) {
        return String(answer.responderUserId || answer.authorUserId || answer.authorId || '').trim();
    }

    function normalizeStudentServiceAnswer(answer = {}, index = 0) {
        if (!answer || typeof answer !== 'object') return null;
        return {
            id: String(answer.id || `svc-answer-${index + 1}`),
            questionId: String(answer.questionId || ''),
            body: String(answer.body || answer.message || '').trim(),
            attachments: normalizeStudentServiceAttachments(answer.attachments),
            status: ['pending', 'published', 'archived'].includes(String(answer.status || '').trim())
                ? String(answer.status || '').trim()
                : 'published',
            responderUserId: resolveStudentServiceAnswerAuthorId(answer),
            responderRole: String(answer.responderRole || answer.authorRole || '').trim().toLowerCase(),
            responderName: String(
                answer.responderName
                || answer.authorDisplayName
                || answer.authorName
                || answer.authorLabel
                || 'Staff'
            ).trim(),
            parentAnswerId: String(answer.parentAnswerId || '').trim(),
            replyToName: String(answer.replyToName || '').trim(),
            helpfulCount: Array.isArray(answer.helpfulVotes)
                ? answer.helpfulVotes.length
                : Number(answer.helpfulCount || 0),
            helpfulVotes: Array.isArray(answer.helpfulVotes) ? answer.helpfulVotes : [],
            viewerHelpfulVote: (() => {
                const actorId = resolveStudentServiceActorUserId();
                if (!actorId) return false;
                return (answer.helpfulVotes || []).some(
                    (entry) => String(entry?.userId || '') === actorId
                );
            })(),
            createdAt: answer.createdAt || ssNowIso(),
            updatedAt: answer.updatedAt || answer.createdAt || ssNowIso()
        };
    }

    function preferStudentServiceAnswerRecord(existing, incoming) {
        if (!existing) return incoming;
        if (!incoming) return existing;
        const existingParent = String(existing.parentAnswerId || '').trim();
        const incomingParent = String(incoming.parentAnswerId || '').trim();
        const incomingTime = ssParseTime(incoming.updatedAt || incoming.createdAt);
        const existingTime = ssParseTime(existing.updatedAt || existing.createdAt);
        const winner = incomingTime >= existingTime ? incoming : existing;
        const loser = incomingTime >= existingTime ? existing : incoming;
        if (!String(winner.parentAnswerId || '').trim() && String(loser.parentAnswerId || '').trim()) {
            return {
                ...winner,
                parentAnswerId: loser.parentAnswerId,
                replyToName: loser.replyToName || winner.replyToName
            };
        }
        return winner;
    }

    function buildStudentServiceAnswerThread(answers = []) {
        const answerIds = new Set((answers || []).map(entry => String(entry.id || '').trim()).filter(Boolean));
        const topLevel = [];
        const repliesByParent = new Map();
        (answers || []).forEach(answer => {
            const parentId = String(answer.parentAnswerId || '').trim();
            if (!parentId || !answerIds.has(parentId)) {
                topLevel.push(answer);
                return;
            }
            if (!repliesByParent.has(parentId)) repliesByParent.set(parentId, []);
            repliesByParent.get(parentId).push(answer);
        });
        const sortByTime = (left, right) => ssParseTime(left.createdAt || left.updatedAt) - ssParseTime(right.createdAt || right.updatedAt);
        topLevel.sort(sortByTime);
        repliesByParent.forEach(list => list.sort(sortByTime));
        return topLevel.map(answer => ({
            answer,
            replies: repliesByParent.get(answer.id) || []
        }));
    }

    function normalizeStudentServiceQuestionStatus(status = '') {
        const raw = String(status || '').trim().toLowerCase();
        if (raw === 'pending' || raw === 'pending_review') return 'published';
        return STUDENT_SERVICE_PUBLIC_QUESTION_STATUSES.includes(raw) ? raw : 'published';
    }

    function normalizeStudentServiceQuestion(question = {}, index = 0) {
        if (!question || typeof question !== 'object') return null;
        const normalizedCategory = STUDENT_SERVICE_CATEGORIES.includes(question.category)
            ? question.category
            : 'General Question';
        const answers = Array.isArray(question.answers)
            ? question.answers.map(normalizeStudentServiceAnswer).filter(Boolean)
            : [];
        const authorUserId = String(question.authorUserId || question.authorId || question.studentId || '');
        return {
            id: String(question.id || `svc-question-${index + 1}`),
            title: String(question.title || 'Untitled question').trim(),
            body: String(question.body || question.message || '').trim(),
            attachments: normalizeStudentServiceAttachments(question.attachments),
            category: normalizedCategory,
            serviceArea: getStudentServiceSupportArea(question.serviceArea || getStudentServiceSupportAreaForCategory(normalizedCategory).id).id,
            facultyCode: normalizeFacultyCode(question.facultyCode || question.faculty || '', ''),
            status: normalizeStudentServiceQuestionStatus(question.status),
            authorUserId,
            authorId: authorUserId,
            authorDisplayName: String(question.authorDisplayName || question.authorName || question.authorLabel || '').trim(),
            anonymousMode: question.anonymousMode !== false,
            displayIdentityToPeers: Boolean(question.displayIdentityToPeers),
            featured: Boolean(question.featured),
            pinned: Boolean(question.pinned),
            staleReviewRequested: Boolean(question.staleReviewRequested),
            staleReviewNote: String(question.staleReviewNote || '').trim(),
            acceptedAnswerId: String(question.acceptedAnswerId || ''),
            ownerResolutionStatus: (() => {
                const raw = String(question.ownerResolutionStatus || '').trim().toLowerCase();
                return raw === 'answered' || raw === 'unanswered' ? raw : '';
            })(),
            ownerResolutionUpdatedAt: String(question.ownerResolutionUpdatedAt || '').trim(),
            ownerResolutionUpdatedBy: String(question.ownerResolutionUpdatedBy || '').trim(),
            viewerCanSetOwnerResolution: typeof question.viewerCanSetOwnerResolution === 'boolean'
                ? question.viewerCanSetOwnerResolution
                : undefined,
            helpfulVotes: (() => {
                const votes = Array.isArray(question.helpfulVotes) ? question.helpfulVotes : [];
                return votes;
            })(),
            helpfulCount: (() => {
                const votes = Array.isArray(question.helpfulVotes) ? question.helpfulVotes : null;
                if (votes) {
                    return votes.filter(entry => entry?.value === 'helpful').length;
                }
                return Number(question.helpfulCount || 0);
            })(),
            notHelpfulCount: (() => {
                const votes = Array.isArray(question.helpfulVotes) ? question.helpfulVotes : null;
                if (votes) {
                    return votes.filter(entry => entry?.value === 'not_helpful').length;
                }
                return Number(question.notHelpfulCount || 0);
            })(),
            viewerVote: (() => {
                const votes = Array.isArray(question.helpfulVotes) ? question.helpfulVotes : [];
                const actorId = resolveStudentServiceActorUserId();
                const viewerEntry = actorId
                    ? votes.find(entry => String(entry?.userId || '') === actorId)
                    : null;
                if (viewerEntry) return String(viewerEntry.value || '').trim();
                if (!actorId) return String(question.viewerVote || '').trim();
                return '';
            })(),
            viewerHelpfulVote: (() => {
                const votes = Array.isArray(question.helpfulVotes) ? question.helpfulVotes : [];
                const actorId = resolveStudentServiceActorUserId();
                if (!actorId) return false;
                return votes.some(
                    entry => String(entry?.userId || '') === actorId && entry?.value !== 'not_helpful'
                );
            })(),
            relatedQuestionIds: Array.isArray(question.relatedQuestionIds) ? question.relatedQuestionIds.map(String) : [],
            lastReviewedAt: question.lastReviewedAt || '',
            convertedTicketId: String(question.convertedTicketId || ''),
            createdAt: question.createdAt || ssNowIso(),
            updatedAt: question.updatedAt || question.createdAt || ssNowIso(),
            viewerCanRespond: typeof question.viewerCanRespond === 'boolean' ? question.viewerCanRespond : undefined,
            answers
        };
    }

    function resolveStudentServiceReplyShell(triggerElement = null) {
        const inlineFromTrigger = triggerElement?.closest?.('.student-service-qa-comment-reply-shell');
        if (inlineFromTrigger) return inlineFromTrigger;
        const openInline = document.querySelector('.student-service-qa-comment-reply-shell');
        if (openInline && triggerElement?.closest?.('.student-service-qa-thread-comments')) return openInline;
        const composeFromTrigger = triggerElement?.closest?.('.student-service-qa-reply-shell');
        if (composeFromTrigger) return composeFromTrigger;
        return document.querySelector('.student-service-qa-comment-reply-shell')
            || document.querySelector('.student-service-qa-reply-shell');
    }

    function resolveStudentServiceParentAnswerId(triggerElement = null, shell = null, questionId = '') {
        const activeShell = shell || resolveStudentServiceReplyShell(triggerElement);
        const fromShellRoot = String(
            activeShell?.dataset?.studentServiceReplyAnswerId
            || activeShell?.getAttribute?.('data-student-service-reply-answer-id')
            || ''
        ).trim();
        const replyHost = triggerElement?.closest?.('[data-student-service-parent-answer]');
        const fromTrigger = String(
            triggerElement?.dataset?.studentServiceParentAnswer
            || replyHost?.dataset?.studentServiceParentAnswer
            || ''
        ).trim();
        const textarea = activeShell?.querySelector(`[data-student-service-reply-input="${questionId}"]`)
            || activeShell?.querySelector('[data-student-service-reply-input]');
        const fromTextarea = String(textarea?.dataset?.studentServiceParentAnswer || '').trim();
        const fromShell = String(
            activeShell?.querySelector('[data-student-service-parent-answer]')?.dataset?.studentServiceParentAnswer || ''
        ).trim();
        const ui = ensureStudentServiceUiState();
        const inlineShell = activeShell?.classList?.contains('student-service-qa-comment-reply-shell')
            || document.querySelector('.student-service-qa-comment-reply-shell');
        const fromHidden = String(
            activeShell?.querySelector?.('.student-service-qa-parent-answer-id')?.value
            || activeShell?.querySelector?.('[data-student-service-parent-answer]')?.value
            || ''
        ).trim();
        const fromPending = inlineShell ? String(STUDENT_SERVICE_RUNTIME.pendingReplyParentAnswerId || '').trim() : '';
        const fromUi = inlineShell ? String(ui.replyingToAnswerId || '').trim() : '';
        return fromShellRoot || fromPending || fromUi || fromTrigger || fromTextarea || fromShell || fromHidden;
    }

    function canCurrentUserDeleteStudentServiceAnswer(question, answer) {
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser?.id || !question || !answer) return false;
        return resolveStudentServiceAnswerAuthorId(answer) === String(currentUser.id || '').trim();
    }

    function getStudentServiceQuestionResolutionLabel(question = {}) {
        const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
        if (ownerStatus === 'answered') {
            return { label: 'Owner: answered', icon: 'fa-check-circle', tone: 'owner-answered' };
        }
        if (ownerStatus === 'unanswered') {
            return { label: 'Owner: still waiting', icon: 'fa-hourglass-half', tone: 'owner-unanswered' };
        }
        const hasStaffAnswer = (question.answers || []).some(answer => answer.status === 'published');
        return hasStaffAnswer
            ? { label: 'Answered', icon: 'fa-user-check', tone: 'answered' }
            : { label: 'Waiting for answer', icon: 'fa-user-check', tone: 'waiting' };
    }

    function canCurrentUserDeleteStudentServiceQuestion(question) {
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser?.id || !question) return false;
        const status = String(question.status || '').trim().toLowerCase();
        if (status === 'converted' || status === 'merged') return false;
        if (canCurrentUserModerateStudentService()) return true;
        return String(question.authorUserId || question.authorId || '') === String(currentUser.id || '').trim();
    }

    function buildStudentServiceAnswerCardOptions(question) {
        return {
            canRespond: canCurrentUserRespondToStudentService(question),
            skipLuxButton: 'data-lux-skip-modern-button="true"'
        };
    }

    function findNewestStudentServiceTopLevelAnswer(question) {
        const answers = (question?.answers || [])
            .map(normalizeStudentServiceAnswer)
            .filter(answer => !String(answer.parentAnswerId || '').trim());
        if (!answers.length) return null;
        return answers.sort((left, right) => ssParseTime(right.createdAt || right.updatedAt) - ssParseTime(left.createdAt || left.updatedAt))[0];
    }

    function appendStudentServiceTopLevelAnswerNode(questionId) {
        const normalizedQuestionId = String(questionId || '').trim();
        if (!normalizedQuestionId) return false;
        const question = getStudentServiceQuestionById(normalizedQuestionId);
        const answer = findNewestStudentServiceTopLevelAnswer(question);
        if (!question || !answer || studentServiceAnswerArticleEl(answer.id)) return Boolean(answer);
        const host = getStudentServiceQuestionThreadHost(normalizedQuestionId);
        const list = host?.querySelector('.student-service-qa-thread-comments .social-neo-comment-list');
        if (!list) return false;
        list.querySelector('.student-service-qa-empty-note')?.remove();
        const cardOptions = {
            ...buildStudentServiceAnswerCardOptions(question),
            canDelete: canCurrentUserDeleteStudentServiceAnswer(question, answer)
        };
        const holder = document.createElement('div');
        holder.innerHTML = renderStudentServiceAnswerThreadNode(question, { answer, replies: [] }, cardOptions);
        if (holder.firstElementChild) list.appendChild(holder.firstElementChild);
        const thread = host?.querySelector('.student-service-qa-thread-comments');
        scheduleStudentServiceThreadRelayout(thread);
        return true;
    }

    function collectStudentServiceAnswerBranchIds(questionId, answerId, answers = []) {
        const normalizedQuestionId = String(questionId || '').trim();
        const normalizedAnswerId = String(answerId || '').trim();
        const removeIds = new Set();
        if (!normalizedQuestionId || !normalizedAnswerId) return removeIds;
        removeIds.add(normalizedAnswerId);
        (answers || []).forEach(answer => {
            const parentId = String(answer.parentAnswerId || '').trim();
            const id = String(answer.id || '').trim();
            if (!id || String(answer.questionId || '').trim() !== normalizedQuestionId) return;
            if (parentId && removeIds.has(parentId)) removeIds.add(id);
        });
        return removeIds;
    }

    function removeStudentServiceAnswersFromSnapshot(questionId, removedAnswerIds = new Set()) {
        const normalizedQuestionId = String(questionId || '').trim();
        if (!normalizedQuestionId || !removedAnswerIds.size || !Array.isArray(KIU_STATE.studentServiceAnswers)) return;
        invalidateStudentServiceStores();
        KIU_STATE.studentServiceAnswers = KIU_STATE.studentServiceAnswers.filter(answer =>
            !removedAnswerIds.has(String(answer.id || '').trim())
        );
        ensureStudentServiceStores();
    }

    function mergeStudentServiceQuestionSnapshot(question = {}) {
        const questionId = String(question.id || '').trim();
        if (!questionId || !Array.isArray(KIU_STATE.studentServiceQuestions)) return;
        invalidateStudentServiceStores();
        const normalizedQuestion = normalizeStudentServiceQuestion(question);
        const questionIndex = KIU_STATE.studentServiceQuestions.findIndex(item => String(item.id) === questionId);
        if (questionIndex >= 0) {
            KIU_STATE.studentServiceQuestions[questionIndex] = normalizedQuestion;
        } else {
            KIU_STATE.studentServiceQuestions.push(normalizedQuestion);
        }
        if (!Array.isArray(KIU_STATE.studentServiceAnswers)) KIU_STATE.studentServiceAnswers = [];
        const snapshotIds = new Set(
            (normalizedQuestion.answers || [])
                .map(answer => String(answer.id || '').trim())
                .filter(Boolean)
        );
        (normalizedQuestion.answers || []).forEach(answer => {
            const answerId = String(answer.id || '').trim();
            if (!answerId) return;
            const record = normalizeStudentServiceAnswer(answer);
            const answerIndex = KIU_STATE.studentServiceAnswers.findIndex(item => String(item.id) === answerId);
            if (answerIndex >= 0) {
                KIU_STATE.studentServiceAnswers[answerIndex] = record;
            } else {
                KIU_STATE.studentServiceAnswers.push(record);
            }
        });
        KIU_STATE.studentServiceAnswers = KIU_STATE.studentServiceAnswers.filter(answer =>
            String(answer.questionId || '') !== questionId
            || snapshotIds.has(String(answer.id || '').trim())
        );
        ensureStudentServiceStores();
    }

    function removeStudentServiceQuestionFromSnapshot(questionId) {
        const normalizedQuestionId = String(questionId || '').trim();
        if (!normalizedQuestionId) return;
        invalidateStudentServiceStores();
        if (Array.isArray(KIU_STATE.studentServiceQuestions)) {
            KIU_STATE.studentServiceQuestions = KIU_STATE.studentServiceQuestions.filter(item =>
                String(item.id || '') !== normalizedQuestionId
            );
        }
        if (Array.isArray(KIU_STATE.studentServiceAnswers)) {
            KIU_STATE.studentServiceAnswers = KIU_STATE.studentServiceAnswers.filter(item =>
                String(item.questionId || '') !== normalizedQuestionId
            );
        }
        ensureStudentServiceStores();
    }

    function removeStudentServiceQuestionCard(questionId) {
        const card = getStudentServiceQuestionCardElement(questionId);
        if (!card) return false;
        const list = card.parentElement;
        card.remove();
        if (list && !list.querySelector('.student-service-qa-card')) {
            list.innerHTML = '<div class="student-service-empty-state student-service-qa-empty-note">No questions match the current filters.</div>';
        }
        return true;
    }

    function buildStudentServiceQaContentFingerprint(questions = []) {
        return (questions || []).map(question => [
            question.id,
            question.updatedAt || '',
            getStudentServiceQuestionAnswerCount(question),
            Number(question.helpfulCount || 0),
            Number(question.notHelpfulCount || 0),
            isStudentServiceQuestionHelpfulVoted(question) ? 1 : 0,
            String(question.ownerResolutionStatus || ''),
            ...(question.answers || []).map(answer => [
                answer.id,
                answer.parentAnswerId || '',
                answer.updatedAt || answer.createdAt || '',
                Number(answer.helpfulCount || 0),
                answer.viewerHelpfulVote ? 1 : 0
            ].join('~'))
        ].join(':')).join('|');
    }

    function buildStudentServiceQaFeedCacheKey(ui, filteredQuestions) {
        return [
            'student-service-qa-feed',
            ui.qaSearch || '',
            buildStudentServiceQaContentFingerprint(filteredQuestions),
            filteredQuestions.length
        ].join(':');
    }

    function getStudentServiceVisibleQuestions() {
        const role = getEffectiveUserRole();
        const currentUser = getStudentServiceCurrentUser();
        const { questions } = ensureStudentServiceStores();
        return questions.filter(question => {
            if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return true;
            if ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
                const sameFaculty = !question.facultyCode
                    || normalizeFacultyCode(question.facultyCode || '', '') === normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '');
                return sameFaculty && question.status === 'published';
            }
            if (role === USER_ROLES.STUDENT) {
                return question.status === 'published'
                    || String(question.authorUserId || '') === String(currentUser?.id || '');
            }
            return question.status === 'published';
        });
    }

    function getStudentServiceQuestionAuthorLabel(question) {
        if (!question) return 'Student';
        if (question.displayIdentityToPeers && question.authorDisplayName) return question.authorDisplayName;
        if (question.anonymousMode !== false) return 'Anonymous student';
        return question.authorDisplayName || 'Student';
    }

    function getStudentServiceSelectedQuestion(questions) {
        const ui = ensureStudentServiceUiState();
        if (!Array.isArray(questions) || !questions.length) {
            ui.selectedQuestionId = '';
            return null;
        }
        if (!ui.selectedQuestionId || !questions.some(question => question.id === ui.selectedQuestionId)) {
            const preferred = questions.find(question => question.pinned)
                || questions.find(question => !(question.answers || []).some(answer => answer.status === 'published'))
                || questions[0];
            ui.selectedQuestionId = preferred?.id || questions[0].id;
        }
        return questions.find(question => question.id === ui.selectedQuestionId) || questions[0] || null;
    }

    function getStudentServiceOpenQuestion(questions) {
        const ui = ensureStudentServiceUiState();
        if (!Array.isArray(questions) || !questions.length) {
            ui.selectedQuestionId = '';
            return null;
        }
        return questions.find(question => question.id === ui.selectedQuestionId) || null;
    }

    function getStudentServiceFilteredQuestions(questions) {
        const ui = ensureStudentServiceUiState();
        const search = String(ui.qaSearch || '').trim().toLowerCase();
        return (questions || []).filter(question => {
            if (!search) return true;
            return [
                question.title,
                question.body,
                question.category,
                question.facultyCode,
                ...(question.answers || []).map(answer => answer.body)
            ].some(value => String(value || '').toLowerCase().includes(search));
        }).sort((left, right) => {
            if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
            if (left.featured !== right.featured) return left.featured ? -1 : 1;
            return ssParseTime(right.updatedAt || right.createdAt) - ssParseTime(left.updatedAt || left.createdAt);
        });
    }

    function relayoutStudentServiceCommentTrunks(scope) {
        const roots = scope
            ? [scope.closest?.('.student-service-qa-thread-comments') || (scope.classList?.contains('student-service-qa-thread-comments') ? scope : null)].filter(Boolean)
            : [...document.querySelectorAll('.student-service-qa-thread-comments')];
        roots.forEach(threadRoot => {
            threadRoot.querySelectorAll('article.social-neo-comment').forEach(comment => {
                const kids = comment.querySelector(':scope > .social-neo-comment-children');
                const avatar = comment.querySelector(':scope > .social-neo-comment-row > .social-neo-avatar');
                if (!kids || !avatar) {
                    comment.style.removeProperty('--trunk-top');
                    comment.style.removeProperty('--trunk-bottom');
                    return;
                }
                const lastChild = kids.querySelector(':scope > article.social-neo-comment:last-child');
                const lastAvatar = lastChild?.querySelector(':scope > .social-neo-comment-row > .social-neo-avatar');
                if (!lastChild || !lastAvatar) {
                    comment.style.removeProperty('--trunk-top');
                    comment.style.removeProperty('--trunk-bottom');
                    return;
                }
                const cR = comment.getBoundingClientRect();
                const aR = avatar.getBoundingClientRect();
                const lChildR = lastChild.getBoundingClientRect();
                comment.style.setProperty('--trunk-top', `${Math.round(aR.bottom - cR.top + 2)}px`);
                comment.style.setProperty('--trunk-bottom', `${Math.round(cR.bottom - lChildR.top)}px`);
            });
        });
    }

    function getStudentServiceQuestionById(questionId) {
        const normalizedId = String(questionId || '').trim();
        if (!normalizedId) return null;
        return getStudentServiceVisibleQuestions().find(question => String(question.id) === normalizedId) || null;
    }

    function getStudentServiceQuestionRecordById(questionId) {
        const normalizedId = String(questionId || '').trim();
        if (!normalizedId) return null;
        const { questions } = ensureStudentServiceStores();
        return questions.find(question => String(question.id) === normalizedId) || null;
    }

    function findStudentServiceAnswerRecord(question, answerId) {
        const normalizedId = String(answerId || '').trim();
        if (!question || !normalizedId) return null;
        return (question.answers || []).find(answer => String(answer.id) === normalizedId) || null;
    }

    function studentServiceAnswerArticleEl(answerId, options = {}) {
        const normalizedId = String(answerId || '').trim();
        if (!normalizedId) return null;
        const escaped = normalizedId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const selector = `article.social-neo-comment[data-student-service-answer-id="${escaped}"]`;
        const root = options.root || null;
        if (root) return root.querySelector(selector);
        const modalBody = getStudentServiceQuestionThreadModalBody();
        if (modalBody) {
            const inModal = modalBody.querySelector(selector);
            if (inModal) return inModal;
        }
        return document.querySelector(selector);
    }

    function getStudentServiceQuestionCardElement(questionId) {
        const normalizedId = String(questionId || '').trim();
        if (!normalizedId) return null;
        const escaped = normalizedId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const trigger = document.querySelector(`[data-student-service-open-question="${escaped}"]`);
        return trigger?.closest('.student-service-qa-card') || null;
    }

    function getStudentServiceQuestionThreadMode() {
        const role = getEffectiveUserRole();
        if (canCurrentUserModerateStudentService()) return 'staff';
        if ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) return 'staff';
        return 'student';
    }

    function isStudentServiceQuestionThreadModalOpen() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;
        return Boolean(modalRoot.querySelector('[data-student-service-question-thread-modal="true"]'));
    }

    function getStudentServiceQuestionThreadModalBody() {
        if (!isStudentServiceQuestionThreadModalOpen()) return null;
        return document.querySelector('[data-student-service-question-thread-modal-body="1"]');
    }

    function getStudentServiceQuestionThreadHost(questionId) {
        const normalizedId = String(questionId || '').trim();
        const ui = ensureStudentServiceUiState();
        if (isStudentServiceQuestionThreadModalOpen() && ui.selectedQuestionId === normalizedId) {
            return getStudentServiceQuestionThreadModalBody();
        }
        const card = getStudentServiceQuestionCardElement(normalizedId);
        return card?.querySelector('.student-service-qa-card-detail') || null;
    }

    function updateStudentServiceQuestionCardToggleUi(card) {
        if (!card) return;
        const toggleBtn = card.querySelector('.student-service-qa-card-toggle-btn');
        if (!toggleBtn) return;
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Open thread';
    }

    function clearLegacyStudentServiceOpenQuestionCards() {
        document.querySelectorAll('.student-service-qa-card.is-open').forEach(card => {
            card.classList.remove('is-open');
            card.querySelector('.student-service-qa-card-detail')?.remove();
            updateStudentServiceQuestionCardToggleUi(card);
        });
    }

    function updateStudentServiceQuestionThreadActiveCards(questionId) {
        const normalizedId = String(questionId || '').trim();
        document.querySelectorAll('.student-service-qa-card.is-thread-active').forEach(card => {
            card.classList.remove('is-thread-active');
        });
        if (!normalizedId) return;
        getStudentServiceQuestionCardElement(normalizedId)?.classList.add('is-thread-active');
    }

    function closeStudentServiceQuestionThreadModal() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || !isStudentServiceQuestionThreadModalOpen()) return;
        modalRoot.innerHTML = '';
        modalRoot.setAttribute('hidden', '');
        if (studentServiceShouldRestoreBodyScroll()) {
            document.body.style.overflow = '';
        }
    }

    function renderStudentServiceQuestionThreadModalShell(question, options = {}) {
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        const authorLabel = getStudentServiceQuestionAuthorLabel(question);
        return `
            <div class="student-service-qa-thread-modal-backdrop" data-student-service-dismiss-thread-modal="true">
                <div class="student-service-qa-thread-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-question-thread-modal-title" data-student-service-question-thread-modal="true">
                    <div class="student-service-qa-thread-modal-accent" aria-hidden="true"></div>
                    <div class="student-service-qa-thread-modal-head">
                        <div class="student-service-qa-thread-modal-heading">
                            <span class="student-service-qa-thread-modal-icon-chip home-hover-chip lux-soft-chrome"><i class="fas fa-comments" aria-hidden="true"></i></span>
                            <div class="student-service-qa-thread-modal-title-wrap">
                                <div class="student-service-kicker">Q&A thread</div>
                                <strong id="student-service-question-thread-modal-title" class="lux-page-title">${ssEscape(question.title || 'Question thread')}</strong>
                                <span class="lux-panel-copy">${ssEscape(authorLabel)} · ${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                            </div>
                        </div>
                        <button type="button" class="lux-secondary-btn student-service-qa-thread-modal-close" data-lux-skip-modern-button="true" data-student-service-cancel-thread-modal="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </div>
                    <div class="student-service-qa-thread-modal-scroll lux-glass-dialog-comment-scroll" data-student-service-question-thread-modal-body="1">
                        ${renderStudentServiceQuestionDetail(question, { mode, inThreadModal: true })}
                    </div>
                    <div class="student-service-qa-thread-modal-compose" data-student-service-question-thread-modal-compose="1">
                        ${renderStudentServiceQuestionThreadCompose(question, { mode })}
                    </div>
                </div>
            </div>
        `;
    }

    function mountStudentServiceQuestionThreadModal(questionId) {
        const normalizedId = String(questionId || '').trim();
        const question = getStudentServiceQuestionById(normalizedId);
        if (!question) return false;
        closeStudentServiceQuestionComposerModal();
        closeStudentServiceDeleteConfirm({ restoreThread: false });
        closeStudentServiceInlineReply();
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return false;
        modalRoot.innerHTML = renderStudentServiceQuestionThreadModalShell(question, {
            mode: getStudentServiceQuestionThreadMode()
        });
        modalRoot.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        const thread = modalRoot.querySelector('.student-service-qa-thread-comments');
        bindStudentServiceThreadResizeObserver(thread);
        scheduleStudentServiceThreadRelayout(thread);
        modalRoot.querySelector('[data-student-service-cancel-thread-modal="true"]')?.focus?.({ preventScroll: true });
        return true;
    }

    function remountStudentServiceQuestionThreadModal() {
        const ui = ensureStudentServiceUiState();
        const questionId = String(ui.selectedQuestionId || '').trim();
        if (!questionId || !isStudentServiceQuestionThreadModalOpen()) return;
        mountStudentServiceQuestionThreadModal(questionId);
    }

    function setStudentServiceOpenQuestionId(questionId) {
        const ui = ensureStudentServiceUiState();
        const normalizedId = String(questionId || '').trim();
        clearLegacyStudentServiceOpenQuestionCards();
        if (!normalizedId) {
            ui.selectedQuestionId = '';
            closeStudentServiceQuestionThreadModal();
            updateStudentServiceQuestionThreadActiveCards('');
            syncStudentServiceRenderSignature();
            return;
        }
        ui.selectedQuestionId = normalizedId;
        if (!mountStudentServiceQuestionThreadModal(normalizedId)) {
            ui.selectedQuestionId = '';
            updateStudentServiceQuestionThreadActiveCards('');
        } else {
            updateStudentServiceQuestionThreadActiveCards(normalizedId);
        }
        syncStudentServiceRenderSignature();
    }

    function restoreStudentServiceOpenQuestionFromUi() {
        const ui = ensureStudentServiceUiState();
        const questionId = String(ui.selectedQuestionId || '').trim();
        if (ui.serviceLane !== 'qa' || !questionId) {
            closeStudentServiceQuestionThreadModal();
            updateStudentServiceQuestionThreadActiveCards('');
            return;
        }
        if (isStudentServiceQuestionThreadModalOpen()) return;
        const question = getStudentServiceQuestionById(questionId);
        if (question) mountStudentServiceQuestionThreadModal(questionId);
    }

    function patchStudentServiceQuestionCardStats(questionId, questionOverride = null) {
        const question = questionOverride || getStudentServiceQuestionById(questionId);
        const card = getStudentServiceQuestionCardElement(questionId);
        if (!question || !card) return;
        const answerCount = getStudentServiceQuestionAnswerCount(question);
        const resolution = getStudentServiceQuestionResolutionLabel(question);
        const stats = card.querySelector('.student-service-qa-card-stats');
        if (!stats) return;
        const statEls = stats.querySelectorAll('.student-service-qa-card-stat');
        if (statEls[0]) statEls[0].innerHTML = `<i class="fas fa-comments"></i> ${answerCount} answer${answerCount === 1 ? '' : 's'}`;
        if (statEls[1]) statEls[1].innerHTML = `<i class="far fa-thumbs-up"></i> ${Number(question.helpfulCount || 0)} helpful`;
        if (statEls[2]) statEls[2].innerHTML = `<i class="fas ${resolution.icon}"></i> ${resolution.label}`;
        const chipRow = card.querySelector('.student-service-qa-chip-row');
        if (chipRow) {
            chipRow.querySelectorAll('.student-service-pill--owner-answered, .student-service-pill--owner-unanswered').forEach(node => node.remove());
            const ownerPill = renderStudentServiceOwnerResolutionPillMarkup(question);
            if (ownerPill) chipRow.insertAdjacentHTML('beforeend', ownerPill);
        }
    }

    function isStudentServiceQuestionHelpfulVoted(question = {}, actorUserId = '') {
        const actorId = resolveStudentServiceActorUserId(actorUserId);
        if (!actorId) return false;
        return (question.helpfulVotes || []).some(
            (entry) => String(entry?.userId || '') === actorId && entry?.value !== 'not_helpful'
        );
    }

    function getStudentServiceQuestionViewerHelpfulVote(question = {}, actorUserId = '') {
        return isStudentServiceQuestionHelpfulVoted(question, actorUserId);
    }

    function reconcileStudentServiceQuestionViewerHelpful(question = {}, actorUserId = '') {
        const actorId = resolveStudentServiceActorUserId(actorUserId);
        const helpfulVotes = question.helpfulVotes || [];
        const viewerEntry = actorId
            ? helpfulVotes.find((entry) => String(entry?.userId || '') === actorId)
            : null;
        const viewerVote = String(viewerEntry?.value || '').trim();
        const viewerHelpfulVote = Boolean(viewerEntry && viewerEntry.value !== 'not_helpful');
        const helpfulCount = helpfulVotes.filter((entry) => entry?.value === 'helpful').length;
        const notHelpfulCount = helpfulVotes.filter((entry) => entry?.value === 'not_helpful').length;
        return {
            ...question,
            helpfulVotes,
            helpfulCount,
            notHelpfulCount,
            viewerVote,
            viewerHelpfulVote
        };
    }

    function getStudentServiceQuestionHelpfulCount(question = {}) {
        if (Array.isArray(question.helpfulVotes)) {
            return question.helpfulVotes.filter((entry) => entry?.value === 'helpful').length;
        }
        const fromCount = Number(question.helpfulCount);
        if (Number.isFinite(fromCount) && question.helpfulCount != null && question.helpfulCount !== '') {
            return fromCount;
        }
        return 0;
    }

    function patchStudentServiceQuestionThreadPreviewMetrics(questionId, question = {}) {
        const modalBody = getStudentServiceQuestionThreadModalBody();
        if (!modalBody) return false;
        const normalizedId = String(questionId || question.id || '').trim();
        if (!normalizedId) return false;
        const metrics = modalBody.querySelector('.lux-glass-dialog-comment-preview .lux-glass-dialog-comment-post-metrics');
        if (!metrics) return false;
        const helpfulMetric = metrics.querySelector('.social-neo-post-metric');
        if (!helpfulMetric) return false;
        const helpful = getStudentServiceQuestionHelpfulCount(question);
        helpfulMetric.textContent = `Helpful (${helpful})`;
        return true;
    }

    function resolveStudentServiceActorUserId(passedUserId = '') {
        const fromArg = String(passedUserId || '').trim();
        if (fromArg) return fromArg;
        const currentUser = typeof getStudentServiceCurrentUser === 'function'
            ? getStudentServiceCurrentUser()
            : window.getStudentServiceCurrentUser?.();
        return String(currentUser?.id || '').trim();
    }

    function buildStudentServiceQuestionHelpfulToggleSnapshot(question, actorUserId, wasHelpful) {
        const userId = resolveStudentServiceActorUserId(actorUserId);
        if (!userId) return null;
        const helpfulVotes = (question.helpfulVotes || [])
            .filter((entry) => String(entry?.userId || '') !== userId);
        if (!wasHelpful) {
            helpfulVotes.push({ userId, value: 'helpful', updatedAt: ssNowIso() });
        }
        const helpfulCount = helpfulVotes.filter((entry) => entry?.value === 'helpful').length;
        const notHelpfulCount = helpfulVotes.filter((entry) => entry?.value === 'not_helpful').length;
        return {
            ...question,
            helpfulVotes,
            helpfulCount,
            notHelpfulCount,
            viewerVote: wasHelpful ? '' : 'helpful',
            viewerHelpfulVote: !wasHelpful,
            updatedAt: ssNowIso()
        };
    }

    function buildStudentServiceAnswerHelpfulToggleSnapshot(answer, actorUserId, wasHelpful) {
        const userId = resolveStudentServiceActorUserId(actorUserId);
        if (!userId) return null;
        const helpfulVotes = (answer.helpfulVotes || [])
            .filter((entry) => String(entry?.userId || '') !== userId);
        if (!wasHelpful) {
            helpfulVotes.push({ userId, updatedAt: ssNowIso() });
        }
        return {
            ...answer,
            helpfulVotes,
            helpfulCount: helpfulVotes.length,
            viewerHelpfulVote: !wasHelpful,
            updatedAt: ssNowIso()
        };
    }

    function renderStudentServiceQuestionHelpfulButtonMarkup(question, skipLuxButton = 'data-lux-skip-modern-button="true"') {
        const helpful = getStudentServiceQuestionHelpfulCount(question);
        const viewerHelpfulVote = isStudentServiceQuestionHelpfulVoted(question);
        return `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--feedback student-service-qa-question-helpful-btn${viewerHelpfulVote ? ' is-active lux-primary-btn' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-feedback="helpful" aria-pressed="${viewerHelpfulVote ? 'true' : 'false'}"><i class="${viewerHelpfulVote ? 'fas' : 'far'} fa-thumbs-up" aria-hidden="true"></i><span class="student-service-qa-question-helpful-label">Helpful${helpful ? ` (${helpful})` : ''}</span></button>`;
    }

    function updateStudentServiceQuestionHelpfulButton(button, question = {}) {
        if (!button) return;
        const helpful = getStudentServiceQuestionHelpfulCount(question);
        const viewerHelpfulVote = isStudentServiceQuestionHelpfulVoted(question);
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

    function triggerStudentServiceHelpfulAnimation(button, voted = true) {
        if (!button) return;
        button.classList.remove('is-voting', 'is-unvoting');
        void button.offsetWidth;
        button.classList.add(voted ? 'is-voting' : 'is-unvoting');
        window.setTimeout(() => button.classList.remove('is-voting', 'is-unvoting'), 520);
    }

    function patchStudentServiceQuestionHelpfulUi(questionId, options = {}) {
        const question = options.question || getStudentServiceQuestionById(questionId);
        if (!question) return false;
        patchStudentServiceQuestionCardStats(questionId, question);
        patchStudentServiceQuestionThreadPreviewMetrics(questionId, question);
        const buttons = new Set();
        if (options.triggerButton) buttons.add(options.triggerButton);
        const card = getStudentServiceQuestionCardElement(questionId);
        const modalBody = getStudentServiceQuestionThreadModalBody();
        modalBody?.querySelectorAll('[data-student-service-question-feedback="helpful"]').forEach((btn) => buttons.add(btn));
        card?.querySelectorAll('[data-student-service-question-feedback="helpful"]').forEach((btn) => buttons.add(btn));
        if (!buttons.size) return Boolean(card || modalBody);
        buttons.forEach((btn) => updateStudentServiceQuestionHelpfulButton(btn, question));
        if (options.animate && options.triggerButton) {
            triggerStudentServiceHelpfulAnimation(options.triggerButton);
        }
        return true;
    }

    function isStudentServiceAnswerHelpfulVoted(answer = {}, actorUserId = '') {
        const actorId = resolveStudentServiceActorUserId(actorUserId);
        if (!actorId) return false;
        return (answer.helpfulVotes || []).some(
            (entry) => String(entry?.userId || '') === actorId
        );
    }

    function renderStudentServiceAnswerHelpfulButtonMarkup(question, answer, skipLuxButton = 'data-lux-skip-modern-button="true"') {
        const helpfulCount = Number(answer.helpfulCount || 0);
        const viewerHelpfulVote = isStudentServiceAnswerHelpfulVoted(answer);
        return `<button type="button" class="lux-secondary-btn lux-secondary-btn-sm student-service-qa-answer-helpful-btn${viewerHelpfulVote ? ' is-active lux-primary-btn' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-answer-id="${ssEscape(answer.id)}" data-student-service-answer-helpful="true" aria-pressed="${viewerHelpfulVote ? 'true' : 'false'}"><i class="${viewerHelpfulVote ? 'fas' : 'far'} fa-thumbs-up" aria-hidden="true"></i> <span class="student-service-qa-answer-helpful-label">Helpful${helpfulCount ? ` (${helpfulCount})` : ''}</span></button>`;
    }

    function updateStudentServiceAnswerHelpfulButton(button, answer = {}) {
        if (!button) return;
        const helpfulCount = Number(answer.helpfulCount || 0);
        const viewerHelpfulVote = isStudentServiceAnswerHelpfulVoted(answer);
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

    function patchStudentServiceAnswerHelpfulBtn(questionId, answerId, options = {}) {
        const question = getStudentServiceQuestionById(questionId);
        const answer = options.answer || findStudentServiceAnswerRecord(question, answerId);
        if (!answer) return false;
        const normalizedAnswerId = String(answerId || '').trim();
        const escaped = normalizedAnswerId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const selector = `article.social-neo-comment[data-student-service-answer-id="${escaped}"]`;
        const buttons = new Set();
        if (options.triggerButton) buttons.add(options.triggerButton);
        document.querySelectorAll(selector).forEach((article) => {
            const btn = article.querySelector('[data-student-service-answer-helpful]');
            if (btn) buttons.add(btn);
        });
        if (!buttons.size) return false;
        buttons.forEach((btn) => updateStudentServiceAnswerHelpfulButton(btn, answer));
        if (options.animate && options.triggerButton) {
            triggerStudentServiceHelpfulAnimation(options.triggerButton);
        }
        return true;
    }

    function removeStudentServiceAnswerBranch(questionId, answerId) {
        const question = getStudentServiceQuestionById(questionId);
        const normalizedAnswerId = String(answerId || '').trim();
        if (!question || !normalizedAnswerId) return false;
        const removeIds = collectStudentServiceAnswerBranchIds(questionId, normalizedAnswerId, question.answers);
        removeStudentServiceAnswersFromSnapshot(questionId, removeIds);
        let changed = false;
        removeIds.forEach(id => {
            const article = studentServiceAnswerArticleEl(id);
            if (!article) return;
            article.remove();
            changed = true;
        });
        if (!changed) return false;
        const host = getStudentServiceQuestionThreadHost(questionId);
        const list = host?.querySelector('.student-service-qa-thread-comments .social-neo-comment-list');
        if (list && !list.querySelector('[data-student-service-answer-id]')) {
            list.innerHTML = '<div class="student-service-empty-state student-service-qa-empty-note lux-soft-chrome">No comments yet. Be the first to reply.</div>';
        }
        const thread = host?.querySelector('.student-service-qa-thread-comments');
        scheduleStudentServiceThreadRelayout(thread);
        return true;
    }

    function applyStudentServiceQuestionMutation(questionId, options = {}) {
        const normalizedQuestionId = String(questionId || '').trim();
        if (!normalizedQuestionId) return false;
        const {
            parentAnswerId = '',
            removedAnswerId = '',
            scrollPreserve = true
        } = options;
        const mutate = () => {
            if (removedAnswerId) {
                if (!removeStudentServiceAnswerBranch(normalizedQuestionId, removedAnswerId)
                    && !patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                    return false;
                }
            } else if (parentAnswerId) {
                if (!appendStudentServiceReplyNode(normalizedQuestionId, parentAnswerId)
                    && !patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                    return false;
                }
            } else if (!appendStudentServiceTopLevelAnswerNode(normalizedQuestionId)
                && !patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                return false;
            }
            patchStudentServiceQuestionCardStats(normalizedQuestionId);
            syncStudentServiceRenderSignature();
            return true;
        };
        if (scrollPreserve) return runStudentServiceScrollPreserved(mutate);
        return mutate();
    }

    function patchStudentServiceOpenQuestionThread(questionId) {
        const question = getStudentServiceQuestionById(questionId);
        const body = getStudentServiceQuestionThreadModalBody();
        if (!question || !body) return false;
        const mode = getStudentServiceQuestionThreadMode();
        const range = document.createRange();
        body.replaceChildren(range.createContextualFragment(renderStudentServiceQuestionDetail(question, { mode, inThreadModal: true })));
        const compose = document.querySelector('[data-student-service-question-thread-modal-compose="1"]');
        if (compose) {
            compose.replaceChildren(range.createContextualFragment(renderStudentServiceQuestionThreadCompose(question, { mode })));
        }
        const thread = body.querySelector('.student-service-qa-thread-comments');
        bindStudentServiceThreadResizeObserver(thread);
        scheduleStudentServiceThreadRelayout(thread);
        patchStudentServiceQuestionHelpfulUi(questionId, { question });
        (question.answers || []).forEach((answer) => {
            const answerId = String(answer?.id || '').trim();
            if (!answerId) return;
            patchStudentServiceAnswerHelpfulBtn(questionId, answerId, { answer });
        });
        return true;
    }

    function setStudentServiceQuestionFilter(field, value) {
        if (field !== 'qaSearch') return;
        const ui = ensureStudentServiceUiState();
        const nextValue = String(value ?? '');
        if (ui.serviceLane === 'qa' && ui.qaSearch === nextValue) return;
        ui.serviceLane = 'qa';
        ui.qaSearch = nextValue;
        renderStudentServicePage();
    }

    function setStudentServiceQuestionComposerExpanded(expanded) {
        if (expanded) {
            openStudentServiceQuestionComposerModal();
            return;
        }
        closeStudentServiceQuestionComposerModal();
    }

    function syncStudentServiceDraftQuestionFromDom(root = document.getElementById('student-service-modal-root')) {
        if (!root) return;
        root.querySelectorAll('[data-student-service-draft-question-field]').forEach((node) => {
            const field = node.dataset.studentServiceDraftQuestionField || '';
            if (!field) return;
            const value = node.type === 'checkbox' ? node.checked : node.value;
            setStudentServiceDraftQuestionField(field, value);
        });
    }

    function setStudentServiceDraftQuestionField(field, value) {
        const ui = ensureStudentServiceUiState();
        ui.serviceLane = 'qa';
        if (!ui.draftQuestion || typeof ui.draftQuestion !== 'object') {
            ui.draftQuestion = buildStudentServiceDefaultDraftQuestion();
        }
        if (field === 'anonymousMode') {
            ui.draftQuestion.anonymousMode = Boolean(value);
            ui.draftQuestion.displayIdentityToPeers = !ui.draftQuestion.anonymousMode;
        } else if (field === 'displayIdentityToPeers') {
            ui.draftQuestion.displayIdentityToPeers = Boolean(value);
            if (ui.draftQuestion.displayIdentityToPeers) ui.draftQuestion.anonymousMode = false;
        } else {
            ui.draftQuestion[field] = String(value ?? '');
        }
        if (field === 'facultyCode') {
            ui.draftQuestion.facultyCode = normalizeFacultyCode(ui.draftQuestion.facultyCode || '', '');
        }
    }

    function openStudentServiceQuestion(questionId) {
        const ui = ensureStudentServiceUiState();
        const normalizedId = String(questionId || '').trim();
        const nextQuestionId = ui.selectedQuestionId === normalizedId ? '' : normalizedId;
        if (ui.serviceLane === 'qa' && ui.selectedQuestionId === nextQuestionId) return;
        closeStudentServiceInlineReply();
        ui.serviceLane = 'qa';
        runStudentServiceScrollPreserved(() => setStudentServiceOpenQuestionId(nextQuestionId));
    }

    function getStudentServiceQuestionStatusLabel(question) {
        if (!question) return 'Published';
        if (question.status === 'published') return 'Published';
        if (question.status === 'archived') return 'Archived';
        if (question.status === 'merged') return 'Merged';
        return String(question.status || 'Published');
    }

    function getStudentServiceQuestionStatusClass(question) {
        const status = String(question?.status || '').toLowerCase();
        if (status === 'published') return 'is-positive';
        if (status === 'archived' || status === 'merged') return 'is-neutral';
        return 'is-neutral';
    }

    function getStudentServiceQuestionAnswerCount(question) {
        return (question?.answers || []).filter(answer => answer.status !== 'archived').length;
    }

    function renderStudentServiceQuestionList(questions = [], options = {}) {
        return renderStudentServiceQuestionFeed(questions, options);
    }

    function renderStudentServiceQuestionComposer(currentUser) {
        const authorName = currentUser?.displayName || currentUser?.name || currentUser?.fullName || 'Student';
        return `
            <section class="student-service-zone student-service-qa-composer-card home-hover-chip">
                <div class="student-service-qa-composer-collapsed">
                    <div class="student-service-qa-avatar">${ssEscape(ssInitials(authorName, '?'))}</div>
                    <button type="button" class="student-service-qa-composer-prompt" data-student-service-question-composer-toggle="open">
                        <strong class="student-service-qa-composer-prompt-title">Ask a question that could help other students</strong>
                        <span class="student-service-qa-composer-prompt-copy">Public answers reduce repeated messages to staff. Open the composer when you are ready to post.</span>
                    </button>
                    <button type="button" class="lux-primary-btn student-service-qa-composer-open-btn" data-student-service-question-composer-toggle="open"><i class="fas fa-pen"></i> Ask</button>
                </div>
            </section>
        `;
    }

    function renderStudentServiceQuestionComposerFormMarkup(currentUser) {
        const ui = ensureStudentServiceUiState();
        const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
        return `
            <div class="student-service-request-form student-service-qa-compose-form">
                <div class="student-service-qa-mode-row student-service-qa-mode-switch">
                    <button type="button" class="student-service-qa-mode-btn ${draftQuestion.askMode === 'public' ? 'lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-draft-question-mode="public"><i class="fas fa-globe"></i> Public</button>
                    <button type="button" class="student-service-qa-mode-btn ${draftQuestion.askMode === 'private' ? 'lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-draft-question-mode="private"><i class="fas fa-lock"></i> Private</button>
                </div>
                <input id="student-service-question-title" class="lux-control" type="text" value="${ssEscape(draftQuestion.title || '')}" data-student-service-draft-question-field="title" placeholder="Question title">
                <textarea id="student-service-question-body" class="lux-control" rows="5" data-student-service-draft-question-field="body" placeholder="Explain the question clearly so the answer can be reused by other students.">${ssEscape(draftQuestion.body || '')}</textarea>
                <div class="student-service-staff-filter-row student-service-qa-field-row">
                    <select id="student-service-question-category" class="lux-control" data-student-service-draft-question-field="category">
                        ${STUDENT_SERVICE_CATEGORIES.map(category => `<option value="${ssEscape(category)}"${draftQuestion.category === category ? ' selected' : ''}>${ssEscape(category)}</option>`).join('')}
                    </select>
                    <select id="student-service-question-faculty" class="lux-control" data-student-service-draft-question-field="facultyCode">
                        <option value="${ssEscape(normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') || '')}"${normalizeFacultyCode(draftQuestion.facultyCode || '', '') === normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') ? ' selected' : ''}>${ssEscape(ssFacultyLabel(currentUser?.facultyCode || currentUser?.faculty || ''))}</option>
                        <option value="ALL"${draftQuestion.facultyCode === 'ALL' ? ' selected' : ''}>All faculties</option>
                    </select>
                </div>
                <label class="student-service-pill student-service-pill-toggle student-service-qa-anonymous-toggle home-hover-chip">
                    <input id="student-service-question-anonymous" type="checkbox" ${draftQuestion.anonymousMode !== false ? 'checked' : ''} data-student-service-draft-question-field="anonymousMode">
                    Post anonymously to other students
                </label>
                <div class="lux-panel-copy student-service-qa-helper-copy">
                    Student Service and authorized responders can still see the real author for moderation and follow-up.
                    ${draftQuestion.askMode === 'private' ? ' Private mode will create a direct Student Service ticket instead of a public post.' : ''}
                </div>
                ${renderStudentServiceAttachmentPickerMarkup('qa-question')}
            </div>
        `;
    }

    function renderStudentServiceQuestionComposerModalActionsMarkup() {
        const ui = ensureStudentServiceUiState();
        const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
        return `
            <div class="student-service-qa-composer-modal-actions">
                <button type="button" class="lux-secondary-btn" data-student-service-cancel-composer-modal="true"><i class="fas fa-times"></i> Cancel</button>
                <button class="lux-primary-btn" type="button" data-student-service-submit-question="true"><i class="fas fa-paper-plane"></i> ${draftQuestion.askMode === 'private' ? 'Create private ticket' : 'Post question'}</button>
            </div>
        `;
    }

    function renderStudentServiceQuestionComposerModalShell(currentUser) {
        const ui = ensureStudentServiceUiState();
        const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
        const prompt = draftQuestion.askMode === 'private'
            ? 'Ask privately when the case includes personal or sensitive details.'
            : 'Ask a question that could help other students too.';
        return `
            <div class="student-service-qa-composer-modal-backdrop" data-student-service-dismiss-composer-modal="true">
                <div class="student-service-qa-composer-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-question-composer-modal-title" data-student-service-question-composer-modal="true">
                    <div class="student-service-qa-composer-modal-accent" aria-hidden="true"></div>
                    <div class="student-service-qa-composer-modal-head">
                        <div class="student-service-qa-composer-modal-heading">
                            <span class="student-service-qa-composer-modal-icon-chip home-hover-chip lux-soft-chrome"><i class="fas fa-pen" aria-hidden="true"></i></span>
                            <div class="student-service-qa-composer-modal-title">
                                <div class="student-service-kicker">Ask question</div>
                                <strong id="student-service-question-composer-modal-title" class="lux-page-title">Post in the Q&A feed</strong>
                                <span class="lux-panel-copy">${ssEscape(prompt)}</span>
                            </div>
                        </div>
                        <button type="button" class="lux-secondary-btn student-service-qa-composer-modal-close" data-lux-skip-modern-button="true" data-student-service-cancel-composer-modal="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </div>
                    <div class="student-service-qa-composer-modal-body">
                        ${renderStudentServiceQuestionComposerFormMarkup(currentUser)}
                    </div>
                    ${renderStudentServiceQuestionComposerModalActionsMarkup()}
                </div>
            </div>
        `;
    }

    function renderStudentServiceQuestionCardPreviewMarkup(question = {}) {
        const previewText = ssClampText(question.body, 100);
        if (previewText) return ssEscape(previewText);
        const attachmentCount = normalizeStudentServiceAttachments(question.attachments).length;
        if (!attachmentCount) return '';
        const label = `${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`;
        return `<span class="student-service-qa-card-attachment-hint"><i class="fas fa-paperclip"></i> ${ssEscape(label)}</span>`;
    }

    function renderStudentServiceQuestionFeed(questions = [], options = {}) {
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        if (!Array.isArray(questions) || !questions.length) return '';
        return `
            <div class="student-service-qa-feed">
                ${(questions || []).map(question => {
                    const authorLabel = getStudentServiceQuestionAuthorLabel(question);
                    const answerCount = getStudentServiceQuestionAnswerCount(question);
                    const resolution = getStudentServiceQuestionResolutionLabel(question);
                    const ownerPill = renderStudentServiceOwnerResolutionPillMarkup(question);
                    return `
                        <article class="student-service-qa-card home-hover-chip">
                            <div class="student-service-qa-card-head">
                                <div class="student-service-qa-card-author">
                                    <div class="student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(authorLabel, '?'))}</div>
                                    <div class="student-service-qa-card-author-copy">
                                        <strong class="student-service-qa-card-author-name">${ssEscape(mode === 'staff' ? `Asked by ${authorLabel}` : authorLabel)}</strong>
                                        <span class="student-service-qa-card-author-date">${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                                    </div>
                                </div>
                                <span class="student-service-status ${ssEscape(getStudentServiceQuestionStatusClass(question))}">${ssEscape(getStudentServiceQuestionStatusLabel(question))}</span>
                            </div>
                            <button type="button" class="student-service-qa-card-main" data-lux-skip-modern-button="true" data-student-service-open-question="${ssEscape(question.id)}">
                                <div class="student-service-qa-chip-row">
                                    <span class="student-service-pill home-hover-chip">${ssEscape(question.category)}</span>
                                    <span class="student-service-pill home-hover-chip">${ssEscape(question.facultyCode ? ssFacultyLabel(question.facultyCode) : 'All faculties')}</span>
                                    ${question.anonymousMode !== false ? '<span class="student-service-pill home-hover-chip">Anonymous</span>' : ''}
                                    ${question.pinned ? '<span class="student-service-pill home-hover-chip">Pinned</span>' : ''}
                                    ${question.featured ? '<span class="student-service-pill home-hover-chip">Featured</span>' : ''}
                                    ${ownerPill}
                                </div>
                                <div class="student-service-qa-card-title">${ssEscape(question.title)}</div>
                                <div class="student-service-qa-card-preview">${renderStudentServiceQuestionCardPreviewMarkup(question)}</div>
                            </button>
                            <div class="student-service-qa-card-footer">
                                <div class="student-service-qa-card-stats">
                                    <span class="student-service-qa-card-stat"><i class="fas fa-comments"></i> ${answerCount} answer${answerCount === 1 ? '' : 's'}</span>
                                    <span class="student-service-qa-card-stat"><i class="far fa-thumbs-up"></i> ${Number(question.helpfulCount || 0)} helpful</span>
                                    <span class="student-service-qa-card-stat"><i class="fas ${resolution.icon}"></i> ${ssEscape(resolution.label)}</span>
                                </div>
                                <button type="button" class="student-service-mini-action student-service-qa-card-toggle-btn" data-lux-skip-modern-button="true" data-student-service-open-question="${ssEscape(question.id)}"><i class="fas fa-chevron-down"></i> Open thread</button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderStudentServiceCommentReplyShell(question, answer, skipLuxButton) {
        const replyName = answer.responderName || answer.authorDisplayName || 'comment';
        return `
            <div class="social-neo-comment-reply-form student-service-qa-comment-reply-shell lux-soft-chrome home-hover-chip" data-student-service-reply-answer-id="${ssEscape(answer.id)}">
                <input type="hidden" class="student-service-qa-parent-answer-id" value="${ssEscape(answer.id)}" data-student-service-parent-answer="${ssEscape(answer.id)}">
                <span class="student-service-qa-reply-context social-neo-muted">Replying to @${ssEscape(replyName)}</span>
                <textarea class="student-service-qa-reply-input student-service-qa-inline-reply-input social-neo-input lux-control" rows="2" data-student-service-reply-input="${ssEscape(question.id)}" data-student-service-parent-answer="${ssEscape(answer.id)}" placeholder="Reply to @${ssEscape(replyName)}..."></textarea>
                ${renderStudentServiceAttachmentPickerMarkup(getStudentServiceAnswerComposerId(question.id, answer.id))}
                <div class="social-neo-comment-reply-form-actions student-service-qa-comment-reply-actions">
                    <button type="button" class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn student-service-qa-reply-cancel-btn" ${skipLuxButton} data-student-service-cancel-reply="true">Cancel</button>
                    <button class="lux-secondary-btn lux-secondary-btn-sm lux-primary-btn student-service-qa-reply-submit-btn" type="button" ${skipLuxButton} data-student-service-submit-answer="${ssEscape(question.id)}" data-student-service-parent-answer="${ssEscape(answer.id)}">Post reply</button>
                </div>
            </div>
        `;
    }

    function openStudentServiceDeleteQuestionConfirm(questionId) {
        closeStudentServiceQuestionComposerModal();
        closeStudentServiceDeleteConfirm();
        closeStudentServiceInlineReply();
        const question = getStudentServiceQuestionById(questionId);
        if (!question || !canCurrentUserDeleteStudentServiceQuestion(question)) return;
        mountStudentServiceDeleteConfirmShell(renderStudentServiceDeleteConfirmShell({
            mode: 'question',
            question,
            skipLuxButton: 'data-lux-skip-modern-button="true"'
        }));
    }

    function isStudentServiceQuestionComposerModalOpen() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;
        return Boolean(modalRoot.querySelector('[data-student-service-question-composer-modal="true"]'));
    }

    function mountStudentServiceQuestionComposerModal() {
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return;
        const currentUser = getStudentServiceCurrentUser();
        modalRoot.innerHTML = renderStudentServiceQuestionComposerModalShell(currentUser);
        modalRoot.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        const titleInput = modalRoot.querySelector('#student-service-question-title');
        titleInput?.focus?.();
    }

    function openStudentServiceQuestionComposerModal() {
        const role = getEffectiveUserRole();
        if (role !== USER_ROLES.STUDENT) return;
        closeStudentServiceQuestionThreadModal();
        closeStudentServiceDeleteConfirm({ restoreThread: false });
        const ui = ensureStudentServiceUiState();
        ui.serviceLane = 'qa';
        mountStudentServiceQuestionComposerModal();
    }

    function closeStudentServiceQuestionComposerModal() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || !isStudentServiceQuestionComposerModalOpen()) return;
        modalRoot.innerHTML = '';
        modalRoot.setAttribute('hidden', '');
        if (studentServiceShouldRestoreBodyScroll()) {
            document.body.style.overflow = '';
        }
    }

    function remountStudentServiceQuestionComposerModal() {
        if (!isStudentServiceQuestionComposerModalOpen()) return;
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return;
        const activeElement = document.activeElement;
        const field = activeElement?.dataset?.studentServiceDraftQuestionField || '';
        const selectionStart = activeElement?.selectionStart;
        const selectionEnd = activeElement?.selectionEnd;
        modalRoot.innerHTML = renderStudentServiceQuestionComposerModalShell(getStudentServiceCurrentUser());
        modalRoot.removeAttribute('hidden');
        if (field) {
            const next = modalRoot.querySelector(`[data-student-service-draft-question-field="${field}"]`);
            next?.focus?.();
            if (next && typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
                try {
                    next.setSelectionRange(selectionStart, selectionEnd);
                } catch (_) {
                    /* ignore selection restore errors */
                }
            }
        }
    }

    function renderStudentServiceAnswerCardMarkup(question, answer, options = {}) {
        const {
            canRespond = false,
            canDelete = false,
            isReply = false,
            replyCount = 0,
            threadChildrenHtml = '',
            dialogBubble = false,
            skipLuxButton = 'data-lux-skip-modern-button="true"'
        } = options;
        const depthClass = isReply ? ' is-reply social-neo-comment-depth-1' : '';
        const hasChildrenClass = threadChildrenHtml ? ' has-children' : '';
        const dialogBubbleClass = dialogBubble ? ' sns-comment-dialog-bubble' : '';
        const shellClass = dialogBubble ? '' : ' student-service-qa-answer-card home-hover-chip';
        const rowClass = dialogBubble ? 'social-neo-comment-row' : 'social-neo-comment-row student-service-qa-answer-head';
        const responderName = answer.responderName || 'Responder';
        return `
            <article class="social-neo-comment${shellClass}${depthClass}${hasChildrenClass}" data-student-service-answer-id="${ssEscape(answer.id)}">
                <div class="${rowClass}">
                    <span class="social-neo-avatar social-neo-avatar-sm is-fallback student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(responderName, 'R'))}</span>
                    <div class="social-neo-comment-body">
                        <div class="social-neo-comment-bubble lux-soft-chrome home-hover-chip${dialogBubbleClass}" data-lux-transparency-exempt="1">
                            <div class="social-neo-comment-head student-service-qa-answer-author">
                                <strong class="student-service-qa-answer-author-name">${ssEscape(responderName)}</strong>
                                <span class="student-service-qa-answer-author-role">${ssEscape(ssRoleLabel(answer.responderRole))}</span>
                                ${isReply && answer.replyToName ? `<span class="student-service-pill home-hover-chip">@${ssEscape(answer.replyToName)}</span>` : ''}
                                <span class="student-service-qa-answer-time">${ssEscape(ssFormatDateTime(answer.updatedAt || answer.createdAt))}</span>
                            </div>
                            <p class="student-service-qa-answer-copy">${ssTextBlock(answer.body)}</p>
                            ${renderStudentServiceAttachmentGalleryMarkup(answer.attachments)}
                        </div>
                        <div class="social-neo-comment-actions student-service-qa-answer-actions">
                            ${answer.status === 'published' ? renderStudentServiceAnswerHelpfulButtonMarkup(question, answer, skipLuxButton) : ''}
                            ${(canRespond && !isReply) ? `
                                <button type="button" class="lux-secondary-btn lux-secondary-btn-sm student-service-qa-answer-reply-btn" ${skipLuxButton} data-student-service-reply-to-answer="${ssEscape(answer.id)}" data-student-service-question-id="${ssEscape(question.id)}"><i class="fas fa-reply"></i> <span class="social-neo-comment-reply-label">Reply${replyCount ? ` (${replyCount})` : ''}</span></button>
                            ` : ''}
                            ${canDelete ? `
                                <button type="button" class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn student-service-qa-answer-delete-btn" ${skipLuxButton} data-student-service-delete-answer="${ssEscape(answer.id)}" data-student-service-question-id="${ssEscape(question.id)}" aria-label="Delete comment"><i class="fas fa-trash"></i></button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${threadChildrenHtml}
            </article>
        `;
    }

    function renderStudentServiceAnswerThreadNode(question, threadEntry, cardOptions) {
        const { answer, replies = [] } = threadEntry;
        const childrenMarkup = replies.length
            ? `<div class="social-neo-comment-children">${replies.map(reply => renderStudentServiceAnswerCardMarkup(question, reply, { ...cardOptions, isReply: true })).join('')}</div>`
            : '';
        return renderStudentServiceAnswerCardMarkup(question, answer, {
            ...cardOptions,
            isReply: false,
            replyCount: replies.length,
            threadChildrenHtml: childrenMarkup
        });
    }

    function renderStudentServiceQuestionDetailActionsMarkup(question, options = {}) {
        const inThreadModal = options.inThreadModal === true;
        const skipLuxButton = options.skipLuxButton || 'data-lux-skip-modern-button="true"';
        const canModerate = canCurrentUserModerateStudentService();
        const canDeleteQuestion = canCurrentUserDeleteStudentServiceQuestion(question);
        const helpful = getStudentServiceQuestionHelpfulCount(question);
        const btnSize = inThreadModal ? 'lux-secondary-btn lux-secondary-btn-sm' : 'lux-secondary-btn';
        const deleteBtn = canDeleteQuestion
            ? `<button type="button" class="${btnSize} student-service-qa-detail-action-btn student-service-qa-detail-action-btn--danger" ${skipLuxButton} data-student-service-delete-question="true" data-student-service-question-id="${ssEscape(question.id)}"><i class="fas fa-trash" aria-hidden="true"></i> Delete question</button>`
            : '';
        const pinBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--flag" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="pinned" data-student-service-question-flag-value="${question.pinned ? 'false' : 'true'}"><i class="fas fa-thumbtack"></i> ${question.pinned ? 'Unpin' : 'Pin'}</button>`
            : '';
        const featureBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--flag" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="featured" data-student-service-question-flag-value="${question.featured ? 'false' : 'true'}"><i class="fas fa-star"></i> ${question.featured ? 'Unfeature' : 'Feature'}</button>`
            : '';
        const staleBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--moderation" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="staleReviewRequested" data-student-service-question-flag-value="${question.staleReviewRequested ? 'false' : 'true'}"><i class="fas fa-clock"></i> ${question.staleReviewRequested ? 'Clear stale flag' : 'Flag stale review'}</button>`
            : '';
        const convertTicketBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--moderation" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-convert="ticket"><i class="fas fa-lock"></i> Convert to private ticket</button>`
            : '';
        const convertArticleBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--moderation" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-convert="article"><i class="fas fa-book-open"></i> Convert to article</button>`
            : '';
        const mergeBtn = canModerate
            ? `<button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--moderation" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-merge="true"><i class="fas fa-code-branch"></i> Merge duplicate</button>`
            : '';
        const helpfulAndOwner = `
            ${renderStudentServiceQuestionHelpfulButtonMarkup({ ...question, helpfulCount: helpful }, skipLuxButton)}
            ${renderStudentServiceOwnerResolutionButtonMarkup(question, skipLuxButton)}
        `;

        if (!inThreadModal) {
            return `
                <div class="student-service-action-row student-service-qa-detail-actions">
                    ${helpfulAndOwner}
                    ${deleteBtn}
                    ${pinBtn}
                    ${featureBtn}
                </div>
                ${canModerate ? `
                    <div class="student-service-action-row student-service-qa-detail-actions student-service-qa-detail-actions--moderation">
                        ${staleBtn}
                        ${convertTicketBtn}
                        ${convertArticleBtn}
                        ${mergeBtn}
                    </div>
                ` : ''}
            `;
        }

        return `
            <div class="student-service-action-row student-service-qa-detail-actions student-service-qa-detail-actions--modal">
                ${helpfulAndOwner}
                ${!canModerate && canDeleteQuestion ? deleteBtn : ''}
            </div>
        `;
    }

    function renderStudentServiceQuestionThreadPreviewMarkup(question) {
        if (!question) return '';
        const authorLabel = getStudentServiceQuestionAuthorLabel(question);
        const answerCount = getStudentServiceQuestionAnswerCount(question);
        const helpful = getStudentServiceQuestionHelpfulCount(question);
        return `
            <div class="lux-glass-dialog-comment-preview lux-soft-chrome home-hover-chip">
                <div class="lux-glass-dialog-comment-post-head">
                    <div class="social-neo-person social-neo-person-start-gap-10">
                        <span class="social-neo-avatar social-neo-avatar-sm is-fallback student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(authorLabel, 'A'))}</span>
                        <div>
                            <strong>${ssEscape(authorLabel)}</strong>
                            <span class="social-neo-muted">${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                        </div>
                    </div>
                    <span class="social-neo-pill home-hover-chip social-neo-post-scope-badge">Q&amp;A</span>
                </div>
                <div class="lux-glass-dialog-comment-post-body">${ssTextBlock(question.body)}</div>
                ${renderStudentServiceAttachmentGalleryMarkup(question.attachments)}
                ${question.relatedQuestionIds?.length ? `<div class="student-service-ticket-detail-copy student-service-qa-related-copy">Related questions: ${ssEscape(question.relatedQuestionIds.join(', '))}</div>` : ''}
                <div class="lux-glass-dialog-comment-post-metrics">
                    <span class="social-neo-post-metric">Helpful (${helpful})</span>
                    <span class="social-neo-post-metric">${answerCount} comment${answerCount === 1 ? '' : 's'}</span>
                </div>
            </div>
        `;
    }

    function renderStudentServiceQuestionThreadCompose(question, options = {}) {
        if (!question) return '';
        const currentUser = getStudentServiceCurrentUser();
        const canRespond = canCurrentUserRespondToStudentService(question);
        const skipLuxButton = 'data-lux-skip-modern-button="true"';
        return `
            <section class="student-service-qa-thread-compose">
                ${canRespond ? `
                    <div class="lux-glass-dialog-comment-compose sns-comment-compose social-neo-comment-compose student-service-qa-thread-reply student-service-qa-reply-shell lux-soft-chrome home-hover-chip">
                        <span class="social-neo-avatar social-neo-avatar-sm is-fallback student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(currentUser?.displayName || currentUser?.name || 'User', 'U'))}</span>
                        <div class="lux-glass-dialog-comment-compose-main social-neo-comment-compose-main">
                            <div class="social-neo-inline social-neo-comment-compose-row">
                                <textarea class="student-service-qa-reply-input social-neo-input lux-control" rows="1" data-student-service-reply-input="${ssEscape(question.id)}" placeholder="Write a comment..."></textarea>
                                <button class="lux-primary-btn student-service-qa-reply-submit-btn" type="button" ${skipLuxButton} data-student-service-submit-answer="${ssEscape(question.id)}"><i class="fas fa-comment"></i> Comment</button>
                            </div>
                            ${renderStudentServiceAttachmentPickerMarkup(getStudentServiceAnswerComposerId(question.id))}
                        </div>
                    </div>
                ` : `
                    <div class="student-service-empty-state student-service-qa-reply-locked lux-soft-chrome">Sign in to join this thread.</div>
                `}
            </section>
        `;
    }

    function renderStudentServiceQuestionDetail(question, options = {}) {
        if (!question) {
            return '<div class="student-service-empty-state student-service-empty-state-large student-service-qa-empty-state">Select a public question to review the answers and moderation options.</div>';
        }
        const inThreadModal = options.inThreadModal === true;
        const currentUser = getStudentServiceCurrentUser();
        const canModerate = canCurrentUserModerateStudentService();
        const ui = ensureStudentServiceUiState();
        const canRespond = canCurrentUserRespondToStudentService(question);
        const authorLabel = getStudentServiceQuestionAuthorLabel(question);
        const allQuestionAnswers = question.answers || [];
        const visibleAnswers = allQuestionAnswers
            .filter(answer => canModerate || answer.status === 'published' || resolveStudentServiceAnswerAuthorId(answer) === String(currentUser?.id || ''));
        const threadedAnswers = includeStudentServiceThreadParents(visibleAnswers, allQuestionAnswers);
        const answerThread = buildStudentServiceAnswerThread(threadedAnswers);
        const cardOptions = {
            canRespond,
            canDelete: false,
            skipLuxButton: 'data-lux-skip-modern-button="true"',
            dialogBubble: inThreadModal
        };
        const answerCardOptions = (answer) => ({
            ...cardOptions,
            canDelete: canCurrentUserDeleteStudentServiceAnswer(question, answer)
        });
        const skipLuxButton = cardOptions.skipLuxButton;
        if (inThreadModal) {
            return `
            <div class="student-service-qa-detail student-service-qa-detail--modal${isStudentServiceInlineReplyOpen() ? ' is-inline-reply-open' : ''}">
                <div class="student-service-qa-inline-reply-banner lux-soft-chrome" aria-live="polite">
                    <i class="fas fa-reply"></i>
                    <span>Replying to a comment — use <strong>Post reply</strong> under that comment. Bottom Comment is hidden while replying.</span>
                </div>
                ${renderStudentServiceQuestionThreadPreviewMarkup(question)}
                ${renderStudentServiceQuestionDetailActionsMarkup(question, { inThreadModal, skipLuxButton })}
                <div class="lux-glass-dialog-comment-thread student-service-qa-thread-comments" data-student-service-thread-observed="1">
                    <div class="social-neo-comment-list student-service-qa-answer-list">
                        ${answerThread.length ? answerThread.map(entry => renderStudentServiceAnswerThreadNode(question, entry, answerCardOptions(entry.answer))).join('') : '<div class="student-service-empty-state student-service-qa-empty-note lux-soft-chrome">No comments yet. Be the first to reply.</div>'}
                    </div>
                </div>
            </div>
        `;
        }
        return `
            <div class="student-service-qa-detail${isStudentServiceInlineReplyOpen() ? ' is-inline-reply-open' : ''}">
                <div class="student-service-qa-inline-reply-banner lux-soft-chrome" aria-live="polite">
                    <i class="fas fa-reply"></i>
                    <span>Replying to a comment — use <strong>Post reply</strong> under that comment. Bottom Comment is hidden while replying.</span>
                </div>
                <section class="student-service-qa-thread-question">
                    <div class="student-service-ticket-detail-meta student-service-qa-detail-meta">
                        <span class="student-service-pill home-hover-chip">Asked by ${ssEscape(authorLabel)}</span>
                        <span class="student-service-pill home-hover-chip">Updated ${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                        ${question.lastReviewedAt ? `<span class="student-service-pill home-hover-chip">Reviewed ${ssEscape(ssFormatDate(question.lastReviewedAt))}</span>` : ''}
                        ${question.staleReviewRequested ? '<span class="student-service-pill home-hover-chip">Stale review requested</span>' : ''}
                        ${renderStudentServiceOwnerResolutionPillMarkup(question)}
                    </div>
                    <div class="student-service-qa-detail-body">${ssTextBlock(question.body)}</div>
                    ${renderStudentServiceAttachmentGalleryMarkup(question.attachments)}
                    ${question.relatedQuestionIds?.length ? `<div class="student-service-ticket-detail-copy student-service-qa-related-copy">Related questions: ${ssEscape(question.relatedQuestionIds.join(', '))}</div>` : ''}
                    ${renderStudentServiceQuestionDetailActionsMarkup(question, { inThreadModal: false, skipLuxButton })}
                </section>
                <section class="student-service-qa-thread-comments">
                    <div class="student-service-kicker student-service-qa-thread-kicker">Thread</div>
                    <div class="social-neo-comment-list student-service-qa-answer-list">
                        ${answerThread.length ? answerThread.map(entry => renderStudentServiceAnswerThreadNode(question, entry, answerCardOptions(entry.answer))).join('') : '<div class="student-service-empty-state student-service-qa-empty-note lux-soft-chrome">No comments yet. Be the first to reply.</div>'}
                    </div>
                </section>
                ${renderStudentServiceQuestionThreadCompose(question, options)}
            </div>
        `;
    }

    async function submitStudentServiceQuestion() {
        syncStudentServiceDraftQuestionFromDom();
        const currentUser = getStudentServiceCurrentUser();
        const role = getEffectiveUserRole();
        if (!currentUser || role !== USER_ROLES.STUDENT) {
            alert('Only students can post questions in the Q&A feed.');
            return;
        }
        const ui = ensureStudentServiceUiState();
        const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
        const title = String(draftQuestion.title || '').trim();
        const body = String(draftQuestion.body || '').trim();
        const attachments = await persistStudentServiceDraftAttachments('qa-question');
        if (!title || (!body && !attachments.length)) {
            alert('Write a title and message or attach at least one file before submitting your question.');
            return;
        }
        if (draftQuestion.askMode === 'private') {
            const area = getStudentServiceSupportAreaForCategory(draftQuestion.category);
            setStudentServiceDraftTicketField('title', title);
            setStudentServiceDraftTicketField('message', body);
            setStudentServiceDraftTicketField('serviceArea', area.id);
            setStudentServiceDraftTicketField('category', draftQuestion.category);
            ensureStudentServiceDraftAttachments(ui)['ticket-create'] = getStudentServiceDraftAttachments('qa-question').slice();
            await submitStudentServiceTicket();
            clearStudentServiceDraftAttachments('qa-question');
            return;
        }
        try {
            const area = getStudentServiceSupportAreaForCategory(draftQuestion.category);
            const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.questionsCreate(), {
                title,
                body,
                attachments,
                serviceArea: area.id,
                category: draftQuestion.category,
                facultyCode: draftQuestion.facultyCode || currentUser.facultyCode || currentUser.faculty || '',
                anonymousMode: draftQuestion.anonymousMode !== false,
                displayIdentityToPeers: Boolean(draftQuestion.displayIdentityToPeers)
            });
            if (payload?.convertedToTicket) {
                const ticket = payload.ticket || null;
                ui.serviceLane = 'service';
                ui.studentTab = 'my_tickets';
                ui.selectedTicketId = ticket?.id || '';
                closeStudentServiceQuestionComposerModal();
                alert('This question contains sensitive details, so it was converted into a private ticket.');
            } else {
                ui.serviceLane = 'qa';
                ui.selectedQuestionId = payload?.question?.id || ui.selectedQuestionId;
                closeStudentServiceQuestionComposerModal();
                alert('Your question was posted.');
            }
            ui.draftQuestion = buildStudentServiceDefaultDraftQuestion();
            clearStudentServiceDraftAttachments('qa-question');
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service question submission failed.', error);
            alert(error?.message || 'Public question could not be submitted.');
        }
    }

    async function submitStudentServiceQuestionAnswer(questionId, triggerElement = null, options = {}) {
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser?.id || !canCurrentUserRespondToStudentService()) return;
        const normalizedQuestionId = String(questionId || '').trim();
        const inlineOpen = isStudentServiceInlineReplyOpen();
        const isInlineSubmit = Boolean(options.forceInlineReply || triggerElement?.closest?.('.student-service-qa-comment-reply-shell'));
        const shell = isInlineSubmit
            ? (triggerElement?.closest?.('.student-service-qa-comment-reply-shell') || document.querySelector('.student-service-qa-comment-reply-shell'))
            : resolveStudentServiceReplyShell(triggerElement);
        const textarea = shell?.querySelector('.student-service-qa-inline-reply-input')
            || shell?.querySelector(`[data-student-service-reply-input="${normalizedQuestionId}"]`)
            || shell?.querySelector('[data-student-service-reply-input]');
        let parentAnswerId = resolveStudentServiceParentAnswerId(triggerElement, shell, normalizedQuestionId);
        if (inlineOpen || isInlineSubmit) {
            parentAnswerId = String(STUDENT_SERVICE_RUNTIME.pendingReplyParentAnswerId || '').trim()
                || String(ensureStudentServiceUiState().replyingToAnswerId || '').trim()
                || parentAnswerId;
            if (!parentAnswerId) {
                alert('Could not link this reply to a parent comment. Click Reply on a comment and try again.');
                return;
            }
        }
        const body = String(textarea?.value || '').trim();
        const composerId = getStudentServiceAnswerComposerId(normalizedQuestionId, parentAnswerId);
        const attachments = await persistStudentServiceDraftAttachments(composerId);
        if (!normalizedQuestionId || (!body && !attachments.length)) {
            alert('Write a comment or attach at least one file before sending it.');
            return;
        }
        const submitButton = triggerElement?.closest?.('[data-student-service-submit-answer]') || triggerElement;
        if (submitButton) {
            setStudentServiceActionButtonPending(submitButton, true);
            flashStudentServiceActionButton(submitButton, 'acting');
        }
        const requestBody = { body, attachments };
        if (inlineOpen || isInlineSubmit) {
            requestBody.parentAnswerId = parentAnswerId;
        } else if (parentAnswerId) {
            requestBody.parentAnswerId = parentAnswerId;
        }
        try {
            const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.questionAnswers(normalizedQuestionId), requestBody);
            if (payload?.question) mergeStudentServiceQuestionSnapshot(payload.question);
            const savedParentAnswerId = parentAnswerId;
            if ((inlineOpen || isInlineSubmit) && savedParentAnswerId) {
                const nestedSaved = (payload?.question?.answers || []).some(answer =>
                    String(answer.parentAnswerId || '').trim() === savedParentAnswerId
                    && String(answer.body || '').trim() === body
                );
                if (!nestedSaved) {
                    alert('Reply was saved as a top-level comment. Restart the local backend (stop then start) and try Post reply again.');
                }
            }
            clearStudentServiceDraftAttachments(composerId);
            closeStudentServiceInlineReply();
            if (!applyStudentServiceQuestionMutation(normalizedQuestionId, {
                parentAnswerId: savedParentAnswerId,
                scrollPreserve: true
            })) {
                const container = document.getElementById('page-student-service');
                if (container) delete container.dataset.studentServiceRenderSignature;
                renderStudentServicePage();
                restoreStudentServiceOpenQuestionFromUi();
            }
            if (submitButton) flashStudentServiceActionButton(submitButton, 'success');
        } catch (error) {
            console.error('Student Service answer submission failed.', error);
            if (submitButton) flashStudentServiceActionButton(submitButton, 'error');
            alert(error?.message || 'Answer could not be submitted.');
        } finally {
            if (submitButton) setStudentServiceActionButtonPending(submitButton, false);
        }
    }

    /* Wave 18: student-service-qa-staff-runtime.js */
    function invokeStudentServicePostService(...args) {
        const fn = window.postStudentService;
        if (typeof fn !== 'function') {
            throw new Error('Student Service API client is not loaded. Refresh the page and try again.');
        }
        return fn(...args);
    }

    function invokeStudentServiceApiPath(method, ...args) {
        const builder = window.STUDENT_SERVICE_API_PATHS?.[method];
        if (typeof builder !== 'function') {
            throw new Error(`Student Service API path "${method}" is not available. Refresh the page and try again.`);
        }
        return builder(...args);
    }

    function invokeStudentServiceScrollPreserved(fn) {
        const runner = window.runStudentServiceScrollPreserved;
        if (typeof runner !== 'function') return fn();
        return runner(fn);
    }

    function invokeSyncStudentServiceRenderSignature(...args) {
        const fn = window.syncStudentServiceRenderSignature;
        if (typeof fn === 'function') return fn(...args);
    }

    const __w18Deps = {
        getStudentServiceQuestionThreadHost,
        updateStudentServiceQuestionCardToggleUi,
        clearLegacyStudentServiceOpenQuestionCards,
        updateStudentServiceQuestionThreadActiveCards,
        closeStudentServiceQuestionThreadModal,
        renderStudentServiceQuestionThreadModalShell,
        mountStudentServiceQuestionThreadModal,
        remountStudentServiceQuestionThreadModal,
        setStudentServiceOpenQuestionId,
        restoreStudentServiceOpenQuestionFromUi,
        patchStudentServiceQuestionCardStats,
        canCurrentUserSetStudentServiceOwnerResolution: window.canCurrentUserSetStudentServiceOwnerResolution,
        updateStudentServiceOwnerResolutionButtons: window.updateStudentServiceOwnerResolutionButtons,
        patchStudentServiceOwnerResolutionUi: window.patchStudentServiceOwnerResolutionUi,
        triggerStudentServiceOwnerResolutionAnimation: window.triggerStudentServiceOwnerResolutionAnimation,
        setStudentServiceActionButtonPending: window.setStudentServiceActionButtonPending,
        flashStudentServiceActionButton: window.flashStudentServiceActionButton,
        isStudentServiceQuestionHelpfulVoted,
        getStudentServiceQuestionViewerHelpfulVote,
        reconcileStudentServiceQuestionViewerHelpful,
        getStudentServiceQuestionHelpfulCount,
        patchStudentServiceQuestionThreadPreviewMetrics,
        resolveStudentServiceActorUserId,
        buildStudentServiceQuestionHelpfulToggleSnapshot,
        buildStudentServiceAnswerHelpfulToggleSnapshot,
        getStudentServiceCurrentUser: (...args) => window.getStudentServiceCurrentUser?.(...args),
        postStudentService: invokeStudentServicePostService,
        STUDENT_SERVICE_API_PATHS: {
            questionOwnerResolution: (questionId) => invokeStudentServiceApiPath('questionOwnerResolution', questionId),
            questionFeedback: (questionId) => invokeStudentServiceApiPath('questionFeedback', questionId),
            questionAnswerFeedback: (questionId, answerId) =>
                invokeStudentServiceApiPath('questionAnswerFeedback', questionId, answerId),
            questionDelete: (questionId) => invokeStudentServiceApiPath('questionDelete', questionId),
            questionAnswerDelete: (questionId, answerId) =>
                invokeStudentServiceApiPath('questionAnswerDelete', questionId, answerId)
        },
        runStudentServiceScrollPreserved: invokeStudentServiceScrollPreserved,
        syncStudentServiceRenderSignature: invokeSyncStudentServiceRenderSignature,
        renderStudentServiceQuestionHelpfulButtonMarkup,
        updateStudentServiceQuestionHelpfulButton,
        triggerStudentServiceHelpfulAnimation,
        patchStudentServiceQuestionHelpfulUi,
        isStudentServiceAnswerHelpfulVoted,
        renderStudentServiceAnswerHelpfulButtonMarkup,
        updateStudentServiceAnswerHelpfulButton,
        patchStudentServiceAnswerHelpfulBtn,
        removeStudentServiceAnswerBranch,
        applyStudentServiceQuestionMutation,
        patchStudentServiceOpenQuestionThread,
        setStudentServiceQuestionFilter,
        setStudentServiceQuestionComposerExpanded,
        setStudentServiceDraftQuestionField,
        openStudentServiceQuestion,
        getStudentServiceQuestionStatusLabel,
        getStudentServiceQuestionStatusClass,
        getStudentServiceQuestionAnswerCount,
        renderStudentServiceQuestionList,
        renderStudentServiceQuestionComposer,
        renderStudentServiceQuestionComposerFormMarkup,
        renderStudentServiceQuestionComposerModalActionsMarkup,
        renderStudentServiceQuestionComposerModalShell,
        renderStudentServiceQuestionCardPreviewMarkup,
        renderStudentServiceQuestionFeed,
        renderStudentServiceCommentReplyShell,
        openStudentServiceDeleteQuestionConfirm,
        isStudentServiceQuestionComposerModalOpen,
        mountStudentServiceQuestionComposerModal,
        openStudentServiceQuestionComposerModal,
        closeStudentServiceQuestionComposerModal,
        remountStudentServiceQuestionComposerModal,
        renderStudentServiceAnswerCardMarkup,
        renderStudentServiceAnswerThreadNode,
        renderStudentServiceQuestionDetailActionsMarkup,
        renderStudentServiceQuestionDetail,
        submitStudentServiceQuestion,
        submitStudentServiceQuestionAnswer,
        mergeStudentServiceQuestionSnapshot,
        getStudentServiceQuestionById,
        getStudentServiceQuestionRecordById,
        findStudentServiceAnswerRecord,
        removeStudentServiceQuestionFromSnapshot,
        removeStudentServiceQuestionCard,
        collectStudentServiceAnswerBranchIds,
        removeStudentServiceAnswersFromSnapshot,
        canCurrentUserDeleteStudentServiceQuestion,
        canCurrentUserDeleteStudentServiceAnswer
    };
    const __w18PeelApi = typeof window.__kiuCreateStudentServiceQaStaffApi === 'function'
        ? window.__kiuCreateStudentServiceQaStaffApi(__w18Deps) : null;
    if (!__w18PeelApi) {
        console.error('Student Service QA staff peel missing; staff desk markup unavailable.');
    }
    const {
        setStudentServiceQuestionOwnerResolution = () => {},
        setStudentServiceQuestionFeedback = () => {},
        setStudentServiceAnswerFeedback = () => {},
        deleteStudentServiceQuestion = async () => null,
        deleteStudentServiceQuestionAnswer = async () => null,
        renderStudentServiceQaCommandBarStats = () => '',
        ensureStudentServiceStaffQaShell = () => null,
        renderStudentServiceStaffQaFeedMarkup = () => ''
    } = __w18PeelApi || {};

    __kiuSsApi.renderStudentServiceStudentQaHub = window.renderStudentServiceStudentQaHub = function renderStudentServiceStudentQaHub(container) {
        const ui = ensureStudentServiceUiState();
        const filteredQuestions = getStudentServiceFilteredQuestions(getStudentServiceVisibleQuestions());
        const selectedQuestion = getStudentServiceOpenQuestion(filteredQuestions);
        const shell = ensureStudentServiceStudentQaShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.feed,
            buildStudentServiceQaFeedCacheKey(ui, filteredQuestions),
            renderStudentServiceStudentQaFeedMarkup(ui, filteredQuestions, selectedQuestion)
        );
    };

    __kiuSsApi.renderStudentServiceStaffQaFeed = window.renderStudentServiceStaffQaFeed = function renderStudentServiceStaffQaFeed(container, options = {}) {
    const ui = ensureStudentServiceUiState();
    const filteredQuestions = Array.isArray(options.filteredQuestions) ? options.filteredQuestions : [];
    const selectedQuestion = options.selectedQuestion || getStudentServiceOpenQuestion(filteredQuestions);
    const shell = ensureStudentServiceStaffQaShell(container);
    if (!shell) return;
    setStudentServiceMarkup(
        shell.feed,
        buildStudentServiceQaFeedCacheKey(ui, filteredQuestions),
        renderStudentServiceStaffQaFeedMarkup(ui, filteredQuestions, selectedQuestion)
    );
    };

    __kiuSsApi.buildStudentServiceDefaultDraftQuestion = buildStudentServiceDefaultDraftQuestion;
    __kiuSsApi.resolveStudentServiceAnswerAuthorId = resolveStudentServiceAnswerAuthorId;
    __kiuSsApi.normalizeStudentServiceAnswer = normalizeStudentServiceAnswer;
    __kiuSsApi.preferStudentServiceAnswerRecord = preferStudentServiceAnswerRecord;
    __kiuSsApi.buildStudentServiceAnswerThread = buildStudentServiceAnswerThread;
    __kiuSsApi.normalizeStudentServiceQuestionStatus = normalizeStudentServiceQuestionStatus;
    __kiuSsApi.normalizeStudentServiceQuestion = normalizeStudentServiceQuestion;
    __kiuSsApi.resolveStudentServiceReplyShell = resolveStudentServiceReplyShell;
    __kiuSsApi.resolveStudentServiceParentAnswerId = resolveStudentServiceParentAnswerId;
    __kiuSsApi.canCurrentUserDeleteStudentServiceAnswer = canCurrentUserDeleteStudentServiceAnswer;
    __kiuSsApi.getStudentServiceQuestionResolutionLabel = getStudentServiceQuestionResolutionLabel;
    __kiuSsApi.canCurrentUserDeleteStudentServiceQuestion = canCurrentUserDeleteStudentServiceQuestion;
    __kiuSsApi.buildStudentServiceAnswerCardOptions = buildStudentServiceAnswerCardOptions;
    __kiuSsApi.findNewestStudentServiceTopLevelAnswer = findNewestStudentServiceTopLevelAnswer;
    __kiuSsApi.appendStudentServiceTopLevelAnswerNode = appendStudentServiceTopLevelAnswerNode;
    __kiuSsApi.collectStudentServiceAnswerBranchIds = collectStudentServiceAnswerBranchIds;
    __kiuSsApi.removeStudentServiceAnswersFromSnapshot = removeStudentServiceAnswersFromSnapshot;
    __kiuSsApi.mergeStudentServiceQuestionSnapshot = window.mergeStudentServiceQuestionSnapshot = mergeStudentServiceQuestionSnapshot;
    __kiuSsApi.removeStudentServiceQuestionFromSnapshot = window.removeStudentServiceQuestionFromSnapshot = removeStudentServiceQuestionFromSnapshot;
    __kiuSsApi.removeStudentServiceQuestionCard = window.removeStudentServiceQuestionCard = removeStudentServiceQuestionCard;
    __kiuSsApi.buildStudentServiceQaContentFingerprint = buildStudentServiceQaContentFingerprint;
    __kiuSsApi.buildStudentServiceQaFeedCacheKey = buildStudentServiceQaFeedCacheKey;
    __kiuSsApi.getStudentServiceVisibleQuestions = getStudentServiceVisibleQuestions;
    __kiuSsApi.getStudentServiceQuestionAuthorLabel = getStudentServiceQuestionAuthorLabel;
    __kiuSsApi.getStudentServiceSelectedQuestion = getStudentServiceSelectedQuestion;
    __kiuSsApi.getStudentServiceOpenQuestion = getStudentServiceOpenQuestion;
    __kiuSsApi.getStudentServiceFilteredQuestions = getStudentServiceFilteredQuestions;
    __kiuSsApi.relayoutStudentServiceCommentTrunks = relayoutStudentServiceCommentTrunks;
    __kiuSsApi.getStudentServiceQuestionById = window.getStudentServiceQuestionById = getStudentServiceQuestionById;
    __kiuSsApi.getStudentServiceQuestionRecordById = window.getStudentServiceQuestionRecordById = getStudentServiceQuestionRecordById;
    __kiuSsApi.findStudentServiceAnswerRecord = window.findStudentServiceAnswerRecord = findStudentServiceAnswerRecord;
    __kiuSsApi.studentServiceAnswerArticleEl = studentServiceAnswerArticleEl;
    __kiuSsApi.getStudentServiceQuestionCardElement = getStudentServiceQuestionCardElement;
    __kiuSsApi.getStudentServiceQuestionThreadMode = getStudentServiceQuestionThreadMode;
    __kiuSsApi.isStudentServiceQuestionThreadModalOpen = isStudentServiceQuestionThreadModalOpen;
    __kiuSsApi.getStudentServiceQuestionThreadModalBody = getStudentServiceQuestionThreadModalBody;
    __kiuSsApi.getStudentServiceQuestionThreadHost = getStudentServiceQuestionThreadHost;
    __kiuSsApi.updateStudentServiceQuestionCardToggleUi = updateStudentServiceQuestionCardToggleUi;
    __kiuSsApi.clearLegacyStudentServiceOpenQuestionCards = clearLegacyStudentServiceOpenQuestionCards;
    __kiuSsApi.updateStudentServiceQuestionThreadActiveCards = updateStudentServiceQuestionThreadActiveCards;
    __kiuSsApi.closeStudentServiceQuestionThreadModal = closeStudentServiceQuestionThreadModal;
    __kiuSsApi.renderStudentServiceQuestionThreadModalShell = renderStudentServiceQuestionThreadModalShell;
    __kiuSsApi.mountStudentServiceQuestionThreadModal = mountStudentServiceQuestionThreadModal;
    __kiuSsApi.remountStudentServiceQuestionThreadModal = remountStudentServiceQuestionThreadModal;
    __kiuSsApi.setStudentServiceOpenQuestionId = setStudentServiceOpenQuestionId;
    __kiuSsApi.restoreStudentServiceOpenQuestionFromUi = restoreStudentServiceOpenQuestionFromUi;
    __kiuSsApi.patchStudentServiceQuestionCardStats = patchStudentServiceQuestionCardStats;
    __kiuSsApi.isStudentServiceQuestionHelpfulVoted = isStudentServiceQuestionHelpfulVoted;
    __kiuSsApi.getStudentServiceQuestionViewerHelpfulVote = getStudentServiceQuestionViewerHelpfulVote;
    __kiuSsApi.reconcileStudentServiceQuestionViewerHelpful = reconcileStudentServiceQuestionViewerHelpful;
    __kiuSsApi.getStudentServiceQuestionHelpfulCount = getStudentServiceQuestionHelpfulCount;
    __kiuSsApi.patchStudentServiceQuestionThreadPreviewMetrics = patchStudentServiceQuestionThreadPreviewMetrics;
    __kiuSsApi.resolveStudentServiceActorUserId = window.resolveStudentServiceActorUserId = resolveStudentServiceActorUserId;
    __kiuSsApi.buildStudentServiceQuestionHelpfulToggleSnapshot = window.buildStudentServiceQuestionHelpfulToggleSnapshot = buildStudentServiceQuestionHelpfulToggleSnapshot;
    __kiuSsApi.buildStudentServiceAnswerHelpfulToggleSnapshot = window.buildStudentServiceAnswerHelpfulToggleSnapshot = buildStudentServiceAnswerHelpfulToggleSnapshot;
    __kiuSsApi.renderStudentServiceQuestionHelpfulButtonMarkup = renderStudentServiceQuestionHelpfulButtonMarkup;
    __kiuSsApi.updateStudentServiceQuestionHelpfulButton = updateStudentServiceQuestionHelpfulButton;
    __kiuSsApi.triggerStudentServiceHelpfulAnimation = triggerStudentServiceHelpfulAnimation;
    __kiuSsApi.patchStudentServiceQuestionHelpfulUi = patchStudentServiceQuestionHelpfulUi;
    __kiuSsApi.isStudentServiceAnswerHelpfulVoted = isStudentServiceAnswerHelpfulVoted;
    __kiuSsApi.renderStudentServiceAnswerHelpfulButtonMarkup = renderStudentServiceAnswerHelpfulButtonMarkup;
    __kiuSsApi.updateStudentServiceAnswerHelpfulButton = updateStudentServiceAnswerHelpfulButton;
    __kiuSsApi.patchStudentServiceAnswerHelpfulBtn = patchStudentServiceAnswerHelpfulBtn;
    __kiuSsApi.removeStudentServiceAnswerBranch = removeStudentServiceAnswerBranch;
    __kiuSsApi.applyStudentServiceQuestionMutation = applyStudentServiceQuestionMutation;
    __kiuSsApi.patchStudentServiceOpenQuestionThread = patchStudentServiceOpenQuestionThread;
    __kiuSsApi.setStudentServiceQuestionFilter = setStudentServiceQuestionFilter;
    __kiuSsApi.setStudentServiceQuestionComposerExpanded = setStudentServiceQuestionComposerExpanded;
    __kiuSsApi.setStudentServiceDraftQuestionField = window.setStudentServiceDraftQuestionField = setStudentServiceDraftQuestionField;
    __kiuSsApi.openStudentServiceQuestion = openStudentServiceQuestion;
    __kiuSsApi.getStudentServiceQuestionStatusLabel = getStudentServiceQuestionStatusLabel;
    __kiuSsApi.getStudentServiceQuestionStatusClass = getStudentServiceQuestionStatusClass;
    __kiuSsApi.getStudentServiceQuestionAnswerCount = getStudentServiceQuestionAnswerCount;
    __kiuSsApi.renderStudentServiceQuestionList = renderStudentServiceQuestionList;
    __kiuSsApi.renderStudentServiceQuestionComposer = renderStudentServiceQuestionComposer;
    __kiuSsApi.renderStudentServiceQuestionComposerFormMarkup = renderStudentServiceQuestionComposerFormMarkup;
    __kiuSsApi.renderStudentServiceQuestionComposerModalActionsMarkup = renderStudentServiceQuestionComposerModalActionsMarkup;
    __kiuSsApi.renderStudentServiceQuestionComposerModalShell = renderStudentServiceQuestionComposerModalShell;
    __kiuSsApi.renderStudentServiceQuestionCardPreviewMarkup = renderStudentServiceQuestionCardPreviewMarkup;
    __kiuSsApi.renderStudentServiceQuestionFeed = window.renderStudentServiceQuestionFeed = renderStudentServiceQuestionFeed;
    __kiuSsApi.renderStudentServiceCommentReplyShell = renderStudentServiceCommentReplyShell;
    __kiuSsApi.openStudentServiceDeleteQuestionConfirm = openStudentServiceDeleteQuestionConfirm;
    __kiuSsApi.isStudentServiceQuestionComposerModalOpen = window.isStudentServiceQuestionComposerModalOpen = isStudentServiceQuestionComposerModalOpen;
    __kiuSsApi.mountStudentServiceQuestionComposerModal = window.mountStudentServiceQuestionComposerModal = mountStudentServiceQuestionComposerModal;
    __kiuSsApi.openStudentServiceQuestionComposerModal = window.openStudentServiceQuestionComposerModal = openStudentServiceQuestionComposerModal;
    __kiuSsApi.closeStudentServiceQuestionComposerModal = window.closeStudentServiceQuestionComposerModal = closeStudentServiceQuestionComposerModal;
    __kiuSsApi.remountStudentServiceQuestionComposerModal = window.remountStudentServiceQuestionComposerModal = remountStudentServiceQuestionComposerModal;
    __kiuSsApi.renderStudentServiceAnswerCardMarkup = renderStudentServiceAnswerCardMarkup;
    __kiuSsApi.renderStudentServiceAnswerThreadNode = renderStudentServiceAnswerThreadNode;
    __kiuSsApi.renderStudentServiceQuestionDetailActionsMarkup = renderStudentServiceQuestionDetailActionsMarkup;
    __kiuSsApi.renderStudentServiceQuestionDetail = renderStudentServiceQuestionDetail;
    __kiuSsApi.submitStudentServiceQuestion = window.submitStudentServiceQuestion = submitStudentServiceQuestion;
    __kiuSsApi.submitStudentServiceQuestionAnswer = window.submitStudentServiceQuestionAnswer = submitStudentServiceQuestionAnswer;
    __kiuSsApi.setStudentServiceQuestionOwnerResolution = window.setStudentServiceQuestionOwnerResolution = setStudentServiceQuestionOwnerResolution;
    __kiuSsApi.setStudentServiceQuestionFeedback = window.setStudentServiceQuestionFeedback = setStudentServiceQuestionFeedback;
    __kiuSsApi.setStudentServiceAnswerFeedback = window.setStudentServiceAnswerFeedback = setStudentServiceAnswerFeedback;
    __kiuSsApi.deleteStudentServiceQuestion = deleteStudentServiceQuestion;
    __kiuSsApi.deleteStudentServiceQuestionAnswer = deleteStudentServiceQuestionAnswer;
    __kiuSsApi.publishStudentServiceQuestion = publishStudentServiceQuestion;
    __kiuSsApi.toggleStudentServiceQuestionFlag = toggleStudentServiceQuestionFlag;
    __kiuSsApi.convertStudentServiceQuestionToTicket = convertStudentServiceQuestionToTicket;
    __kiuSsApi.convertStudentServiceQuestionToArticle = convertStudentServiceQuestionToArticle;
    __kiuSsApi.mergeStudentServiceQuestionPrompt = mergeStudentServiceQuestionPrompt;
    __kiuSsApi.renderStudentServiceQaCommandBarStats = renderStudentServiceQaCommandBarStats;
    if (typeof window.handleStudentServiceQaThreadClick === 'function') {
        __kiuSsApi.handleStudentServiceQaThreadClick = window.handleStudentServiceQaThreadClick;
    }
    window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED = true;
})();
