/* LMS Kiu Blue exam helper / gate / heartbeat runtime.
 * Peeled from lms.js. Load before lms.js on lms.html (and via LMS_QUIZ_MODULE_URLS).
 * Free vars resolve at call time against globals from lms.js / quiz modules.
 */
(function initLmsQuizBlueRuntime() {
    'use strict';
    if (window.__KIU_LMS_QUIZ_BLUE_LOADED) return;
    window.__KIU_LMS_QUIZ_BLUE_LOADED = true;

    const KIU_BLUE_HELPER_DEFAULT_URL = (() => {
        try {
            if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
                const host = window.location.hostname || '127.0.0.1';
                return `${window.location.protocol}//${host}:47831`;
            }
        } catch (error) {}
        return 'http://127.0.0.1:47831';
    })();
    const KIU_BLUE_STATUS_TTL_MS = 4000;
    const KIU_BLUE_HEARTBEAT_MS = 5000;
    const KIU_BLUE_HEARTBEAT_TIMEOUT_MS = 15000;
    let activeKiuBlueHeartbeatInterval = null;
    let activeKiuBlueDisconnectInterval = null;

    function getKiuBlueHelperBaseUrl() {
        return String(window.KIU_BLUE_HELPER_URL || localStorage.getItem('KIU_BLUE_HELPER_URL') || KIU_BLUE_HELPER_DEFAULT_URL)
            .trim()
            .replace(/\/+$/, '');
    }
    function getKiuBlueExamRuntime() {
        if (!window.__kiuBlueExamRuntime || typeof window.__kiuBlueExamRuntime !== 'object') {
            window.__kiuBlueExamRuntime = {
                helperReachable: false,
                lastFetchedAt: 0,
                lastError: '',
                pending: false,
                status: 'idle',
                sessionHealth: 'idle',
                activeSession: null,
                connectedStudentCount: 0,
                totalBoundStudentCount: 0,
                heartbeatTarget: null,
                lastStudentGateKey: ''
            };
        }
        return window.__kiuBlueExamRuntime;
    }
    function getKiuBlueSessionStudents() {
        const sessionStudents = getKiuBlueExamRuntime().activeSession?.students;
        return Array.isArray(sessionStudents) ? sessionStudents : [];
    }
    function getKiuBlueStudentSessionEntry(studentId) {
        const targetId = String(studentId || '');
        if (!targetId) return null;
        return getKiuBlueSessionStudents().find(entry => String(entry?.studentId || '') === targetId) || null;
    }
    function mergeKiuBlueHelperState(payload = {}) {
        const runtime = getKiuBlueExamRuntime();
        runtime.helperReachable = true;
        runtime.lastFetchedAt = Date.now();
        runtime.lastError = '';
        runtime.status = String(payload?.status || 'idle');
        runtime.sessionHealth = String(payload?.sessionHealth || 'idle');
        runtime.activeSession = payload?.activeSession && typeof payload.activeSession === 'object'
            ? payload.activeSession
            : null;
        runtime.connectedStudentCount = Number(payload?.connectedStudentCount || 0);
        runtime.totalBoundStudentCount = Number(payload?.totalBoundStudentCount || 0);
        return runtime;
    }
    async function fetchKiuBlueHelperJson(path, options = {}) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
        try {
            const response = await fetch(`${getKiuBlueHelperBaseUrl()}${path}`, {
                method: options.method || 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: options.body ? JSON.stringify(options.body) : undefined,
                mode: 'cors',
                cache: 'no-store',
                signal: controller?.signal
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const error = new Error(payload?.error || `Exam verification helper request failed (${response.status})`);
                error.payload = payload;
                throw error;
            }
            return payload;
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }
    async function refreshKiuBlueHelperState(options = {}) {
        const runtime = getKiuBlueExamRuntime();
        const force = options.force === true;
        if (!force && runtime.pending) return runtime;
        if (!force && runtime.lastFetchedAt && (Date.now() - runtime.lastFetchedAt) < KIU_BLUE_STATUS_TTL_MS) {
            return runtime;
        }
        runtime.pending = true;
        try {
            const payload = await fetchKiuBlueHelperJson('/api/status');
            mergeKiuBlueHelperState(payload);
            return runtime;
        } catch (error) {
            runtime.helperReachable = false;
            runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
            runtime.lastFetchedAt = Date.now();
            runtime.activeSession = null;
            runtime.connectedStudentCount = 0;
            runtime.totalBoundStudentCount = 0;
            return runtime;
        } finally {
            runtime.pending = false;
        }
    }
    function isLmsQuizBlueExamRequired(quiz = {}) {
        return false;
    }
    function isLmsQuizAttendanceQualified(submission = {}, quiz = {}) {
        if (!isLmsQuizBlueExamRequired(quiz) || quiz?.attendanceGateEnabled === false) {
            return true;
        }
        return ['present', 'late'].includes(String(submission?.attendanceStatus || '').trim().toLowerCase());
    }
    function getLmsQuizOutsideActionCount(submission) {
        const outsideEventTypes = new Set([
            'left-tab',
            'fullscreen-exit',
            'before-unload-blocked',
            'shortcut-blocked',
            'left-protected-view'
        ]);
        return (submission?.proctorEvents || []).filter(event => outsideEventTypes.has(String(event?.type || ''))).length;
    }
    function formatLmsDurationLabel(ms) {
        if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return '00:00';
        return formatCountdownDuration(Number(ms));
    }
    function getLmsQuizBlueDisconnectElapsedMs(submission = {}) {
        const accumulated = Number(submission?.blueDisconnectAccumulatedMs || 0);
        const activeDisconnect = submission?.blueDisconnectedAt ? Math.max(0, Date.now() - new Date(submission.blueDisconnectedAt).getTime()) : 0;
        return accumulated + activeDisconnect;
    }
    function getLmsQuizBlueGateStatus(resourceKey, quiz, submission, studentId) {
        const required = isLmsQuizBlueExamRequired(quiz);
        if (!required) {
            return {
                required: false,
                helperReachable: true,
                sessionActive: true,
                connected: true,
                attendanceQualified: true,
                startUnlocked: true,
                blankAttempt: false,
                rosterEntry: null,
                message: '',
                disconnectElapsedMs: 0
            };
        }
        const runtime = getKiuBlueExamRuntime();
        const rosterEntry = getKiuBlueStudentSessionEntry(studentId);
        const attendanceQualified = isLmsQuizAttendanceQualified(submission, quiz);
        const helperReachable = runtime.helperReachable;
        const sessionActive = Boolean(
            runtime.activeSession?.id
            && helperReachable
            && !['idle', 'offline', 'error'].includes(String(runtime.sessionHealth || runtime.status || '').trim().toLowerCase())
        );
        const connected = Boolean(helperReachable && sessionActive && rosterEntry?.connected);
        const attemptLive = ['in-progress'].includes(String(submission?.status || ''));
        let message = '';
        if (!helperReachable) {
            message = 'Exam verification helper is offline, so the portal cannot verify the exam session.';
        } else if (!sessionActive) {
            message = 'Exam verification is not active yet.';
        } else if (!attendanceQualified) {
            message = 'Attendance is not confirmed yet. TA / professor must mark this student present before Start Quiz unlocks.';
        } else if (!connected) {
            message = 'This account is not connected to the required exam verification session.';
        }
        return {
            required: true,
            helperReachable,
            sessionActive,
            connected,
            attendanceQualified,
            startUnlocked: Boolean(helperReachable && sessionActive && connected && attendanceQualified),
            blankAttempt: Boolean(attemptLive && (!helperReachable || !sessionActive || !connected)),
            rosterEntry,
            message,
            disconnectElapsedMs: getLmsQuizBlueDisconnectElapsedMs(submission)
        };
    }
    function syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, studentMeta) {
        if (!submission || !isLmsQuizBlueExamRequired(quiz)) return false;
        const runtime = getKiuBlueExamRuntime();
        const rosterEntry = getKiuBlueStudentSessionEntry(studentMeta?.id || submission.studentId);
        const nowIso = new Date().toISOString();
        let changed = false;
        const setField = (field, value) => {
            if (submission[field] === value) return;
            submission[field] = value;
            changed = true;
        };
        setField('blueSessionId', runtime.activeSession?.id || null);
        setField('blueBindStatus', !runtime.helperReachable
            ? 'helper-unreachable'
            : !runtime.activeSession?.id
                ? 'session-offline'
                : rosterEntry?.connected
                    ? 'connected'
                    : rosterEntry
                        ? (rosterEntry.connectionStatus || 'disconnected')
                        : 'not-bound');
        setField('blueConnected', Boolean(runtime.helperReachable && runtime.activeSession?.id && rosterEntry?.connected));
        setField('blueLastHeartbeatAt', rosterEntry?.lastHeartbeatAt || null);
        setField('outsideActionCount', getLmsQuizOutsideActionCount(submission));
        if (rosterEntry?.present !== undefined) {
            if (submission.attendanceStatus !== rosterEntry.presentStatus && rosterEntry.presentStatus) {
                submission.attendanceStatus = rosterEntry.presentStatus;
                changed = true;
            }
            if (rosterEntry.attendanceVerifiedAt && submission.attendanceVerifiedAt !== rosterEntry.attendanceVerifiedAt) {
                submission.attendanceVerifiedAt = rosterEntry.attendanceVerifiedAt;
                changed = true;
            }
            if (rosterEntry.attendanceVerifiedBy && submission.attendanceVerifiedBy !== rosterEntry.attendanceVerifiedBy) {
                submission.attendanceVerifiedBy = rosterEntry.attendanceVerifiedBy;
                changed = true;
            }
        }
        if (String(submission.status || '') === 'in-progress') {
            if (submission.blueConnected) {
                if (submission.blueDisconnectedAt) {
                    const disconnectStart = new Date(submission.blueDisconnectedAt).getTime();
                    const reconnectAt = new Date(rosterEntry?.lastHeartbeatAt || nowIso).getTime();
                    if (Number.isFinite(disconnectStart) && Number.isFinite(reconnectAt) && reconnectAt > disconnectStart) {
                        submission.blueDisconnectAccumulatedMs = Number(submission.blueDisconnectAccumulatedMs || 0) + (reconnectAt - disconnectStart);
                    }
                    submission.blueReconnectAt = rosterEntry?.lastHeartbeatAt || nowIso;
                    submission.blueDisconnectedAt = null;
                    changed = true;
                    recordLmsQuizProctorEvent(resourceKey, quiz.id, studentMeta, 'blue-reconnected', 'Student reconnected to exam verification');
                }
            } else if (!submission.blueDisconnectedAt) {
                submission.blueDisconnectedAt = nowIso;
                changed = true;
                recordLmsQuizProctorEvent(
                    resourceKey,
                    quiz.id,
                    studentMeta,
                    runtime.helperReachable ? 'blue-disconnected' : 'blue-heartbeat-timeout',
                    runtime.helperReachable
                        ? 'Student is no longer connected to exam verification'
                        : 'Exam verification heartbeat failed during the quiz'
                );
            }
        }
        if (changed) {
            submission.outsideActionCount = getLmsQuizOutsideActionCount(submission);
            saveState();
        }
        return changed;
    }
    function clearKiuBlueDisconnectInterval() {
        if (activeKiuBlueDisconnectInterval) {
            clearInterval(activeKiuBlueDisconnectInterval);
            activeKiuBlueDisconnectInterval = null;
        }
    }
    function updateVisibleKiuBlueDisconnectTimer() {
        const timerEl = document.getElementById('lms-blue-disconnect-timer');
        if (!timerEl) return;
        const resourceKey = resolveCanonicalLmsResourceKey(currentLmsQuizCourseKey || currentCourseId);
        const uiState = ensureLmsQuizUiState(resourceKey);
        const quizId = String(uiState.studentQuizId || '');
        if (!quizId) return;
        const studentId = resolveLmsQuizStudentMeta(resourceKey, getLmsQuizById(resourceKey, quizId)).id;
        const submission = getLmsQuizSubmission(resourceKey, quizId, studentId);
        timerEl.textContent = formatLmsDurationLabel(getLmsQuizBlueDisconnectElapsedMs(submission));
    }
    function buildLmsQuizBlueGateKey(gateStatus = {}) {
        return JSON.stringify({
            required: gateStatus.required === true,
            helperReachable: gateStatus.helperReachable === true,
            sessionActive: gateStatus.sessionActive === true,
            connected: gateStatus.connected === true,
            attendanceQualified: gateStatus.attendanceQualified === true,
            blankAttempt: gateStatus.blankAttempt === true,
            message: String(gateStatus.message || '')
        });
    }
    async function unregisterKiuBlueStudentSession(studentMeta = {}) {
        const studentId = String(studentMeta?.id || '');
        if (!studentId) return;
        try {
            const runtime = getKiuBlueExamRuntime();
            const payload = await fetchKiuBlueHelperJson('/api/session/unregister', {
                method: 'POST',
                body: {
                    studentId,
                    accountId: studentId,
                    sessionId: runtime.activeSession?.id || null
                }
            });
            mergeKiuBlueHelperState(payload?.state || {});
        } catch (error) {
            const runtime = getKiuBlueExamRuntime();
            runtime.helperReachable = false;
            runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
        }
    }
    async function syncKiuBlueAttendanceToHelper(resourceKey, quizId, studentId, submission = {}) {
        const normalizedStudentId = String(studentId || '').trim();
        if (!normalizedStudentId) return null;
        try {
            const runtime = getKiuBlueExamRuntime();
            const payload = await fetchKiuBlueHelperJson('/api/session/attendance', {
                method: 'POST',
                body: {
                    sessionId: runtime.activeSession?.id || null,
                    studentId: normalizedStudentId,
                    studentName: submission.studentName || `Student ${normalizedStudentId}`,
                    accountId: normalizedStudentId,
                    resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
                    quizId: String(quizId || ''),
                    presentStatus: String(submission.attendanceStatus || ''),
                    attendanceVerifiedAt: submission.attendanceVerifiedAt || null,
                    attendanceVerifiedBy: submission.attendanceVerifiedBy || ''
                }
            });
            mergeKiuBlueHelperState(payload?.state || {});
            return payload;
        } catch (error) {
            const runtime = getKiuBlueExamRuntime();
            runtime.helperReachable = false;
            runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
            return null;
        }
    }
    function stopKiuBlueStudentHeartbeat(options = {}) {
        const runtime = getKiuBlueExamRuntime();
        if (activeKiuBlueHeartbeatInterval) {
            clearInterval(activeKiuBlueHeartbeatInterval);
            activeKiuBlueHeartbeatInterval = null;
        }
        clearKiuBlueDisconnectInterval();
        const target = runtime.heartbeatTarget;
        runtime.heartbeatTarget = null;
        runtime.lastStudentGateKey = '';
        if (options.unregister && target?.studentMeta?.id) {
            unregisterKiuBlueStudentSession(target.studentMeta);
        }
    }
    function ensureKiuBlueStatusSoon() {
        refreshKiuBlueHelperState({ force: false }).then(() => {
            if (document.getElementById('lms-content-area')) {
                rerenderCurrentLmsQuizWorkspace();
            }
        });
    }
    function ensureKiuBlueStudentHeartbeat(resourceKey, quiz, studentMeta, subject = null, group = null) {
        if (!isLmsQuizBlueExamRequired(quiz) || !studentMeta?.id) {
            stopKiuBlueStudentHeartbeat();
            return;
        }
        const runtime = getKiuBlueExamRuntime();
        const targetKey = `${resolveCanonicalLmsResourceKey(resourceKey)}::${quiz.id}::${studentMeta.id}`;
        if (runtime.heartbeatTarget?.key === targetKey && activeKiuBlueHeartbeatInterval) {
            return;
        }
        stopKiuBlueStudentHeartbeat();
        runtime.heartbeatTarget = {
            key: targetKey,
            resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
            quizId: String(quiz.id),
            studentMeta: {
                id: String(studentMeta.id),
                name: studentMeta.name || `Student ${studentMeta.id}`
            },
            subject,
            group
        };
        const tick = async () => {
            const currentTarget = runtime.heartbeatTarget;
            if (!currentTarget || currentTarget.key !== targetKey) return;
            let previousGateKey = runtime.lastStudentGateKey;
            const existingEntry = getKiuBlueStudentSessionEntry(currentTarget.studentMeta.id);
            try {
                const payload = await fetchKiuBlueHelperJson(existingEntry ? '/api/session/heartbeat' : '/api/session/register', {
                    method: 'POST',
                    body: {
                        sessionId: runtime.activeSession?.id || null,
                        studentId: currentTarget.studentMeta.id,
                        studentName: currentTarget.studentMeta.name,
                        accountId: currentTarget.studentMeta.id,
                        resourceKey: currentTarget.resourceKey,
                        quizId: currentTarget.quizId,
                        userAgent: navigator.userAgent
                    }
                });
                mergeKiuBlueHelperState(payload?.state || {});
            } catch (error) {
                runtime.helperReachable = false;
                runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
                runtime.activeSession = null;
            }
            const activeQuiz = getLmsQuizById(currentTarget.resourceKey, currentTarget.quizId);
            const submission = ensureLmsQuizSubmissionShell(currentTarget.resourceKey, currentTarget.quizId, currentTarget.studentMeta);
            if (!activeQuiz || !submission) return;
            syncLmsQuizBlueSubmissionState(currentTarget.resourceKey, activeQuiz, submission, currentTarget.studentMeta);
            const gateKey = buildLmsQuizBlueGateKey(getLmsQuizBlueGateStatus(currentTarget.resourceKey, activeQuiz, submission, currentTarget.studentMeta.id));
            if (gateKey !== previousGateKey) {
                runtime.lastStudentGateKey = gateKey;
                renderStudentLmsQuizSection(currentCourseId, currentTarget.subject, currentTarget.group);
            } else {
                runtime.lastStudentGateKey = gateKey;
            }
        };
        const initialTickPromise = tick();
        activeKiuBlueHeartbeatInterval = setInterval(tick, KIU_BLUE_HEARTBEAT_MS);
        return initialTickPromise;
    }

    window.getKiuBlueHelperBaseUrl = getKiuBlueHelperBaseUrl;
    window.getKiuBlueExamRuntime = getKiuBlueExamRuntime;
    window.getKiuBlueSessionStudents = getKiuBlueSessionStudents;
    window.getKiuBlueStudentSessionEntry = getKiuBlueStudentSessionEntry;
    window.mergeKiuBlueHelperState = mergeKiuBlueHelperState;
    window.fetchKiuBlueHelperJson = fetchKiuBlueHelperJson;
    window.refreshKiuBlueHelperState = refreshKiuBlueHelperState;
    window.isLmsQuizBlueExamRequired = isLmsQuizBlueExamRequired;
    window.isLmsQuizAttendanceQualified = isLmsQuizAttendanceQualified;
    window.getLmsQuizOutsideActionCount = getLmsQuizOutsideActionCount;
    window.formatLmsDurationLabel = formatLmsDurationLabel;
    window.getLmsQuizBlueDisconnectElapsedMs = getLmsQuizBlueDisconnectElapsedMs;
    window.getLmsQuizBlueGateStatus = getLmsQuizBlueGateStatus;
    window.syncLmsQuizBlueSubmissionState = syncLmsQuizBlueSubmissionState;
    window.clearKiuBlueDisconnectInterval = clearKiuBlueDisconnectInterval;
    window.updateVisibleKiuBlueDisconnectTimer = updateVisibleKiuBlueDisconnectTimer;
    window.buildLmsQuizBlueGateKey = buildLmsQuizBlueGateKey;
    window.unregisterKiuBlueStudentSession = unregisterKiuBlueStudentSession;
    window.syncKiuBlueAttendanceToHelper = syncKiuBlueAttendanceToHelper;
    window.stopKiuBlueStudentHeartbeat = stopKiuBlueStudentHeartbeat;
    window.ensureKiuBlueStatusSoon = ensureKiuBlueStatusSoon;
    window.ensureKiuBlueStudentHeartbeat = ensureKiuBlueStudentHeartbeat;
})();
