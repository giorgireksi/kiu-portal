/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module social-task-model.js; modules + defer share document order.
 */
(function initSocialTaskModelBridge() {
    'use strict';
    var api = window.__kiuSocialTaskModelExports || window.KiuSocialTaskModel;
    if (!api) {
        console.error('[social-task-model-bridge] ESM leaf missing; load social-task-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_TASK_MODEL_LOADED = true;
    window.__kiuSocialTaskModelExports = api;
    window.KiuSocialTaskModel = api;
    Object.keys(api).forEach(function (key) {
        var value = api[key];
        if (typeof value === 'function') {
            if (typeof window[key] !== 'function') window[key] = value;
        } else if (window[key] == null) {
            window[key] = value;
        }
    });
})();
