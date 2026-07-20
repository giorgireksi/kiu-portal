/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers (social-page.js).
 * Load after type=module social-entity-model.js; modules + defer share document order.
 */
(function initSocialEntityModelBridge() {
    'use strict';
    var api = window.__kiuSocialEntityModelExports || window.KiuSocialEntityModel;
    if (!api) {
        console.error('[social-entity-model-bridge] ESM leaf missing; load social-entity-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_ENTITY_MODEL_LOADED = true;
    window.__kiuSocialEntityModelExports = api;
    window.KiuSocialEntityModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
