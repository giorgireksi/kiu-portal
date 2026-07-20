/* LMS student quiz focus-mode chrome helpers.
 * Peeled from lms-quiz-workspace-runtime.js. Load via LMS_QUIZ_MODULE_URLS before workspace.
 */
(function initLmsQuizFocusRuntime() {
    if (window.__KIU_LMS_QUIZ_FOCUS_LOADED) return;
    window.__KIU_LMS_QUIZ_FOCUS_LOADED = true;

    window.__kiuCreateLmsQuizFocusApi = function createKiuLmsQuizFocusApi(deps = {}) {
        const d = deps;
        const LMS_STUDENT_QUIZ_FOCUS_STATE_KEY = d.LMS_STUDENT_QUIZ_FOCUS_STATE_KEY
            || window.LMS_STUDENT_QUIZ_FOCUS_STATE_KEY
            || 'KIU_LMS_STUDENT_QUIZ_FOCUS_STATE';
        void d;

function ensureLmsStudentQuizFocusStyles() {
    // Explicit owner: assets/css/lms-route.css
    return;
}

function syncLmsStudentQuizFocusChrome(state = null) {
    const normalizedState = state && typeof state === 'object'
        ? state
        : buildEmptyLmsStudentQuizFocusState();
    ensureLmsStudentQuizFocusStyles();
    document.body?.classList.toggle('kiu-lms-quiz-focus-active', normalizedState.active === true);
}

function getLmsStudentQuizFocusState() {
    const fallback = buildEmptyLmsStudentQuizFocusState();
    try {
        const raw = sessionStorage.getItem(LMS_STUDENT_QUIZ_FOCUS_STATE_KEY);
        if (!raw) {
            syncLmsStudentQuizFocusChrome(fallback);
            return fallback;
        }
        const parsed = JSON.parse(raw);
        const normalized = {
            ...fallback,
            ...(parsed && typeof parsed === 'object' ? parsed : {})
        };
        normalized.active = normalized.active === true;
        syncLmsStudentQuizFocusChrome(normalized);
        return normalized;
    } catch (error) {
        syncLmsStudentQuizFocusChrome(fallback);
        return fallback;
    }
}

function setLmsStudentQuizFocusState(nextState = {}) {
    const normalized = {
        ...buildEmptyLmsStudentQuizFocusState(),
        ...(nextState && typeof nextState === 'object' ? nextState : {})
    };
    normalized.active = normalized.active === true;
    try {
        sessionStorage.setItem(LMS_STUDENT_QUIZ_FOCUS_STATE_KEY, JSON.stringify(normalized));
    } catch (error) {}
    syncLmsStudentQuizFocusChrome(normalized);
    return normalized;
}

function enableLmsStudentQuizFocusMode(resourceKey, quizId, studentMeta = {}, warningMessage = '') {
    return setLmsStudentQuizFocusState({
        active: true,
        resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
        quizId: String(quizId || ''),
        studentId: String(studentMeta?.id || ''),
        studentName: String(studentMeta?.name || ''),
        activatedAt: new Date().toISOString(),
        warningMessage: String(warningMessage || '')
    });
}

function disableLmsStudentQuizFocusMode() {
    const cleared = setLmsStudentQuizFocusState(buildEmptyLmsStudentQuizFocusState());
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        Promise.resolve(document.exitFullscreen()).catch(() => null);
    }
    return cleared;
}

        const api = {
            LMS_STUDENT_QUIZ_FOCUS_STATE_KEY,
            ensureLmsStudentQuizFocusStyles,
            syncLmsStudentQuizFocusChrome,
            getLmsStudentQuizFocusState,
            setLmsStudentQuizFocusState,
            enableLmsStudentQuizFocusMode,
            disableLmsStudentQuizFocusMode,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsQuizFocusApi({});
})();
