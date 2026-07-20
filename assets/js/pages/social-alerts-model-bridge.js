/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module social-alerts-model.js; modules + defer share document order.
 */
(function initSocialAlertsModelBridge() {
    'use strict';
    var api = window.__kiuSocialAlertsModelExports || window.KiuSocialAlertsModel;
    if (!api) {
        console.error('[social-alerts-model-bridge] ESM leaf missing; load social-alerts-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_ALERTS_MODEL_LOADED = true;
    window.__kiuSocialAlertsModelExports = api;
    window.KiuSocialAlertsModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
