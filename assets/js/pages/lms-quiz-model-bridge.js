/* Classic bridge after type=module lms-quiz-model.js (lazy MODULE_URLS). */
(function initLmsQuizModelBridge() {
    'use strict';
    var api = window.__kiuLmsQuizModelExports || window.KiuLmsQuizModel;
    if (!api) {
        console.error('[lms-quiz-model-bridge] ESM leaf missing; load lms-quiz-model.js as type=module first');
        return;
    }
    window.__KIU_LMS_QUIZ_MODEL_LOADED = true;
    window.__kiuLmsQuizModelExports = api;
    window.KiuLmsQuizModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
