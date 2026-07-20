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
const PROTECTED_QUIZ_MONITOR_REFRESH_MS = 5000;
let activeProtectedQuizBootstrapTimer = null;
let pendingProtectedQuizResumeScheduled = false;
let protectedQuizMonitorRuntime = { pending: false, groupKey: '', data: null };
let activeProtectedQuizMonitorInterval = null;
let activeProtectedQuizMonitorCourseKey = '';
let activeProtectedQuizMonitorRefreshPending = false;

function getActiveLmsTabId() {
    try {
        return document.querySelector('#page-lms-inner [data-lms-tab].is-active')?.id?.replace(/^tab-/, '') || '';
    } catch (error) {
        return '';
    }
}

function isProtectedQuizMonitoringVisible(courseKey = '') {
    const normalizedCourseKey = String(courseKey || '').trim();
    if (!normalizedCourseKey) return false;
    return getActiveLmsTabId() === 'monitoring' && String(currentCourseId || '').trim() === normalizedCourseKey;
}

function stopProtectedQuizMonitorAutoRefresh() {
    if (activeProtectedQuizMonitorInterval) {
        clearInterval(activeProtectedQuizMonitorInterval);
        activeProtectedQuizMonitorInterval = null;
    }
    activeProtectedQuizMonitorCourseKey = '';
    activeProtectedQuizMonitorRefreshPending = false;
}

function armProtectedQuizMonitorAutoRefresh(courseKey) {
    const normalizedCourseKey = String(courseKey || '').trim();
    if (!normalizedCourseKey) {
        stopProtectedQuizMonitorAutoRefresh();
        return;
    }
    activeProtectedQuizMonitorCourseKey = normalizedCourseKey;
    if (activeProtectedQuizMonitorInterval) return;
    activeProtectedQuizMonitorInterval = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        void refreshProtectedQuizMonitorLiveData();
    }, PROTECTED_QUIZ_MONITOR_REFRESH_MS);
}

async function refreshProtectedQuizMonitorLiveData(force = false) {
    const courseKey = String(activeProtectedQuizMonitorCourseKey || currentCourseId || '').trim();
    if (!courseKey) return null;
    if (!force && !isProtectedQuizMonitoringVisible(courseKey)) return null;
    if (activeProtectedQuizMonitorRefreshPending) return null;
    activeProtectedQuizMonitorRefreshPending = true;
    try {
        const context = resolveLmsQuizWorkspace(courseKey);
        if (!context?.resourceKey) return null;
        const monitor = await fetchProtectedQuizMonitor(context.resourceKey);
        if (!monitor) return null;
        protectedQuizMonitorRuntime = { pending: false, groupKey: context.resourceKey, data: monitor };
        if (!force && !isProtectedQuizMonitoringVisible(courseKey)) return monitor;
        await renderLmsMonitoringSection(courseKey, {
            monitorOverride: monitor,
            skipAutoRefreshArm: true
        });
        return monitor;
    } catch (error) {
        return null;
    } finally {
        activeProtectedQuizMonitorRefreshPending = false;
    }
}

function renderProtectedAntiCheatPolicySummary(policy = {}) {
    const normalized = typeof normalizeLmsAntiCheatPolicy === 'function'
        ? normalizeLmsAntiCheatPolicy(policy)
        : (policy || {});
    const enabled = [
        ['Kiosk', normalized.kioskMode],
        ['Process scan', normalized.processScanning],
        ['VM detection', normalized.vmDetection],
        ['Navigation lock', normalized.navigationProtection],
        ['Clipboard clear', normalized.clipboardClearing],
        ['Input lock', normalized.inputBlocking]
    ].filter(([, value]) => value !== false).map(([label]) => label);
    return `
        <div class="lms-protected-monitor-policy">
            <div class="lms-protected-monitor-copy"><strong>Policy:</strong> ${escapeHtml(enabled.join(', ') || 'Default secure policy')}</div>
            <div class="lms-protected-monitor-copy">Heartbeat ${Number(normalized.heartbeatMs || 2000)} ms  -  Scan ${Number(normalized.processScanMs || 1500)} ms  -  Blocked processes ${(normalized.blockedProcesses || []).length || 0}</div>
        </div>
    `;
}

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

function isAndroidAntiCheatBrowserRuntime() {
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase();
    return isAntiCheatBrowserRuntime() && /android/.test(userAgent);
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
        frame.hidden = true;
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
        link.hidden = true;
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
    searchParams.set('returnTo', String(window.location.href || ''));
    if (isAndroidAntiCheatBrowserRuntime()) {
        searchParams.set('inline', '1');
    }
    const popupUrl = `protected-launch.html${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (isAndroidAntiCheatBrowserRuntime()) {
        try {
            window.location.href = popupUrl;
        } catch (error) {
            window.location.assign(popupUrl);
        }
        return { inline: true, url: popupUrl };
    }
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
            antiCheatPolicy: typeof normalizeLmsAntiCheatPolicy === 'function'
                ? normalizeLmsAntiCheatPolicy(quiz.antiCheatPolicy)
                : (quiz.antiCheatPolicy || {}),
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
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    runtime.courseKey = canonicalKey;
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
    const clientProfile = getProtectedQuizPreferredClientProfile();
    const quizTitle = String(quiz.title || getLmsQuizDisplayLabel(quiz)).trim();
    const popup = openProtectedQuizLaunchPopup({
        mode: 'quiz',
        resourceKey: canonicalKey,
        courseId: canonicalKey,
        quizId: runtime.quizId,
        studentId: String(studentMeta.id || ''),
        studentName: String(studentMeta.name || ''),
        clientType: clientProfile.clientType,
        securityLevel: clientProfile.securityLevel,
        installUrl: getProtectedQuizInstallUrl(),
        quizTitle,
        subjectLabel: labels.subjectLabel,
        groupLabel: labels.groupLabel
    });
    if (popup) {
        return { launchPopupOpened: true };
    }
    if (typeof createProtectedQuizLaunchTicket !== 'function') {
        alert('The anti-cheat launch window was blocked and the launch ticket API is unavailable.');
        return null;
    }
    try {
        const portalToken = typeof getPortalSessionToken === 'function' ? String(getPortalSessionToken() || '').trim() : '';
        if (!portalToken) {
            redirectToProtectedQuizLogin(canonicalKey, runtime.quizId, 'Please sign in again before the protected quiz can be launched.');
            return null;
        }
        const result = await createProtectedQuizLaunchTicket(runtime.quizId, {
            courseId: canonicalKey,
            resourceKey: canonicalKey,
            studentId: String(studentMeta.id || ''),
            studentName: String(studentMeta.name || ''),
            clientType: clientProfile.clientType,
            securityLevel: clientProfile.securityLevel
        });
        const launchUrl = String(result?.launchUrl || '').trim();
        if (!launchUrl) {
            throw new Error('Protected launch URL was not returned.');
        }
        await attemptProtectedAppLaunch(launchUrl, {
            wakeProtocolUrl: 'anticheat://open?screen=settings&source=kiu-lms-launch',
            fallbackMessage: 'Could not reach the Anti-Cheat desktop app. Start the local stack with npm run start:local:lms, or start the app manually with cd anti-cheat && npm run start, then try again.'
        });
        return { bridgeHandoffAttempted: true };
    } catch (error) {
        alert(error?.message || 'Protected quiz launch failed.');
        return null;
    }
}

function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel) {
    const installUrl = getProtectedQuizInstallUrl();
    return `
        <div class="lms-quiz-studio-shell lms-quiz-builder lms-protected-launch-shell">
            <div class="lms-student-quiz-cover">
                <div class="lms-student-quiz-cover-inner lms-protected-launch-inner">
                    <div class="lms-student-quiz-cover-icon is-accent lms-protected-launch-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="lms-student-quiz-cover-title lms-protected-launch-title">Protected Quiz Launch Required</div>
                    <div class="lms-student-quiz-cover-copy lms-protected-launch-copy">
                        ${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))} for ${escapeHtml(subjectLabel)} / ${escapeHtml(groupLabel)} can only be opened inside the anti-cheat application.
                        The regular browser LMS page will not reveal the answerable quiz body.
                    </div>
                    <div class="lms-protected-launch-support-copy">
                        Open the Anti-Cheat Browser first, sign in there, then open this same LMS group and start the quiz from inside that protected browser. This page stays read-only in the regular browser.
                    </div>
                    <div class="lms-student-quiz-cover-actions lms-protected-launch-actions">
                        <button type="button" class="lux-primary-btn lms-student-quiz-cover-btn lms-protected-launch-action-btn is-open-browser" data-lms-click="launchProtectedQuizInAntiCheat(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})">
                            <i class="fas fa-arrow-up-right-from-square"></i> Open Anti-Cheat Browser
                        </button>
                        <button type="button" class="lux-secondary-btn lms-student-quiz-cover-btn lms-protected-launch-action-btn is-open-app" data-lms-click="openAntiCheatDesktopApp()">
                            <i class="fas fa-desktop"></i> Open LMS In App
                        </button>
                        ${installUrl && installUrl !== '#' ? `<a href="${escapeHtml(installUrl)}" target="_blank" rel="noopener" class="lux-secondary-btn lms-student-quiz-cover-btn lms-protected-launch-link lms-protected-launch-action-btn is-install"><i class="fas fa-download"></i> Install App</a>` : ''}
                    </div>
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

async function renderLmsMonitoringSection(courseId, options = {}) {
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
        monitor = options.monitorOverride || await fetchProtectedQuizMonitor(context.resourceKey);
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
            const attemptPolicy = attempt.appliedAntiCheatPolicy || quiz.antiCheatPolicy || {};
            const timeline = Array.isArray(attempt.auditTrail) && attempt.auditTrail.length
                ? attempt.auditTrail.slice(0, 6).map(event => `
                    <div class="lms-protected-monitor-audit-item">
                        <div class="lms-protected-monitor-audit-copy">${escapeHtml(event.note || event.type || 'Event')}</div>
                        <div class="lms-protected-monitor-audit-meta">${escapeHtml(formatLmsDateTime(event.createdAt))}</div>
                    </div>
                `).join('')
                : '<div class="lms-protected-monitor-audit-empty">No audit trail yet.</div>';
            return `
                <details class="lms-protected-monitor-details">
                    <summary class="lms-protected-monitor-summary">
                        <div class="lms-protected-monitor-head">
                            <div>
                                <div class="lms-protected-monitor-student">${escapeHtml(student.name || attempt.studentName || `Student ${student.id || attempt.studentId || ''}`)}</div>
                                <div class="lms-protected-monitor-copy lms-protected-monitor-status-line">Status ${escapeHtml(status)}  -  Last heartbeat ${escapeHtml(heartbeat)}  -  Disconnect ${escapeHtml(disconnectLabel)}</div>
                                <div class="lms-protected-monitor-copy lms-protected-monitor-latest-copy">${escapeHtml(latestEvent?.note || latestEvent?.type || 'No violations yet')}</div>
                            </div>
                            <div class="lms-protected-monitor-pills">
                                <span class="lms-route-pill lms-protected-monitor-pill is-warning-count"><i class="fas fa-triangle-exclamation"></i> Warnings ${Number(attempt.warningCount || 0)}</span>
                                <span class="lms-route-pill lms-protected-monitor-pill is-violation-count"><i class="fas fa-shield"></i> Violations ${Number(attempt.violationCount || 0)}</span>
                                <span class="lms-route-pill lms-protected-monitor-pill ${attempt.antiCheatConnected ? 'is-connected' : 'is-disconnected'}"><i class="fas fa-plug"></i> ${attempt.antiCheatConnected ? 'Connected' : 'Disconnected'}</span>
                                ${overrideStatus ? `<span class="lms-route-pill lms-protected-monitor-pill is-override"><i class="fas fa-sliders"></i> Override ${escapeHtml(overrideStatus)}</span>` : ''}
                            </div>
                        </div>
                    </summary>
                    <div class="lms-protected-monitor-body">
                        <div class="lms-protected-monitor-actions">
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-block" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'block')">Block</button>
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-unblock" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'unblock')">Unblock</button>
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-force-submit" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'force-submit')">Force Submit</button>
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-reset-warnings" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'reset-warnings')">Reset Warnings</button>
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-approve-reconnect" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'approve-reconnect')">Approve Reconnect</button>
                            <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-protected-monitor-action-btn is-override-status" data-lms-click="performProtectedMonitoringAction(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id || attempt.studentId)}, 'override-status')">Override Status</button>
                        </div>
                        <div class="lms-protected-monitor-metrics">
                            <div class="lms-protected-monitor-metric">
                                <div class="lms-protected-monitor-metric-title">Applied Policy</div>
                                <div class="lms-protected-monitor-metric-copy">${escapeHtml([
                                    attemptPolicy.kioskMode !== false ? 'Kiosk' : '',
                                    attemptPolicy.processScanning !== false ? 'Process scan' : '',
                                    attemptPolicy.vmDetection !== false ? 'VM detection' : ''
                                ].filter(Boolean).join(', ') || 'Default secure policy')}</div>
                            </div>
                            <div class="lms-protected-monitor-metric">
                                <div class="lms-protected-monitor-metric-title">Submit Reason</div>
                                <div class="lms-protected-monitor-metric-copy">${escapeHtml(submitReason || 'None')}</div>
                            </div>
                            <div class="lms-protected-monitor-metric">
                                <div class="lms-protected-monitor-metric-title">Review State</div>
                                <div class="lms-protected-monitor-metric-copy">${escapeHtml(attempt.requiresManualReview ? 'Manual review required' : 'Auto-graded or not required')}</div>
                            </div>
                            <div class="lms-protected-monitor-metric">
                                <div class="lms-protected-monitor-metric-title">Score Snapshot</div>
                                <div class="lms-protected-monitor-metric-copy">Auto ${Number(attempt.autoScoreRaw || 0)} | Manual ${Number(attempt.manualScoreRaw || 0)} | Final ${attempt.finalScoreRaw === null || attempt.finalScoreRaw === undefined ? 'Pending' : Number(attempt.finalScoreRaw)}</div>
                            </div>
                        </div>
                        <div class="lms-protected-monitor-audit">
                            <div class="lms-protected-monitor-audit-title">Audit Trail</div>
                            ${timeline}
                        </div>
                    </div>
                </details>
            `;
        }).join('');
        return `
            <section class="lms-route-panel lms-protected-monitor-shell">
                <div class="lms-route-card-head lms-protected-monitor-shell-head">
                    <div>
                        <div class="lms-route-card-title lms-protected-monitor-shell-title">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                        <div class="lms-route-copy lms-route-copy-mt-6 lms-protected-monitor-shell-copy">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(String(quiz.status || 'published'))}</div>
                        ${renderProtectedAntiCheatPolicySummary(quiz.antiCheatPolicy)}
                    </div>
                    <div class="lms-route-actions lms-protected-monitor-shell-actions">
                        <span class="lms-route-pill lms-protected-monitor-shell-pill is-students"><i class="fas fa-users"></i> ${(quiz.attempts || []).length} students</span>
                        <span class="lms-route-pill lms-protected-monitor-shell-pill is-live"><i class="fas fa-play"></i> ${Number(quiz.monitoringSummary?.inProgress || 0)} live</span>
                        <span class="lms-route-pill lms-protected-monitor-shell-pill is-submitted"><i class="fas fa-paper-plane"></i> ${Number(quiz.monitoringSummary?.submitted || 0)} submitted</span>
                        <span class="lms-route-pill lms-protected-monitor-shell-pill is-blocked"><i class="fas fa-ban"></i> ${Number(quiz.monitoringSummary?.blocked || 0)} blocked</span>
                    </div>
                </div>
                <div class="lms-route-stack lms-route-stack-mt-16 lms-protected-monitor-shell-list">${rows || `<div class="lms-route-copy lms-protected-monitor-empty-note">No students are assigned to this protected quiz yet.</div>`}</div>
            </section>
        `;
    }).join('') : renderLmsRouteEmptyState('No protected quizzes', 'Publish a quiz in this group first. Monitoring data will appear here after launch and proctor events start coming in.', 'fa-shield-halved');
    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <div class="lms-route-panel lms-protected-monitor-page-shell">
                <div class="lms-route-card-head lms-protected-monitor-page-head">
                    <div>
                        <div class="lms-route-eyebrow lms-protected-monitor-page-eyebrow">Monitoring</div>
                        <div class="lms-route-card-title lms-protected-monitor-page-title">Quiz Monitoring</div>
                        <div class="lms-route-copy lms-route-copy-mt-4 lms-protected-monitor-page-copy">Live anti-cheat, warnings, and proctor controls. Auto-refresh updates every ${Math.round(PROTECTED_QUIZ_MONITOR_REFRESH_MS / 1000)} seconds.</div>
                    </div>
                    <button type="button" class="lux-secondary-btn lms-quiz-action-btn lms-protected-monitor-page-refresh lms-protected-monitor-action-btn is-refresh" data-lms-click="refreshProtectedQuizMonitorLiveData(true)"><i class="fas fa-rotate-right"></i> Refresh</button>
                </div>
            </div>
            ${quizBlocks}
        </div>
    `;
    if (!options.skipAutoRefreshArm) {
        armProtectedQuizMonitorAutoRefresh(context.resourceKey);
    }
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

window.launchProtectedQuizInAntiCheat = launchProtectedQuizInAntiCheat;
window.openProtectedQuizLaunchPopup = openProtectedQuizLaunchPopup;
window.attemptProtectedAppLaunch = attemptProtectedAppLaunch;
window.openAntiCheatDesktopApp = openAntiCheatDesktopApp;
window.refreshProtectedQuizMonitorLiveData = refreshProtectedQuizMonitorLiveData;

bootstrapProtectedQuizRouteFromUrl();
schedulePendingProtectedQuizLaunchResume();
window.addEventListener('beforeunload', stopProtectedQuizMonitorAutoRefresh);
if (typeof window !== 'undefined') {
    window.renderLmsMonitoringSection = window.renderLmsMonitoringSection || renderLmsMonitoringSection;
}
