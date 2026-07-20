/* LMS whiteboard ephemeral collaboration: cursors, laser, follow presenter. */

const LMS_WHITEBOARD_COLLAB = {
    cursors: {},
    lasers: {},
    presenterViewport: null,
    followInstructor: true,
    presentView: false,
    laserMode: false,
    lastCursorSentAt: 0,
    lastViewportSentAt: 0,
    lastStrokeOpSentAt: 0,
    boundKey: '',
    signalsBlockedByKey: {}
};

const LMS_WHITEBOARD_COLLAB_CURSOR_TTL_MS = 10000;
const LMS_WHITEBOARD_COLLAB_LASER_TTL_MS = 1800;
const LMS_WHITEBOARD_COLLAB_CURSOR_THROTTLE_MS = 120;
const LMS_WHITEBOARD_COLLAB_VIEWPORT_THROTTLE_MS = 220;
const LMS_WHITEBOARD_COLLAB_STROKE_OP_THROTTLE_MS = 160;

function getLmsWhiteboardActorLabel() {
    if (typeof getCurrentUserDisplayName === 'function') {
        return String(getCurrentUserDisplayName() || '').trim();
    }
    return typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
}

function getLmsWhiteboardCollabColor(userId = '') {
    const palette = ['#f4d06f', '#caffbf', '#bdb2ff', '#ffd6a5', '#ffadad', '#9bf6ff'];
    const seed = String(userId || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return palette[seed % palette.length];
}

function pruneLmsWhiteboardCollabState() {
    const now = Date.now();
    Object.keys(LMS_WHITEBOARD_COLLAB.cursors).forEach(userId => {
        const cursor = LMS_WHITEBOARD_COLLAB.cursors[userId];
        if (!cursor || (now - Number(cursor.updatedAt || 0)) > LMS_WHITEBOARD_COLLAB_CURSOR_TTL_MS) {
            delete LMS_WHITEBOARD_COLLAB.cursors[userId];
        }
    });
    Object.keys(LMS_WHITEBOARD_COLLAB.lasers).forEach(userId => {
        const laser = LMS_WHITEBOARD_COLLAB.lasers[userId];
        if (!laser || (now - Number(laser.updatedAt || 0)) > LMS_WHITEBOARD_COLLAB_LASER_TTL_MS) {
            delete LMS_WHITEBOARD_COLLAB.lasers[userId];
        }
    });
}

function canEmitLmsWhiteboardCollabSignals(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return false;
    // Personal My Workspace cameras stay per-account — never broadcast collab signals there.
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)) return false;
    if (LMS_WHITEBOARD_COLLAB.signalsBlockedByKey[canonicalKey]) return false;
    if (typeof shouldSyncLmsWhiteboardWorkspace === 'function' && !shouldSyncLmsWhiteboardWorkspace(canonicalKey)) {
        return false;
    }
    if (typeof canAccessLmsLiveQuizScope === 'function' && !canAccessLmsLiveQuizScope(canonicalKey)) {
        return false;
    }
    return true;
}

function emitLmsWhiteboardSignal(resourceKey = '', signal = {}) {
    if (!resourceKey || typeof submitLmsWhiteboardSignal !== 'function') return;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canEmitLmsWhiteboardCollabSignals(canonicalKey)) return;
    const actorId = typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
    submitLmsWhiteboardSignal(canonicalKey, {
        ...signal,
        displayName: signal.displayName || getLmsWhiteboardActorLabel(),
        userId: signal.userId || actorId
    }).catch(error => {
        if (Number(error?.status) === 403) {
            LMS_WHITEBOARD_COLLAB.signalsBlockedByKey[canonicalKey] = true;
        }
    });
}

function maybeEmitLmsWhiteboardCursor(resourceKey = '', point = {}) {
    if (!resourceKey || !isLmsWhiteboardActiveTab() || !canEmitLmsWhiteboardCollabSignals(resourceKey)) return;
    const now = Date.now();
    if ((now - LMS_WHITEBOARD_COLLAB.lastCursorSentAt) < LMS_WHITEBOARD_COLLAB_CURSOR_THROTTLE_MS) return;
    LMS_WHITEBOARD_COLLAB.lastCursorSentAt = now;
    emitLmsWhiteboardSignal(resourceKey, {
        type: 'cursor',
        x: Number(point.x) || 0,
        y: Number(point.y) || 0
    });
}

function maybeEmitLmsWhiteboardLaser(resourceKey = '', point = {}) {
    if (!resourceKey || !LMS_WHITEBOARD_COLLAB.laserMode || !canEmitLmsWhiteboardCollabSignals(resourceKey)) return;
    emitLmsWhiteboardSignal(resourceKey, {
        type: 'laser',
        signalType: 'laser',
        x: Number(point.x) || 0,
        y: Number(point.y) || 0
    });
}

function maybeEmitLmsWhiteboardViewport(resourceKey = '') {
    if (!resourceKey || !LMS_WHITEBOARD_COLLAB.presentView || !canEmitLmsWhiteboardCollabSignals(resourceKey)) return;
    const now = Date.now();
    if ((now - LMS_WHITEBOARD_COLLAB.lastViewportSentAt) < LMS_WHITEBOARD_COLLAB_VIEWPORT_THROTTLE_MS) return;
    LMS_WHITEBOARD_COLLAB.lastViewportSentAt = now;
    emitLmsWhiteboardSignal(resourceKey, {
        type: 'viewport',
        zoom: LMS_WHITEBOARD_UI.zoom,
        panX: LMS_WHITEBOARD_UI.panX,
        panY: LMS_WHITEBOARD_UI.panY
    });
}

function maybeEmitLmsWhiteboardStrokePreview(resourceKey = '', element = null) {
    if (!resourceKey || !element || element.type !== 'stroke') return;
    if (typeof shouldUseLmsWhiteboardOpsSync === 'function' && !shouldUseLmsWhiteboardOpsSync(resourceKey)) return;
    const now = Date.now();
    if ((now - LMS_WHITEBOARD_COLLAB.lastStrokeOpSentAt) < LMS_WHITEBOARD_COLLAB_STROKE_OP_THROTTLE_MS) return;
    LMS_WHITEBOARD_COLLAB.lastStrokeOpSentAt = now;
    if (typeof queueLmsWhiteboardOpsSync === 'function') {
        queueLmsWhiteboardOpsSync(resourceKey, [{ element }], 'stroke-preview');
    }
}

function applyLmsWhiteboardPresenterViewport(signal = {}) {
    if (!LMS_WHITEBOARD_COLLAB.followInstructor) return false;
    const zoom = Number(signal.zoom) || 1;
    LMS_WHITEBOARD_UI.zoom = Math.max(0.4, Math.min(2.5, zoom));
    LMS_WHITEBOARD_UI.panX = Number(signal.panX) || 0;
    LMS_WHITEBOARD_UI.panY = Number(signal.panY) || 0;
    return true;
}

function handleLmsWhiteboardRealtimeSignal(payload = {}) {
    const resourceKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(payload.resourceKey || '')
        : String(payload.resourceKey || '').trim();
    if (!resourceKey) return;
    // Personal boards: ignore remote viewport so student pan never moves staff view.
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(resourceKey)) {
        const signalType = String(payload?.signal?.type || payload?.signal?.signalType || '').trim().toLowerCase();
        if (signalType === 'viewport') return;
    }
    const signal = payload.signal && typeof payload.signal === 'object' ? payload.signal : {};
    const actorId = typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
    const userId = String(signal.userId || '').trim();
    if (userId && userId === actorId) return;
    const type = String(signal.type || signal.signalType || '').trim().toLowerCase();
    const now = Date.now();
    if (type === 'cursor') {
        LMS_WHITEBOARD_COLLAB.cursors[userId] = {
            x: Number(signal.x) || 0,
            y: Number(signal.y) || 0,
            displayName: String(signal.displayName || userId).trim(),
            color: getLmsWhiteboardCollabColor(userId),
            updatedAt: now
        };
    } else if (type === 'laser') {
        LMS_WHITEBOARD_COLLAB.lasers[userId] = {
            x: Number(signal.x) || 0,
            y: Number(signal.y) || 0,
            displayName: String(signal.displayName || userId).trim(),
            color: '#ff4d4f',
            updatedAt: now
        };
    } else if (type === 'viewport') {
        LMS_WHITEBOARD_COLLAB.presenterViewport = {
            userId,
            zoom: Number(signal.zoom) || 1,
            panX: Number(signal.panX) || 0,
            panY: Number(signal.panY) || 0,
            updatedAt: now
        };
        if (isLmsWhiteboardActiveTab() && applyLmsWhiteboardPresenterViewport(signal)) {
            if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
        }
    }
    pruneLmsWhiteboardCollabState();
    if (isLmsWhiteboardActiveTab() && LMS_WHITEBOARD_UI.boundKey === resourceKey) {
        if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
    }
}

function drawLmsWhiteboardCollabOverlay(ctx) {
    if (!ctx) return;
    pruneLmsWhiteboardCollabState();
    Object.values(LMS_WHITEBOARD_COLLAB.lasers).forEach(laser => {
        ctx.save();
        ctx.fillStyle = laser.color || '#ff4d4f';
        ctx.shadowColor = laser.color || '#ff4d4f';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    Object.values(LMS_WHITEBOARD_COLLAB.cursors).forEach(cursor => {
        ctx.save();
        ctx.translate(cursor.x, cursor.y);
        ctx.fillStyle = cursor.color || '#f4d06f';
        ctx.strokeStyle = 'rgba(8, 12, 22, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 16);
        ctx.lineTo(11, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const label = String(cursor.displayName || '').trim();
        if (label) {
            ctx.font = '11px Inter, sans-serif';
            ctx.fillStyle = 'rgba(8, 12, 22, 0.88)';
            const width = ctx.measureText(label).width + 10;
            ctx.fillRect(12, 10, width, 16);
            ctx.fillStyle = cursor.color || '#f4d06f';
            ctx.fillText(label, 16, 22);
        }
        ctx.restore();
    });
}

function renderLmsWhiteboardCollabPill(workspace = {}, canManage = false, resourceKey = '') {
    if (!workspace.sessionActive) return '';
    const followChecked = LMS_WHITEBOARD_COLLAB.followInstructor ? ' checked' : '';
    const participantCount = Object.keys(LMS_WHITEBOARD_COLLAB.cursors).length + 1;
    if (canManage) {
        return `
            <div class="lms-whiteboard-collab-pill" aria-label="Collaboration">
                <button type="button" class="lms-live-pill lms-whiteboard-members-toggle" data-lms-whiteboard-action="open-members-modal" aria-haspopup="dialog">
                    <i class="fas fa-users"></i> ${participantCount} <i class="fas fa-chevron-down"></i>
                </button>
            </div>`;
    }
    return `
        <div class="lms-whiteboard-collab-pill" aria-label="Collaboration">
            <span class="lms-live-pill"><i class="fas fa-users"></i> ${participantCount}</span>
            <label class="lms-whiteboard-collab-toggle" title="Follow instructor viewport">
                <input type="checkbox" data-lms-whiteboard-action="toggle-follow-instructor"${followChecked} aria-label="Follow instructor">
                <i class="fas fa-person-walking-arrow-right"></i>
            </label>
        </div>`;
}

function renderLmsWhiteboardCollabControls(workspace = {}, canManage = false) {
    if (!workspace.sessionActive) return '';
    const followChecked = LMS_WHITEBOARD_COLLAB.followInstructor ? ' checked' : '';
    const presentChecked = LMS_WHITEBOARD_COLLAB.presentView ? ' checked' : '';
    const laserChecked = LMS_WHITEBOARD_COLLAB.laserMode ? ' checked' : '';
    const participantCount = Object.keys(LMS_WHITEBOARD_COLLAB.cursors).length + 1;
    const pills = [`<span class="lms-live-pill"><i class="fas fa-users"></i> ${participantCount} on board</span>`];
    if (canManage) {
        pills.push(`
            <label class="lms-whiteboard-collab-toggle" title="Broadcast your zoom and pan">
                <span>Present view</span>
                <input type="checkbox" data-lms-whiteboard-action="toggle-present-view"${presentChecked}>
            </label>
            <label class="lms-whiteboard-collab-toggle" title="Show laser pointer while moving on canvas">
                <span>Laser</span>
                <input type="checkbox" data-lms-whiteboard-action="toggle-laser"${laserChecked}>
            </label>`);
    } else {
        pills.push(`
            <label class="lms-whiteboard-collab-toggle" title="Follow instructor viewport">
                <span>Follow instructor</span>
                <input type="checkbox" data-lms-whiteboard-action="toggle-follow-instructor"${followChecked}>
            </label>`);
    }
    return `<div class="lms-whiteboard-collab-controls">${pills.join('')}</div>`;
}

function bindLmsWhiteboardCollabActions(shell, resourceKey = '') {
    if (!shell || shell.dataset.lmsWhiteboardCollabBound === '1') return;
    shell.dataset.lmsWhiteboardCollabBound = '1';
    shell.querySelectorAll('[data-lms-whiteboard-action="toggle-follow-instructor"]').forEach(input => {
        input.addEventListener('change', () => {
            LMS_WHITEBOARD_COLLAB.followInstructor = Boolean(input.checked);
            if (LMS_WHITEBOARD_COLLAB.followInstructor && LMS_WHITEBOARD_COLLAB.presenterViewport) {
                applyLmsWhiteboardPresenterViewport(LMS_WHITEBOARD_COLLAB.presenterViewport);
                if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
            }
        });
    });
    shell.querySelectorAll('[data-lms-whiteboard-action="toggle-present-view"]').forEach(input => {
        input.addEventListener('change', () => {
            LMS_WHITEBOARD_COLLAB.presentView = Boolean(input.checked);
            if (LMS_WHITEBOARD_COLLAB.presentView) maybeEmitLmsWhiteboardViewport(resourceKey);
        });
    });
    shell.querySelectorAll('[data-lms-whiteboard-action="toggle-laser"]').forEach(input => {
        input.addEventListener('change', () => {
            LMS_WHITEBOARD_COLLAB.laserMode = Boolean(input.checked);
        });
    });
    shell.addEventListener('click', event => {
        const toggle = event.target.closest?.('[data-lms-whiteboard-action="open-members-modal"]');
        if (!toggle) return;
        if (typeof openLmsWhiteboardMembersModal === 'function') openLmsWhiteboardMembersModal(resourceKey);
    });
}

function trackLmsWhiteboardCollabPointer(resourceKey = '', point = {}) {
    LMS_WHITEBOARD_COLLAB.boundKey = resourceKey;
    maybeEmitLmsWhiteboardCursor(resourceKey, point);
    maybeEmitLmsWhiteboardLaser(resourceKey, point);
}

function resetLmsWhiteboardCollabForTabLeave() {
    LMS_WHITEBOARD_COLLAB.laserMode = false;
    LMS_WHITEBOARD_COLLAB.presentView = false;
}

window.handleLmsWhiteboardRealtimeSignal = handleLmsWhiteboardRealtimeSignal;
window.drawLmsWhiteboardCollabOverlay = drawLmsWhiteboardCollabOverlay;
window.renderLmsWhiteboardCollabControls = renderLmsWhiteboardCollabControls;
window.renderLmsWhiteboardCollabPill = renderLmsWhiteboardCollabPill;
window.bindLmsWhiteboardCollabActions = bindLmsWhiteboardCollabActions;
window.trackLmsWhiteboardCollabPointer = trackLmsWhiteboardCollabPointer;
window.maybeEmitLmsWhiteboardViewport = maybeEmitLmsWhiteboardViewport;
window.maybeEmitLmsWhiteboardStrokePreview = maybeEmitLmsWhiteboardStrokePreview;
window.resetLmsWhiteboardCollabForTabLeave = resetLmsWhiteboardCollabForTabLeave;
window.canEmitLmsWhiteboardCollabSignals = canEmitLmsWhiteboardCollabSignals;