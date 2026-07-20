/* Classic bridge after type=module social-profile-model.js. */
(function initSocialProfileModelBridge() {
    'use strict';
    var api = window.__kiuSocialProfileModelExports || window.KiuSocialProfileModel;
    if (!api) {
        console.error('[social-profile-model-bridge] ESM leaf missing; load social-profile-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_PROFILE_MODEL_LOADED = true;
    window.__kiuSocialProfileModelExports = api;
    window.KiuSocialProfileModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
