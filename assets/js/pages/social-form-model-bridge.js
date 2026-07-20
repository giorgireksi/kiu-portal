/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module social-form-model.js; modules + defer share document order.
 */
(function initSocialFormModelBridge() {
    'use strict';
    var api = window.__kiuSocialFormModelExports || window.KiuSocialFormModel;
    if (!api) {
        console.error('[social-form-model-bridge] ESM leaf missing; load social-form-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_FORM_MODEL_LOADED = true;
    window.__kiuSocialFormModelExports = api;
    window.KiuSocialFormModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
