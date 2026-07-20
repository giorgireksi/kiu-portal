/* LMS whiteboard minimap navigator. */

function paintLmsWhiteboardMinimap(resourceKey = '') {
    const minimap = document.querySelector('.lms-whiteboard-minimap');
    if (!minimap || typeof getLmsWhiteboardWorkspaceContentBounds !== 'function') return;
    const bounds = getLmsWhiteboardWorkspaceContentBounds(resourceKey)
        || { x: 0, y: 0, w: LMS_WHITEBOARD_LOGICAL_WIDTH, h: LMS_WHITEBOARD_LOGICAL_HEIGHT };
    const width = minimap.width;
    const height = minimap.height;
    const ctx = minimap.getContext('2d');
    if (!ctx) return;
    const pad = 24;
    const worldW = Math.max(bounds.w + pad * 2, LMS_WHITEBOARD_LOGICAL_WIDTH);
    const worldH = Math.max(bounds.h + pad * 2, LMS_WHITEBOARD_LOGICAL_HEIGHT);
    const originX = bounds.x - pad;
    const originY = bounds.y - pad;
    const scale = Math.min(width / worldW, height / worldH);
    const offsetX = (width - (worldW * scale)) / 2;
    const offsetY = (height - (worldH * scale)) / 2;
    ctx.clearRect(0, 0, width, height);
    const theme = window.LMS_WHITEBOARD_THEME || {};
    ctx.fillStyle = theme.canvasBg || 'rgba(8, 12, 22, 0.92)';
    ctx.fillRect(0, 0, width, height);
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-originX, -originY);
    (workspace.elements || []).forEach(element => {
        const box = typeof getLmsWhiteboardElementBounds === 'function'
            ? getLmsWhiteboardElementBounds(element)
            : null;
        if (!box) return;
        ctx.fillStyle = theme.minimapElement || 'rgba(244, 208, 111, 0.55)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
    });
    const viewX = (-LMS_WHITEBOARD_UI.panX) / LMS_WHITEBOARD_UI.zoom;
    const viewY = (-LMS_WHITEBOARD_UI.panY) / LMS_WHITEBOARD_UI.zoom;
    const viewW = LMS_WHITEBOARD_LOGICAL_WIDTH / LMS_WHITEBOARD_UI.zoom;
    const viewH = LMS_WHITEBOARD_LOGICAL_HEIGHT / LMS_WHITEBOARD_UI.zoom;
    ctx.strokeStyle = theme.viewport || 'rgba(96, 165, 250, 0.95)';
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    ctx.restore();
    minimap.dataset.worldOriginX = String(originX);
    minimap.dataset.worldOriginY = String(originY);
    minimap.dataset.worldScale = String(scale);
    minimap.dataset.worldOffsetX = String(offsetX);
    minimap.dataset.worldOffsetY = String(offsetY);
}

function bindLmsWhiteboardMinimap(resourceKey = '') {
    const boundToken = String(resourceKey || '').trim();
    const boardShell = typeof getActiveLmsWhiteboardShell === 'function'
        ? getActiveLmsWhiteboardShell(resourceKey)
        : null;
    const minimap = boardShell?.querySelector('.lms-whiteboard-minimap')
        || document.querySelector('.lms-whiteboard-minimap');
    if (!minimap || minimap.dataset.lmsWhiteboardMinimapBound === boundToken) return;
    minimap.dataset.lmsWhiteboardMinimapBound = boundToken;
    minimap.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const rect = minimap.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const originX = Number(minimap.dataset.worldOriginX || 0);
        const originY = Number(minimap.dataset.worldOriginY || 0);
        const scale = Number(minimap.dataset.worldScale || 1);
        const offsetX = Number(minimap.dataset.worldOffsetX || 0);
        const offsetY = Number(minimap.dataset.worldOffsetY || 0);
        const worldX = originX + ((localX - offsetX) / scale);
        const worldY = originY + ((localY - offsetY) / scale);
        const viewW = LMS_WHITEBOARD_LOGICAL_WIDTH / LMS_WHITEBOARD_UI.zoom;
        const viewH = LMS_WHITEBOARD_LOGICAL_HEIGHT / LMS_WHITEBOARD_UI.zoom;
        LMS_WHITEBOARD_UI.panX = (LMS_WHITEBOARD_LOGICAL_WIDTH / 2) - ((worldX + (viewW / 2)) * LMS_WHITEBOARD_UI.zoom);
        LMS_WHITEBOARD_UI.panY = (LMS_WHITEBOARD_LOGICAL_HEIGHT / 2) - ((worldY + (viewH / 2)) * LMS_WHITEBOARD_UI.zoom);
        if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
        if (typeof maybeEmitLmsWhiteboardViewport === 'function') maybeEmitLmsWhiteboardViewport(resourceKey);
    });
}

window.paintLmsWhiteboardMinimap = paintLmsWhiteboardMinimap;
window.bindLmsWhiteboardMinimap = bindLmsWhiteboardMinimap;