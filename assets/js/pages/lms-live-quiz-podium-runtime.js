/* LMS live quiz Kahoot-style fullscreen ranking podium overlay. */

function resolveLmsLivePodiumSession(resourceKey) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return null;
    if (typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey)) {
        return (typeof getLmsLiveStaffLiveSession === 'function' ? getLmsLiveStaffLiveSession(canonicalKey) : null)
            || (typeof getLmsLiveStaffEditingSession === 'function' ? getLmsLiveStaffEditingSession(canonicalKey) : null);
    }
    return typeof getLmsLiveStudentSession === 'function' ? getLmsLiveStudentSession(canonicalKey) : null;
}

function renderLmsLivePodiumPedestal(rank, participant, options = {}) {
    const emptyCopy = rank === 1 ? 'No winner yet' : `No #${rank} yet`;
    const name = participant ? escapeHtml(participant.nickname || 'Student') : escapeHtml(emptyCopy);
    const score = participant ? escapeHtml(String(participant.score || 0)) : '—';
    const rankClass = rank === 1 ? 'is-rank-1' : rank === 2 ? 'is-rank-2' : 'is-rank-3';
    const winnerClass = rank === 1 && participant ? ' is-winner' : '';
    const revealClass = options.revealClass || '';
    const icon = rank === 1 ? 'fa-trophy' : rank === 2 ? 'fa-medal' : 'fa-award';
    return `
        <div class="lms-live-podium-pedestal ${rankClass}${winnerClass}${revealClass}" data-lms-podium-rank="${rank}">
            <div class="lms-live-podium-rank-badge">${rank}</div>
            <div class="lms-live-podium-avatar"><i class="fas ${icon}"></i></div>
            <div class="lms-live-podium-name">${name}</div>
            <div class="lms-live-podium-score">${score} pts</div>
            <div class="lms-live-podium-block"></div>
        </div>
    `;
}

function renderLmsLivePodiumRunnersMarkup(session, startRank = 4) {
    const leaders = typeof getLmsLiveLeaderboard === 'function'
        ? getLmsLiveLeaderboard(session).slice(startRank - 1, 10)
        : [];
    if (!leaders.length) return '';
    return `
        <div class="lms-live-podium-runners">
            ${leaders.map((participant, index) => `
                <div class="lms-live-podium-runner">
                    <span class="lms-live-podium-runner-rank">${startRank + index}</span>
                    <span class="lms-live-podium-runner-name">${escapeHtml(participant.nickname || 'Student')}</span>
                    <strong class="lms-live-podium-runner-score">${escapeHtml(String(participant.score || 0))}</strong>
                </div>
            `).join('')}
        </div>
    `;
}

function renderLmsLivePodiumConfettiMarkup(count = 32) {
    const colors = ['#f5c542', '#4fd1c5', '#ff6b8a', '#7c8cff', '#9ef01a', '#ff9f43'];
    return Array.from({ length: count }, (_, index) => {
        const left = (index * 17 + 7) % 100;
        const delay = (index % 8) * 0.08;
        const duration = 2.4 + (index % 5) * 0.18;
        const color = colors[index % colors.length];
        return `<span class="lms-live-podium-confetti" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;background:${color};"></span>`;
    }).join('');
}

function renderLmsLivePodiumMarkup(session, resourceKey, options = {}) {
    const leaders = typeof getLmsLiveLeaderboard === 'function' ? getLmsLiveLeaderboard(session) : [];
    const top3 = [leaders[2] || null, leaders[1] || null, leaders[0] || null];
    const ranks = [3, 2, 1];
    const canManage = typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(resourceKey);
    const closeAttr = canManage
        ? `data-lms-click="dismissLmsLiveQuizPodium(${typeof lmsInlineArg === 'function' ? lmsInlineArg(resourceKey) : JSON.stringify(resourceKey)})"`
        : '';
    const podiumBody = `
            <div class="lms-live-podium-stage">
                ${ranks.map((rank, index) => renderLmsLivePodiumPedestal(rank, top3[index], {
                    revealClass: options.skipAnimation ? ' is-revealed' : ''
                })).join('')}
            </div>
            ${renderLmsLivePodiumRunnersMarkup(session)}`;
    const glassPanel = typeof renderLmsGlassDialogCard === 'function'
        ? renderLmsGlassDialogCard({
            hookClass: 'lms-live-podium-panel',
            bodyClass: 'lms-live-podium-content',
            title: 'Class podium',
            icon: 'fa-trophy',
            subtitle: 'Final rankings',
            closeAttr: closeAttr || 'data-lms-click="void(0)"',
            bodyHtml: podiumBody,
            actionsHtml: canManage
                ? `<button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" ${closeAttr}><i class="fas fa-xmark"></i> Close rankings</button>`
                : ''
        })
        : `<div class="lms-live-podium-content">${podiumBody}</div>`;
    return `
        <div class="lms-live-podium-confetti-layer" aria-hidden="true">${renderLmsLivePodiumConfettiMarkup()}</div>
        ${glassPanel}
    `;
}

function clearLmsLivePodiumAnimationTimers() {
    if (typeof window === 'undefined') return;
    const timers = window.__lmsLivePodiumAnimationTimers;
    if (!Array.isArray(timers)) return;
    timers.forEach(timerId => clearTimeout(timerId));
    window.__lmsLivePodiumAnimationTimers = [];
}

function runLmsLivePodiumRevealAnimation(root) {
    if (!root || typeof window === 'undefined') return;
    clearLmsLivePodiumAnimationTimers();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.querySelectorAll('[data-lms-podium-rank]').forEach(node => node.classList.add('is-revealed'));
        root.classList.add('is-animation-complete');
        return;
    }
    const timers = [];
    const revealOrder = [3, 2, 1];
    revealOrder.forEach((rank, index) => {
        const timerId = window.setTimeout(() => {
            const node = root.querySelector(`[data-lms-podium-rank="${rank}"]`);
            if (node) node.classList.add('is-revealed');
            if (rank === 1) {
                root.classList.add('is-winner-revealed', 'is-animation-complete');
            }
        }, 500 + (index * 900));
        timers.push(timerId);
    });
    window.__lmsLivePodiumAnimationTimers = timers;
}

function unmountLmsLivePodiumOverlay() {
    if (typeof document === 'undefined') return;
    clearLmsLivePodiumAnimationTimers();
    const existing = document.getElementById('lms-live-podium-overlay');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(existing, { instant: true });
    } else {
        existing?.remove();
    }
    if (typeof window !== 'undefined') {
        window.__lmsLivePodiumMountedAt = '';
    }
}

function mountLmsLivePodiumOverlay(resourceKey) {
    if (typeof document === 'undefined' || !isLmsActiveTab('live-quiz')) return false;
    const session = resolveLmsLivePodiumSession(resourceKey);
    if (!session?.showPodium) {
        unmountLmsLivePodiumOverlay();
        return false;
    }
    const revealAt = String(session.podiumRevealAt || 'active');
    let overlay = document.getElementById('lms-live-podium-overlay');
    if (overlay && typeof window !== 'undefined' && window.__lmsLivePodiumMountedAt === revealAt) {
        return true;
    }
    const shouldAnimate = typeof window !== 'undefined'
        && window.__lmsLivePodiumMountedAt !== revealAt;
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lms-live-podium-overlay';
        overlay.className = 'lms-live-podium-overlay lms-glass-dialog-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Live quiz rankings');
        document.body.appendChild(overlay);
    }
    overlay.dataset.lmsPodiumRevealAt = revealAt;
    overlay.innerHTML = renderLmsLivePodiumMarkup(session, resourceKey, { skipAnimation: !shouldAnimate });
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
    if (shouldAnimate) {
        runLmsLivePodiumRevealAnimation(overlay);
        if (typeof window !== 'undefined') {
            window.__lmsLivePodiumMountedAt = revealAt;
        }
    } else {
        overlay.classList.add('is-animation-complete');
        overlay.querySelectorAll('[data-lms-podium-rank]').forEach(node => node.classList.add('is-revealed'));
    }
    return true;
}

function syncLmsLivePodiumOverlay(resourceKey) {
    if (typeof document === 'undefined' || !isLmsActiveTab('live-quiz')) {
        unmountLmsLivePodiumOverlay();
        return;
    }
    const session = resolveLmsLivePodiumSession(resourceKey);
    if (session?.showPodium) {
        mountLmsLivePodiumOverlay(resourceKey);
        return;
    }
    unmountLmsLivePodiumOverlay();
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        mountLmsLivePodiumOverlay,
        unmountLmsLivePodiumOverlay,
        syncLmsLivePodiumOverlay
    });
}