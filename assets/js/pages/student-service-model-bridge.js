/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module student-service-model.js.
 */
(function initStudentServiceModelBridge() {
    'use strict';
    var api = window.__kiuStudentServiceModelExports || window.KiuStudentServiceModel;
    if (!api) {
        console.error('[student-service-model-bridge] ESM leaf missing; load student-service-model.js as type=module first');
        return;
    }
    window.__KIU_STUDENT_SERVICE_MODEL_LOADED = true;
    window.__kiuStudentServiceModelExports = api;
    window.KiuStudentServiceModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
