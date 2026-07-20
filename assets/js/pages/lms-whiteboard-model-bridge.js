/* Classic bridge after type=module lms-whiteboard-model.js (lazy MODULE_URLS). */
(function initLmsWhiteboardModelBridge() {
    'use strict';
    var api = window.__kiuLmsWhiteboardModelExports || window.KiuLmsWhiteboardModel;
    if (!api) {
        console.error('[lms-whiteboard-model-bridge] ESM leaf missing; load lms-whiteboard-model.js as type=module first');
        return;
    }
    window.__KIU_LMS_WHITEBOARD_MODEL_LOADED = true;
    window.__kiuLmsWhiteboardModelExports = api;
    window.KiuLmsWhiteboardModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
