/* Protected quiz launch/runtime helpers extracted from lms.js. */

const LMS_PENDING_PROTECTED_QUIZ_LAUNCH_KEY = 'KIU_PENDING_PROTECTED_QUIZ_LAUNCH';

function buildKiuBlueHelperDefaultUrl() {
    try {
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            const host = window.location.hostname || '127.0.0.1';
            return `${window.location.protocol}//${host}:47831`;
        }
    } catch (error) {}
    return 'http://127.0.0.1:47831';
}

function buildAntiCheatDesktopBridgeOrigins() {
    const candidates = [];
    const pushOrigin = (value) => {
        try {
            const url = new URL(String(value || '').trim());
            if (url.origin) candidates.push(url.origin);
        } catch (error) {}
    };
    try {
        const protocol = window.location?.protocol === 'https:' ? 'https:' : 'http:';
        const hostname = window.location?.hostname || '127.0.0.1';
        pushOrigin(`${protocol}//${hostname}:47835`);
    } catch (error) {}
    pushOrigin(window.KIU_BLUE_HELPER_URL || localStorage.getItem('KIU_BLUE_HELPER_URL') || buildKiuBlueHelperDefaultUrl());
    pushOrigin('http://127.0.0.1:47835');
    pushOrigin('http://localhost:47835');
    return Array.from(new Set(candidates));
}

const ANTI_CHEAT_DESKTOP_BRIDGE_ORIGINS = buildAntiCheatDesktopBridgeOrigins();
let activeProtectedQuizBootstrapTimer = null;
let pendingProtectedQuizResumeScheduled = false;
let protectedQuizMonitorRuntime = { pending: false, groupKey: '', data: null };

function getProtectedQuizLaunchParams() {
    try {
        const params = new URLSearchParams(window.location.search || '');
        return {
            courseKey: String(params.get('protectedCourseKey') || '').trim(),
            quizId: String(params.get('protectedQuizId') || '').trim()
        };
    } catch (error) {
        return { courseKey: '', quizId: '' };
    }
}

function getProtectedQuizClientRuntime() {
    window.__KIU_PROTECTED_QUIZ_CLIENT_RUNTIME = window.__KIU_PROTECTED_QUIZ_CLIENT_RUNTIME || {
        pending: false,
        loaded: false,
        authorized: false,
        error: '',
        courseKey: '',
        quizId: '',
        payload: null
    };
    const runtime = window.__KIU_PROTECTED_QUIZ_CLIENT_RUNTIME;
    const params = getProtectedQuizLaunchParams();
    runtime.courseKey = params.courseKey;
    runtime.quizId = params.quizId;
    return runtime;
}

async function refreshProtectedQuizClientRuntime(force = false) {
    const runtime = getProtectedQuizClientRuntime();
    if (runtime.pending && !force) return runtime;
    if (runtime.loaded && !force) return runtime;
    runtime.pending = true;
    try {
        const authorized = isAntiCheatBrowserRuntime();
        runtime.payload = authorized ? {
            mode: 'anti-cheat-browser',
            userAgent: String(window.navigator?.userAgent || '')
        } : null;
        runtime.authorized = authorized;
        runtime.error = '';
    } catch (error) {
        runtime.payload = null;
        runtime.authorized = false;
        runtime.error = error?.message || 'Protected quiz browser state could not be validated.';
    } finally {
        runtime.loaded = true;
        runtime.pending = false;
    }
    return runtime;
}

function isProtectedQuizSessionAuthorized(resourceKey, quizId) {
    return isAntiCheatBrowserRuntime();
}

function getProtectedQuizInstallUrl() {
    const backend = typeof getKiuPortalBackendUrl === 'function' ? getKiuPortalBackendUrl() : '';
    if (!backend) return '#';
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase();
    let platform = 'windows';
    if (/android/.test(userAgent)) platform = 'android';
    else if (/macintosh|mac os x/.test(userAgent)) platform = 'macos';
    else if (/linux|x11/.test(userAgent) && !/android/.test(userAgent)) platform = 'linux';
    return `${String(backend).replace(/\/$/, '')}/download?platform=${encodeURIComponent(platform)}`;
}

function getProtectedQuizPreferredClientProfile() {
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);
    return isMobile
        ? { clientType: 'mobile-app', securityLevel: 'mobile-limited' }
        : { clientType: 'desktop-app', securityLevel: 'desktop-locked' };
}

function persistPendingProtectedQuizLaunch(resourceKey, quizId) {
    const payload = JSON.stringify({
        resourceKey: String(resourceKey || '').trim(),
        quizId: String(quizId || '').trim(),
        savedAt: new Date().toISOString()
    });
    try {
        sessionStorage.setItem(LMS_PENDING_PROTECTED_QUIZ_LAUNCH_KEY, payload);
    } catch (error) {}
}

function consumePendingProtectedQuizLaunch() {
    let raw = '';
    try {
        raw = String(sessionStorage.getItem(LMS_PENDING_PROTECTED_QUIZ_LAUNCH_KEY) || '').trim();
        if (raw) sessionStorage.removeItem(LMS_PENDING_PROTECTED_QUIZ_LAUNCH_KEY);
        sessionStorage.removeItem('LMS_PENDING_PROTECTED_QUIZ_LAUNCH_REASON');
    } catch (error) {
        raw = '';
    }
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        const resourceKey = String(parsed?.resourceKey || '').trim();
        const quizId = String(parsed?.quizId || '').trim();
        if (!resourceKey || !quizId) return null;
        return { resourceKey, quizId };
    } catch (error) {
        return null;
    }
}

function redirectToProtectedQuizLogin(resourceKey, quizId, reason = '') {
    persistPendingProtectedQuizLaunch(resourceKey, quizId);
    if (reason) {
        try {
            sessionStorage.setItem('LMS_PENDING_PROTECTED_QUIZ_LAUNCH_REASON', String(reason || ''));
        } catch (error) {}
    }
    window.location.href = 'login.html';
}

function schedulePendingProtectedQuizLaunchResume() {
    if (pendingProtectedQuizResumeScheduled) return;
    pendingProtectedQuizResumeScheduled = true;
    setTimeout(async () => {
        pendingProtectedQuizResumeScheduled = false;
        const pendingLaunch = consumePendingProtectedQuizLaunch();
        if (!pendingLaunch) return;
        const portalToken = typeof getPortalSessionToken === 'function' ? String(getPortalSessionToken() || '').trim() : '';
        if (!portalToken) {
            persistPendingProtectedQuizLaunch(pendingLaunch.resourceKey, pendingLaunch.quizId);
            return;
        }
        await launchProtectedQuizInAntiCheat(pendingLaunch.resourceKey, pendingLaunch.quizId);
    }, 0);
}

async function fetchDesktopBridgeJson(origin, path, options = {}) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeoutMs = Number(options.timeoutMs || 1200);
    let timeoutId = null;
    if (controller && timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }
    try {
        const response = await fetch(`${String(origin || '').replace(/\/$/, '')}${path}`, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            signal: controller?.signal
        });
        const payload = await response.json().catch(() => ({}));
        return {
            ok: response.ok && payload?.ok !== false,
            status: response.status,
            payload
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            payload: null
        };
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

function wakeAntiCheatDesktopApp(protocolUrl = 'anticheat://open?screen=settings&source=kiu-lms') {
    const targetUrl = String(protocolUrl || '').trim();
    if (!targetUrl) return;
    try {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.setAttribute('aria-hidden', 'true');
        frame.src = targetUrl;
        document.body.appendChild(frame);
        setTimeout(() => {
            try {
                frame.remove();
            } catch (error) {}
        }, 1500);
        return;
    } catch (error) {}
    try {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            try {
                link.remove();
            } catch (error) {}
        }, 1500);
    } catch (error) {}
}

function getAntiCheatLmsLaunchUrl() {
    try {
        const launchUrl = new URL('lms.html', window.location.href);
        const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '';
        if (effectiveRole) {
            launchUrl.searchParams.set('view', String(effectiveRole));
        }
        return launchUrl.toString();
    } catch (error) {
        return 'lms.html';
    }
}

function buildAntiCheatDesktopOpenUrl(options = {}) {
    const launchUrl = String(options.launchUrl || getAntiCheatLmsLaunchUrl()).trim();
    const screen = String(options.screen || 'lms').trim().toLowerCase() || 'lms';
    const params = new URLSearchParams();
    params.set('screen', screen);
    params.set('source', 'kiu-lms');
    if (launchUrl) {
        params.set('launchUrl', launchUrl);
    }
    if (typeof getKiuPortalBackendUrl === 'function') {
        const backendUrl = String(getKiuPortalBackendUrl() || '').trim().replace(/\/$/, '');
        if (backendUrl) {
            params.set('backendUrl', backendUrl);
        }
    }
    return `anticheat://open?${params.toString()}`;
}

async function findActiveAntiCheatDesktopBridge() {
    for (const origin of ANTI_CHEAT_DESKTOP_BRIDGE_ORIGINS) {
        const health = await fetchDesktopBridgeJson(origin, '/health', { timeoutMs: 900 });
        if (health.ok) return origin;
    }
    return '';
}

async function waitForAntiCheatDesktopBridge(options = {}) {
    const timeoutMs = Number(options.timeoutMs || 10000);
    const intervalMs = Number(options.intervalMs || 350);
    const wakeProtocolUrl = String(options.wakeProtocolUrl || '').trim();
    const startedAt = Date.now();
    let wakeIssued = false;
    while ((Date.now() - startedAt) <= timeoutMs) {
        const origin = await findActiveAntiCheatDesktopBridge();
        if (origin) return origin;
        if (!wakeIssued && wakeProtocolUrl) {
            wakeIssued = true;
            wakeAntiCheatDesktopApp(wakeProtocolUrl);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return '';
}

async function handoffProtectedLaunchToDesktopBridge(launchUrl, options = {}) {
    const targetUrl = String(launchUrl || '').trim();
    if (!targetUrl) return false;
    const origin = await waitForAntiCheatDesktopBridge({
        timeoutMs: Number(options.timeoutMs || 10000),
        intervalMs: Number(options.intervalMs || 350),
        wakeProtocolUrl: String(options.wakeProtocolUrl || '').trim()
    });
    if (!origin) return false;
    const launch = await fetchDesktopBridgeJson(origin, '/launch', {
        method: 'POST',
        timeoutMs: 2500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ launchUrl: targetUrl, source: 'kiu-lms' })
    });
    return launch.ok;
}

async function attemptProtectedAppLaunch(launchUrl, fallbackOptions = {}) {
    const targetUrl = String(launchUrl || '').trim();
    if (!targetUrl) return;
    const normalizedOptions = typeof fallbackOptions === 'string'
        ? { message: fallbackOptions, fallbackUrl: '' }
        : (fallbackOptions && typeof fallbackOptions === 'object' ? fallbackOptions : {});
    const fallbackMessage = String(normalizedOptions.message || '').trim();
    const fallbackUrl = String(normalizedOptions.fallbackUrl || '').trim();
    const wakeProtocolUrl = String(
        normalizedOptions.wakeProtocolUrl
        || 'anticheat://open?screen=settings&source=kiu-lms-launch'
        || ''
    ).trim();
    const bridgeAccepted = await handoffProtectedLaunchToDesktopBridge(targetUrl, {
        wakeProtocolUrl,
        timeoutMs: Number(normalizedOptions.bridgeTimeoutMs || 10000),
        intervalMs: Number(normalizedOptions.bridgePollIntervalMs || 350)
    });
    if (bridgeAccepted) return;
    let settled = false;
    const cleanup = () => {
        window.removeEventListener('blur', markSuccess, true);
        window.removeEventListener('pagehide', markSuccess, true);
        document.removeEventListener('visibilitychange', handleVisibilityChange, true);
    };
    const markSuccess = () => {
        settled = true;
        cleanup();
    };
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            markSuccess();
        }
    };
    window.addEventListener('blur', markSuccess, true);
    window.addEventListener('pagehide', markSuccess, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    wakeAntiCheatDesktopApp(targetUrl);
    setTimeout(() => {
        if (settled) return;
        cleanup();
        if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
            try {
                window.open(fallbackUrl, '_blank', 'noopener');
            } catch (error) {}
        }
        if (fallbackMessage) alert(fallbackMessage);
    }, 3500);
}

function openAntiCheatDesktopApp() {
    const protocolUrl = buildAntiCheatDesktopOpenUrl();
    wakeAntiCheatDesktopApp(protocolUrl);
    return { protocolUrl };
}

function openProtectedQuizLaunchPopup(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        const text = String(value).trim();
        if (!text) return;
        searchParams.set(key, text);
    });
    const popupUrl = `protected-launch.html${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const popupFeatures = [
        'popup=yes',
        'width=520',
        'height=760',
        'resizable=yes',
        'scrollbars=yes'
    ].join(',');
    const popup = window.open(popupUrl, 'kiuProtectedQuizLaunch', popupFeatures);
    if (!popup) {
        alert('The anti-cheat launch window was blocked by this browser. Allow popups for the KIU portal and try again.');
        return null;
    }
    try {
        popup.focus();
    } catch (error) {}
    return popup;
}

function resolveLmsProtectedQuizLaunchLabels(resourceKey, options = {}) {
    const subject = options.subject && typeof options.subject === 'object' ? options.subject : null;
    const group = options.group && typeof options.group === 'object' ? options.group : null;
    const parsed = parseLmsCourseKey(resourceKey || '');
    const lmsContext = resolveActiveLmsQuizContext(resourceKey) || {};
    return {
        subjectLabel: String(
            options.subjectLabel
            || subject?.name
            || lmsContext?.subject?.name
            || lmsContext?.courseId
            || parsed.courseId
            || 'Subject'
        ).trim(),
        groupLabel: String(
            options.groupLabel
            || group?.name
            || lmsContext?.group?.name
            || lmsContext?.groupId
            || parsed.groupId
            || 'Group'
        ).trim()
    };
}

function getProtectedQuizAllowedStudentsSnapshot(resourceKey, quiz = {}) {
    const allowedIds = new Set(getLmsQuizAllowedStudentIds(resourceKey, quiz).map(id => String(id)));
    return getLmsQuizEligibleStudents(resourceKey)
        .filter(student => allowedIds.has(String(student.id || '')))
        .map(student => ({
            id: String(student.id || ''),
            name: String(student.nameEn || student.name || `Student ${student.id}`),
            email: String(student.email || '')
        }));
}

async function syncProtectedQuizRecordToBackend(resourceKey, quiz, options = {}) {
    if (typeof syncProtectedQuizRecord !== 'function' || !quiz?.id) return null;
    const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '';
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole)) {
        return null;
    }
    try {
        return await syncProtectedQuizRecord({
            courseId: resolveCanonicalLmsResourceKey(resourceKey),
            resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
            groupKey: resolveCanonicalLmsResourceKey(resourceKey),
            quizId: String(quiz.id),
            title: quiz.title || getLmsQuizDisplayLabel(quiz),
            assessmentType: quiz.assessmentType || 'quiz',
            assessmentNumber: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
            status: options.status || quiz.status || getLmsQuizLifecycleStatus(quiz),
            publishedAt: quiz.publishedAt || null,
            publishedBy: quiz.publishedBy || getSimulatedUserName(),
            availableFrom: quiz.availableFrom || '',
            availableUntil: quiz.availableUntil || '',
            durationMinutes: quiz.durationMinutes || 20,
            protectedDelivery: true,
            monitoringEnabled: true,
            requiresDesktopClient: true,
            allowedPlatforms: ['windows', 'macos', 'linux', 'ios', 'android'],
            allowedStudentIds: getLmsQuizAllowedStudentIds(resourceKey, quiz),
            allowedStudents: getProtectedQuizAllowedStudentsSnapshot(resourceKey, quiz)
        });
    } catch (error) {
        console.warn('Protected quiz sync failed.', error);
        return null;
    }
}

async function syncProtectedQuizAttemptToBackend(resourceKey, quiz, submission, extras = {}) {
    if (typeof submitProtectedQuizAttempt !== 'function' || !quiz?.id || !submission?.studentId) return null;
    try {
        return await submitProtectedQuizAttempt(resolveCanonicalLmsResourceKey(resourceKey), quiz.id, {
            studentId: submission.studentId,
            studentName: submission.studentName || '',
            status: String(submission.status || '').trim() || 'submitted',
            submitReason: extras.submitReason || submission.proctorAutoSubmitReason || '',
            autoScoreRaw: submission.autoScoreRaw,
            manualScoreRaw: submission.manualScoreRaw,
            finalScoreRaw: submission.finalScoreRaw,
            gradebookScore: submission.gradebookScore,
            requiresManualReview: submission.requiresManualReview === true,
            manualScoresByQuestion: submission.manualScoresByQuestion || {},
            questionResults: Array.isArray(submission.questionResults) ? submission.questionResults : [],
            responseSummary: submission.responseSummary || null,
            gradedAt: submission.gradedAt || null,
            reviewedBy: submission.reviewedBy || submission.gradedBy || '',
            details: {
                ...(extras || {}),
                note: extras.note || '',
                submitReason: extras.submitReason || submission.proctorAutoSubmitReason || '',
                status: submission.status || ''
            }
        });
    } catch (error) {
        console.warn('Protected quiz attempt sync failed.', error);
        return null;
    }
}

async function logProtectedQuizEventToBackend(resourceKey, quizId, studentMeta, eventType, note, details = {}) {
    if (typeof postProtectedQuizEvent !== 'function' || !resourceKey || !quizId || !studentMeta?.id) return null;
    try {
        return await postProtectedQuizEvent(resolveCanonicalLmsResourceKey(resourceKey), quizId, {
            studentId: String(studentMeta.id || ''),
            studentName: String(studentMeta.name || ''),
            event: String(eventType || 'notice'),
            note: String(note || ''),
            details: {
                ...(details || {}),
                note: String(note || '')
            }
        });
    } catch (error) {
        console.warn('Protected quiz event sync failed.', error);
        return null;
    }
}

async function launchProtectedQuizInAntiCheat(resourceKey, quizId) {
    const quiz = getLmsQuizById(resourceKey, quizId);
    const studentMeta = resolveLmsQuizStudentMeta(resourceKey, quiz);
    if (!quiz || !studentMeta?.id) return null;
    const runtime = getProtectedQuizClientRuntime();
    runtime.courseKey = resolveCanonicalLmsResourceKey(resourceKey);
    runtime.quizId = String(quiz.id || '').trim();
    runtime.loaded = true;
    runtime.authorized = isAntiCheatBrowserRuntime();
    runtime.error = '';
    runtime.payload = runtime.authorized ? {
        mode: 'anti-cheat-browser',
        courseKey: runtime.courseKey,
        quizId: runtime.quizId
    } : null;
    if (runtime.authorized) {
        return { antiCheatBrowserActive: true };
    }
    const labels = resolveLmsProtectedQuizLaunchLabels(resourceKey);
    openAntiCheatDesktopApp();
    alert(`Protected quizzes only open inside the Anti-Cheat Browser. The app was opened separately. Sign in there, open ${labels.subjectLabel} / ${labels.groupLabel}, and start "${String(quiz.title || getLmsQuizDisplayLabel(quiz)).trim()}" from the LMS inside that browser.`);
    return { appOpened: true };
}

function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel) {
    const installUrl = getProtectedQuizInstallUrl();
    return `
        <div style="display:grid; place-items:center; min-height:420px; background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:24px; box-shadow:0 18px 36px rgba(15,23,42,0.05);">
            <div style="max-width:620px; padding:34px; text-align:center;">
                <div style="width:72px; height:72px; border-radius:22px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); display:grid; place-items:center; font-size:28px; margin:0 auto 18px;">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div style="font-size:26px; font-weight:900; color:var(--lux-text);">Protected Quiz Launch Required</div>
                <div style="font-size:13px; color:var(--lux-text-muted); line-height:1.8; margin-top:12px;">
                    ${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))} for ${escapeHtml(subjectLabel)} / ${escapeHtml(groupLabel)} can only be opened inside the anti-cheat application.
                    The regular browser LMS page will not reveal the answerable quiz body.
                </div>
                <div style="font-size:12px; color:var(--lux-text-muted); line-height:1.7; margin-top:12px;">
                    Open the Anti-Cheat Browser first, sign in there, then open this same LMS group and start the quiz from inside that protected browser. This page stays read-only in the regular browser.
                </div>
                <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:20px;">
                    <button type="button" class="kiu-btn-blue" data-lms-click="launchProtectedQuizInAntiCheat(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:12px 18px; font-size:13px;">
                        <i class="fas fa-arrow-up-right-from-square"></i> Open Anti-Cheat Browser
                    </button>
                    <button type="button" class="kiu-btn-outline" data-lms-click="openAntiCheatDesktopApp()" style="padding:12px 18px; font-size:13px;">
                        <i class="fas fa-desktop"></i> Open LMS In App
                    </button>
                    ${installUrl && installUrl !== '#' ? `<a href="${escapeHtml(installUrl)}" target="_blank" rel="noopener" class="kiu-btn-outline" style="padding:12px 18px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;"><i class="fas fa-download"></i> Install App</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

function bootstrapProtectedQuizRouteFromUrl() {
    const params = getProtectedQuizLaunchParams();
    if (!params.courseKey || !params.quizId) return;
    const applyBootstrap = async () => {
        if (typeof navigate !== 'function' || typeof openLMSCourse !== 'function' || typeof switchLMSTab !== 'function') return false;
        await refreshProtectedQuizClientRuntime();
        navigate('lms');
        openLMSCourse(params.courseKey, params.courseKey);
        const uiState = ensureLmsQuizUiState(params.courseKey);
        uiState.studentQuizId = String(params.quizId);
        uiState.studentRevealQuizId = String(params.quizId);
        switchLMSTab('quiz');
        renderLmsQuizSection(params.courseKey);
        return true;
    };
    setTimeout(() => {
        applyBootstrap().then((applied) => {
            if (applied || activeProtectedQuizBootstrapTimer) return;
            activeProtectedQuizBootstrapTimer = setInterval(async () => {
                const ready = await applyBootstrap();
                if (ready) {
                    clearInterval(activeProtectedQuizBootstrapTimer);
                    activeProtectedQuizBootstrapTimer = null;
                }
            }, 250);
            setTimeout(() => {
                if (activeProtectedQuizBootstrapTimer) {
                    clearInterval(activeProtectedQuizBootstrapTimer);
                    activeProtectedQuizBootstrapTimer = null;
                }
            }, 8000);
        });
    }, 50);
}

async function performProtectedMonitoringAction(resourceKey, quizId, studentId, action) {
    if (typeof performProtectedQuizStudentAction !== 'function') return;
    try {
        const payload = {
            actorUserId: getCurrentUserId() || '',
            actorName: getSimulatedUserName()
        };
        if (action === 'override-status') {
            const quiz = getLmsQuizById(resourceKey, quizId);
            const attempt = getLmsQuizSubmission(resourceKey, quizId, studentId) || quiz?.attempts?.[studentId] || {};
            const nextOverrideStatus = window.prompt('Enter an override status for this student session. Leave blank to clear it.', String(attempt.overrideStatus || ''));
            if (nextOverrideStatus === null) return;
            payload.overrideStatus = String(nextOverrideStatus || '').trim();
        }
        await performProtectedQuizStudentAction(resolveCanonicalLmsResourceKey(resourceKey), quizId, studentId, action, payload);
        if (action === 'force-submit') {
            const student = { id: studentId, name: `Student ${studentId}` };
            const quiz = getLmsQuizById(resourceKey, quizId);
            const submission = getLmsQuizSubmission(resourceKey, quizId, studentId);
            if (quiz && submission && !['submitted', 'auto-submitted', 'graded'].includes(String(submission.status || ''))) {
                finalizeLmsQuizSubmission(resourceKey, quiz, submission, studentId, submission.studentName || student.name, 'auto-submit');
                submission.proctorAutoSubmitReason = 'Force submitted by course staff.';
                saveState();
            }
        }
        renderLmsMonitoringSection(currentCourseId);
    } catch (error) {
        alert(error?.message || 'Monitoring action failed.');
    }
}

async function renderLmsMonitoringSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    const renderToken = prepareLmsContentAreaForTab('monitoring', contentArea);
    const context = resolveLmsQuizWorkspace(courseId);
    if (!context?.resourceKey) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Monitoring unavailable', 'Open a valid LMS group first.', 'fa-shield-halved');
        return;
    }
    const effectiveRole = getEffectiveUserRole();
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole)) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Monitoring locked', 'Only professor, TA, and admin roles can monitor protected quiz activity.', 'fa-user-lock');
        return;
    }
    contentArea.innerHTML = `<div class="lms-route-panel"><div class="lms-route-copy">Loading protected quiz monitoring - </div></div>`;
    let monitor = null;
    try {
        monitor = await fetchProtectedQuizMonitor(context.resourceKey);
        protectedQuizMonitorRuntime = { pending: false, groupKey: context.resourceKey, data: monitor };
    } catch (error) {
        protectedQuizMonitorRuntime = { pending: false, groupKey: context.resourceKey, data: null };
    }
    if (!isLmsRenderCurrent('monitoring', renderToken, contentArea)) return;
    const fallbackQuizzes = sortLmsQuizzes(ensureLmsQuizzesForKey(context.resourceKey).filter(quiz => getLmsQuizLifecycleStatus(quiz) === 'published'));
    const quizzes = Array.isArray(monitor?.quizzes) && monitor.quizzes.length ? monitor.quizzes : fallbackQuizzes.map(quiz => ({
        ...quiz,
        attempts: getLmsQuizAllowedStudentIds(context.resourceKey, quiz).map(studentId => ({
            student: {
                id: studentId,
                name: getLmsQuizEligibleStudents(context.resourceKey).find(student => String(student.id) === String(studentId))?.nameEn || `Student ${studentId}`
            },
            attempt: getLmsQuizSubmission(context.resourceKey, quiz.id, studentId) || {
                studentId,
                studentName: `Student ${studentId}`,
                status: 'not-started',
                warningCount: 0,
                violationCount: 0,
                antiCheatConnected: false,
                auditTrail: []
            }
        }))
    }));
    const quizBlocks = quizzes.length ? quizzes.map(quiz => {
        const rows = (quiz.attempts || []).map(entry => {
            const student = entry.student || {};
            const attempt = entry.attempt || {};
            const latestEvent = attempt.lastEvent || (Array.isArray(attempt.auditTrail) && attempt.auditTrail.length ? attempt.auditTrail[0] : null);
            const status = String(attempt.status || 'not-started');
            const heartbeat = attempt.lastHeartbeatAt ? formatLmsDateTime(attempt.lastHeartbeatAt) : 'No heartbeat';
            const disconnectLabel = formatLmsDurationLabel(attempt.disconnectAccumulatedMs || 0);
            const submitReason = String(attempt.submitReason || '').trim();
            const overrideStatus = String(attempt.overrideStatus || '').trim();
            const timeline = Array.isArray(attempt.auditTrail) && attempt.auditTrail.length
                ? attempt.auditTrail.slice(0, 6).map(event => `
                    <div style="padding:10px 12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.16);">
                        <div style="font-size:12px; font-weight:800; color:var(--lux-text);">${escapeHtml(event.note || event.type || 'Event')}</div>
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(formatLmsDateTime(event.createdAt))}</div>
                    </div>
                `).join('')
                : `<div style="font-size:12px; color:var(--lux-text-muted);">No audit trail yet.</div>`;
            return `
                <details style="background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:18px; padding:16px 18px;">
                    <summary style="cursor:pointer; list-style:none;">
                        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start;">
                            <div>
                                <div style="font-size:16px; font-weight:900; color:var(--lux-text);">${escapeHtml(student.name || attempt.studentName || `Student ${student.id || attempt.studentId || ''}`)}</div>
                                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:6px;">Status ${escapeHtml(status)}  -  Last heartbeat ${escapeHtml(heartbeat)}  -  Disconnect ${escapeHtml(disconnectLabel)}</div>
                                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:6px;">${escapeHtml(latestEvent?.note || latestEvent?.type || 'No violations yet')}</div>
                            </div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <span class="lms-route-pill"><i class="fas fa-triangle-exclamation"></i> Warnings ${Number(attempt.warningCount || 0)}</span>
                                <span class="lms-route-pill"><i class="fas fa-shield"></i> Violations ${Number(attempt.violationCount || 0)}</span>
                                <span class="lms-route-pill"><i class="fas fa-plug"></i> ${attempt.antiCheatConnected ? 'Connected' : 'Disconnected'}</span>
                                ${overrideStatus ? `<span class="lms-route-pill"><i class="fas fa-sliders"></i> Override ${escapeHtml(overrideStatus)}</span>` : ''}
                            </div>
                        </div>
                    </summary>
                    <div style="display:grid; gap:14px; margin-top:16px;">
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'block')" style="padding:8px 12px; font-size:12px;">Block</button>
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'unblock')" style="padding:8px 12px; font-size:12px;">Unblock</button>
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'force-submit')" style="padding:8px 12px; font-size:12px;">Force Submit</button>
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'reset-warnings')" style="padding:8px 12px; font-size:12px;">Reset Warnings</button>
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'approve-reconnect')" style="padding:8px 12px; font-size:12px;">Approve Reconnect</button>
                            <button type="button" class="kiu-btn-outline" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'override-status')" style="padding:8px 12px; font-size:12px;">Override Status</button>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                            <div style="padding:12px 14px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.16);">
                                <div style="font-size:11px; font-weight:900; color:var(--lux-text-muted); text-transform:uppercase; letter-spacing:0.08em;">Submit Reason</div>
                                <div style="font-size:13px; color:var(--lux-text); margin-top:6px;">${escapeHtml(submitReason || 'None')}</div>
                            </div>
                            <div style="padding:12px 14px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.16);">
                                <div style="font-size:11px; font-weight:900; color:var(--lux-text-muted); text-transform:uppercase; letter-spacing:0.08em;">Review State</div>
                                <div style="font-size:13px; color:var(--lux-text); margin-top:6px;">${escapeHtml(attempt.requiresManualReview ? 'Manual review required' : 'Auto-graded or not required')}</div>
                            </div>
                            <div style="padding:12px 14px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.16);">
                                <div style="font-size:11px; font-weight:900; color:var(--lux-text-muted); text-transform:uppercase; letter-spacing:0.08em;">Score Snapshot</div>
                                <div style="font-size:13px; color:var(--lux-text); margin-top:6px;">Auto ${Number(attempt.autoScoreRaw || 0)} | Manual ${Number(attempt.manualScoreRaw || 0)} | Final ${attempt.finalScoreRaw === null || attempt.finalScoreRaw === undefined ? 'Pending' : Number(attempt.finalScoreRaw)}</div>
                            </div>
                        </div>
                        <div style="display:grid; gap:10px;">
                            <div style="font-size:11px; font-weight:900; color:var(--lux-text-muted); text-transform:uppercase; letter-spacing:0.08em;">Audit Trail</div>
                            ${timeline}
                        </div>
                    </div>
                </details>
            `;
        }).join('');
        return `
            <section class="lms-route-panel">
                <div class="lms-route-card-head">
                    <div>
                        <div class="lms-route-card-title" style="font-size:22px;">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                        <div class="lms-route-copy" style="margin-top:6px;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(String(quiz.status || 'published'))}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <span class="lms-route-pill"><i class="fas fa-users"></i> ${(quiz.attempts || []).length} students</span>
                        <span class="lms-route-pill"><i class="fas fa-play"></i> ${Number(quiz.monitoringSummary?.inProgress || 0)} live</span>
                        <span class="lms-route-pill"><i class="fas fa-paper-plane"></i> ${Number(quiz.monitoringSummary?.submitted || 0)} submitted</span>
                        <span class="lms-route-pill"><i class="fas fa-ban"></i> ${Number(quiz.monitoringSummary?.blocked || 0)} blocked</span>
                    </div>
                </div>
                <div style="display:grid; gap:12px; margin-top:14px;">${rows || `<div class="lms-route-copy">No students are assigned to this protected quiz yet.</div>`}</div>
            </section>
        `;
    }).join('') : renderLmsRouteEmptyState('No protected quizzes', 'Publish a quiz in this group first. Monitoring data will appear here after launch and proctor events start coming in.', 'fa-shield-halved');
    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <div class="lms-route-panel">
                <div class="lms-route-card-head">
                    <div>
                        <div class="lms-route-eyebrow">Monitoring</div>
                        <div class="lms-route-card-title">Quiz Monitoring</div>
                        <div class="lms-route-copy" style="margin-top:4px;">Live anti-cheat, warnings, and proctor controls</div>
                    </div>
                    <button type="button" class="kiu-btn-outline" data-lms-click="renderLmsMonitoringSection(currentCourseId)" style="padding:10px 14px; font-size:12px;"><i class="fas fa-rotate-right"></i> Refresh</button>
                </div>
            </div>
            ${quizBlocks}
        </div>
    `;
}

function deleteLmsExamSession(sessionId) {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const store = ensureExamSessionStore();
    removeLmsQuizWorkspaceRecord(session.resourceKey, session.quizId);
    delete store[String(sessionId)];
    saveState();
}

function toggleLmsExamSessionStudentBlock(sessionId, studentId) {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const targetId = String(studentId || '');
    if (!targetId) return;
    const blockedIds = new Set((session.blockedStudentIds || []).map(id => String(id)));
    if (blockedIds.has(targetId)) {
        blockedIds.delete(targetId);
    } else {
        blockedIds.add(targetId);
    }
    session.blockedStudentIds = [...blockedIds];
    session.updatedAt = new Date().toISOString();
    updateLmsExamSessionSummary(sessionId);
    saveState();
}

bootstrapProtectedQuizRouteFromUrl();
schedulePendingProtectedQuizLaunchResume();
