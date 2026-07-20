/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module social-panel-model.js; modules + defer share document order.
 */
(function initSocialPanelModelBridge() {
    'use strict';
    var api = window.__kiuSocialPanelModelExports || window.KiuSocialPanelModel;
    if (!api) {
        console.error('[social-panel-model-bridge] ESM leaf missing; load social-panel-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_PANEL_MODEL_LOADED = true;
    window.__kiuSocialPanelModelExports = api;
    window.KiuSocialPanelModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
