/* Live quiz staff action/impersonation UI helpers. Peeled from lms-live-quiz-ui-runtime.js.
 * Load before lms-live-quiz-ui-runtime.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_LIVE_QUIZ_UI_STAFF_LOADED) return;
    window.__KIU_LMS_LIVE_QUIZ_UI_STAFF_LOADED = true;

    window.__kiuCreateLmsLiveQuizUiStaffApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function getLmsLiveStudentId() {
    const resourceKey = arguments.length ? arguments[0] : currentCourseId;
    return getLmsLiveStudentMeta(resourceKey).id;
}

function canManageLmsLiveQuiz(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = canonicalKey ? ensureLmsLiveQuizWorkspace(canonicalKey) : null;
    if (workspace?.ui?.accessDenied) {
        if (typeof canAccessLmsLiveQuizScope === 'function' && canAccessLmsLiveQuizScope(canonicalKey || resourceKey)) {
            workspace.ui.accessDenied = false;
            workspace.ui.syncError = '';
        } else {
            return false;
        }
    }
    if (typeof isActualAdminLmsLiveQuizSession === 'function' && isActualAdminLmsLiveQuizSession()) {
        return true;
    }
    const role = getEffectiveUserRole();
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        return false;
    }
    const hasScopeAccess = typeof canAccessLmsLiveQuizScope === 'function'
        ? canAccessLmsLiveQuizScope(canonicalKey || resourceKey)
        : false;
    if (!hasScopeAccess) return false;
    const parsed = parseLmsCourseKey(canonicalKey || resourceKey);
    if (typeof canManageLmsClassSection === 'function'
        && !canManageLmsClassSection(parsed.sectionType || getCurrentLmsSectionType())) {
        return hasScopeAccess;
    }
    return true;
}

function notifyLmsLiveStaffGuard(message = '') {
    const text = String(message || '').trim();
    if (!text) return;
    alert(text);
}

function canRevealLmsLiveQuizPodium(session = null) {
    if (!session) return false;
    return String(session.status || '').toLowerCase() === 'ended';
}

function renderLmsLivePodiumQueueButton(resourceKey, session = null) {
    const canReveal = canRevealLmsLiveQuizPodium(session);
    const disabledAttrs = canReveal ? '' : ' disabled aria-disabled="true"';
    const titleAttr = canReveal
        ? ''
        : ' title="Available after the session ends."';
    const activeClass = session?.showPodium ? ' is-active' : '';
    return `<button type="button" class="lux-secondary-btn${activeClass}"${disabledAttrs}${titleAttr} data-lms-click="revealLmsLiveQuizPodium(${lmsInlineArg(resourceKey)})"><i class="fas fa-trophy"></i> Show rankings</button>`;
}

function getLmsLiveStaffActionAvailability(question = null, session = null) {
    const state = String(question?.state || 'draft').toLowerCase();
    const questionCount = Array.isArray(session?.questions) ? session.questions.length : 0;
    const currentIndex = Math.min(Math.max(0, Number(session?.currentQuestionIndex || 0)), Math.max(0, questionCount - 1));
    return {
        show: {
            enabled: Boolean(question),
            active: state === 'showing',
            hint: question ? '' : 'Select a question first.'
        },
        pause: {
            enabled: state === 'showing',
            active: false,
            hint: 'Pause only works while the question is showing.'
        },
        resume: {
            enabled: state === 'paused',
            active: state === 'paused',
            hint: 'Resume only works while the question is paused.'
        },
        lock: {
            enabled: ['showing', 'paused'].includes(state),
            active: state === 'locked',
            hint: 'Lock only works while the question is showing or paused.'
        },
        reveal: {
            enabled: ['showing', 'paused', 'locked', 'revealed'].includes(state),
            active: state === 'revealed',
            hint: 'Reveal only works after the question has been shown.'
        },
        results: {
            enabled: Boolean(session),
            active: Boolean(session?.showResults),
            hint: session ? '' : 'Start a session first.'
        },
        prev: {
            enabled: questionCount > 0 && currentIndex > 0,
            active: false,
            hint: 'Already on the first question.'
        },
        next: {
            enabled: questionCount > 0 && currentIndex < questionCount - 1,
            active: false,
            hint: 'Already on the last question.'
        },
        podium: {
            enabled: canRevealLmsLiveQuizPodium(session),
            active: Boolean(session?.showPodium),
            hint: 'Show rankings after the session ends.'
        }
    };
}

function renderLmsLiveStaffActionButton(actionKey, availability, label, iconClass, clickHandler, primary = false) {
    const action = availability?.[actionKey] || { enabled: true, active: false, hint: '' };
    const buttonClass = `${primary ? 'lux-primary-btn' : 'lux-secondary-btn'}${action.active ? ' is-active' : ''}`;
    const disabledAttrs = action.enabled ? '' : ' disabled aria-disabled="true"';
    const titleAttr = action.hint ? ` title="${escapeHtml(action.hint)}"` : '';
    return `<button type="button" class="${buttonClass}"${disabledAttrs}${titleAttr} data-lms-click="${clickHandler}"><i class="${escapeHtml(iconClass)}"></i> ${escapeHtml(label)}</button>`;
}

function prepareLmsLiveQuizImpersonation(resourceKey = currentCourseId) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const role = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : '';
    if (typeof isAdminImpersonationMode !== 'function' || !isAdminImpersonationMode()) {
        return Promise.resolve(null);
    }
    const syncRole = role === USER_ROLES.STUDENT
        ? USER_ROLES.STUDENT
        : ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) ? role : '');
    if (!syncRole || typeof syncPortalBackendImpersonation !== 'function') {
        return Promise.resolve(null);
    }
    if (syncRole === USER_ROLES.STUDENT && typeof syncLmsImpersonatedStudentSession === 'function') {
        syncLmsImpersonatedStudentSession(canonicalKey || resourceKey);
    }
    if (typeof window === 'undefined') {
        return Promise.resolve(syncPortalBackendImpersonation(syncRole)).catch(() => null);
    }
    window.__lmsLiveQuizImpersonationSyncs = window.__lmsLiveQuizImpersonationSyncs || {};
    const syncKey = `${canonicalKey || String(resourceKey || '').trim() || 'live-quiz'}::${syncRole}`;
    const existing = window.__lmsLiveQuizImpersonationSyncs[syncKey];
    if (existing) return existing;
    const syncPromise = Promise.resolve(syncPortalBackendImpersonation(syncRole))
        .catch(() => null)
        .finally(() => {
            if (window.__lmsLiveQuizImpersonationSyncs?.[syncKey] === syncPromise) {
                delete window.__lmsLiveQuizImpersonationSyncs[syncKey];
            }
        });
    window.__lmsLiveQuizImpersonationSyncs[syncKey] = syncPromise;
    return syncPromise;
}

function refreshStaffLmsLiveQuizUi(resourceKey, options = {}) {
    if (typeof refreshLmsLiveQuizUi === 'function') {
        refreshLmsLiveQuizUi(resourceKey, {
            skipLoad: true,
            ...options
        });
        return;
    }
    renderLmsLiveQuizSection(resourceKey, { skipLoad: true, ...options });
}

        const api = {
            getLmsLiveStudentId,
            canManageLmsLiveQuiz,
            notifyLmsLiveStaffGuard,
            canRevealLmsLiveQuizPodium,
            renderLmsLivePodiumQueueButton,
            getLmsLiveStaffActionAvailability,
            renderLmsLiveStaffActionButton,
            prepareLmsLiveQuizImpersonation,
            refreshStaffLmsLiveQuizUi,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsLiveQuizUiStaffApi({});
})();

