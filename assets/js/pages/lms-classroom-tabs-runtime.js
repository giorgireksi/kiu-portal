/* FINDABILITY: LMS classroom tabs / lazy modules — see docs/findability-index.md#lms-tabs */
/* LMS classroom tabs — Wave 25 KiuLmsClassroomTabs */
window.KiuLmsClassroomTabs=window.KiuLmsClassroomTabs||{};const __kiuLmsTabsApi=window.KiuLmsClassroomTabs;window.__kiuLmsTabsApi=__kiuLmsTabsApi;
function __kiuLmsTabsExpose(map){Object.keys(map).forEach((k)=>{__kiuLmsTabsApi[k]=map[k];window[k]=map[k];});}


/* Tab-owned heavy modules: load on first Grades / Live Quiz / Whiteboard / Quiz / Calls / Interaction use. */
const LMS_GRADEBOOK_MODULE_URLS = Object.freeze([
    'assets/js/pages/gradebook-history-ui-runtime.js?v=20260720-gbsize1',
    'assets/js/pages/gradebook-quiz-map-runtime.js?v=20260720-h2b',
    'assets/js/pages/gradebook-model.js?v=20260720-gbsize1',
    'assets/js/pages/gradebook-weights-runtime.js?v=20260720-gbsize1',
    'assets/js/pages/gradebook-components-runtime.js?v=20260720-h2b',
    'assets/js/pages/gradebook-workspace.js?v=20260720-gbsize1',
    'assets/js/pages/gradebook-staff.js?v=20260720-gbsize1'
]);
const LMS_LIVE_QUIZ_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-week-store-runtime.js?v=20260714-lmspro2',
    'assets/js/pages/lms-workspace-sync-timing.js?v=20260718-lmssync1',
    'assets/js/pages/lms-live-quiz-access-runtime.js?v=20260720-w18',
    'assets/js/pages/lms-live-quiz-workspace-runtime.js?v=20260714-lmspro2',
    'assets/js/pages/lms-live-quiz-podium-runtime.js?v=20260609-livequiz-podium1',
    'assets/js/pages/lms-live-quiz-session-runtime.js?v=20260720-lqsession1',
    'assets/js/pages/lms-live-quiz-ui-staff-runtime.js?v=20260728-livepatch1',
    'assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260728-livepatch1'
]);
const LMS_WHITEBOARD_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-workspace-sync-timing.js?v=20260718-lmssync1',
    'assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1',
    'assets/js/pages/lms-whiteboard-collab-runtime.js?v=20260708-wb-shapes-v4',
    'assets/js/pages/lms-whiteboard-history-runtime.js?v=20260708-wb-shapes-v4',
    'assets/js/pages/lms-whiteboard-minimap-runtime.js?v=20260708-wb-shapes-v4',
    'assets/js/pages/lms-whiteboard-document-runtime.js?v=20260708-wb-shapes-v4',
    'assets/js/pages/lms-whiteboard-model.js?v=20260720-w25wb1',
    'assets/js/pages/lms-whiteboard-model-bridge.js?v=20260720-w25wb1',
    'assets/js/pages/lms-whiteboard-pointer-runtime.js?v=20260728-wbpan1',
    'assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260719-wbchrome1',
    'assets/js/pages/lms-whiteboard-chrome-runtime.js?v=20260728-wbchrome2',
    'assets/js/pages/lms-whiteboard-session-runtime.js?v=20260720-wbsession1',
    'assets/js/pages/lms-whiteboard-selection-runtime.js?v=20260728-wbpan1',
    'assets/js/pages/lms-whiteboard-runtime.js?v=20260720-wbsession1'
]);
const LMS_QUIZ_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-grade-sync-runtime.js?v=20260518-lmsgrade1',
    'assets/js/pages/lms-quiz-model.js?v=20260720-w25quiz1',
    'assets/js/pages/lms-quiz-model-bridge.js?v=20260720-w25quiz1',
    'assets/js/pages/lms-quiz-blue-runtime.js?v=20260719-lmsblue1',
    'assets/js/pages/lms-quiz-focus-runtime.js?v=20260719-quizfocus1',
    'assets/js/pages/lms-quiz-workspace-session-runtime.js?v=20260720-quizsess1',
    'assets/js/pages/lms-quiz-workspace-review-runtime.js?v=20260720-w18',
    'assets/js/pages/lms-quiz-workspace-runtime.js?v=20260728-lmquiz4',
    'assets/js/pages/lms-protected-quiz-runtime.js?v=20260714-lmspro2'
]);
const LMS_CALLS_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-calls-runtime.js?v=20260518-lmscalls1'
]);
const LMS_INTERACTION_MODULE_URLS = Object.freeze([
    'assets/js/shared/messenger-gradebook-runtime.js?v=20260720-msgrgb1',
    'assets/js/shared/messenger-chrome-runtime.js?v=20260720-w18',
    'assets/js/shared/messenger.js?v=20260720-msgrgb1',
    'assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2'
]);
const LMS_CONTENT_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-file-storage-runtime.js?v=20260518-lmsfiles1',
    'assets/js/pages/lms-week-store-runtime.js?v=20260714-lmspro2',
    'assets/js/pages/lms-content-library-runtime.js?v=20260714-lmspro2',
    'assets/js/pages/lms-materials-runtime.js?v=20260714-lmspro2',
    'assets/js/pages/lms-assignments-runtime.js?v=20260714-lmspro2'
]);
const LMS_PERSONAL_DASHBOARD_MODULE_URLS = Object.freeze([
    'assets/js/pages/lms-personal-dashboard-runtime.js?v=20260715-lms-lazy2'
]);

const lmsRuntimeEnsurePromises = Object.create(null);

const LMS_SCRIPT_EXECUTION_MARKERS = Object.freeze([
    [/lms-quiz-model\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_MODEL_LOADED)],
    [/lms-quiz-model-bridge\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_MODEL_LOADED)],
    [/lms-quiz-blue-runtime\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_BLUE_LOADED)],
    [/lms-quiz-focus-runtime\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_FOCUS_LOADED)],
    [/lms-quiz-workspace-session-runtime\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_WORKSPACE_SESSION_LOADED)],
    [/lms-quiz-workspace-review-runtime\.js(\?|$)/, () => Boolean(window.__KIU_LMS_QUIZ_WORKSPACE_REVIEW_LOADED)],
    [/lms-quiz-workspace-runtime\.js(\?|$)/, () => typeof window.renderLmsQuizSection === 'function'],
    [/lms-protected-quiz-runtime\.js(\?|$)/, () => typeof window.launchProtectedQuizInAntiCheat === 'function'],
]);

function hasLmsScriptExecuted(url) {
    const entry = LMS_SCRIPT_EXECUTION_MARKERS.find(([pattern]) => pattern.test(url));
    return entry ? entry[1]() : true;
}

function waitForLmsScriptExecution(url, scriptEl, resolve, reject) {
    if (hasLmsScriptExecuted(url)) {
        scriptEl.dataset.kiuLoaded = '1';
        resolve();
        return;
    }
    let attempts = 0;
    const tick = () => {
        if (hasLmsScriptExecuted(url)) {
            scriptEl.dataset.kiuLoaded = '1';
            resolve();
            return;
        }
        if (++attempts >= 50) {
            reject(new Error(`LMS module loaded but did not execute: ${url}`));
            return;
        }
        queueMicrotask(tick);
    };
    queueMicrotask(tick);
}

function loadLmsScriptOnce(url) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            const settleLoaded = () => waitForLmsScriptExecution(url, existing, resolve, reject);
            if (existing.dataset.kiuLoaded === '1' && hasLmsScriptExecuted(url)) {
                resolve();
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                delete existing.dataset.kiuLoaded;
            }
            if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
                settleLoaded();
                return;
            }
            existing.addEventListener('load', settleLoaded, { once: true });
            existing.addEventListener('error', () => {
                reject(new Error(`Could not load LMS module: ${url}`));
            }, { once: true });
            // Parser-inserted defer/classic scripts (e.g. lms-quiz-blue-runtime.js in lms.html)
            // can finish before listeners attach; load will not fire again.
            queueMicrotask(() => {
                if (existing.readyState === 'loading') return;
                settleLoaded();
            });
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        script.dataset.kiuInjected = '1';
        // Wave 25: pure model leaves load as ESM; classic bridges follow in MODULE_URLS.
        if (/\/(lms-quiz-model|lms-whiteboard-model)\.js(\?|$)/.test(url)) {
            script.type = 'module';
        }
        script.addEventListener('load', () => {
            waitForLmsScriptExecution(url, script, resolve, reject);
        }, { once: true });
        script.addEventListener('error', () => {
            reject(new Error(`Could not load LMS module: ${url}`));
        }, { once: true });
        document.head.appendChild(script);
    });
}

function ensureLmsRuntimeModules(key, urls, isReady, label) {
    if (typeof isReady === 'function' && isReady()) return Promise.resolve(true);
    if (lmsRuntimeEnsurePromises[key]) return lmsRuntimeEnsurePromises[key];

    lmsRuntimeEnsurePromises[key] = urls
        .reduce((chain, url) => chain.then(() => loadLmsScriptOnce(url)), Promise.resolve())
        .then(() => {
            if (typeof isReady === 'function' && !isReady()) {
                throw new Error(`${label} runtime loaded without expected exports.`);
            }
            return true;
        })
        .catch((error) => {
            console.error(`LMS ${label} runtime load failed.`, error);
            throw error;
        })
        .finally(() => {
            lmsRuntimeEnsurePromises[key] = null;
        });

    return lmsRuntimeEnsurePromises[key];
}

function isLmsGradebookRuntimeReady() {
    return typeof window.openGradebookSection === 'function'
        || typeof window.renderGradebookRosterSelection === 'function'
        || typeof window.initStaffModernGradebook === 'function';
}

function isLmsLiveQuizRuntimeReady() {
    return typeof window.renderLmsLiveQuizSection === 'function';
}

function isLmsWhiteboardRuntimeReady() {
    return typeof window.renderLmsWhiteboardSection === 'function'
        || typeof window.ensureLmsWhiteboardWorkspace === 'function';
}

function isLmsQuizRuntimeReady() {
    return typeof window.renderLmsQuizSection === 'function'
        && typeof window.resolveLmsQuizWorkspace === 'function';
}

function isLmsCallsRuntimeReady() {
    return typeof window.renderLmsCallsSection === 'function';
}

function isLmsInteractionRuntimeReady() {
    return typeof window.ensureLmsInteractionUiState === 'function'
        && typeof window.renderLmsInteractionBodyMarkup === 'function';
}

function isLmsContentRuntimeReady() {
    return typeof window.ensureLmsWeeksForKey === 'function'
        && typeof window.renderLmsMaterialsLibrary === 'function'
        && typeof window.renderLmsConceptsLibrary === 'function'
        && typeof window.renderWorkspace === 'function';
}

function isLmsPersonalDashboardRuntimeReady() {
    return typeof window.openLmsPersonalDashboard === 'function'
        && typeof window.bindLmsPersonalDashboardChromeButton === 'function';
}

function ensureLmsGradebookRuntime() {
    return ensureLmsRuntimeModules('gradebook', LMS_GRADEBOOK_MODULE_URLS, isLmsGradebookRuntimeReady, 'gradebook');
}

function ensureLmsLiveQuizRuntime() {
    return ensureLmsRuntimeModules('live-quiz', LMS_LIVE_QUIZ_MODULE_URLS, isLmsLiveQuizRuntimeReady, 'live-quiz');
}

function ensureLmsWhiteboardRuntime() {
    return ensureLmsRuntimeModules('whiteboard', LMS_WHITEBOARD_MODULE_URLS, isLmsWhiteboardRuntimeReady, 'whiteboard');
}

function ensureLmsQuizRuntime() {
    return ensureLmsRuntimeModules('quiz', LMS_QUIZ_MODULE_URLS, isLmsQuizRuntimeReady, 'quiz');
}

function ensureLmsCallsRuntime() {
    return ensureLmsRuntimeModules('calls', LMS_CALLS_MODULE_URLS, isLmsCallsRuntimeReady, 'calls');
}

function ensureLmsInteractionRuntime() {
    return ensureLmsRuntimeModules('interaction', LMS_INTERACTION_MODULE_URLS, isLmsInteractionRuntimeReady, 'interaction');
}

function ensureLmsContentRuntime() {
    return ensureLmsRuntimeModules('content', LMS_CONTENT_MODULE_URLS, isLmsContentRuntimeReady, 'content');
}

function ensureLmsPersonalDashboardRuntime() {
    return ensureLmsRuntimeModules(
        'personal-dashboard',
        LMS_PERSONAL_DASHBOARD_MODULE_URLS,
        isLmsPersonalDashboardRuntimeReady,
        'personal-dashboard'
    );
}

function syncLmsPersonalDashboardChromeButtonLite() {
    const button = document.querySelector('[data-lms-action="open-personal-dashboard"]');
    const pageInner = document.getElementById('page-lms-inner');
    if (!button) return;
    button.hidden = !(pageInner && !pageInner.hidden);
}

__kiuLmsTabsExpose({
    isLmsGradebookRuntimeReady,
    ensureLmsGradebookRuntime,
    isLmsLiveQuizRuntimeReady,
    ensureLmsLiveQuizRuntime,
    isLmsWhiteboardRuntimeReady,
    ensureLmsWhiteboardRuntime,
    isLmsQuizRuntimeReady,
    ensureLmsQuizRuntime,
    isLmsCallsRuntimeReady,
    ensureLmsCallsRuntime,
    isLmsInteractionRuntimeReady,
    ensureLmsInteractionRuntime,
    isLmsContentRuntimeReady,
    ensureLmsContentRuntime,
    isLmsPersonalDashboardRuntimeReady,
    ensureLmsPersonalDashboardRuntime,
});
if (typeof window.syncLmsPersonalDashboardChromeButton !== 'function') {
    window['syncLmsPersonalDashboardChromeButton'] = syncLmsPersonalDashboardChromeButtonLite;
}

function closeLMSGroups() {
    setLmsPageSectionShown(document.getElementById('page-lms-groups'), false);
    setLmsPageSectionShown(document.getElementById('page-lms'), true);
}

function backToLMSGroups() {
    if (typeof closeLmsPersonalDashboard === 'function') closeLmsPersonalDashboard();
    if (typeof syncLmsPersonalDashboardChromeButton === 'function') syncLmsPersonalDashboardChromeButton();
    setLmsPageSectionShown(document.getElementById('page-lms-inner'), false);
    if (typeof isLmsStudentViewer === 'function' && isLmsStudentViewer()) {
        setLmsPageSectionShown(document.getElementById('page-lms-groups'), false);
        setLmsPageSectionShown(document.getElementById('page-lms'), true);
        return;
    }
    setLmsPageSectionShown(document.getElementById('page-lms-groups'), true);
}

function syncLmsCourseBackButtonLabel() {
    const button = document.querySelector('[data-lms-action="back-to-groups"]');
    if (!button) return;
    const isStudent = typeof isLmsStudentViewer === 'function' && isLmsStudentViewer();
    button.innerHTML = isStudent
        ? '<i class="fas fa-arrow-left"></i> Back to subjects'
        : '<i class="fas fa-arrow-left"></i> Back to groups';
}

function getLmsBulkDraftKey(subjectId = lmsBulkGroupContext.subjectId) {
    return `bulk-material::${String(subjectId || 'subject').trim() || 'subject'}`;
}

function buildLmsBulkGroupCourseKey(subjectId, groupId) {
    return resolveCanonicalLmsResourceKey(`${subjectId}::${groupId}`);
}

function buildLmsBulkGroupSectionResourceKey(subjectId, groupId, sectionType) {
    return resolveCanonicalLmsResourceKey(`${subjectId}::${groupId}${getLmsSectionSuffix(sectionType)}`);
}

function getSelectedLmsBulkGroups() {
    const checkedIds = new Set(Array.from(document.querySelectorAll('[data-lms-bulk-group-check="true"]:checked'))
        .map(input => String(input.dataset.groupId || '').trim())
        .filter(Boolean));
    return (lmsBulkGroupContext.groups || []).filter(group => checkedIds.has(String(group.id || '')));
}

function updateLmsBulkSelectionCount() {
    const count = getSelectedLmsBulkGroups().length;
    const target = document.getElementById('lms-bulk-selected-count');
    if (target) target.textContent = `${count} selected`;
    const buttons = document.querySelectorAll('[data-lms-bulk-requires-selection="true"]');
    buttons.forEach(button => {
        button.disabled = count === 0;
    });
}

function setLmsBulkGroupSelection(checked) {
    document.querySelectorAll('[data-lms-bulk-group-check="true"]').forEach(input => {
        input.checked = Boolean(checked);
    });
    updateLmsBulkSelectionCount();
}

function getLmsBulkSelectedWeeks() {
    const select = document.getElementById('lms-bulk-material-weeks');
    const values = select
        ? Array.from(select.selectedOptions).map(option => normalizeLmsWeekLabel(option.value))
        : [];
    const filtered = values.filter(value => value);
    return filtered.length ? filtered : [''];
}

function buildLmsBulkWeekOptions(subjectId, groups = []) {
    const labels = new Set(LMS_DEFAULT_WEEKS);
    const defaultSection = getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    const ensureWeeks = typeof ensureLmsWeeksForKey === 'function' ? ensureLmsWeeksForKey : null;
    if (ensureWeeks) {
        (groups || []).forEach(group => {
            const resourceKey = buildLmsBulkGroupSectionResourceKey(subjectId, group.id, defaultSection);
            ensureWeeks(resourceKey).forEach(week => labels.add(week));
        });
    }
    const sortWeeks = typeof sortLmsWeekLabels === 'function' ? sortLmsWeekLabels : ((list) => list);
    return [
        '<option value="">No Week / General</option>',
        ...sortWeeks([...labels]).map(week => `<option value="${escapeHtml(week)}">${escapeHtml(week)}</option>`)
    ].join('');
}

function renderLmsBulkGroupTools(subjectId, subjectTitle, groups = []) {
    const host = document.getElementById('lms-bulk-group-tools');
    if (!host) return;
    lmsBulkGroupContext = { subjectId, subjectTitle, groups: Array.isArray(groups) ? groups : [] };
    if (!canManageLmsGroupContent() || !groups.length) {
        host.innerHTML = '';
        return;
    }
    if (typeof ensureLmsWeeksForKey !== 'function' && typeof ensureLmsContentRuntime === 'function') {
        if (host.dataset.lmsContentLoading !== '1') {
            host.dataset.lmsContentLoading = '1';
            host.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span"><div class="lms-route-empty-title">Loading group tools…</div></div>';
            ensureLmsContentRuntime()
                .then(() => {
                    delete host.dataset.lmsContentLoading;
                    renderLmsBulkGroupTools(subjectId, subjectTitle, groups);
                })
                .catch(() => {
                    delete host.dataset.lmsContentLoading;
                    host.innerHTML = '<div class="lms-live-copy is-danger">Group tools failed to load.</div>';
                });
        }
        return;
    }
    const bulkKey = getLmsBulkDraftKey(subjectId);
    const token = toDomToken(bulkKey);
    const fileLabelId = `lms-bulk-material-file-label-${token}`;
    const defaultSection = getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    const subjectScheme = typeof getGradebookSubjectGradingScheme === 'function'
        ? (getGradebookSubjectGradingScheme(subjectId)
            || (typeof getGradebookSchemeForRoster === 'function'
                ? getGradebookSchemeForRoster('', subjectId)
                : null))
        : null;
    const bulkSchemeMarkup = typeof getGradebookGradingSchemeControlsMarkup === 'function'
        ? getGradebookGradingSchemeControlsMarkup(subjectScheme || {
            quiz: 10,
            oralQuiz: 10,
            classAssignment: 15,
            teamProject: 15,
            homework: 10,
            midterm: 20,
            final: 20
        }, false, {
            idPrefix: 'lms-bulk-',
            totalId: 'lms-bulk-scheme-total-points',
            schemeShellId: 'lms-bulk-grading-scheme-shell',
            shellLabel: 'Max points per component',
            subjectId
        })
        : '';
    host.innerHTML = `
        <section class="lms-route-panel lms-route-panel-compact lms-bulk-panel is-collapsed" id="lms-bulk-panel">
            <div class="lms-bulk-head">
                <div class="lms-bulk-head-main">
                    <span class="lms-bulk-icon"><i class="fas fa-layer-group"></i></span>
                    <div class="lms-route-min-w-0">
                        <div class="lms-bulk-title">Multi-group actions</div>
                        <div class="lms-bulk-copy">${escapeHtml(subjectTitle || 'Subject')} has ${groups.length} selectable group${groups.length !== 1 ? 's' : ''}.</div>
                    </div>
                </div>
                <div class="lms-bulk-head-actions">
                    <span id="lms-bulk-selected-count" class="lms-bulk-selection">0 selected</span>
                    <div class="lms-bulk-selection-actions">
                        <button type="button" class="lux-secondary-btn" data-lms-click="setLmsBulkGroupSelection(true)"><i class="fas fa-check"></i> All</button>
                        <button type="button" class="lux-secondary-btn" data-lms-click="setLmsBulkGroupSelection(false)"><i class="fas fa-xmark"></i> Clear</button>
                    </div>
                    <button type="button" class="lux-secondary-btn lms-bulk-toggle" data-lms-click="toggleLmsBulkToolsPanel(this)" aria-expanded="false">
                        <i class="fas fa-sliders"></i>
                        <span>Show tools</span>
                    </button>
                </div>
            </div>
            <div class="lms-bulk-body">
                <div class="lms-bulk-action-grid">
                    <div class="lms-route-card lms-route-panel-compact lms-bulk-card">
                        <div>
                            <div class="lms-bulk-title"><i class="fas fa-message"></i> Announcement</div>
                            <div class="lms-bulk-copy lms-route-copy-mt-5">Post one message to selected Interaction threads.</div>
                        </div>
                        <textarea id="lms-bulk-message-text" class="lms-route-textarea lux-control" rows="3" placeholder="Write the message students should see..."></textarea>
                        <div class="lms-bulk-actions">
                            <span class="lms-bulk-copy">Sender: ${escapeHtml(getSimulatedUserName())}</span>
                            <button type="button" class="lux-primary-btn" data-lms-bulk-requires-selection="true" data-lms-click="sendLmsBulkGroupMessage()"><i class="fas fa-paper-plane"></i> Send</button>
                        </div>
                    </div>
                    <div class="lms-route-card lms-route-panel-compact lms-bulk-card">
                        <div class="lms-bulk-head lms-bulk-head--plain">
                            <div>
                                <div class="lms-bulk-title"><i class="fas fa-folder-open"></i> Material</div>
                                <div class="lms-bulk-copy lms-route-copy-mt-5">Upload one file to selected groups and weeks.</div>
                            </div>
                            <span id="${fileLabelId}" class="lms-route-pill">No file selected</span>
                        </div>
                        <div class="lms-bulk-upload-grid">
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-title">Title</label>
                                <input id="lms-bulk-material-title" class="lms-route-input lux-control" type="text" placeholder="e.g. Week 5 slides">
                            </div>
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-section">Class type</label>
                                <select id="lms-bulk-material-section" class="lms-route-select lux-control">
                                    ${LMS_SECTION_TYPES.map(type => `<option value="${type}" ${type === defaultSection ? 'selected' : ''}>${escapeHtml(getLmsSectionMeta(type).label)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-weeks">Weeks</label>
                                <select id="lms-bulk-material-weeks" class="lms-route-select lux-control" multiple size="4">
                                    ${buildLmsBulkWeekOptions(subjectId, groups)}
                                </select>
                            </div>
                        </div>
                        <div class="lms-route-field">
                            <label class="lms-route-field-label" for="lms-bulk-material-description">Description</label>
                            <input id="lms-bulk-material-description" class="lms-route-input lux-control" type="text" placeholder="Optional student-facing note">
                        </div>
                        <div class="lms-bulk-actions">
                            <button type="button" class="lux-secondary-btn" data-lms-click="pickLocalLmsFile('material', ${lmsInlineArg(bulkKey)}, ${lmsInlineArg(fileLabelId)})"><i class="fas fa-paperclip"></i> Choose</button>
                            <button type="button" class="lux-primary-btn" data-lms-bulk-requires-selection="true" data-lms-click="createLmsBulkMaterialUpload()"><i class="fas fa-cloud-upload-alt"></i> Upload</button>
                        </div>
                    </div>
                    <div class="lms-route-card lms-route-panel-compact lms-bulk-card lms-bulk-card--grading-scheme">
                        <div>
                            <div class="lms-bulk-title"><i class="fas fa-table-list"></i> Grading scheme</div>
                            <div class="lms-bulk-copy lms-route-copy-mt-5">Set max points per assessment type for this subject. Applies to all ${groups.length} group${groups.length !== 1 ? 's' : ''} automatically.</div>
                        </div>
                        <div class="lms-bulk-grading-scheme-fields">
                            ${bulkSchemeMarkup}
                        </div>
                        <div class="lms-bulk-actions">
                            <span class="lms-bulk-copy">Use Edit, then Save. No group selection required.</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    updateLmsBulkSelectionCount();
}

function applyLmsBulkSubjectGradingScheme() {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can update the grading scheme.');
        return;
    }
    const subjectId = String(lmsBulkGroupContext?.subjectId || '').trim();
    if (!subjectId) {
        alert('No subject context for the grading scheme.');
        return;
    }
    const panel = document.getElementById('lms-bulk-panel');
    const shell = panel?.querySelector('[data-gb-scheme-shell]');
    const saveScheme = typeof saveGradebookGradingSchemeFromShell === 'function'
        ? saveGradebookGradingSchemeFromShell
        : window.saveGradebookGradingSchemeFromShell;
    if (typeof saveScheme !== 'function') {
        alert('Gradebook grading scheme controls are not available.');
        return;
    }
    const saved = saveScheme(shell, subjectId, { refreshGradebook: false });
    if (!saved) return;
    const groupCount = Array.isArray(lmsBulkGroupContext?.groups) ? lmsBulkGroupContext.groups.length : 0;
    alert(`Grading scheme saved for this subject (${saved.courseTotal} points, ${groupCount} group${groupCount === 1 ? '' : 's'}).`);
}

function applyLmsBulkSubjectGradeWeights() {
    return applyLmsBulkSubjectGradingScheme();
}

function toggleLmsBulkToolsPanel(button) {
    const panel = document.getElementById('lms-bulk-panel');
    if (!panel) return;
    const isCollapsed = panel.classList.toggle('is-collapsed');
    if (button) {
        button.setAttribute('aria-expanded', String(!isCollapsed));
        const label = button.querySelector('span');
        if (label) label.textContent = isCollapsed ? 'Show tools' : 'Hide tools';
        const icon = button.querySelector('i');
        if (icon) icon.className = isCollapsed ? 'fas fa-sliders' : 'fas fa-chevron-up';
    }
}

function sendLmsBulkGroupMessage() {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can send multi-group messages.');
        return;
    }
    const selected = getSelectedLmsBulkGroups();
    const text = String(document.getElementById('lms-bulk-message-text')?.value || '').trim();
    if (!selected.length) {
        alert('Select at least one group first.');
        return;
    }
    if (!text) {
        alert('Write the announcement first.');
        return;
    }
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    selected.forEach(group => {
        const courseKey = buildLmsBulkGroupCourseKey(lmsBulkGroupContext.subjectId, group.id);
        if (!Array.isArray(KIU_STATE.messages[courseKey])) KIU_STATE.messages[courseKey] = [];
        KIU_STATE.messages[courseKey].push(buildLmsInteractionMessagePayload(text, {
            type: 'announcement',
            bulk: true,
            targetGroupId: group.id,
            targetGroupName: group.group || group.name || group.id
        }));
    });
    saveState();
    const input = document.getElementById('lms-bulk-message-text');
    if (input) input.value = '';
    if (selected.some(group => buildLmsBulkGroupCourseKey(lmsBulkGroupContext.subjectId, group.id) === resolveCanonicalLmsResourceKey(currentCourseId)) && getCurrentLmsActiveTab() === 'interaction') {
        const resourceKey = resolveCanonicalLmsResourceKey(currentCourseId);
        if (!updateLmsInteractionStreamUi(resourceKey)) {
            renderLmsInteractionSection(currentCourseId);
        } else {
            const stream = document.getElementById('lms-interaction-stream');
            if (stream) scrollLmsInteractionStreamToBottom(stream);
        }
    }
    alert(`Message sent to ${selected.length} group${selected.length === 1 ? '' : 's'}.`);
}

async function createLmsBulkMaterialUpload() {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can upload materials to multiple groups.');
        return;
    }
    const selected = getSelectedLmsBulkGroups();
    const title = String(document.getElementById('lms-bulk-material-title')?.value || '').trim();
    const description = String(document.getElementById('lms-bulk-material-description')?.value || '').trim();
    const sectionType = normalizeLmsSectionType(document.getElementById('lms-bulk-material-section')?.value) || getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    const weeks = getLmsBulkSelectedWeeks();
    const bulkKey = getLmsBulkDraftKey();
    const file = getLmsDraftFile('material', bulkKey);
    if (!selected.length) {
        alert('Select at least one group first.');
        return;
    }
    if (!title) {
        alert('Add a material title first.');
        return;
    }
    if (!file) {
        alert('Choose a file first.');
        return;
    }
    try {
        const persistedFile = await persistLmsStoredFile(file, 'material');
        let createdCount = 0;
        selected.forEach((group, groupIndex) => {
            const resourceKey = buildLmsBulkGroupSectionResourceKey(lmsBulkGroupContext.subjectId, group.id, sectionType);
            const materials = ensureLmsMaterialsForKey(resourceKey);
            const configuredWeeks = ensureLmsWeeksForKey(resourceKey);
            weeks.forEach((weekLabel, weekIndex) => {
                const normalizedWeek = normalizeLmsWeekLabel(weekLabel);
                if (normalizedWeek && !configuredWeeks.some(week => week.toLowerCase() === normalizedWeek.toLowerCase())) {
                    configuredWeeks.push(normalizedWeek);
                    KIU_STATE.groupWeekConfigs[resourceKey] = sortLmsWeekLabels(configuredWeeks);
                }
                materials.unshift({
                    id: `material_${Date.now()}_${groupIndex}_${weekIndex}`,
                    title,
                    description,
                    weekLabel: normalizedWeek,
                    file: cloneStoredFile(persistedFile),
                    uploadedBy: getSimulatedUserName(),
                    uploadedAt: new Date().toISOString(),
                    bulkUpload: true,
                    targetGroupId: group.id
                });
                createdCount += 1;
            });
        });
        clearLmsDraftFile('material', bulkKey);
        const fileLabel = document.getElementById(`lms-bulk-material-file-label-${toDomToken(bulkKey)}`);
        if (fileLabel) fileLabel.textContent = 'No file selected';
        ['lms-bulk-material-title', 'lms-bulk-material-description'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        saveState();
        if (getCurrentLmsActiveTab() === 'materials') rerenderCurrentLmsTab();
        alert(`Material uploaded to ${selected.length} group${selected.length === 1 ? '' : 's'} (${createdCount} material record${createdCount === 1 ? '' : 's'}).`);
    } catch (error) {
        console.error('Bulk material upload failed.', error);
        alert('Bulk material upload failed.');
    }
}

function normalizeLmsSessionMarkerType(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return LMS_SESSION_MARKER_TYPES[normalized] ? normalized : 'important';
}

function getLmsSessionMarkerTypeMeta(type) {
    const normalized = normalizeLmsSessionMarkerType(type);
    return {
        type: normalized,
        ...(LMS_SESSION_MARKER_TYPES[normalized] || LMS_SESSION_MARKER_TYPES.important)
    };
}

function normalizeLmsSessionMarkerWeekStart(weekStart) {
    if (typeof formatLocalDateISO === 'function' && typeof getWeekStartDate === 'function') {
        return formatLocalDateISO(getWeekStartDate(typeof parseLocalDate === 'function' ? (parseLocalDate(weekStart) || new Date()) : new Date(weekStart || Date.now())));
    }
    return String(weekStart || '').trim();
}

function getLmsSessionMarkerGroupKey(courseKey = currentCourseId) {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(courseKey || currentCourseId));
    if (!parsed.courseId || !parsed.groupId) return '';
    return resolveCanonicalLmsResourceKey(`${parsed.courseId}::${parsed.groupId}`);
}

function buildLmsSessionMarkerSessionKey(slot = {}) {
    const weekStart = normalizeLmsSessionMarkerWeekStart(slot.weekStart);
    const sectionType = normalizeLmsSectionType(slot.sectionType) || 'lecture';
    const day = repairLmsDisplayText(slot.day || '', '');
    const startTime = String(slot.startTime || slot.time || '').trim();
    return `${weekStart}|${sectionType}|${day}|${startTime}`;
}

function parseLmsWeekNumberInput(raw, maxWeek = 16) {
    const numbers = new Set();
    String(raw || '').split(',').forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        if (trimmed.includes('-')) {
            const [startRaw, endRaw] = trimmed.split('-', 2);
            const start = parseInt(startRaw, 10);
            const end = parseInt(endRaw, 10);
            if (!Number.isFinite(start) || !Number.isFinite(end)) return;
            const lo = Math.min(start, end);
            const hi = Math.max(start, end);
            for (let index = lo; index <= hi; index += 1) {
                if (index >= 1 && index <= maxWeek) numbers.add(index);
            }
        } else {
            const value = parseInt(trimmed, 10);
            if (Number.isFinite(value) && value >= 1 && value <= maxWeek) numbers.add(value);
        }
    });
    return [...numbers].sort((left, right) => left - right);
}

function getLmsWeekStartForNumber(weekNumber, baseWeekStart) {
    const base = normalizeLmsSessionMarkerWeekStart(baseWeekStart || (typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : new Date()));
    const offset = Math.max(0, parseInt(weekNumber, 10) - 1);
    return typeof shiftWeekStartISO === 'function' ? shiftWeekStartISO(base, offset) : base;
}

function getLmsGroupScheduleSlotsForWeek(courseKey = currentCourseId, weekStart = getCurrentWeekStartISO()) {
    const schedule = getLmsSessionScheduleForWeek(courseKey, weekStart);
    const normalizedWeek = normalizeLmsSessionMarkerWeekStart(weekStart);
    const weekLabel = typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(normalizedWeek) : normalizedWeek;
    if (!schedule?.active) {
        return [{
            weekStart: normalizedWeek,
            weekLabel,
            sectionType: 'lecture',
            day: '',
            startTime: '',
            time: '',
            endTime: '',
            room: '',
            instructor: '',
            active: false,
            sessionKey: ''
        }];
    }
    const sectionTypes = typeof LMS_SECTION_TYPES !== 'undefined' ? LMS_SECTION_TYPES : ['lecture', 'workshop'];
    return sectionTypes.map(sectionType => {
        const startTime = schedule.time || '';
        const sessionKey = buildLmsSessionMarkerSessionKey({
            weekStart: schedule.weekStart,
            sectionType,
            day: schedule.day,
            startTime,
            time: startTime
        });
        return {
            weekStart: schedule.weekStart,
            weekLabel: schedule.weekLabel || weekLabel,
            dateLabel: schedule.dateLabel || '',
            sectionType,
            day: schedule.day,
            startTime,
            time: startTime,
            endTime: schedule.endTime,
            room: schedule.room,
            instructor: schedule.instructor,
            active: true,
            sessionKey
        };
    });
}

function buildLmsMarkerSessionCandidates(courseKey = currentCourseId, weekNumbers = [], filters = {}) {
    const context = getLmsSessionMarkerContext(courseKey);
    if (!context || !weekNumbers.length) return [];
    const baseWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const sectionFilter = filters.sectionType && filters.sectionType !== 'all'
        ? normalizeLmsSectionType(filters.sectionType)
        : '';
    const markers = getLmsSessionMarkersForGroup(courseKey);
    const candidates = [];
    weekNumbers.forEach(weekNumber => {
        const weekStart = getLmsWeekStartForNumber(weekNumber, baseWeek);
        const slots = getLmsGroupScheduleSlotsForWeek(courseKey, weekStart);
        slots.forEach(slot => {
            if (sectionFilter && slot.sectionType !== sectionFilter) return;
            candidates.push({
                ...slot,
                weekNumber,
                existingMarker: slot.sessionKey ? findLmsSessionMarkerBySessionKey(markers, slot.sessionKey) : null,
                disabled: !slot.active || !slot.sessionKey
            });
        });
    });
    return candidates;
}

function findLmsSessionMarkerBySessionKey(markers = [], sessionKey = '') {
    const key = String(sessionKey || '').trim();
    if (!key) return null;
    return markers.find(marker => {
        if (marker.sessionKey === key) return true;
        if (marker.sessionKey) return false;
        return buildLmsSessionMarkerSessionKey(marker) === key;
    }) || null;
}

function upsertLmsSessionMarkerInList(markers = [], marker = {}, groupKey = '') {
    const normalized = normalizeLmsSessionMarker(marker, groupKey);
    const key = normalized.sessionKey;
    const index = markers.findIndex(item => {
        if (!key) return false;
        if (item.sessionKey === key) return true;
        if (!item.sessionKey && buildLmsSessionMarkerSessionKey(item) === key) return true;
        return false;
    });
    if (index >= 0) {
        const previous = markers[index];
        markers[index] = normalizeLmsSessionMarker({
            ...previous,
            ...normalized,
            id: previous.id,
            createdAt: previous.createdAt,
            createdBy: previous.createdBy || normalized.createdBy,
            updatedAt: new Date().toISOString()
        }, groupKey);
        return markers[index];
    }
    markers.push(normalized);
    return normalized;
}

function lmsSessionMarkerClassToken(value) {
    return String(value || 'important').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function normalizeLmsSessionMarker(marker = {}, groupKey = '') {
    const parsed = parseLmsCourseKey(groupKey || marker.groupKey || currentCourseId);
    const typeMeta = getLmsSessionMarkerTypeMeta(marker.type);
    const weekStart = normalizeLmsSessionMarkerWeekStart(marker.weekStart);
    const sectionType = normalizeLmsSectionType(marker.sectionType) || 'lecture';
    const day = repairLmsDisplayText(marker.day || '', '');
    const time = String(marker.time || '').trim();
    const sessionKey = String(marker.sessionKey || '').trim() || buildLmsSessionMarkerSessionKey({
        weekStart,
        sectionType,
        day,
        startTime: time,
        time
    });
    return {
        id: String(marker.id || `session_marker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
        courseId: marker.courseId || parsed.courseId || '',
        groupId: marker.groupId || parsed.groupId || '',
        weekStart,
        sessionKey,
        type: typeMeta.type,
        title: repairLmsDisplayText(marker.title || typeMeta.label, typeMeta.label),
        note: repairLmsDisplayText(marker.note || '', ''),
        sectionType,
        day,
        time,
        endTime: String(marker.endTime || '').trim(),
        room: repairLmsDisplayText(marker.room || '', ''),
        createdBy: repairLmsDisplayText(marker.createdBy || '', ''),
        createdAt: marker.createdAt || new Date().toISOString(),
        updatedAt: marker.updatedAt || marker.createdAt || new Date().toISOString()
    };
}

function getLmsSessionMarkersForGroup(courseKey = currentCourseId) {
    ensureLmsStores();
    const groupKey = getLmsSessionMarkerGroupKey(courseKey);
    if (!groupKey) return [];
    if (!Array.isArray(KIU_STATE.lmsSessionMarkers[groupKey])) KIU_STATE.lmsSessionMarkers[groupKey] = [];
    KIU_STATE.lmsSessionMarkers[groupKey] = KIU_STATE.lmsSessionMarkers[groupKey]
        .filter(marker => marker && typeof marker === 'object')
        .map(marker => normalizeLmsSessionMarker(marker, groupKey))
        .sort((left, right) => String(left.weekStart || '').localeCompare(String(right.weekStart || '')) || String(left.title || '').localeCompare(String(right.title || '')));
    return KIU_STATE.lmsSessionMarkers[groupKey];
}

function getLmsSessionMarkerContext(courseKey = currentCourseId) {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(courseKey || currentCourseId));
    if (!parsed.courseId || !parsed.groupId) return null;
    const subject = (typeof findCurriculumSubjectByIdOrTitle === 'function'
        ? findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty())
        : null)
        || (typeof getDomain === 'function' ? getDomain()?.subjectsById?.[parsed.courseId] : null)
        || (KIU_STATE.curriculum || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.courseId))
        || null;
    const groups = typeof getAvailableGroupsForSubject === 'function'
        ? getAvailableGroupsForSubject(subject?.id || parsed.courseId)
        : (KIU_STATE.availableGroups?.[subject?.id || parsed.courseId] || []);
    const group = groups.find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || (KIU_STATE.availableGroups?.[parsed.courseId] || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || null;
    return {
        courseId: subject?.id || parsed.courseId,
        groupId: group?.id || parsed.groupId,
        subject,
        group,
        groupKey: getLmsSessionMarkerGroupKey(`${subject?.id || parsed.courseId}::${group?.id || parsed.groupId}`)
    };
}

/* Session schedule/next-session helpers: lms-classroom-sessions-runtime.js */
const getLmsSessionScheduleForWeek = window.getLmsSessionScheduleForWeek;
const buildLmsNextSessionDatesFromSchedule = window.buildLmsNextSessionDatesFromSchedule;
const getLmsNextSessionForGroup = window.getLmsNextSessionForGroup;
const formatLmsNextSessionRelative = window.formatLmsNextSessionRelative;
const renderLmsNextSessionHtml = window.renderLmsNextSessionHtml;
const getLmsSessionMarkerComposerOptions = window.getLmsSessionMarkerComposerOptions;
const renderLmsSessionMarkerPreviewHtml = window.renderLmsSessionMarkerPreviewHtml;
const refreshLmsSessionMarkerPreview = window.refreshLmsSessionMarkerPreview;
const setLmsSessionMarkerType = window.setLmsSessionMarkerType;
const setLmsSessionMarkerWeekPreset = window.setLmsSessionMarkerWeekPreset;
const clearLmsSessionMarkerWeekInput = window.clearLmsSessionMarkerWeekInput;

function renderLmsSessionMarkerCards(courseKey = currentCourseId) {
    const markers = getLmsSessionMarkersForGroup(courseKey);
    const currentWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const canManage = canManageLmsGroupContent();
    if (!markers.length) {
        return renderLmsRouteEmptyState('No marked sessions yet', 'Quiz, exam, presentation, and important-session weeks will appear here and in the student timetable.', 'fa-calendar-check');
    }
    return `
        <div class="lms-session-marker-list">
            ${markers.map(marker => {
                const typeMeta = getLmsSessionMarkerTypeMeta(marker.type);
                const schedule = getLmsSessionScheduleForWeek(courseKey, marker.weekStart) || marker;
                const status = marker.weekStart === currentWeek ? 'current' : (marker.weekStart > currentWeek ? 'upcoming' : 'past');
                return `
                    <article class="lms-route-card lms-route-panel-compact lms-session-marker-card is-${escapeHtml(status)} marker-${lmsSessionMarkerClassToken(marker.type)}">
                        <div class="lms-session-marker-icon"><i class="fas ${escapeHtml(typeMeta.icon)}"></i></div>
                        <div class="lms-session-marker-main">
                            <div class="lms-session-marker-kicker">
                                <span>${escapeHtml(typeMeta.label)}</span>
                                <span>${escapeHtml(getLmsSectionMeta(marker.sectionType).label)}</span>
                                <span>${escapeHtml(status === 'current' ? 'This week' : status)}</span>
                            </div>
                            <h3>${escapeHtml(marker.title || typeMeta.label)}</h3>
                            <div class="lms-session-marker-schedule">
                                <span><i class="fas fa-calendar-week"></i> ${escapeHtml(typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(marker.weekStart) : marker.weekStart)}</span>
                                <span><i class="far fa-clock"></i> ${escapeHtml(schedule.day || marker.day || 'Day TBD')} ${escapeHtml(schedule.time || marker.time || 'TBD')}-${escapeHtml(schedule.endTime || marker.endTime || 'TBD')}</span>
                                <span><i class="fas fa-location-dot"></i> ${escapeHtml(schedule.room || marker.room || 'Room TBD')}</span>
                            </div>
                            ${marker.note ? `<p>${escapeHtml(marker.note)}</p>` : ''}
                        </div>
                        ${canManage ? `
                            <button type="button" class="lux-secondary-btn lms-session-marker-remove" data-lms-click="deleteLmsSessionMarker(${lmsInlineArg(marker.id)}, ${lmsInlineArg(courseKey)})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        ` : ''}
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderLmsSessionsSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('sessions', contentArea);
    const context = getLmsSessionMarkerContext(courseId);
    if (!context) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Sessions unavailable', 'Open a valid LMS group first.', 'fa-calendar-xmark');
        return;
    }
    const nextSession = getLmsNextSessionForGroup(courseId);
    const markers = getLmsSessionMarkersForGroup(courseId);
    const currentWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const activeCount = markers.filter(marker => marker.weekStart === currentWeek).length;
    const upcomingCount = markers.filter(marker => marker.weekStart >= currentWeek).length;
    const canManage = canManageLmsGroupContent();
    const defaultTitle = getLmsSessionMarkerTypeMeta('quiz').label;
    contentArea.innerHTML = `
        <div class="lms-session-planner-page">
            <section class="lms-route-hero lms-session-hero">
                <div class="lms-route-hero-grid">
                    <div>
                        <div class="lms-route-eyebrow"><i class="fas fa-calendar-check"></i> Group Sessions</div>
                        <div class="lms-route-title lms-route-title-mt-10">${escapeHtml(context.subject?.name || context.courseId)} - ${escapeHtml(context.group?.name || context.groupId)}</div>
                        <div class="lms-route-copy lms-route-copy-mt-8">Mark quiz, exam, presentation, deadline, lab, or other important weeks once. Students see the highlighted session automatically in their timetable.</div>
                    </div>
                    ${renderLmsNextSessionHtml(nextSession, 'hero')}
                </div>
            </section>
            ${renderLmsRouteStats([
                { label: 'Marked weeks', value: markers.length },
                { label: 'This week', value: activeCount },
                { label: 'Upcoming', value: upcomingCount }
            ])}
            ${canManage ? `
                <section class="lms-route-panel lms-route-panel-compact lms-session-marker-composer" id="lms-session-marker-composer">
                    <div class="lms-session-marker-toolbar">
                        <div class="lms-session-marker-toolbar-main">
                            <span class="lms-bulk-icon"><i class="fas fa-wand-magic-sparkles"></i></span>
                            <div class="lms-route-min-w-0">
                                <div class="lms-route-card-title">Mark Important Timetable Weeks</div>
                                <div class="lms-route-copy lms-route-copy-mt-4">Pick real schedule slots, then mark quiz, exam, presentation, and other important sessions for the student timetable.</div>
                            </div>
                        </div>
                        <button type="button" class="lux-secondary-btn lms-session-marker-toggle" data-lms-click="toggleLmsSessionMarkerComposer(this)" aria-expanded="true">
                            <i class="fas fa-chevron-up"></i>
                            <span>Hide marker</span>
                        </button>
                    </div>
                    <div class="lms-session-marker-body">
                        <div class="lms-session-marker-workspace">
                            <input type="hidden" id="lms-session-marker-type" value="quiz">
                            <div class="lms-session-marker-filter-bar">
                                <div class="lms-session-marker-type-chips" role="group" aria-label="Marker type">
                                    ${Object.entries(LMS_SESSION_MARKER_TYPES).map(([type, meta]) => `
                                        <button type="button" class="lms-session-marker-type-chip${type === 'quiz' ? ' is-active' : ''}" data-marker-type="${escapeHtml(type)}" aria-pressed="${type === 'quiz' ? 'true' : 'false'}" data-lms-click="setLmsSessionMarkerType(${lmsInlineArg(type)})">
                                            <span class="lms-session-marker-type-chip-icon"><i class="fas ${escapeHtml(meta.icon)}"></i></span>
                                            <span class="lms-session-marker-type-chip-label">${escapeHtml(meta.label)}</span>
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="lms-session-marker-title-row">
                                    <label class="lms-route-field">
                                        <span class="lms-route-field-label">Title</span>
                                        <input id="lms-session-marker-title" class="lms-route-input lux-control" type="text" placeholder="${escapeHtml(defaultTitle)}">
                                    </label>
                                    <label class="lms-route-field">
                                        <span class="lms-route-field-label">Note for students</span>
                                        <input id="lms-session-marker-note" class="lms-route-input lux-control" type="text" placeholder="Optional: bring laptop, files, printed work, or ID card">
                                    </label>
                                </div>
                                <div class="lms-session-marker-week-row">
                                    <label class="lms-route-field lms-session-marker-week-field">
                                        <span class="lms-route-field-label">Weeks</span>
                                        <input id="lms-session-marker-week-input" class="lms-route-input lux-control" type="text" value="1,2,3,4,5" placeholder="1,2,3 or 1-5" data-lms-change="refreshLmsSessionMarkerPreview(${lmsInlineArg(courseId)})">
                                    </label>
                                    <div class="lms-session-marker-week-chips">
                                        <button type="button" class="lux-secondary-btn lms-session-marker-week-chip" data-lms-click="setLmsSessionMarkerWeekPreset('this', ${lmsInlineArg(courseId)})">This week</button>
                                        <button type="button" class="lux-secondary-btn lms-session-marker-week-chip" data-lms-click="setLmsSessionMarkerWeekPreset('next4', ${lmsInlineArg(courseId)})">Next 4 weeks</button>
                                        <button type="button" class="lux-secondary-btn lms-session-marker-week-chip" data-lms-click="clearLmsSessionMarkerWeekInput(${lmsInlineArg(courseId)})">Clear</button>
                                    </div>
                                    <label class="lms-route-field lms-session-marker-section-filter-field">
                                        <span class="lms-route-field-label">Class type</span>
                                        <select id="lms-session-marker-section-filter" class="lms-route-select lux-control" data-lms-change="refreshLmsSessionMarkerPreview(${lmsInlineArg(courseId)})">
                                            <option value="all">All</option>
                                            ${LMS_SECTION_TYPES.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(getLmsSectionMeta(type).label)}</option>`).join('')}
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class="lms-session-marker-preview-wrap">
                                <div class="lms-route-field-label">Schedule preview</div>
                                <div id="lms-session-marker-preview" class="lms-session-marker-preview">
                                    ${renderLmsSessionMarkerPreviewHtml(courseId)}
                                </div>
                            </div>
                            <div class="lms-session-marker-actions">
                                <button type="button" class="lux-primary-btn" data-lms-click="createLmsSessionMarkers(${lmsInlineArg(courseId)})"><i class="fas fa-calendar-plus"></i> Mark selected sessions</button>
                            </div>
                        </div>
                    </div>
                </section>
            ` : ''}
            <section class="lms-route-panel lms-session-marker-board">
                <div class="lms-route-card-head">
                    <div>
                        <div class="lms-route-card-title">Marked Sessions</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">These are the group sessions that will stand out in the timetable for enrolled students.</div>
                    </div>
                    <span class="lms-route-pill"><i class="fas fa-calendar-week"></i> ${escapeHtml(typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(currentWeek) : currentWeek)}</span>
                </div>
                ${renderLmsSessionMarkerCards(courseId)}
            </section>
        </div>
    `;
}

function createLmsSessionMarkers(courseId = currentCourseId) {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can mark important sessions.');
        return;
    }
    const context = getLmsSessionMarkerContext(courseId);
    if (!context) {
        alert('Open a valid group first.');
        return;
    }
    const selectedKeys = Array.from(document.querySelectorAll('.lms-session-marker-slot-check:checked'))
        .map(element => String(element.dataset.sessionKey || element.value || '').trim())
        .filter(Boolean);
    if (!selectedKeys.length) {
        alert('Select at least one session slot.');
        return;
    }
    const type = normalizeLmsSessionMarkerType(document.getElementById('lms-session-marker-type')?.value);
    const typeMeta = getLmsSessionMarkerTypeMeta(type);
    const title = repairLmsDisplayText(document.getElementById('lms-session-marker-title')?.value || typeMeta.label, typeMeta.label);
    const note = repairLmsDisplayText(document.getElementById('lms-session-marker-note')?.value || '', '');
    const groupKey = getLmsSessionMarkerGroupKey(courseId);
    const markers = getLmsSessionMarkersForGroup(courseId);
    const actor = getSimulatedUserName();
    const { weekNumbers } = getLmsSessionMarkerComposerOptions(courseId);
    const candidateByKey = new Map(
        buildLmsMarkerSessionCandidates(courseId, weekNumbers, { sectionType: 'all' })
            .filter(candidate => candidate.sessionKey)
            .map(candidate => [candidate.sessionKey, candidate])
    );
    selectedKeys.forEach(sessionKey => {
        const candidate = candidateByKey.get(sessionKey);
        if (!candidate || candidate.disabled) return;
        upsertLmsSessionMarkerInList(markers, {
            courseId: context.courseId,
            groupId: context.groupId,
            weekStart: candidate.weekStart,
            sessionKey,
            type,
            title,
            note,
            sectionType: candidate.sectionType,
            day: candidate.day,
            time: candidate.startTime || candidate.time,
            endTime: candidate.endTime,
            room: candidate.room,
            createdBy: actor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, groupKey);
    });
    KIU_STATE.lmsSessionMarkers[groupKey] = markers;
    saveState();
    renderLmsSessionsSection(courseId);
}

function toggleLmsSessionMarkerComposer(button) {
    const composer = document.getElementById('lms-session-marker-composer');
    if (!composer) return;
    const isCollapsed = composer.classList.toggle('is-collapsed');
    if (button) {
        button.setAttribute('aria-expanded', String(!isCollapsed));
        const label = button.querySelector('span');
        if (label) label.textContent = isCollapsed ? 'Show marker' : 'Hide marker';
        const icon = button.querySelector('i');
        if (icon) icon.className = isCollapsed ? 'fas fa-sliders' : 'fas fa-chevron-up';
    }
}

function deleteLmsSessionMarker(markerId, courseId = currentCourseId) {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can remove marked sessions.');
        return;
    }
    const groupKey = getLmsSessionMarkerGroupKey(courseId);
    if (!groupKey || !Array.isArray(KIU_STATE.lmsSessionMarkers?.[groupKey])) return;
    KIU_STATE.lmsSessionMarkers[groupKey] = KIU_STATE.lmsSessionMarkers[groupKey].filter(marker => String(marker.id) !== String(markerId));
    saveState();
    renderLmsSessionsSection(courseId);
}

__kiuLmsTabsExpose({
    renderLmsSessionsSection,
    createLmsSessionMarkers,
    deleteLmsSessionMarker,
    parseLmsWeekNumberInput,
    buildLmsSessionMarkerSessionKey,
    buildLmsMarkerSessionCandidates,
    normalizeLmsSessionMarker,
    refreshLmsSessionMarkerPreview,
    setLmsSessionMarkerType,
    setLmsSessionMarkerWeekPreset,
    clearLmsSessionMarkerWeekInput,
    getLmsNextSessionForGroup,
    formatLmsNextSessionRelative,
    renderLmsNextSessionHtml,
});


function openLMSCourse(courseKey, titleString) {
    // courseKey can be "LAW-1::g2" or legacy "hr", "law_g2" etc.
    currentCourseId = courseKey;
    currentLmsSectionType = getDefaultLmsSectionTypeForRole(getEffectiveUserRole());
    
    const pageLms = document.getElementById('page-lms');
    const pageLmsGroups = document.getElementById('page-lms-groups');
    const pageLmsInner = document.getElementById('page-lms-inner');
    setLmsPageSectionShown(pageLms, false);
    setLmsPageSectionShown(pageLmsGroups, false);
    setLmsPageSectionShown(pageLmsInner, true);

    const cleanTitle = repairLmsDisplayText(titleString, courseKey);
    if (document.getElementById('lms-course-title')) {
        document.getElementById('lms-course-title').innerText = cleanTitle;
    }
    if (typeof window !== 'undefined') window['currentCourseId'] = courseKey;
    if (typeof syncLmsCourseContext === 'function') syncLmsCourseContext(cleanTitle, courseKey);
    else if (typeof syncLmsNextSessionContext === 'function') syncLmsNextSessionContext(courseKey);
    syncLmsSectionSwitchPresentation();
    syncLmsCourseBackButtonLabel();

    switchLMSTab('sessions');
    if (typeof handleLmsPersonalDashboardSectionSwitch === 'function') handleLmsPersonalDashboardSectionSwitch();
    if (typeof syncLmsPersonalDashboardChromeButton === 'function') syncLmsPersonalDashboardChromeButton();
    if (typeof bindLmsPersonalDashboardChromeButton === 'function') bindLmsPersonalDashboardChromeButton();
    if (typeof scheduleLmsVisualShellSync === 'function') scheduleLmsVisualShellSync();
    if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
    requestAnimationFrame(() => syncLmsWorkspaceChromeOffset());
}

function refreshLmsQuizTabPresentation() {
    const quizTab = document.getElementById('tab-quiz');
    const liveQuizTab = document.getElementById('tab-live-quiz');
    const monitoringTab = document.getElementById('tab-monitoring');
    const gradebookTab = document.getElementById('tab-gradebook');
    if (!quizTab) return;
    const effectiveRole = getEffectiveUserRole();
    if (liveQuizTab) {
        liveQuizTab.innerHTML = effectiveRole === USER_ROLES.STUDENT
            ? '<i class="fas fa-bolt"></i> Live Quiz'
            : '<i class="fas fa-bolt"></i> Live Quiz';
        liveQuizTab.title = effectiveRole === USER_ROLES.STUDENT
            ? 'Answer live class questions shown by course staff'
            : 'Broadcast optional class questions to this group';
    }
    if (effectiveRole === USER_ROLES.STUDENT) {
        quizTab.innerHTML = '<i class="fas fa-pen-to-square"></i> My Quizzes';
        quizTab.title = 'Published quizzes for this group';
    } else {
        quizTab.innerHTML = '<i class="fas fa-pen-to-square"></i> Quiz Builder';
        quizTab.title = 'Create, publish, and review quizzes for this group';
    }
    if (monitoringTab) {
        monitoringTab.hidden = ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    }
    if (gradebookTab) {
        gradebookTab.innerHTML = '<i class="fas fa-chart-bar"></i> Grades';
        gradebookTab.title = effectiveRole === USER_ROLES.STUDENT
            ? 'View your scores and assessment history for this group'
            : 'Grade students in this group and review score history';
        gradebookTab.hidden = false;
    }
}

function renderLmsMembersSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('members', contentArea);

    const parsed = parseLmsCourseKey(courseId);
    const domain = getDomain();
    const subjectId = canonicalCourseKey(parsed.courseId);
    const groupId = canonicalCourseKey(parsed.groupId);
    const subject = domain?.subjectsById?.[subjectId] || findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty()) || null;
    const group = (KIU_STATE.availableGroups?.[subjectId] || KIU_STATE.availableGroups?.[parsed.courseId] || [])
        .find(item => canonicalCourseKey(item?.id) === groupId) || null;
    const students = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
    const currentViewerId = String(getCurrentUserId() || '');
    const professorUser = resolveUserFromName(domain?.usersById, group?.prof);
    const taUser = resolveUserFromName(domain?.usersById, group?.ta);
    const canViewMemberDetails = typeof canManageLmsGroupContent === 'function' && canManageLmsGroupContent();

    const buildRolePill = (label, tone) => `
        <span class="lms-route-pill ${tone}">
            ${escapeHtml(label)}
        </span>
    `;

    const buildMemberRow = (member, roleLabel, tone, fallbackName) => {
        const displayName = member?.nameEn || member?.name || fallbackName || 'Unknown member';
        const initials = String(displayName || '?').trim().charAt(0).toUpperCase() || '?';
        const memberId = member?.id || '';
        const memberEmail = member?.email || '';
        const facultyLabel = getFacultyLabel(member?.facultyCode || member?.faculty || group?.faculty || subject?.faculty || getCurrentFaculty());
        const youBadge = currentViewerId && String(memberId || '') === currentViewerId
            ? '<span class="lms-route-pill is-you">You</span>'
            : '';
        const metaParts = [
            facultyLabel,
            memberId || 'Not listed',
            memberEmail || 'Not listed'
        ];
        const metaLine = metaParts.map(part => escapeHtml(String(part))).join(' · ');
        const detailsMeta = canViewMemberDetails
            ? `<div class="lms-member-row__meta" title="${metaLine}">${metaLine}</div>`
            : '';
        return `
            <article class="lms-member-row">
                <div class="lms-member-row__person">
                    <div class="lms-route-avatar lms-member-row__avatar ${tone}" aria-hidden="true">
                        ${escapeHtml(initials)}
                    </div>
                    <div class="lms-member-row__copy">
                        <div class="lms-member-row__name">${escapeHtml(displayName)}</div>
                        ${detailsMeta}
                    </div>
                </div>
                <div class="lms-member-row__badges">
                    ${buildRolePill(roleLabel, tone)}
                    ${youBadge}
                </div>
            </article>
        `;
    };

    const sortedStudents = [...students].sort((left, right) => {
        const leftName = String(left?.name || left?.nameEn || '').trim();
        const rightName = String(right?.name || right?.nameEn || '').trim();
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
    });

    const studentRows = sortedStudents.length
        ? sortedStudents.map(student => {
            const studentUser = domain?.usersById?.[student.id] || null;
            return buildMemberRow(
                studentUser ? { ...studentUser, id: student.id } : { id: student.id, name: student.name },
                'Student',
                'is-student',
                student.name
            );
        }).join('')
        : '<div class="lms-member-empty-note"><i class="fas fa-user-graduate"></i> No students are enrolled in this group yet.</div>';

    const professorRow = group?.prof
        ? buildMemberRow(professorUser, 'Professor', 'is-professor', group.prof || 'Professor')
        : '<div class="lms-member-empty-note"><i class="fas fa-user-tie"></i> No professor is assigned to this group yet.</div>';

    const taRow = group?.ta
        ? buildMemberRow(taUser, 'Teaching Assistant', 'is-ta', group.ta)
        : '<div class="lms-member-empty-note"><i class="fas fa-user-plus"></i> No teaching assistant is assigned to this group yet.</div>';

    const studentSectionCopy = canViewMemberDetails
        ? 'Roster for admin, professor, TA, and student group views.'
        : 'Your classmates and teaching staff in this group.';

    contentArea.innerHTML = `
        <div class="lms-route-stack lms-member-stack">
            <div class="lms-route-panel lms-member-overview-panel">
                <div class="lms-route-card-head lms-member-overview-head">
                    <div class="lms-route-inline lms-route-inline-gap-12 lms-route-inline-center">
                        <i class="fas fa-users lms-route-icon-accent"></i>
                        <div>
                            <div class="lms-route-card-title lms-member-overview-title">Group Members</div>
                            <div class="lms-route-copy lms-route-copy-mt-4 lms-member-overview-copy">${escapeHtml(subject?.name || parsed.courseId || 'Course')} &middot; ${escapeHtml(group?.name || parsed.groupId || 'Group')}</div>
                        </div>
                    </div>
                    <div class="lms-route-actions lms-member-overview-actions">
                        <span class="lms-route-pill"><i class="fas fa-user-graduate"></i> ${students.length} students</span>
                        <span class="lms-route-pill"><i class="fas fa-door-open"></i> ${escapeHtml(group?.room || 'TBD')}</span>
                    </div>
                </div>
            </div>
            <section class="lms-member-section">
                <div class="lms-member-section-head">
                    <div>
                        <div class="lms-member-section-title">Teaching Staff</div>
                        <div class="lms-route-copy lms-member-section-copy">Professor and teaching assistant for this group.</div>
                    </div>
                </div>
                <div class="lms-member-row-list">
                    ${professorRow}
                    ${taRow}
                </div>
            </section>
            <section class="lms-member-section">
                <div class="lms-member-section-head">
                    <div>
                        <div class="lms-member-section-title">Students in This Group</div>
                        <div class="lms-route-copy lms-member-section-copy">${escapeHtml(studentSectionCopy)}</div>
                    </div>
                    <span class="lms-route-pill"><i class="fas fa-users"></i> ${students.length} student${students.length === 1 ? '' : 's'}</span>
                </div>
                <div class="lms-member-row-list">
                    ${studentRows}
                </div>
            </section>
        </div>
    `;
}

function createLmsInteractionMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeLmsInteractionMessages(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    if (!Array.isArray(KIU_STATE.messages[canonicalKey])) KIU_STATE.messages[canonicalKey] = [];
    let changed = false;
    KIU_STATE.messages[canonicalKey] = KIU_STATE.messages[canonicalKey].map(message => {
        const normalized = { ...message };
        if (!normalized.id) {
            normalized.id = createLmsInteractionMessageId();
            changed = true;
        }
        if (normalized.parentId == null && !normalized.type) {
            normalized.type = 'announcement';
            changed = true;
        }
        if (!normalized.type) {
            normalized.type = normalized.parentId ? 'reply' : 'announcement';
            changed = true;
        }
        if (!normalized.createdAt) {
            normalized.createdAt = new Date().toISOString();
            changed = true;
        }
        return normalized;
    });
    if (changed) saveState();
    return KIU_STATE.messages[canonicalKey];
}

function getLmsInteractionAnnouncements(resourceKey) {
    const messages = normalizeLmsInteractionMessages(resourceKey);
    return messages.filter(message => message.parentId == null || message.type === 'announcement');
}

function getLmsInteractionMessengerStats(resourceKey) {
    const announcements = getLmsInteractionAnnouncements(resourceKey).filter(isLmsInteractionMessageFromStaff);
    const replies = announcements.reduce((sum, post) => sum + getLmsInteractionRepliesForPost(resourceKey, post.id).length, 0);
    return {
        announcements: announcements.length,
        replies
    };
}

function getLmsInteractionRepliesForPost(resourceKey, parentId) {
    const messages = normalizeLmsInteractionMessages(resourceKey);
    return messages.filter(message => String(message.parentId || '') === String(parentId || ''));
}

function getLmsInteractionChildReplies(resourceKey, replyId) {
    const messages = normalizeLmsInteractionMessages(resourceKey);
    return messages.filter(message => String(message.parentId || '') === String(replyId || ''));
}

function getLmsInteractionStaffRoleLabel(message) {
    if (message?.isProf) return 'Professor';
    if (message?.isStaff) return 'TA';
    return 'Staff';
}

function renderLmsInteractionAvatar(name, tone = 'is-student') {
    const initials = String(name || '?').trim().charAt(0).toUpperCase() || '?';
    return `<div class="lms-interaction-avatar lms-route-avatar ${tone}" aria-hidden="true">${escapeHtml(initials)}</div>`;
}

function renderLmsInteractionRolePill(message) {
    const label = getLmsInteractionStaffRoleLabel(message);
    const tone = label === 'Professor' ? 'is-professor' : 'is-ta';
    return `<span class="lms-interaction-role-pill lms-route-pill ${tone}">${escapeHtml(label)}</span>`;
}

function renderLmsInteractionReplyComposer(resourceKey, parentId) {
    const inputId = `lms-interaction-reply-${toDomToken(resourceKey)}-${toDomToken(parentId)}`;
    return `
        <div class="lms-interaction-reply-compose">
            <input
                id="${inputId}"
                class="lms-interaction-compose-input"
                type="text"
                placeholder="Write a reply…"
                data-lms-interaction-reply-input="${escapeHtml(parentId)}"
            >
            <button
                class="lms-interaction-compose-send lux-secondary-btn"
                type="button"
                data-lms-click="sendLmsInteractionReply(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(parentId)})"
                aria-label="Send reply"
            ><i class="fas fa-paper-plane"></i></button>
        </div>
    `;
}

function renderLmsInteractionReply(reply, currentName, resourceKey, depth = 0) {
    const isMe = reply.sender === currentName;
    const tone = 'is-student';
    const childReplies = resourceKey ? getLmsInteractionChildReplies(resourceKey, reply.id) : [];
    const canReply = canReplyToLmsInteractionPost(reply);
    const meClass = depth === 0 && isMe ? ' is-me' : '';
    const nestedChildren = childReplies.length
        ? `<div class="lms-thread-lines">${childReplies.map(child => renderLmsInteractionReply(child, currentName, resourceKey, depth + 1)).join('')}</div>`
        : '';
    const inlineCompose = canReply
        ? `<div class="lms-interaction-inline-compose" data-lms-interaction-inline-compose="${escapeHtml(reply.id)}" hidden>
            <div class="lms-interaction-reply-compose lms-interaction-reply-compose--inline">
                <input class="lms-interaction-compose-input" type="text" placeholder="Write a reply…" data-lms-interaction-reply-input="${escapeHtml(reply.id)}" id="lms-interaction-reply-${toDomToken(resourceKey)}-${toDomToken(reply.id)}">
                <button class="lms-interaction-compose-submit" type="button" data-lms-click="sendLmsInteractionReply(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(reply.id)})">Comment</button>
                <button class="lms-interaction-compose-cancel" type="button" data-lms-click="toggleLmsInteractionInlineReply(${lmsInlineArg(reply.id)})">Cancel</button>
            </div>
        </div>`
        : '';
    return `
        <article class="lms-interaction-reply${meClass}" data-lms-interaction-reply-id="${escapeHtml(reply.id)}">
            <div class="lms-interaction-reply-main">
                ${renderLmsInteractionAvatar(reply.sender, tone)}
                <div class="lms-interaction-body">
                    <div class="lms-interaction-bubble-wrap">
                        <div class="lms-interaction-bubble-meta">
                            ${isMe ? 'You' : escapeHtml(reply.sender || 'Unknown')}
                            &middot; ${escapeHtml(reply.time || formatLmsDateTime(reply.createdAt))}
                        </div>
                        <div class="lms-interaction-bubble lms-interaction-bubble--reply">${escapeHtml(reply.text || '')}</div>
                        <div class="lms-interaction-reply-actions">
                            ${canReply ? `<button class="lms-interaction-reply-btn" type="button" data-lms-click="toggleLmsInteractionInlineReply(${lmsInlineArg(reply.id)})"><i class="fas fa-reply"></i> Reply</button>` : ''}
                        </div>
                    </div>
                    ${inlineCompose}
                    ${nestedChildren}
                </div>
            </div>
        </article>
    `;
}

function renderLmsInteractionThread(post, resourceKey, currentName) {
    const replies = getLmsInteractionRepliesForPost(resourceKey, post.id);
    const staffTone = post.isProf ? 'is-professor' : 'is-ta';
    return `
        <article class="lms-interaction-thread" data-lms-interaction-thread="${escapeHtml(post.id)}">
            <div class="lms-interaction-announcement">
                ${renderLmsInteractionAvatar(post.sender, staffTone)}
                <div class="lms-interaction-bubble-wrap">
                    <div class="lms-interaction-bubble-head">
                        <strong class="lms-interaction-sender">${escapeHtml(post.sender || 'Staff')}</strong>
                        ${renderLmsInteractionRolePill(post)}
                        ${post.bulk ? '<span class="lms-interaction-bulk-pill lms-route-pill">Multi-group</span>' : ''}
                    </div>
                    <div class="lms-interaction-bubble lms-interaction-bubble--staff">${escapeHtml(post.text || '')}</div>
                    <div class="lms-interaction-bubble-meta">${escapeHtml(post.time || formatLmsDateTime(post.createdAt))}</div>
                </div>
            </div>
            ${replies.length ? `<div class="lms-thread-lines">${replies.map(reply => renderLmsInteractionReply(reply, currentName, resourceKey, 0)).join('')}</div>` : ''}
            ${canReplyToLmsInteractionPost(post) ? `
                <div class="lms-interaction-reply-compose lms-interaction-reply-compose--inline">
                    <input class="lms-interaction-compose-input" type="text" placeholder="Write a reply…" data-lms-interaction-reply-input="${escapeHtml(post.id)}" id="lms-interaction-reply-${toDomToken(resourceKey)}-${toDomToken(post.id)}">
                    <button class="lms-interaction-compose-submit" type="button" data-lms-click="sendLmsInteractionReply(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(post.id)})">Comment</button>
                </div>
            ` : ''}
        </article>
    `;
}

function renderLmsInteractionStreamMarkup(resourceKey) {
    const announcements = getLmsInteractionAnnouncements(resourceKey).filter(isLmsInteractionMessageFromStaff);
    const currentName = getSimulatedUserName();
    const canManage = canPostLmsInteractionAnnouncement();
    if (!announcements.length) {
        const studentCta = canManage
            ? ''
            : `
                <button type="button" class="lux-secondary-btn lms-interaction-empty-cta" data-lms-interaction-mode="messages">Open class chat</button>
            `;
        return `
            <div class="lms-interaction-empty lms-route-empty lms-route-empty--interaction">
                <div class="lms-interaction-empty-icon lms-route-empty-icon"><i class="fas fa-comments"></i></div>
                <div class="lms-route-empty-title">${canManage ? 'No announcements yet' : 'Waiting for staff updates'}</div>
                <div class="lms-route-empty-copy">${canManage
                    ? 'Post an update for your class using the composer below.'
                    : 'Your professor or TA will post updates here. You can reply to their messages.'}</div>
                ${studentCta}
            </div>
        `;
    }
    return announcements.map(post => renderLmsInteractionThread(post, resourceKey, currentName)).join('');
}

function renderLmsInteractionComposerMarkup(resourceKey) {
    if (!canPostLmsInteractionAnnouncement()) {
        return `
            <div class="lms-interaction-student-hint">
                <i class="fas fa-info-circle" aria-hidden="true"></i>
                <span>Switch to Messages for class chat and attachments. Only your professor or TA can start new announcements here. Reply under their posts above.</span>
            </div>
        `;
    }
    return `
        <div class="lms-interaction-compose-row">
            <input
                id="lms-interaction-announce-input"
                class="lms-interaction-compose-input"
                type="text"
                placeholder="Post an announcement for your class…"
            >
            <button
                class="lms-interaction-compose-send lux-secondary-btn"
                type="button"
                data-lms-click="sendLmsInteractionMessage(${lmsInlineArg(resourceKey)})"
            ><i class="fas fa-paper-plane"></i> Send</button>
        </div>
    `;
}

function bindLmsInteractionComposerEvents(resourceKey) {
    if (typeof bindLmsInteractionDelegatedEvents === 'function') {
        bindLmsInteractionDelegatedEvents(document.getElementById('lms-content-area'));
    }
}

function scrollLmsInteractionStreamToBottom(stream) {
    if (!stream) return;
    stream.scrollTop = stream.scrollHeight;
}

function updateLmsInteractionStreamUi(resourceKey) {
    const stream = document.querySelector('[data-lms-interaction-region="stream"]');
    if (!stream) return false;
    const atBottom = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 48;
    stream.innerHTML = renderLmsInteractionStreamMarkup(resourceKey);
    if (atBottom) scrollLmsInteractionStreamToBottom(stream);
    syncLmsInteractionTabCacheFromDom(resourceKey);
    return true;
}

function updateLmsInteractionComposerUi(resourceKey) {
    const composer = document.querySelector('[data-lms-interaction-region="composer"]');
    if (!composer) return false;
    composer.innerHTML = renderLmsInteractionComposerMarkup(resourceKey);
    bindLmsInteractionComposerEvents(resourceKey);
    return true;
}

function syncLmsWorkspaceChromeOffset(contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return;
    const workspaceChrome = document.querySelector('#page-lms-inner .lms-route-workspace-chrome');
    let panelChrome = 0;
    if (workspaceChrome) {
        panelChrome = Math.ceil(workspaceChrome.getBoundingClientRect().height);
    } else {
        const cardHead = document.querySelector('#page-lms-inner .lms-route-card-head');
        const tabStrip = document.querySelector('#page-lms-inner .lms-route-tab-strip');
        if (cardHead) panelChrome += Math.ceil(cardHead.getBoundingClientRect().height);
        if (tabStrip) panelChrome += Math.ceil(tabStrip.getBoundingClientRect().height);
    }
    if (panelChrome > 0) {
        contentArea.style.setProperty('--lms-interaction-panel-chrome', `${panelChrome}px`);
        contentArea.style.setProperty('--lms-workspace-panel-chrome', `${panelChrome}px`);
    } else {
        contentArea.style.removeProperty('--lms-interaction-panel-chrome');
        contentArea.style.removeProperty('--lms-workspace-panel-chrome');
    }
    const pageInner = document.getElementById('page-lms-inner');
    if (contentArea.dataset.activeLmsTab === 'whiteboard') {
        const shell = document.body?.classList?.contains('kiu-lms-whiteboard-focus-active')
            ? (document.querySelector('.lms-whiteboard-shell[data-lms-whiteboard-fullscreen-mounted="1"]')
                || (typeof getActiveLmsWhiteboardShell === 'function' ? getActiveLmsWhiteboardShell() : null)
                || contentArea.querySelector('.lms-whiteboard-shell'))
            : contentArea.querySelector('.lms-whiteboard-shell');
        const layout = shell?.querySelector('.lms-whiteboard-layout');
        const panel = document.querySelector('#page-lms-inner .lms-route-panel-compact');
        const contentTop = Math.max(0, Math.ceil(contentArea.getBoundingClientRect().top));
        const panelTop = panel ? Math.max(0, Math.ceil(panel.getBoundingClientRect().top)) : contentTop;
        const prevContentTop = Number(contentArea.dataset.lmsWhiteboardContentTop || NaN);
        const prevPanelTop = Number(contentArea.dataset.lmsWhiteboardPanelTop || NaN);
        if (shell && layout) {
            const shellChrome = Math.max(0, Math.ceil(layout.getBoundingClientRect().top - shell.getBoundingClientRect().top));
            contentArea.style.setProperty('--lms-whiteboard-shell-chrome', `${shellChrome}px`);
        } else {
            contentArea.style.removeProperty('--lms-whiteboard-shell-chrome');
        }
        if (!Number.isFinite(prevContentTop) || Math.abs(contentTop - prevContentTop) >= 2) {
            contentArea.dataset.lmsWhiteboardContentTop = String(contentTop);
            contentArea.style.setProperty('--lms-whiteboard-content-top', `${contentTop}px`);
            if (pageInner) pageInner.style.setProperty('--lms-whiteboard-content-top', `${contentTop}px`);
        }
        if (!Number.isFinite(prevPanelTop) || Math.abs(panelTop - prevPanelTop) >= 2) {
            contentArea.dataset.lmsWhiteboardPanelTop = String(panelTop);
            if (pageInner) pageInner.style.setProperty('--lms-whiteboard-panel-top', `${panelTop}px`);
        }
    } else {
        contentArea.style.removeProperty('--lms-whiteboard-shell-chrome');
        contentArea.style.removeProperty('--lms-whiteboard-content-top');
        delete contentArea.dataset.lmsWhiteboardContentTop;
        delete contentArea.dataset.lmsWhiteboardPanelTop;
        if (pageInner) {
            pageInner.style.removeProperty('--lms-whiteboard-content-top');
            pageInner.style.removeProperty('--lms-whiteboard-panel-top');
        }
    }
}

function syncLmsInteractionChromeOffset(contentArea = document.getElementById('lms-content-area')) {
    return syncLmsWorkspaceChromeOffset(contentArea);
}

let lmsWorkspaceChromeResizeBound = false;

function bindLmsWorkspaceChromeResizeSync() {
    if (lmsWorkspaceChromeResizeBound) return;
    lmsWorkspaceChromeResizeBound = true;
    const scheduleSync = () => {
        requestAnimationFrame(() => syncLmsWorkspaceChromeOffset());
    };
    if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(scheduleSync);
        const watch = (node) => {
            if (node) observer.observe(node);
        };
        watch(document.getElementById('lms-content-area'));
        watch(document.querySelector('#page-lms-inner .lms-route-workspace-chrome'));
    }
    window.addEventListener('resize', scheduleSync, { passive: true });
}

bindLmsWorkspaceChromeResizeSync();

function removeOrphanLmsInteractionMessengerSections(contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return;
    document.querySelectorAll('#page-lms-inner .lms-interaction-messenger').forEach(section => {
        if (!contentArea.contains(section)) section.remove();
    });
}

const renderLmsInteractionSection = window.renderLmsInteractionSection;
const buildLmsInteractionMessagePayload = window.buildLmsInteractionMessagePayload;
const sendLmsInteractionMessage = window.sendLmsInteractionMessage;
const toggleLmsInteractionInlineReply = window.toggleLmsInteractionInlineReply;
const sendLmsInteractionReply = window.sendLmsInteractionReply;
const renderLmsAttendanceSection = window.renderLmsAttendanceSection;
const markLmsAttendanceStatus = window.markLmsAttendanceStatus;
const getLmsSectionEnhancementContext = window.getLmsSectionEnhancementContext;
const getLmsSectionEnhancementConfig = window.getLmsSectionEnhancementConfig;
const computeLmsMemberRisk = window.computeLmsMemberRisk;
const renderLmsDeepToolkitCard = window.renderLmsDeepToolkitCard;
const renderLmsDeepToolkitList = window.renderLmsDeepToolkitList;
const renderLmsDeepSectionToolkit = window.renderLmsDeepSectionToolkit;
const cleanupLmsInjectedEnhancementBlocks = window.cleanupLmsInjectedEnhancementBlocks;
const buildLmsTabRenderCacheKey = window.buildLmsTabRenderCacheKey;
const clearLmsTabRenderCache = window.clearLmsTabRenderCache;
const invalidateLmsLiveQuizTabCache = window.invalidateLmsLiveQuizTabCache;
const invalidateLmsWhiteboardTabCache = window.invalidateLmsWhiteboardTabCache;
const invalidateLmsInteractionTabCache = window.invalidateLmsInteractionTabCache;
const syncLmsInteractionTabCacheFromDom = window.syncLmsInteractionTabCacheFromDom;
const prepareLmsContentAreaForTab = window.prepareLmsContentAreaForTab;
const isLmsRenderCurrent = window.isLmsRenderCurrent;
const syncLmsTabRenderCacheFromDom = window.syncLmsTabRenderCacheFromDom;
const enhanceLmsTabExperience = window.enhanceLmsTabExperience;
const switchLMSTab = window.switchLMSTab;
function lmsInlineArg(value) {
    return escapeHtml(JSON.stringify(String(value == null ? '' : value)));
}

function toggleAccordion(element) {
    const weekPanel = element.closest('.lms-week-accordion-panel');
    if (weekPanel) {
        const content = weekPanel.querySelector('.lms-week-accordion-body');
        const icon = element.querySelector('i.fas');
        if (!content) return;
        const isCollapsed = weekPanel.classList.toggle('is-collapsed');
        content.hidden = isCollapsed;
        if (icon) icon.className = isCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        element.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        return;
    }
    const content = element.nextElementSibling;
    const icon = element.querySelector('i');
    if (!content) return;
    if (!content.hidden || content.classList.contains('active')) {
        content.hidden = true;
        content.classList.remove('active');
        if (icon) icon.className = 'fas fa-chevron-down';
    } else {
        content.hidden = false;
        content.classList.add('active');
        if (icon) icon.className = 'fas fa-chevron-up';
    }
}

__kiuLmsTabsExpose({
    sendLmsInteractionMessage,
    sendLmsInteractionReply,
    updateLmsInteractionStreamUi,
    updateLmsInteractionComposerUi,
    switchLMSTab,
    clearLmsTabRenderCache,
    buildLmsTabRenderCacheKey,
    syncLmsTabRenderCacheFromDom,
    invalidateLmsLiveQuizTabCache,
    invalidateLmsWhiteboardTabCache,
    invalidateLmsInteractionTabCache,
    syncLmsInteractionTabCacheFromDom,
    syncLmsWorkspaceChromeOffset,
    syncLmsInteractionChromeOffset,
    cleanupLmsInjectedEnhancementBlocks,
    renderLmsBulkGroupTools,
});
window['refreshLmsBulkGroupTools'] = function refreshLmsBulkGroupTools() {
    if (typeof lmsBulkGroupContext === 'undefined' || !lmsBulkGroupContext) return;
    renderLmsBulkGroupTools(lmsBulkGroupContext.subjectId, lmsBulkGroupContext.subjectTitle, lmsBulkGroupContext.groups);
};
