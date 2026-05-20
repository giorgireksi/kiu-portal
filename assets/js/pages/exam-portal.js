(function initExamPortal() {
    const TOKEN_KEY = 'KIU_EXAM_PORTAL_TOKEN';
    const STUDENT_KEY = 'KIU_EXAM_PORTAL_STUDENT';
    const MANUAL_TYPES = new Set(['short', 'written', 'essay', 'text']);
    const FINAL_ATTEMPT_STATUSES = new Set(['submitted', 'auto-submitted', 'graded']);

    function readExamSessionValue(key) {
        try {
            return String(sessionStorage.getItem(key) || localStorage.getItem(key) || '').trim();
        } catch (error) {
            return '';
        }
    }

    function readExamSessionJson(key) {
        try {
            return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || 'null');
        } catch (error) {
            return null;
        }
    }

    const runtime = {
        token: readExamSessionValue(TOKEN_KEY),
        student: readExamSessionJson(STUDENT_KEY),
        sessions: [],
        countdownTimer: null,
        heartbeatTimer: null,
        notice: {
            type: '',
            message: ''
        },
        protected: {
            active: false,
            courseId: '',
            quizId: '',
            sessionId: '',
            payload: null,
            answers: {},
            flagged: {},
            revealed: false,
            submitted: false,
            submitting: false,
            deadlineAt: 0,
            countdownTimer: null
        },
        confirmResolve: null,
        lastAutosaveAt: 0
    };

    function q(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseDate(value) {
        const time = value ? new Date(value).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    }

    function formatDateTime(value) {
        if (!value) return 'Not scheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
    }

    function formatShortDate(value) {
        if (!value) return 'No date';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCountdown(targetMs) {
        if (!targetMs) return '--:--:--';
        const diff = Math.max(0, targetMs - Date.now());
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function formatDuration(ms) {
        const safeMs = Math.max(0, Number(ms || 0));
        const totalSeconds = Math.floor(safeMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function getQuery() {
        return new URLSearchParams(window.location.search);
    }

    function getExamPortalBackendUrl() {
        try {
            if (typeof getKiuPortalBackendUrl === 'function') {
                return String(getKiuPortalBackendUrl() || '').replace(/\/$/, '');
            }
        } catch (error) {}
        try {
            const protocol = window.location?.protocol === 'https:' ? 'https:' : 'http:';
            const host = /^(127\.0\.0\.1|localhost)$/i.test(window.location?.hostname || '')
                ? window.location.hostname
                : '127.0.0.1';
            return `${protocol}//${host}:48933`;
        } catch (error) {
            return 'http://127.0.0.1:48933';
        }
    }

    function buildExamPortalApiUrl(path) {
        const value = String(path || '').trim();
        if (/^https?:\/\//i.test(value)) return value;
        if (value.startsWith('/api/')) return `${getExamPortalBackendUrl()}${value}`;
        return value;
    }

    function isAntiCheatBrowser() {
        return /AntiCheatBrowser\/\d+/i.test(String(navigator.userAgent || ''));
    }

    function renderAntiCheatOnlyBlock() {
        const root = q('exam-portal-root');
        if (!root) return;
        root.innerHTML = `
            <main class="exam-blocked-shell">
                <section class="exam-blocked-card">
                    <div class="exam-blocked-icon"><i class="fas fa-shield-halved"></i></div>
                    <div class="exam-kicker" style="color:var(--exam-danger); opacity:1;">Secure Browser Required</div>
                    <h1 style="margin:0; font-family:Fraunces, Georgia, serif; font-size:clamp(30px, 5vw, 46px);">Open this page in KIU Anti-Cheat Browser</h1>
                    <p class="exam-panel-copy" style="max-width:620px; margin:0 auto;">Exam schedules, launch controls, and protected attempts are only available inside the anti-cheat environment. This prevents students from opening exam pages in a normal browser.</p>
                    <div class="exam-chip-row" style="justify-content:center;">
                        <span class="exam-chip"><i class="fas fa-lock"></i> Normal browser blocked</span>
                        <span class="exam-chip"><i class="fas fa-user-shield"></i> Invigilated session only</span>
                    </div>
                </section>
            </main>
        `;
    }

    function bindConfirmModal() {
        const modal = q('exam-confirm-modal');
        const cancel = q('exam-confirm-cancel');
        const ok = q('exam-confirm-ok');
        if (!modal || !cancel || !ok) return;

        const resolve = value => {
            modal.classList.remove('is-visible');
            if (runtime.confirmResolve) runtime.confirmResolve(value);
            runtime.confirmResolve = null;
        };

        cancel.addEventListener('click', () => resolve(false));
        ok.addEventListener('click', () => resolve(true));
        modal.addEventListener('click', event => {
            if (event.target === modal) resolve(false);
        });
        window.addEventListener('keydown', event => {
            if (event.key === 'Escape' && modal.classList.contains('is-visible')) resolve(false);
        });
    }

    function showExamConfirm(options = {}) {
        const modal = q('exam-confirm-modal');
        const kicker = q('exam-confirm-kicker');
        const title = q('exam-confirm-title');
        const copy = q('exam-confirm-copy');
        const ok = q('exam-confirm-ok');
        if (!modal || !title || !copy || !ok) {
            return Promise.resolve(window.confirm(options.title || 'Continue?'));
        }

        if (runtime.confirmResolve) runtime.confirmResolve(false);
        if (kicker) kicker.textContent = options.kicker || 'Confirm Action';
        title.textContent = options.title || 'Continue?';
        copy.textContent = options.copy || 'Confirm before continuing.';
        ok.innerHTML = options.confirmLabel || 'Continue';
        ok.classList.toggle('is-danger', options.danger === true);
        modal.classList.add('is-visible');

        return new Promise(resolve => {
            runtime.confirmResolve = resolve;
        });
    }

    function setNotice(message, type = 'warn') {
        runtime.notice = {
            type,
            message: String(message || '').trim()
        };
        renderNotice();
    }

    function clearNotice() {
        runtime.notice = {
            type: '',
            message: ''
        };
        renderNotice();
    }

    function renderNotice() {
        const notice = q('exam-portal-notice');
        if (!notice) return;
        const hasMessage = Boolean(runtime.notice.message);
        notice.className = `exam-notice ${hasMessage ? `is-visible ${runtime.notice.type || 'warn'}` : ''}`.trim();
        notice.textContent = hasMessage ? runtime.notice.message : '';
    }

    async function fetchJson(path, options = {}) {
        let response;
        try {
            response = await fetch(buildExamPortalApiUrl(path), {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                cache: 'no-store'
            });
        } catch (error) {
            const failure = new Error('Exam services are currently unavailable. Start the platform backend and try again.');
            failure.cause = error;
            throw failure;
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false) {
            const error = new Error(payload?.error || payload?.message || 'Request failed.');
            error.status = response.status;
            throw error;
        }
        return payload;
    }

    function getFriendlyExamError(error) {
        const message = String(error?.message || '').trim();
        if (!message || /request failed/i.test(message)) {
            return 'The exam server could not complete this request. Confirm the platform backend is running on port 48933 and try again.';
        }
        if (/email and student id/i.test(message) || error?.status === 404) {
            return 'The email and student ID do not match an exam account. Check both values and try again.';
        }
        if (/anti-cheat/i.test(message) || error?.status === 403) {
            return 'This action is available only inside the KIU Anti-Cheat Browser.';
        }
        if (error?.status === 401) {
            return 'Your exam portal session expired. Sign in again to continue.';
        }
        return message;
    }

    function setButtonLoading(button, isLoading, label) {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalHtml = button.innerHTML;
            button.classList.add('is-loading');
            button.disabled = true;
            button.innerHTML = `<span class="exam-spinner" aria-hidden="true"></span> ${escapeHtml(label || 'Working')}`;
            return;
        }
        button.classList.remove('is-loading');
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
            delete button.dataset.originalHtml;
        }
    }

    async function refreshExamSystemStatus() {
        const backend = q('exam-backend-status');
        if (!backend) return;
        backend.textContent = 'Checking';
        try {
            await fetchJson('/api/portal/microsoft/config');
            backend.textContent = 'Online';
        } catch (error) {
            backend.textContent = 'Offline';
        }
    }

    function setToken(token, student) {
        runtime.token = String(token || '').trim();
        runtime.student = student || null;
        if (runtime.token) {
            sessionStorage.setItem(TOKEN_KEY, runtime.token);
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
        }
        if (runtime.student) {
            sessionStorage.setItem(STUDENT_KEY, JSON.stringify(runtime.student));
        } else {
            sessionStorage.removeItem(STUDENT_KEY);
        }
        try { localStorage.removeItem(TOKEN_KEY); } catch (error) {}
        try { localStorage.removeItem(STUDENT_KEY); } catch (error) {}
    }

    function clearPortalSession() {
        setToken('', null);
        runtime.sessions = [];
        clearNotice();
    }

    function deriveSessionStatus(session) {
        const startAt = parseDate(session?.startAt);
        const endAt = parseDate(session?.endAt);
        const now = Date.now();
        if (endAt && endAt <= now) return 'closed';
        if (startAt && startAt <= now) return 'live';
        return String(session?.status || 'scheduled');
    }

    function canLaunchSession(session) {
        return deriveSessionStatus(session) === 'live';
    }

    function getLaunchReason(session) {
        const status = deriveSessionStatus(session);
        if (status === 'live') return 'Start available now';
        if (status === 'closed') return 'This exam window is closed';
        return `Available at ${formatShortDate(session?.startAt)}`;
    }

    function getSpotlightSession() {
        const sessions = [...runtime.sessions];
        if (!sessions.length) return null;
        sessions.sort((left, right) => {
            const leftStatus = deriveSessionStatus(left);
            const rightStatus = deriveSessionStatus(right);
            if (leftStatus === 'live' && rightStatus !== 'live') return -1;
            if (rightStatus === 'live' && leftStatus !== 'live') return 1;
            return parseDate(left?.startAt) - parseDate(right?.startAt);
        });
        return sessions[0];
    }

    function getSessionGroupLabel(session) {
        const assignmentGroups = Array.isArray(session?.studentAssignment?.groupNames) ? session.studentAssignment.groupNames : [];
        const sessionGroups = Array.isArray(session?.groupNames) ? session.groupNames : [];
        const groups = assignmentGroups.length ? assignmentGroups : sessionGroups;
        if (groups.length) return groups.join(', ');
        return String(session?.groupName || session?.groupId || 'Assigned cohort');
    }

    function getSessionLocationLabel(session) {
        return String(session?.locationLabel || [session?.placeLabel, session?.roomLabel].filter(Boolean).join(' - ') || 'Computer lab').trim();
    }

    function getSessionObserverLabel(session) {
        const observers = Array.isArray(session?.observerNames) ? session.observerNames.filter(Boolean) : [];
        return observers.length ? observers.join(', ') : 'Observer not published yet';
    }

    function getSessionCountdownLabel(session, status = deriveSessionStatus(session)) {
        if (status === 'scheduled') return formatCountdown(parseDate(session?.startAt));
        if (status === 'live') return 'Exam is live';
        return 'Session closed';
    }

    function getSessionDomKey(sessionId) {
        return encodeURIComponent(String(sessionId || '').trim());
    }

    function renderEmptySessionState(list) {
        list.innerHTML = `
            <div class="exam-empty">
                <div class="exam-empty-icon"><i class="fas fa-calendar-check"></i></div>
                <strong>No exams are currently available</strong>
                <span>No live or upcoming exam sessions are assigned to this student account. This can mean the exam is not published yet, the student is not assigned, or the scheduled window has not been opened.</span>
            </div>
        `;
    }

    function buildSessionSpotlightMarkup(session) {
        if (!session) return '';
        const status = deriveSessionStatus(session);
        const sessionKey = getSessionDomKey(session.id);
        return `
            <section class="exam-session-hero" data-session-spotlight="${sessionKey}">
                <div class="exam-kicker" style="color:var(--exam-muted); opacity:1;">Priority Session</div>
                <div style="display:flex; justify-content:space-between; gap:14px; align-items:flex-start; flex-wrap:wrap;">
                    <div>
                        <h3 style="margin:0; font-size:22px;">${escapeHtml(session.title || session.subjectName || 'Scheduled exam')}</h3>
                        <div class="exam-panel-copy">${escapeHtml(session.subjectName || session.subjectId || '')} | ${escapeHtml(session.variantLabel || 'Variant')} | ${escapeHtml(getSessionGroupLabel(session))}</div>
                    </div>
                    <span class="exam-status exam-status-${escapeHtml(status)}" data-session-spotlight-status>${escapeHtml(status)}</span>
                </div>
                <div class="exam-card-meta">
                    <div><strong>Window</strong><span>${escapeHtml(formatDateTime(session.startAt))} to ${escapeHtml(formatDateTime(session.endAt))}</span></div>
                    <div><strong>Countdown</strong><span data-session-spotlight-countdown>${escapeHtml(getSessionCountdownLabel(session, status))}</span></div>
                    <div><strong>Secure Mode</strong><span>${escapeHtml(session.deliveryMode || 'Anti-cheat lab')}</span></div>
                    <div><strong>Room</strong><span>${escapeHtml(getSessionLocationLabel(session))}</span></div>
                    <div><strong>Observers</strong><span>${escapeHtml(getSessionObserverLabel(session))}</span></div>
                    <div><strong>Launch Rule</strong><span data-session-spotlight-launch-rule>${escapeHtml(canLaunchSession(session) ? 'Start available now' : 'Wait until the live window')}</span></div>
                </div>
            </section>
        `;
    }

    function buildSessionCardMarkup(session) {
        const status = deriveSessionStatus(session);
        const sessionKey = getSessionDomKey(session.id);
        return `
            <article class="exam-card is-${escapeHtml(status)}" data-session-card="${sessionKey}">
                <div class="exam-card-head">
                    <div>
                        <div class="exam-card-title">${escapeHtml(session.title || session.subjectName || 'Scheduled exam')}</div>
                        <div class="exam-card-copy">${escapeHtml(session.subjectName || session.subjectId || '')} | ${escapeHtml(session.variantLabel || 'Variant')} | ${escapeHtml(getSessionGroupLabel(session))}</div>
                    </div>
                    <span class="exam-status exam-status-${escapeHtml(status)}" data-session-status>${escapeHtml(status)}</span>
                </div>
                <div class="exam-card-meta">
                    <div><strong>Start</strong><span>${escapeHtml(formatDateTime(session.startAt))}</span></div>
                    <div><strong>Countdown</strong><span data-session-countdown>${escapeHtml(getSessionCountdownLabel(session, status))}</span></div>
                    <div><strong>Mode</strong><span>${escapeHtml(session.deliveryMode || 'Anti-cheat lab')}</span></div>
                    <div><strong>Room</strong><span>${escapeHtml(getSessionLocationLabel(session))}</span></div>
                    <div><strong>Observers</strong><span>${escapeHtml(getSessionObserverLabel(session))}</span></div>
                    <div><strong>Assigned Groups</strong><span>${escapeHtml(getSessionGroupLabel(session))}</span></div>
                </div>
                <div class="exam-chip-row">
                    <span class="exam-chip"><i class="fas fa-clock"></i> ${escapeHtml(String(session.durationMinutes || 0))} minutes</span>
                    <span class="exam-chip"><i class="fas fa-shield-halved"></i> Secure launch required</span>
                    <span class="exam-chip"><i class="fas fa-file-signature"></i> ${escapeHtml(session.variantLabel || 'Variant')}</span>
                </div>
                <div class="exam-action-row">
                    <span class="exam-launch-reason" data-session-launch-reason>${escapeHtml(getLaunchReason(session))}</span>
                    <button type="button" class="exam-primary-btn" ${!canLaunchSession(session) ? 'disabled' : ''} data-exam-launch-session="${escapeHtml(session.id)}">
                        <i class="fas fa-shield-halved"></i> Start In Anti-Cheat
                    </button>
                </div>
            </article>
        `;
    }

    function updateSessionCardNode(card, session) {
        if (!card || !session) return;
        const status = deriveSessionStatus(session);
        card.classList.remove('is-scheduled', 'is-live', 'is-closed');
        card.classList.add(`is-${status}`);

        const statusNode = card.querySelector('[data-session-status]');
        if (statusNode) {
            statusNode.className = `exam-status exam-status-${status}`;
            statusNode.textContent = status;
        }

        const countdownNode = card.querySelector('[data-session-countdown]');
        if (countdownNode) countdownNode.textContent = getSessionCountdownLabel(session, status);

        const reasonNode = card.querySelector('[data-session-launch-reason]');
        if (reasonNode) reasonNode.textContent = getLaunchReason(session);

        const launchButton = card.querySelector('[data-exam-launch-session]');
        if (launchButton) launchButton.disabled = !canLaunchSession(session);
    }

    function updateSessionSpotlightNode(node, session) {
        if (!node || !session) return;
        const status = deriveSessionStatus(session);

        const statusNode = node.querySelector('[data-session-spotlight-status]');
        if (statusNode) {
            statusNode.className = `exam-status exam-status-${status}`;
            statusNode.textContent = status;
        }

        const countdownNode = node.querySelector('[data-session-spotlight-countdown]');
        if (countdownNode) countdownNode.textContent = getSessionCountdownLabel(session, status);

        const launchRule = node.querySelector('[data-session-spotlight-launch-rule]');
        if (launchRule) launchRule.textContent = canLaunchSession(session) ? 'Start available now' : 'Wait until the live window';
    }

    function updateSessionCountdowns() {
        const list = q('exam-session-list');
        if (!list || !runtime.sessions.length) return;

        const spotlight = getSpotlightSession();
        const spotlightNode = list.querySelector('[data-session-spotlight]');
        if (spotlightNode && spotlight) updateSessionSpotlightNode(spotlightNode, spotlight);

        runtime.sessions.forEach(session => {
            const card = list.querySelector(`[data-session-card="${getSessionDomKey(session.id)}"]`);
            if (card) updateSessionCardNode(card, session);
        });
    }

    function stopDashboardTimer() {
        if (runtime.countdownTimer) {
            clearInterval(runtime.countdownTimer);
            runtime.countdownTimer = null;
        }
    }

    function stopProtectedCountdown() {
        if (runtime.protected.countdownTimer) {
            clearInterval(runtime.protected.countdownTimer);
            runtime.protected.countdownTimer = null;
        }
    }

    function stopProtectedHeartbeat() {
        if (runtime.heartbeatTimer) {
            clearInterval(runtime.heartbeatTimer);
            runtime.heartbeatTimer = null;
        }
    }

    function stopAllTimers() {
        stopDashboardTimer();
        stopProtectedCountdown();
        stopProtectedHeartbeat();
    }

    function renderSessionCards() {
        const list = q('exam-session-list');
        if (!list) return;

        if (!runtime.sessions.length) {
            renderEmptySessionState(list);
            return;
        }

        const spotlight = getSpotlightSession();
        const cards = runtime.sessions
            .slice()
            .sort((left, right) => parseDate(left?.startAt) - parseDate(right?.startAt))
            .map(buildSessionCardMarkup)
            .join('');

        list.innerHTML = `
            ${buildSessionSpotlightMarkup(spotlight)}
            <div class="exam-session-grid">${cards}</div>
        `;

        updateSessionCountdowns();
    }

    function startDashboardTimer() {
        stopDashboardTimer();
        if (document.hidden || !runtime.token || !runtime.sessions.length || runtime.protected.active) return;
        runtime.countdownTimer = setInterval(updateSessionCountdowns, 1000);
        updateSessionCountdowns();
    }

    async function refreshSessions() {
        if (!runtime.token) {
            stopDashboardTimer();
            renderSessionCards();
            return;
        }
        const payload = await fetchJson('/api/exam-portal/sessions', {
            headers: {
                'X-Exam-Portal-Token': runtime.token
            }
        });
        runtime.sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
        clearNotice();
        renderSessionCards();
        startDashboardTimer();
    }

    function renderAuthState() {
        const authPane = q('exam-auth-pane');
        const dashboard = q('exam-dashboard');
        const banner = q('exam-student-banner');
        if (!authPane || !dashboard || !banner) return;
        const loggedIn = Boolean(runtime.token && runtime.student);
        authPane.style.display = loggedIn ? 'none' : '';
        dashboard.style.display = loggedIn ? '' : 'none';
        banner.innerHTML = loggedIn
            ? `<strong>${escapeHtml(runtime.student.displayName || runtime.student.nameEn || runtime.student.name || runtime.student.email || runtime.student.id || 'Student')}</strong><span>${escapeHtml(runtime.student.email || '')} | ID ${escapeHtml(runtime.student.id || '')}</span>`
            : '<strong>Identity Check Required</strong><span>Sign in to view your exam windows, countdowns, and secure launch actions.</span>';
    }

    async function handlePortalLogin(event) {
        event.preventDefault();
        const email = q('exam-login-email')?.value?.trim() || '';
        const studentId = q('exam-login-student-id')?.value?.trim() || '';
        const errorBox = q('exam-login-error');
        const submitButton = q('exam-login-submit');
        if (errorBox) errorBox.textContent = '';

        try {
            setButtonLoading(submitButton, true, 'Verifying');
            const payload = await fetchJson('/api/exam-portal/auth', {
                method: 'POST',
                body: { email, studentId }
            });
            setToken(payload.token, payload.student || null);
            runtime.sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
            renderAuthState();
            clearNotice();
            renderSessionCards();
            startDashboardTimer();
        } catch (error) {
            if (errorBox) errorBox.textContent = getFriendlyExamError(error);
        } finally {
            setButtonLoading(submitButton, false);
        }
    }

    function logoutPortal() {
        stopDashboardTimer();
        clearProtectedDraft();
        clearPortalSession();
        renderAuthState();
        renderSessionCards();
    }

    async function launchScheduledExam(sessionId) {
        const session = runtime.sessions.find(item => String(item?.id) === String(sessionId));
        const confirmed = await showExamConfirm({
            kicker: 'Accidental Click Protection',
            title: 'Start this exam session?',
            copy: `You are about to open ${session?.title || session?.subjectName || 'this exam'} in the protected anti-cheat flow. Continue only when the invigilator has confirmed that the session should start.`,
            confirmLabel: '<i class="fas fa-shield-halved"></i> Start Secure Exam'
        });
        if (!confirmed) return;

        try {
            const payload = await fetchJson(`/api/exam-portal/sessions/${encodeURIComponent(String(sessionId || '').trim())}/launch-ticket`, {
                method: 'POST',
                headers: {
                    'X-Exam-Portal-Token': runtime.token
                },
                body: {
                    clientType: 'desktop-app',
                    securityLevel: 'desktop-locked'
                }
            });
            const launchUrl = String(payload.launchUrl || '').trim();
            if (!launchUrl) throw new Error('The anti-cheat launch URL was not returned.');
            window.location.href = launchUrl;
        } catch (error) {
            alert(error.message || 'Exam could not be launched.');
        }
    }

    function bindLaunchSessionButtons() {
        if (window.__KIU_EXAM_PORTAL_LAUNCH_BINDING) return;
        document.addEventListener('click', event => {
            const button = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('[data-exam-launch-session]')
                : null;
            if (!button) return;
            event.preventDefault();
            launchScheduledExam(button.getAttribute('data-exam-launch-session'));
        });
        window.__KIU_EXAM_PORTAL_LAUNCH_BINDING = true;
    }

    function computeProtectedDeadline(payload) {
        const quiz = payload?.quiz || {};
        const attempt = payload?.attempt || {};
        const availableUntil = parseDate(quiz.availableUntil);
        const startedAt = parseDate(attempt.startedAt || payload?.session?.createdAt);
        const durationDeadline = startedAt && Number(quiz.durationMinutes || 0)
            ? startedAt + (Number(quiz.durationMinutes || 0) * 60 * 1000)
            : 0;
        if (availableUntil && durationDeadline) return Math.min(availableUntil, durationDeadline);
        return availableUntil || durationDeadline || 0;
    }

    function countAnsweredQuestions() {
        const quiz = runtime.protected.payload?.quiz || {};
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        return questions.reduce((total, question) => {
            const raw = runtime.protected.answers[question.id];
            return total + (String(raw ?? '').trim() !== '' ? 1 : 0);
        }, 0);
    }

    function countFlaggedQuestions() {
        return Object.values(runtime.protected.flagged || {}).filter(Boolean).length;
    }

    function getAttemptScoreSummary(attempt = {}, quiz = {}) {
        const questionResults = Array.isArray(attempt.questionResults) ? attempt.questionResults : [];
        const quizQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const objectiveMax = questionResults.reduce((total, result) => {
            return total + (MANUAL_TYPES.has(String(result?.type || '').trim()) ? 0 : Number(result?.maxScore || 0));
        }, 0);
        const manualMax = questionResults.reduce((total, result) => {
            return total + (MANUAL_TYPES.has(String(result?.type || '').trim()) ? Number(result?.maxScore || 0) : 0);
        }, 0);
        const fallbackMax = quizQuestions.reduce((total, question) => total + Number(question?.score || 1), 0);
        const maxScore = objectiveMax + manualMax || fallbackMax;
        const objectiveScore = Math.max(0, Number(attempt.autoScoreRaw || 0));
        const manualScore = Math.max(0, Number(attempt.manualScoreRaw || 0));
        const finalScore = attempt.finalScoreRaw === null || attempt.finalScoreRaw === undefined
            ? null
            : Math.max(0, Number(attempt.finalScoreRaw || 0));
        return {
            objectiveScore,
            objectiveMax,
            manualScore,
            manualMax,
            finalScore,
            maxScore
        };
    }

    function getProtectedStartedAt() {
        const attempt = runtime.protected.payload?.attempt || {};
        const session = runtime.protected.payload?.session || {};
        return parseDate(attempt.startedAt || session.createdAt) || Date.now();
    }

    function getProtectedDraftKey() {
        const sessionToken = runtime.protected.payload?.session?.token || runtime.protected.sessionId || '';
        return `KIU_EXAM_DRAFT_${runtime.protected.courseId}_${runtime.protected.quizId}_${sessionToken}`;
    }

    function updateAutosaveState(message) {
        const autosave = q('protected-autosave-state');
        if (!autosave) return;
        const savedAt = runtime.lastAutosaveAt ? formatShortDate(runtime.lastAutosaveAt) : 'Not saved yet';
        autosave.innerHTML = `<strong>Autosave</strong><span>${escapeHtml(message || `Saved locally at ${savedAt}`)}</span>`;
    }

    function saveProtectedDraft() {
        if (!runtime.protected.active || runtime.protected.submitted) return;
        runtime.lastAutosaveAt = Date.now();
        try {
            sessionStorage.setItem(getProtectedDraftKey(), JSON.stringify({
                answers: runtime.protected.answers,
                flagged: runtime.protected.flagged,
                savedAt: runtime.lastAutosaveAt
            }));
        } catch (error) {}
        updateAutosaveState();
    }

    function restoreProtectedDraft() {
        try {
            const raw = sessionStorage.getItem(getProtectedDraftKey()) || localStorage.getItem(getProtectedDraftKey());
            if (!raw) return;
            const draft = JSON.parse(raw);
            if (draft && typeof draft === 'object') {
                if (draft.answers && typeof draft.answers === 'object') {
                    runtime.protected.answers = { ...runtime.protected.answers, ...draft.answers };
                }
                if (draft.flagged && typeof draft.flagged === 'object') {
                    runtime.protected.flagged = { ...runtime.protected.flagged, ...draft.flagged };
                }
                runtime.lastAutosaveAt = Number(draft.savedAt || 0) || 0;
            }
            try { localStorage.removeItem(getProtectedDraftKey()); } catch (error) {}
        } catch (error) {}
    }

    function clearProtectedDraft() {
        try {
            sessionStorage.removeItem(getProtectedDraftKey());
            localStorage.removeItem(getProtectedDraftKey());
        } catch (error) {}
        runtime.lastAutosaveAt = 0;
    }

    function updateProtectedFlagButtons() {
        document.querySelectorAll('[data-question-flag]').forEach(button => {
            const questionId = button.getAttribute('data-question-flag');
            const flagged = runtime.protected.flagged[questionId] === true;
            button.classList.toggle('is-active', flagged);
            button.innerHTML = `<i class="fas fa-flag"></i> ${flagged ? 'Flagged' : 'Flag'}`;
        });
    }

    function updateProtectedAnswerVisuals() {
        const quiz = runtime.protected.payload?.quiz || {};
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const summary = q('protected-progress-summary');
        if (summary) {
            summary.textContent = `${countAnsweredQuestions()} of ${questions.length} answered`;
        }

        document.querySelectorAll('[data-question-nav]').forEach(button => {
            const questionId = button.getAttribute('data-question-nav');
            const answered = String(runtime.protected.answers[questionId] ?? '').trim() !== '';
            const flagged = runtime.protected.flagged[questionId] === true;
            const state = button.querySelector('[data-question-state]');
            if (state) state.textContent = flagged ? 'Flagged' : answered ? 'Answered' : 'Pending';
            button.classList.toggle('is-answered', answered);
            button.classList.toggle('is-flagged', flagged);
        });

        updateProtectedFlagButtons();
    }

    function updateProtectedCountdown() {
        const deadline = runtime.protected.deadlineAt;
        const timer = q('protected-exam-timer');
        if (timer) timer.textContent = deadline ? formatCountdown(deadline) : '--:--:--';
        const stickyLeft = q('protected-exam-left');
        if (stickyLeft) stickyLeft.textContent = deadline ? formatCountdown(deadline) : '--:--:--';
        const elapsed = q('protected-exam-elapsed');
        if (elapsed) elapsed.textContent = formatDuration(Date.now() - getProtectedStartedAt());
        const endsAt = q('protected-exam-ends');
        if (endsAt) endsAt.textContent = deadline ? formatShortDate(deadline) : 'No deadline';
        if (deadline && Date.now() >= deadline && runtime.protected.revealed && !runtime.protected.submitted) {
            submitProtectedExam('time-expired');
        }
    }

    function startProtectedCountdown() {
        stopProtectedCountdown();
        if (document.hidden || !runtime.protected.active || runtime.protected.submitted) return;
        runtime.protected.countdownTimer = setInterval(updateProtectedCountdown, 1000);
        updateProtectedCountdown();
    }

    function startProtectedHeartbeat() {
        stopProtectedHeartbeat();
        if (document.hidden || !runtime.protected.active || runtime.protected.submitted) return;
        runtime.heartbeatTimer = setInterval(() => {
            if (!runtime.protected.active || runtime.protected.submitted) return;
            fetchJson(`/api/protected-quizzes/${encodeURIComponent(runtime.protected.quizId)}/heartbeat`, {
                method: 'POST',
                body: {
                    courseId: runtime.protected.courseId,
                    clientSessionToken: runtime.protected.payload?.session?.token || '',
                    status: 'active'
                }
            }).catch(() => null);
        }, 15000);
    }

    function getQuestionTypeLabel(type) {
        const normalized = String(type || 'mcq').trim().toLowerCase();
        if (normalized === 'short') return 'Short Answer';
        if (MANUAL_TYPES.has(normalized)) return 'Written Response';
        return 'Multiple Choice';
    }

    function buildProtectedQuestionInputMarkup(question, answerValue) {
        const type = String(question?.type || 'mcq').trim().toLowerCase();
        if (type === 'short') {
            return `<input type="text" class="exam-input" data-question-id="${escapeHtml(question.id)}" value="${escapeHtml(String(answerValue || ''))}" placeholder="Enter your answer">`;
        }
        if (MANUAL_TYPES.has(type)) {
            return `<textarea class="exam-textarea" data-question-id="${escapeHtml(question.id)}" placeholder="Write your answer here">${escapeHtml(String(answerValue || ''))}</textarea>`;
        }
        return `
            <div class="exam-option-list">
                ${(question.options || []).map((option, optionIndex) => `
                    <label class="exam-option">
                        <input type="radio" name="question-${escapeHtml(question.id)}" value="${escapeHtml(String(optionIndex))}" ${String(answerValue) === String(optionIndex) ? 'checked' : ''}>
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    function buildProtectedQuestionCardMarkup(question, index) {
        const answerValue = runtime.protected.answers[question.id] ?? '';
        return `
            <article class="exam-question-card" id="question-${escapeHtml(question.id)}" data-question-id="${escapeHtml(question.id)}">
                <div class="exam-question-toolbar">
                    <div class="exam-question-title">Question ${index + 1} | ${escapeHtml(getQuestionTypeLabel(question.type))}</div>
                    <button type="button" class="exam-flag-btn ${runtime.protected.flagged[question.id] ? 'is-active' : ''}" data-question-flag="${escapeHtml(question.id)}">
                        <i class="fas fa-flag"></i> ${runtime.protected.flagged[question.id] ? 'Flagged' : 'Flag'}
                    </button>
                </div>
                <div class="exam-question-copy">${escapeHtml(question.text || '')}</div>
                <div class="exam-question-score">${escapeHtml(String(question.score || 1))} points</div>
                ${buildProtectedQuestionInputMarkup(question, answerValue)}
            </article>
        `;
    }

    function buildProtectedReceiptMarkup(quiz, attempt, session) {
        const needsManual = attempt.requiresManualReview === true;
        const scoreSummary = getAttemptScoreSummary(attempt, quiz);
        return `
            <main class="exam-protected-shell">
                <section class="exam-protected-hero">
                    <div class="exam-kicker">Submission Receipt</div>
                    <div class="exam-protected-title">${escapeHtml(quiz.title || 'Exam submitted')}</div>
                    <p class="exam-protected-copy">Your submission is recorded. Objective scoring is visible immediately, while manual grading remains hidden until the reviewer finalizes it.</p>
                </section>
                <section class="exam-receipt-card">
                    <div class="exam-card-meta">
                        <div><strong>Objective Score</strong><span>${escapeHtml(String(scoreSummary.objectiveScore))}/${escapeHtml(String(scoreSummary.objectiveMax || scoreSummary.maxScore))}</span></div>
                        <div><strong>Final Score</strong><span>${scoreSummary.finalScore === null ? 'Pending' : `${escapeHtml(String(scoreSummary.finalScore))}/${escapeHtml(String(scoreSummary.maxScore))}`}</span></div>
                        <div><strong>Status</strong><span>${escapeHtml(String(attempt.status || 'submitted'))}</span></div>
                        <div><strong>Submitted</strong><span>${escapeHtml(formatShortDate(attempt.submittedAt || ''))}</span></div>
                        <div><strong>Manual Review</strong><span>${needsManual ? `Pending (${escapeHtml(String(scoreSummary.manualMax))} pts)` : 'Not required'}</span></div>
                        <div><strong>Variant</strong><span>${escapeHtml(session.variantLabel || 'Variant')}</span></div>
                        <div><strong>Room</strong><span>${escapeHtml(getSessionLocationLabel(session))}</span></div>
                    </div>
                    <div class="exam-panel-copy">${needsManual ? 'Written or short-answer responses are pending manual review. Final score will update after grading.' : 'This exam did not require manual review.'}</div>
                </section>
            </main>
        `;
    }

    function buildProtectedReadyMarkup(session) {
        return `
            <section class="exam-ready-panel">
                <div class="exam-kicker" style="color:var(--exam-muted); opacity:1;">Ready Check</div>
                <h2 style="margin:0;">Start only when your invigilator confirms the live session</h2>
                <div class="exam-panel-copy">The question body stays hidden until you explicitly begin in the protected environment. Once started, leaving this secure session may auto-submit your exam.</div>
                <div class="exam-chip-row">
                    <span class="exam-chip"><i class="fas fa-eye-slash"></i> Questions hidden</span>
                    <span class="exam-chip"><i class="fas fa-shield-halved"></i> Anti-cheat active</span>
                    <span class="exam-chip"><i class="fas fa-file-signature"></i> ${escapeHtml(session.variantLabel || 'Variant')}</span>
                </div>
                <div class="exam-action-row">
                    <button type="button" class="exam-primary-btn" id="protected-start-btn"><i class="fas fa-play"></i> Start Exam</button>
                </div>
            </section>
        `;
    }

    function buildProtectedWorkspaceMarkup(quiz, attempt, session, questions) {
        return `
            <main class="exam-protected-shell">
                <section class="exam-protected-hero">
                    <div class="exam-kicker">Protected Exam Session</div>
                    <div class="exam-protected-title">${escapeHtml(quiz.title || 'Scheduled exam')}</div>
                    <p class="exam-protected-copy">${escapeHtml(quiz.instructions || 'Read each question carefully. Leaving the protected exam environment may trigger automatic submission.')}</p>
                    <div class="exam-hero-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(session.studentName || attempt.studentName || 'Student')}</span>
                        <span><i class="fas fa-file-signature"></i> ${escapeHtml(session.variantLabel || 'Variant')}</span>
                        <span><i class="fas fa-location-dot"></i> ${escapeHtml(getSessionLocationLabel(session))}</span>
                        <span><i class="fas fa-user-shield"></i> ${escapeHtml(getSessionObserverLabel(session))}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHtml(String(quiz.durationMinutes || 0))} minutes</span>
                        <span><i class="fas fa-stopwatch"></i> <strong id="protected-exam-timer">--:--:--</strong></span>
                    </div>
                </section>
                ${runtime.protected.revealed ? `
                    <section class="exam-sticky-timer" aria-label="Exam timing">
                        <div>
                            <strong>Time Left</strong>
                            <span id="protected-exam-left">--:--:--</span>
                        </div>
                        <div>
                            <strong>Time Passed</strong>
                            <span id="protected-exam-elapsed">00:00:00</span>
                        </div>
                        <div>
                            <strong>Exam Ends</strong>
                            <span id="protected-exam-ends">No deadline</span>
                        </div>
                    </section>
                    <div class="exam-protected-layout">
                        <aside class="exam-protected-card">
                            <h3 style="margin:0;">Exam Progress</h3>
                            <div class="exam-progress-grid">
                                <div class="exam-progress-box">
                                    <strong>Answered</strong>
                                    <span id="protected-progress-summary">${escapeHtml(String(countAnsweredQuestions()))} of ${escapeHtml(String(questions.length))} answered</span>
                                </div>
                                <div class="exam-progress-box">
                                    <strong>Question Count</strong>
                                    <span>${escapeHtml(String(questions.length))}</span>
                                </div>
                            </div>
                            <div class="exam-autosave" id="protected-autosave-state">
                                <strong>Autosave</strong>
                                <span>Ready</span>
                            </div>
                            <div class="exam-nav-list">
                                ${questions.map((question, index) => `
                                    <button type="button" class="exam-nav-btn ${String(runtime.protected.answers[question.id] ?? '').trim() ? 'is-answered' : ''}" data-question-nav="${escapeHtml(question.id)}">
                                        <span>Question ${index + 1}</span>
                                        <span data-question-state>${runtime.protected.flagged[question.id] ? 'Flagged' : String(runtime.protected.answers[question.id] ?? '').trim() ? 'Answered' : 'Pending'}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </aside>
                        <section class="exam-protected-card">
                            <form id="protected-exam-form" class="exam-question-list">
                                ${questions.map(buildProtectedQuestionCardMarkup).join('')}
                                <div class="exam-action-row">
                                    <button type="submit" class="exam-primary-btn"><i class="fas fa-paper-plane"></i> Submit Exam</button>
                                </div>
                            </form>
                        </section>
                    </div>
                ` : buildProtectedReadyMarkup(session)}
            </main>
        `;
    }

    function bindProtectedShellEvents() {
        const form = q('protected-exam-form');
        if (form) {
            form.addEventListener('submit', event => {
                event.preventDefault();
                submitProtectedExam('student-submit');
            });

            form.querySelectorAll('textarea[data-question-id], input[type="text"][data-question-id]').forEach(control => {
                control.addEventListener('input', () => {
                    const questionId = control.getAttribute('data-question-id');
                    runtime.protected.answers[questionId] = control.value;
                    updateProtectedAnswerVisuals();
                    saveProtectedDraft();
                });
            });

            form.querySelectorAll('input[type="radio"]').forEach(input => {
                input.addEventListener('change', () => {
                    const questionId = String(input.name || '').replace(/^question-/, '');
                    runtime.protected.answers[questionId] = input.value;
                    updateProtectedAnswerVisuals();
                    saveProtectedDraft();
                });
            });
        }

        document.querySelectorAll('[data-question-nav]').forEach(button => {
            button.addEventListener('click', () => {
                const questionId = button.getAttribute('data-question-nav');
                const target = q(`question-${questionId}`);
                if (target && typeof target.scrollIntoView === 'function') {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        document.querySelectorAll('[data-question-flag]').forEach(button => {
            button.addEventListener('click', () => {
                const questionId = button.getAttribute('data-question-flag');
                runtime.protected.flagged[questionId] = runtime.protected.flagged[questionId] !== true;
                updateProtectedAnswerVisuals();
                saveProtectedDraft();
            });
        });

        const startBtn = q('protected-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                const confirmed = await showExamConfirm({
                    kicker: 'Timed Exam Start',
                    title: 'Begin the timed exam?',
                    copy: 'Questions will become visible and the secure session will be treated as active. Start only after the invigilator confirms you may proceed.',
                    confirmLabel: '<i class="fas fa-play"></i> Begin Exam'
                });
                if (!confirmed) return;
                runtime.protected.revealed = true;
                renderProtectedShell();
            });
        }
    }

    function renderProtectedShell() {
        const root = q('exam-portal-root');
        if (!root) return;

        const payload = runtime.protected.payload || {};
        const quiz = payload.quiz || {};
        const attempt = payload.attempt || {};
        const session = payload.session || {};
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const hasFinalized = FINAL_ATTEMPT_STATUSES.has(String(attempt.status || '').trim()) || runtime.protected.submitted;

        stopDashboardTimer();

        if (hasFinalized) {
            stopAllTimers();
            root.innerHTML = buildProtectedReceiptMarkup(quiz, attempt, session);
            return;
        }

        root.innerHTML = buildProtectedWorkspaceMarkup(quiz, attempt, session, questions);
        bindProtectedShellEvents();
        startProtectedCountdown();
        updateProtectedAnswerVisuals();
        updateAutosaveState(runtime.lastAutosaveAt ? null : 'No local answers saved yet');
    }

    function buildQuestionResults(payload) {
        const quiz = payload?.quiz || {};
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const answers = runtime.protected.answers || {};
        let autoScoreRaw = 0;
        let writtenCount = 0;

        const questionResults = questions.map(question => {
            const type = String(question.type || 'mcq').trim().toLowerCase();
            const isManual = MANUAL_TYPES.has(type);
            const rawAnswer = answers[question.id];
            const answerText = isManual
                ? String(rawAnswer || '').trim()
                : (question.options || [])[Number(rawAnswer ?? -1)] || '';
            const maxScore = Number(question.score || 1);
            const scoreAwarded = isManual
                ? 0
                : Number(rawAnswer) === Number(question.correctOption) ? maxScore : 0;
            if (!isManual) autoScoreRaw += scoreAwarded;
            if (isManual) writtenCount += 1;

            return {
                questionId: String(question.id || ''),
                questionText: String(question.text || ''),
                answerText,
                answerValue: rawAnswer ?? '',
                type,
                maxScore,
                scoreAwarded,
                needsManualReview: isManual,
                isCorrect: isManual ? null : Number(rawAnswer) === Number(question.correctOption)
            };
        });

        return {
            answers,
            questionResults,
            autoScoreRaw,
            requiresManualReview: writtenCount > 0,
            responseSummary: {
                totalQuestions: questions.length,
                answeredQuestions: questionResults.filter(result => String(result.answerText || '').trim()).length,
                writtenQuestions: writtenCount,
                objectiveQuestions: questions.length - writtenCount
            }
        };
    }

    async function submitProtectedExam(reason) {
        if (runtime.protected.submitted || runtime.protected.submitting) return;
        if (reason === 'student-submit') {
            const answered = countAnsweredQuestions();
            const total = Array.isArray(runtime.protected.payload?.quiz?.questions) ? runtime.protected.payload.quiz.questions.length : 0;
            const flagged = countFlaggedQuestions();
            const confirmed = await showExamConfirm({
                kicker: 'Final Submission',
                title: 'Submit your exam?',
                copy: `You have answered ${answered} of ${total} questions and flagged ${flagged}. After submission, you cannot return to the exam.`,
                confirmLabel: '<i class="fas fa-paper-plane"></i> Submit Exam'
            });
            if (!confirmed) return;
        }

        runtime.protected.submitting = true;
        const payload = runtime.protected.payload;
        const courseId = runtime.protected.courseId;
        const quizId = runtime.protected.quizId;
        const computed = buildQuestionResults(payload);

        try {
            const result = await fetchJson(`/api/protected-quizzes/${encodeURIComponent(quizId)}/submit`, {
                method: 'POST',
                body: {
                    courseId,
                    clientSessionToken: payload?.session?.token || '',
                    submitReason: reason,
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                    autoScoreRaw: computed.autoScoreRaw,
                    manualScoreRaw: 0,
                    finalScoreRaw: computed.requiresManualReview ? null : computed.autoScoreRaw,
                    requiresManualReview: computed.requiresManualReview,
                    answers: computed.answers,
                    questionResults: computed.questionResults,
                    responseSummary: computed.responseSummary,
                    details: {
                        submitReason: reason
                    }
                }
            });
            runtime.protected.payload.attempt = result.attempt || runtime.protected.payload.attempt;
            runtime.protected.submitted = true;
            clearProtectedDraft();
            stopAllTimers();
            renderProtectedShell();
        } catch (error) {
            alert(error.message || 'Exam submission failed.');
        } finally {
            runtime.protected.submitting = false;
        }
    }

    function syncTimerVisibility() {
        if (document.hidden) {
            stopAllTimers();
            return;
        }

        if (runtime.protected.active && !runtime.protected.submitted) {
            startProtectedCountdown();
            startProtectedHeartbeat();
            return;
        }

        startDashboardTimer();
    }

    async function bootstrapProtectedMode() {
        const params = getQuery();
        const courseId = String(params.get('protectedCourseKey') || '').trim();
        const quizId = String(params.get('protectedQuizId') || '').trim();
        const sessionId = String(params.get('sessionId') || '').trim();
        if (!courseId || !quizId) return false;

        runtime.protected.active = true;
        runtime.protected.courseId = courseId;
        runtime.protected.quizId = quizId;
        runtime.protected.sessionId = sessionId;

        try {
            const payload = await fetchJson(`/api/protected-quizzes/${encodeURIComponent(quizId)}/attempt?courseId=${encodeURIComponent(courseId)}`);
            runtime.protected.payload = payload || null;
            runtime.protected.deadlineAt = computeProtectedDeadline(payload);
            restoreProtectedDraft();
            startProtectedHeartbeat();
            renderProtectedShell();
            return true;
        } catch (error) {
            const root = q('exam-portal-root');
            if (root) {
                root.innerHTML = `
                    <main class="exam-protected-shell">
                        <section class="exam-receipt-card">
                            <div class="exam-kicker" style="color:var(--exam-muted); opacity:1;">Launch Error</div>
                            <h2 style="margin:0;">Protected exam session could not be loaded</h2>
                            <div class="exam-panel-copy">${escapeHtml(error.message || 'The exam session is invalid or expired.')}</div>
                        </section>
                    </main>
                `;
            }
            return true;
        }
    }

    function attachAutoSubmitGuards() {
        window.addEventListener('pagehide', () => {
            if (!runtime.protected.active || !runtime.protected.revealed || runtime.protected.submitted) return;

            const body = {
                courseId: runtime.protected.courseId,
                clientSessionToken: runtime.protected.payload?.session?.token || '',
                submitReason: 'pagehide-auto-submit',
                status: 'auto-submitted',
                submittedAt: new Date().toISOString(),
                autoScoreRaw: 0,
                manualScoreRaw: 0,
                finalScoreRaw: null,
                requiresManualReview: true,
                details: {
                    submitReason: 'pagehide-auto-submit'
                }
            };

            const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
            navigator.sendBeacon(buildExamPortalApiUrl(`/api/protected-quizzes/${encodeURIComponent(runtime.protected.quizId)}/submit`), blob);
        });
    }

    function renderPortalShell() {
        renderAuthState();
        renderNotice();
        renderSessionCards();
        startDashboardTimer();
    }

    function initDashboardEvents() {
        const form = q('exam-login-form');
        if (form) form.addEventListener('submit', handlePortalLogin);
        const logout = q('exam-logout-btn');
        if (logout) logout.addEventListener('click', logoutPortal);
    }

    window.launchScheduledExam = launchScheduledExam;

    document.addEventListener('DOMContentLoaded', async () => {
        bindLaunchSessionButtons();
        bindConfirmModal();
        document.addEventListener('visibilitychange', syncTimerVisibility);
        window.addEventListener('pagehide', stopAllTimers);

        if (!isAntiCheatBrowser()) {
            renderAntiCheatOnlyBlock();
            return;
        }

        const protectedMode = await bootstrapProtectedMode();
        if (protectedMode) {
            attachAutoSubmitGuards();
            return;
        }

        initDashboardEvents();
        renderPortalShell();
        refreshExamSystemStatus();
        syncTimerVisibility();

        if (runtime.token) {
            try {
                await refreshSessions();
            } catch (error) {
                if (error?.status === 401 || error?.status === 404) {
                    clearPortalSession();
                    renderPortalShell();
                    setNotice('Your previous exam portal session expired. Sign in again to continue.', 'warn');
                } else {
                    setNotice(error.message || 'Exam sessions could not be refreshed.', 'danger');
                }
            }
        }
    }, { once: true });
})();
