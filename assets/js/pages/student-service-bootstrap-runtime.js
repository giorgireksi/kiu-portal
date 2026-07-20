/* Student-service snapshot/bootstrap helpers. Peeled from student-service.js.
 * Load before student-service.js.
 */
(function initWave18Peel() {
    if (window.__KIU_STUDENT_SERVICE_BOOTSTRAP_LOADED) return;
    window.__KIU_STUDENT_SERVICE_BOOTSTRAP_LOADED = true;

    window.__kiuCreateStudentServiceBootstrapApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function findNewestStudentServiceTopLevelAnswer(question) {
    if (hasStudentServiceQaModule()
        && typeof window.findNewestStudentServiceTopLevelAnswer === 'function'
        && window.findNewestStudentServiceTopLevelAnswer !== findNewestStudentServiceTopLevelAnswer) {
        return window.findNewestStudentServiceTopLevelAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function appendStudentServiceTopLevelAnswerNode(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.appendStudentServiceTopLevelAnswerNode === 'function'
        && window.appendStudentServiceTopLevelAnswerNode !== appendStudentServiceTopLevelAnswerNode) {
        return window.appendStudentServiceTopLevelAnswerNode.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function collectStudentServiceAnswerBranchIds(questionId, answerId, answers = []) {
    if (hasStudentServiceQaModule()
        && typeof window.collectStudentServiceAnswerBranchIds === 'function'
        && window.collectStudentServiceAnswerBranchIds !== collectStudentServiceAnswerBranchIds) {
        return window.collectStudentServiceAnswerBranchIds.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function removeStudentServiceAnswersFromSnapshot(questionId, removedAnswerIds = new Set()) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceAnswersFromSnapshot === 'function'
        && window.removeStudentServiceAnswersFromSnapshot !== removeStudentServiceAnswersFromSnapshot) {
        return window.removeStudentServiceAnswersFromSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function mergeStudentServiceQuestionSnapshot(question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.mergeStudentServiceQuestionSnapshot === 'function'
        && window.mergeStudentServiceQuestionSnapshot !== mergeStudentServiceQuestionSnapshot) {
        return window.mergeStudentServiceQuestionSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function removeStudentServiceQuestionFromSnapshot(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceQuestionFromSnapshot === 'function'
        && window.removeStudentServiceQuestionFromSnapshot !== removeStudentServiceQuestionFromSnapshot) {
        return window.removeStudentServiceQuestionFromSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function removeStudentServiceQuestionCard(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceQuestionCard === 'function'
        && window.removeStudentServiceQuestionCard !== removeStudentServiceQuestionCard) {
        return window.removeStudentServiceQuestionCard.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function applyStudentServiceBootstrap(payload = {}) {
    const state = payload.studentService || payload || {};
    const previousLayoutFingerprint = JSON.stringify(KIU_STATE.studentServiceInboxFilterLayout?.filters || []);
    const previousArticleFingerprint = buildStudentServiceArticleFingerprint(KIU_STATE.studentServiceArticles || []);
    invalidateStudentServiceStores();
    if (Array.isArray(state.articles)) KIU_STATE.studentServiceArticles = state.articles.slice();
    if (Array.isArray(state.tickets)) KIU_STATE.studentServiceTickets = state.tickets.slice();
    if (Array.isArray(state.macros)) KIU_STATE.studentServiceMacros = state.macros.slice();
    if (Array.isArray(state.questions)) KIU_STATE.studentServiceQuestions = state.questions.slice();
    if (Array.isArray(state.answers)) KIU_STATE.studentServiceAnswers = state.answers.slice();
    if (Array.isArray(state.reviewQueue)) KIU_STATE.studentServiceReviewQueue = state.reviewQueue.slice();
    KIU_STATE.studentServicePermissions = state.permissions || KIU_STATE.studentServicePermissions || {};
    KIU_STATE.studentServiceAnalytics = state.analytics || KIU_STATE.studentServiceAnalytics || {};
    if (state.inboxFilterLayout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(state.inboxFilterLayout);
        KIU_STATE.studentServiceInboxFilterLayout = normalized;
        publishStudentServiceInboxFilterLayout(normalized);
        pruneStudentServiceCustomTicketFilters(normalized);
        const nextLayoutFingerprint = JSON.stringify(normalized?.filters || []);
        if (previousLayoutFingerprint !== nextLayoutFingerprint) {
            invalidateStudentServiceRenderSignature();
        }
    }
    ensureStudentServiceStores();
    const nextArticleFingerprint = buildStudentServiceArticleFingerprint(KIU_STATE.studentServiceArticles || []);
    if (previousArticleFingerprint !== nextArticleFingerprint) {
        const ui = ensureStudentServiceUiState();
        ui.studentHubArticleByArea = {};
        invalidateStudentServiceRenderSignature();
    } else {
        pruneStudentHubArticleSelections(KIU_STATE.studentServiceArticles);
    }
}

async function fetchStudentServiceBootstrap(force = false) {
    if (STUDENT_SERVICE_RUNTIME.bootstrapPromise && !force) return STUDENT_SERVICE_RUNTIME.bootstrapPromise;
    if (typeof kiuPortalFetch !== 'function') return null;
    STUDENT_SERVICE_RUNTIME.bootstrapPromise = (async () => {
        const payload = await kiuPortalFetch(studentServiceApiPath(STUDENT_SERVICE_API_PATHS.bootstrap()));
        STUDENT_SERVICE_RUNTIME.backendManifestVersion = String(payload?.apiManifestVersion || '').trim();
        if (!STUDENT_SERVICE_RUNTIME.backendManifestVersion) {
            try {
                const health = await kiuPortalFetch('/health');
                STUDENT_SERVICE_RUNTIME.backendManifestVersion = String(health?.studentServiceApiManifestVersion || '').trim();
            } catch (error) {}
        }
        ensureStudentServiceBackendContract(STUDENT_SERVICE_RUNTIME.backendManifestVersion);
        if (payload?.studentService) {
            applyStudentServiceBootstrap(payload.studentService);
            STUDENT_SERVICE_RUNTIME.loaded = true;
            STUDENT_SERVICE_RUNTIME.loadFailed = false;
            STUDENT_SERVICE_RUNTIME.lastLoadedAt = Date.now();
        }
        return payload?.studentService || null;
    })().catch(error => {
        STUDENT_SERVICE_RUNTIME.loadFailed = true;
        throw error;
    }).finally(() => {
        STUDENT_SERVICE_RUNTIME.bootstrapPromise = null;
    });
    return STUDENT_SERVICE_RUNTIME.bootstrapPromise;
}

function shouldDeferStudentServiceStudentHubUntilBootstrap(role, ui) {
    return role === USER_ROLES.STUDENT
        && getStudentServiceLane() === 'service'
        && ui.studentTab === 'get_help'
        && shouldBootstrapStudentServiceWorkspace()
        && !STUDENT_SERVICE_RUNTIME.loaded
        && !STUDENT_SERVICE_RUNTIME.loadFailed;
}

function renderStudentServiceBootstrapLoadingShell() {
    return `
        <div class="student-service-loading-state student-service-empty-state-large">
            <i class="fas fa-spinner fa-spin student-service-loading-icon"></i>
            Loading guidance and support topics...
        </div>
    `;
}

function renderStudentServiceBootstrapErrorBanner() {
    const message = String(STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage || '').trim()
        || 'Student Service data could not load. Check your connection and retry.';
    return `
        <div class="student-service-bootstrap-error-banner" role="alert" aria-live="polite">
            <div class="student-service-bootstrap-error-copy">
                <div class="student-service-bootstrap-error-title">Student Service data could not load</div>
                <div class="student-service-bootstrap-error-message">${ssEscape(message)}</div>
            </div>
            <button type="button" class="lux-primary-btn student-service-bootstrap-retry-btn" data-student-service-retry-bootstrap="1"><i class="fas fa-rotate-right"></i> Retry</button>
        </div>
    `;
}

function scheduleStudentServiceBootstrap(force = false) {
    fetchStudentServiceBootstrap(force)
        .then(async () => {
            STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage = '';
            await maybeSyncStudentServicePersonalInboxFilterLayoutToTeam();
            if (isStudentServiceQaBodyStale()) {
                rerenderStudentServicePageAfterModuleLoad();
                return;
            }
            renderStudentServicePage();
        })
        .catch((error) => {
            STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage = formatStudentServiceApiError(error, studentServiceApiPath(STUDENT_SERVICE_API_PATHS.bootstrap()));
            console.error('Student Service bootstrap failed.', error);
            renderStudentServicePage();
        });
}

function getStudentServiceCurrentUser() {
    return getCurrentUser() || currentUser || null;
}

        const api = {
            findNewestStudentServiceTopLevelAnswer,
            appendStudentServiceTopLevelAnswerNode,
            collectStudentServiceAnswerBranchIds,
            removeStudentServiceAnswersFromSnapshot,
            mergeStudentServiceQuestionSnapshot,
            removeStudentServiceQuestionFromSnapshot,
            fetchStudentServiceBootstrap,
            shouldDeferStudentServiceStudentHubUntilBootstrap,
            renderStudentServiceBootstrapLoadingShell,
            renderStudentServiceBootstrapErrorBanner,
            scheduleStudentServiceBootstrap,
            getStudentServiceCurrentUser,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStudentServiceBootstrapApi({});
})();

