/* LMS whiteboard local undo/redo history (per board). */

const LMS_WHITEBOARD_HISTORY_MAX = 40;
const LMS_WHITEBOARD_HISTORY = {};

function cloneLmsWhiteboardElements(elements = []) {
    if (typeof cloneState === 'function') return cloneState(elements);
    return JSON.parse(JSON.stringify(Array.isArray(elements) ? elements : []));
}

function ensureLmsWhiteboardHistory(resourceKey = '') {
    const key = String(resourceKey || '').trim();
    if (!key) return null;
    if (!LMS_WHITEBOARD_HISTORY[key]) {
        LMS_WHITEBOARD_HISTORY[key] = { past: [], future: [], recording: false };
    }
    return LMS_WHITEBOARD_HISTORY[key];
}

function pushLmsWhiteboardHistoryState(resourceKey = '', options = {}) {
    const key = String(resourceKey || '').trim();
    if (!key || typeof ensureLmsWhiteboardWorkspace !== 'function') return;
    const history = ensureLmsWhiteboardHistory(key);
    if (!history || history.recording) return;
    const workspace = ensureLmsWhiteboardWorkspace(key);
    if (!workspace) return;
    const snapshot = cloneLmsWhiteboardElements(workspace.elements);
    const last = history.past[history.past.length - 1];
    if (!options.force && last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
    history.past.push(snapshot);
    if (history.past.length > LMS_WHITEBOARD_HISTORY_MAX) history.past.shift();
    history.future = [];
}

function restoreLmsWhiteboardHistoryState(resourceKey = '', elements = [], reason = 'history-restore') {
    const key = String(resourceKey || '').trim();
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(key)
        : null;
    if (!workspace) return false;
    const history = ensureLmsWhiteboardHistory(key);
    if (!history) return false;
    history.recording = true;
    workspace.elements = cloneLmsWhiteboardElements(elements);
    if (typeof saveLmsWhiteboardChange === 'function') {
        saveLmsWhiteboardChange(key, reason, {
            forceFullSync: true,
            skipHistory: true,
            deferUiRefresh: true
        });
    }
    history.recording = false;
    if (typeof repaintLmsWhiteboardAfterHistoryChange === 'function') {
        repaintLmsWhiteboardAfterHistoryChange(key);
    }
    return true;
}

function undoLmsWhiteboardHistory(resourceKey = '') {
    const key = String(resourceKey || '').trim();
    const history = ensureLmsWhiteboardHistory(key);
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(key)
        : null;
    if (!history || !workspace || history.past.length < 1) return false;
    const current = cloneLmsWhiteboardElements(workspace.elements);
    history.future.push(current);
    const previous = history.past.pop();
    return restoreLmsWhiteboardHistoryState(key, previous, 'undo-history');
}

function redoLmsWhiteboardHistory(resourceKey = '') {
    const key = String(resourceKey || '').trim();
    const history = ensureLmsWhiteboardHistory(key);
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(key)
        : null;
    if (!history || !workspace || !history.future.length) return false;
    const current = cloneLmsWhiteboardElements(workspace.elements);
    history.past.push(current);
    const next = history.future.pop();
    return restoreLmsWhiteboardHistoryState(key, next, 'redo-history');
}

function resetLmsWhiteboardHistory(resourceKey = '') {
    const key = String(resourceKey || '').trim();
    if (!key) return;
    LMS_WHITEBOARD_HISTORY[key] = { past: [], future: [], recording: false };
}

window.pushLmsWhiteboardHistoryState = pushLmsWhiteboardHistoryState;
window.undoLmsWhiteboardHistory = undoLmsWhiteboardHistory;
window.redoLmsWhiteboardHistory = redoLmsWhiteboardHistory;
window.resetLmsWhiteboardHistory = resetLmsWhiteboardHistory;
