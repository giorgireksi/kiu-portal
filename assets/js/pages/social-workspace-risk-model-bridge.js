/* Classic bridge: re-assert ESM risk-model namespace for defer-order consumers.
 * Load after type=module social-workspace-risk-model.js. Namespace only — no flat keys.
 */
(function initSocialWorkspaceRiskModelBridge() {
    'use strict';
    var api = window.__kiuSocialWorkspaceRiskModelExports || window.KiuSocialWorkspaceRiskModel;
    if (!api) {
        console.error('[social-workspace-risk-model-bridge] ESM leaf missing; load social-workspace-risk-model.js as type=module first');
        return;
    }
    window.__KIU_SOCIAL_WORKSPACE_RISK_MODEL_LOADED = true;
    window.__kiuSocialWorkspaceRiskModelExports = api;
    window.KiuSocialWorkspaceRiskModel = api;
})();
